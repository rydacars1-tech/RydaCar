import { useEffect, useMemo, useState } from "react";
import AdminShell from "./admin/AdminShell.jsx";
import DateRangeFilter from "./admin/DateRangeFilter.jsx";
import { filterItemsByDateRange, formatDateTime, getCurrentMonthDateRange } from "./admin/adminData.js";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { useCachedResource } from "../lib/adminCache.js";
import { InlineLoadingNotice, LoadingBlock } from "./common/LoadingState.jsx";

function formatLabel(value, fallback = "") {
  const normalized = String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return fallback;
  }

  return normalized.replace(/\b\w/g, (character) => character.toUpperCase());
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripHtml(value) {
  return normalizeText(String(value || "").replace(/<[^>]*>/g, " "));
}

function buildEmailPreview(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "Notification details are available for this email.";
  }

  const directPreview =
    normalizeText(payload.preview) ||
    normalizeText(payload.message) ||
    normalizeText(payload.text) ||
    stripHtml(payload.html);

  if (directPreview) {
    return directPreview;
  }

  const payloadKeys = Object.keys(payload).filter((key) => key !== "subject");
  if (payloadKeys.length === 0) {
    return "Notification details are available for this email.";
  }

  return `${payloadKeys.slice(0, 3).map((key) => formatLabel(key)).join(" • ")} details available.`;
}

function getEmailDefaultRange(items) {
  if (items.length === 0) {
      return getCurrentMonthDateRange();
  }

  const timestamps = items
    .map((item) => new Date(item.receivedAt || item.createdAt))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (timestamps.length === 0) {
    return getCurrentMonthDateRange();
  }

  const first = timestamps[0];
  const last = timestamps[timestamps.length - 1];
  const toInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    startDate: toInput(first),
    endDate: toInput(last)
  };
}

function EmailPage() {
  const { authenticatedRequest, user } = useAdminAuth();
  const [statusFilter, setStatusFilter] = useState("all");
  const {
    data: emailPageData,
    error: loadError,
    isLoading,
    isFetching
  } = useCachedResource({
    userId: user?.id,
    cacheKey: "emails:logs",
    fetcher: async () => {
      const [logsPayload, statsPayload] = await Promise.all([
        authenticatedRequest("/notifications/logs", { method: "GET" }),
        authenticatedRequest("/dashboard/admin", { method: "GET" })
      ]);

      return {
        emails: (logsPayload.data || []).map((item) => ({
          id: item.notificationId,
          recipient: Array.isArray(item.to) && item.to[0] ? item.to[0] : "noreply@ryda.app",
          subject: normalizeText(item.payload?.subject) || formatLabel(item.template, "System notification"),
          preview: buildEmailPreview(item.payload),
          receivedAt: item.createdAt,
          status: item.status || "queued",
          category: item.channel || "email",
          templateLabel: formatLabel(item.template, "System notification")
        })),
        openBookingsCount: Number(statsPayload.data?.pendingBookings || 0)
      };
    },
    staleTime: 60_000,
    emptyValue: { emails: [], openBookingsCount: 0 },
    errorMessage: "Unable to load email logs."
  });
  const emails = emailPageData.emails || [];
  const openBookingsCount = emailPageData.openBookingsCount || 0;
  const defaultRange = useMemo(() => getEmailDefaultRange(emails), [emails]);
  const [range, setRange] = useState(() => getCurrentMonthDateRange());

  const filteredEmails = useMemo(() => {
    const rangeFiltered = filterItemsByDateRange(emails, range, (item) => item.receivedAt || item.createdAt);
    return rangeFiltered.filter((item) => (statusFilter === "all" ? true : String(item.status || "").toLowerCase() === statusFilter));
  }, [emails, range, statusFilter]);

  useEffect(() => {
    if (defaultRange.startDate && defaultRange.endDate) {
      setRange(defaultRange);
    }
  }, [defaultRange]);

  return (
    <AdminShell
      activeNav="email"
      openBookingsCount={openBookingsCount}
      title="Emails"
      actions={
        <div className="admin-toolbar admin-toolbar-filters">
          <label className="admin-filter-select-wrap">
            <span className="admin-filter-select-label">Status</span>
            <select className="admin-filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="queued">Queued</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </label>
          <DateRangeFilter value={range} loading={isFetching} onApply={setRange} onReset={() => setRange(defaultRange)} />
        </div>
      }
      mobilePrimaryAction={
        <DateRangeFilter value={range} loading={isFetching} onApply={setRange} onReset={() => setRange(defaultRange)} compactOnMobile compactLabel="Filter" />
      }
      mobileSecondaryActions={
        <label className="admin-filter-select-wrap admin-filter-select-wrap-mobile">
          <span className="admin-filter-select-label">Status</span>
          <select className="admin-filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="queued">Queued</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
        </label>
      }
    >
      <section className="admin-panel-card">
        {isFetching && !isLoading ? <InlineLoadingNotice label="Refreshing email activity..." /> : null}

        <div className="admin-section-head">
          <div>
            <div className="admin-section-title">Inbox list</div>
          </div>
          <div className="admin-email-counts">
            <span>{filteredEmails.length} filtered emails</span>
            <span>{emails.filter((item) => item.status === "queued").length} queued</span>
          </div>
        </div>

        {loadError ? <div className="admin-inline-feedback">{loadError}</div> : null}

        {isLoading ? (
          <div className="admin-loading-state">
            <LoadingBlock title="Loading emails" copy="Fetching notification logs and queued email activity." compact />
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-state-title">No emails in this filter</div>
            <div className="admin-empty-state-copy">Try another status or date range to view inbox activity.</div>
          </div>
        ) : (
          <div className="admin-email-list">
            {filteredEmails.map((item) => (
              <div key={item.id} className="admin-email-row-card">
                <div className="admin-email-row-main">
                  <div className="admin-email-row-top">
                    <div className="admin-email-row-from">
                      <strong>{item.recipient}</strong>
                      <span>To recipient</span>
                    </div>
                    <time className="admin-email-row-time">{formatDateTime(item.receivedAt)}</time>
                  </div>

                  <div className="admin-email-row-subject">{item.subject}</div>
                  <div className="admin-email-row-preview">{item.preview}</div>
                  <div className="admin-email-row-meta">
                    <span className="admin-email-chip">{formatLabel(item.category, "Email")}</span>
                    <span className="admin-email-chip admin-email-chip-muted">{item.templateLabel}</span>
                  </div>
                </div>

                <div className="admin-email-row-status">
                  <span
                    className={
                      item.status === "queued"
                        ? "admin-status-badge admin-status-badge-open"
                        : item.status === "sent"
                          ? "admin-status-badge admin-status-badge-done"
                          : "admin-status-badge"
                    }
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}

export default EmailPage;

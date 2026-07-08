import { useEffect, useMemo, useRef, useState } from "react";
import AdminShell from "./admin/AdminShell.jsx";
import DateRangeFilter from "./admin/DateRangeFilter.jsx";
import { filterItemsByDateRange, formatDateTime, getCurrentMonthDateRange } from "./admin/adminData.js";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";

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
  const { authenticatedRequest } = useAdminAuth();
  const [emails, setEmails] = useState([]);
  const defaultRange = useMemo(() => getEmailDefaultRange(emails), [emails]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [range, setRange] = useState(defaultRange);
  const [loading, setLoading] = useState(false);
  const [openBookingsCount, setOpenBookingsCount] = useState(0);
  const [loadError, setLoadError] = useState("");
  const timerRef = useRef(null);

  const filteredEmails = useMemo(() => {
    const rangeFiltered = filterItemsByDateRange(emails, range, (item) => item.receivedAt || item.createdAt);
    return rangeFiltered.filter((item) => (statusFilter === "all" ? true : String(item.status || "").toLowerCase() === statusFilter));
  }, [emails, range, statusFilter]);

  useEffect(() => {
    let active = true;

    async function loadEmails() {
      setLoading(true);
      setLoadError("");

      try {
        const [logsPayload, statsPayload] = await Promise.all([
          authenticatedRequest("/notifications/logs", { method: "GET" }),
          authenticatedRequest("/dashboard/admin", { method: "GET" })
        ]);

        if (!active) {
          return;
        }

        setEmails(
          (logsPayload.data || []).map((item) => ({
            id: item.notificationId,
            sender: Array.isArray(item.to) && item.to[0] ? item.to[0] : "noreply@ryda.app",
            subject: item.template ? String(item.template).replace(/_/g, " ") : "System notification",
            preview: JSON.stringify(item.payload || {}),
            receivedAt: item.createdAt,
            status: item.status || "queued",
            category: item.channel || "email",
            email: Array.isArray(item.to) && item.to[0] ? item.to[0] : "noreply@ryda.app"
          }))
        );
        setOpenBookingsCount(Number(statsPayload.data?.pendingBookings || 0));
      } catch (error) {
        if (active) {
          setLoadError(error?.message || "Unable to load email logs.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadEmails();

    return () => {
      active = false;
    };
  }, [authenticatedRequest]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  useEffect(() => {
    if (defaultRange.startDate && defaultRange.endDate) {
      setRange(defaultRange);
    }
  }, [defaultRange]);

  function runFilterUpdate(nextRange) {
    window.clearTimeout(timerRef.current);
    setLoading(true);
    setRange(nextRange);
    timerRef.current = window.setTimeout(() => setLoading(false), 220);
  }

  return (
    <AdminShell
      activeNav="email"
      openBookingsCount={openBookingsCount}
      title="Email"
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
          <DateRangeFilter value={range} loading={loading} onApply={runFilterUpdate} onReset={() => runFilterUpdate(defaultRange)} />
        </div>
      }
    >
      <section className="admin-panel-card">
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

        {loading ? (
          <div className="admin-loading-state">Updating email results...</div>
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
                      <strong>{item.sender}</strong>
                    </div>
                    <time className="admin-email-row-time">{formatDateTime(item.receivedAt)}</time>
                  </div>

                  <div className="admin-email-row-subject">{item.subject}</div>
                  <div className="admin-email-row-preview">{item.preview}</div>
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

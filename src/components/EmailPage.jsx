import { useEffect, useMemo, useRef, useState } from "react";
import AdminShell from "./admin/AdminShell.jsx";
import DateRangeFilter from "./admin/DateRangeFilter.jsx";
import { filterItemsByDateRange, formatDateTime, getAdminSnapshot, getCurrentMonthDateRange } from "./admin/adminData.js";

const EMAILS = [
  {
    id: "mail-1",
    sender: "bookings@ryda.app",
    subject: "New airport pickup request",
    preview: "A customer submitted a ride request from Gulberg to Allama Iqbal Airport.",
    receivedAt: "2026-07-05T08:10:00.000Z",
    status: "Unread",
    category: "Bookings",
    email: "bookings@ryda.app"
  },
  {
    id: "mail-2",
    sender: "support@ryda.app",
    subject: "Driver account verification pending",
    preview: "Bilal Ahmed uploaded documents and is waiting for admin approval.",
    receivedAt: "2026-07-05T06:45:00.000Z",
    status: "Unread",
    category: "Users",
    email: "support@ryda.app"
  },
  {
    id: "mail-3",
    sender: "payments@ryda.app",
    subject: "Payment captured successfully",
    preview: "Booking #RX-302 is marked paid and ready for ride completion follow-up.",
    receivedAt: "2026-07-04T18:30:00.000Z",
    status: "Starred",
    category: "Payments",
    email: "payments@ryda.app"
  },
  {
    id: "mail-4",
    sender: "alerts@ryda.app",
    subject: "High pending booking count",
    preview: "Pending requests crossed the configured threshold for evening operations.",
    receivedAt: "2026-07-04T14:05:00.000Z",
    status: "Read",
    category: "Alerts",
    email: "alerts@ryda.app"
  }
];

function getEmailDefaultRange(items) {
  if (items.length === 0) {
    return getCurrentMonthDateRange();
  }

  const timestamps = items
    .map((item) => new Date(item.receivedAt))
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
  const snapshot = useMemo(() => getAdminSnapshot(), []);
  const defaultRange = useMemo(() => getEmailDefaultRange(EMAILS), []);
  const [statusFilter, setStatusFilter] = useState("all");
  const [range, setRange] = useState(defaultRange);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const filteredEmails = useMemo(() => {
    const rangeFiltered = filterItemsByDateRange(EMAILS, range, (item) => item.receivedAt);
    return rangeFiltered.filter((item) => (statusFilter === "all" ? true : item.status.toLowerCase() === statusFilter));
  }, [range, statusFilter]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  function runFilterUpdate(nextRange) {
    window.clearTimeout(timerRef.current);
    setLoading(true);
    setRange(nextRange);
    timerRef.current = window.setTimeout(() => setLoading(false), 220);
  }

  return (
    <AdminShell
      activeNav="email"
      openBookingsCount={snapshot.totals.open}
      title="Email"
      actions={
        <div className="admin-toolbar admin-toolbar-filters">
          <label className="admin-filter-select-wrap">
            <span className="admin-filter-select-label">Status</span>
            <select className="admin-filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="starred">Starred</option>
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
            <span>{EMAILS.filter((item) => item.status === "Unread").length} unread</span>
          </div>
        </div>

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
                  <span className={item.status === "Unread" ? "admin-status-badge admin-status-badge-open" : item.status === "Starred" ? "admin-status-badge admin-status-badge-done" : "admin-status-badge"}>
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

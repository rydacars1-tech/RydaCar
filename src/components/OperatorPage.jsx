import { useEffect, useMemo, useRef, useState } from "react";
import AdminShell from "./admin/AdminShell.jsx";
import DateRangeFilter from "./admin/DateRangeFilter.jsx";
import {
  filterItemsByDateRange,
  formatDateRangeLabel,
  formatDateTime,
  getBookingDateValue,
  getCurrentMonthDateRange,
  navigateTo
} from "./admin/adminData.js";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";

function CopyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function OperatorPage({ initialTab = "bookings" }) {
  const { authenticatedRequest } = useAdminAuth();
  const [tab, setTab] = useState(initialTab);
  const [copiedPhoneKey, setCopiedPhoneKey] = useState("");
  const [range, setRange] = useState(() => getCurrentMonthDateRange());
  const [loading, setLoading] = useState(false);
  const [allBookings, setAllBookings] = useState([]);
  const [actionError, setActionError] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    let active = true;

    async function loadBookings() {
      setLoading(true);
      setActionError("");

      try {
        const payload = await authenticatedRequest("/bookings", { method: "GET" });
        if (!active) {
          return;
        }

        setAllBookings(payload.data?.items || []);
      } catch (error) {
        if (active) {
          setActionError(error?.message || "Unable to load bookings.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadBookings();

    return () => {
      active = false;
    };
  }, [authenticatedRequest]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const openBookings = useMemo(() => {
    return allBookings.filter((booking) => !["completed", "cancelled"].includes(String(booking.status || "").toLowerCase()));
  }, [allBookings]);
  const doneBookings = useMemo(() => {
    return allBookings.filter((booking) => String(booking.status || "").toLowerCase() === "completed");
  }, [allBookings]);

  const filteredOpenBookings = useMemo(() => filterItemsByDateRange(openBookings, range, getBookingDateValue), [openBookings, range]);
  const filteredDoneBookings = useMemo(() => filterItemsByDateRange(doneBookings, range, getBookingDateValue), [doneBookings, range]);
  const shown = tab === "history" ? filteredDoneBookings : filteredOpenBookings;
  const openCount = openBookings.length;

  async function reloadBookings() {
    const payload = await authenticatedRequest("/bookings", { method: "GET" });
    setAllBookings(payload.data?.items || []);
  }

  async function markDone(bookingId) {
    try {
      await authenticatedRequest(`/bookings/${bookingId}/complete`, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus: "paid" })
      });
      await reloadBookings();
    } catch (error) {
      setActionError(error?.message || "Unable to complete this booking.");
    }
  }

  async function clearBookings() {
    try {
      await authenticatedRequest("/bookings", { method: "DELETE" });
      setAllBookings([]);
    } catch (error) {
      setActionError(error?.message || "Unable to clear bookings.");
    }
  }

  async function copyPhoneNumber(phone, key, event) {
    event.preventDefault();
    event.stopPropagation();
    if (!phone) return;

    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhoneKey(key);
      window.setTimeout(() => {
        setCopiedPhoneKey((current) => (current === key ? "" : current));
      }, 1400);
    } catch {
      setCopiedPhoneKey("");
    }
  }

  function runFilterUpdate(nextRange) {
    window.clearTimeout(timerRef.current);
    setLoading(true);
    setRange(nextRange);
    timerRef.current = window.setTimeout(() => setLoading(false), 180);
  }

  return (
    <AdminShell
      activeNav="bookings"
      openBookingsCount={openCount}
      title="Bookings"
      actions={
        <>
          <DateRangeFilter value={range} loading={loading} onApply={runFilterUpdate} onReset={() => runFilterUpdate(getCurrentMonthDateRange())} />
          <button type="button" className="admin-ghost-button" onClick={reloadBookings}>
            Refresh
          </button>
          <button type="button" className="admin-primary-button" onClick={() => navigateTo("#/qr")}>
            Generate QR
          </button>
        </>
      }
      secondaryTabs={[
        {
          id: "bookings",
          label: "Active bookings",
          badge: openCount > 0 ? String(openCount) : "",
          active: tab === "bookings",
          onClick: () => {
            setTab("bookings");
            navigateTo("#/bookings");
          }
        },
        {
          id: "history",
          label: "History",
          badge: doneBookings.length > 0 ? String(doneBookings.length) : "",
          active: tab === "history",
          onClick: () => {
            setTab("history");
            navigateTo("#/history");
          }
        }
      ]}
    >
      <section className="admin-panel-card">
        <div className="admin-section-head">
          <div>
            <div className="admin-section-title">{tab === "history" ? "Completed booking history" : "Pending booking queue"}</div>
          </div>
          <div className="admin-inline-actions">
            <button type="button" className="admin-text-button" disabled={allBookings.length === 0} onClick={clearBookings}>
              Clear all
            </button>
          </div>
        </div>

        {actionError ? <div className="admin-inline-feedback">{actionError}</div> : null}

        {loading ? (
          <div className="admin-loading-state">Updating bookings for {formatDateRangeLabel(range)}...</div>
        ) : shown.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-state-title">{tab === "history" ? "No completed bookings yet" : "No active bookings yet"}</div>
            <div className="admin-empty-state-copy">
              {tab === "history"
                ? "Completed rides in the selected date range will appear here after you mark them done."
                : "Bookings inside the selected date range will appear here automatically."}
            </div>
          </div>
        ) : (
          <div className="admin-table-wrap admin-table-wrap-rich">
            <table className="admin-table admin-bookings-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Customer</th>
                  <th>Driver</th>
                  <th>Route</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((booking, index) => (
                  <tr key={booking.id} className="admin-bookings-row">
                    <td>
                      <div className="admin-booking-count">{index + 1}</div>
                    </td>
                    <td>
                      <div className="admin-table-title">{booking.customerName || "-"}</div>
                      <div className="admin-phone-row">
                        <span className="admin-table-subtitle">{booking.customerPhone || "-"}</span>
                        <button
                          type="button"
                          className="admin-copy-icon-button"
                          onClick={(event) => copyPhoneNumber(booking.customerPhone, `customer-${booking.id}`, event)}
                          aria-label={`Copy customer phone number ${booking.customerPhone}`}
                          title="Copy phone number"
                        >
                          <CopyIcon />
                        </button>
                        {copiedPhoneKey === `customer-${booking.id}` ? <span className="admin-copy-feedback">Phone number copied.</span> : null}
                      </div>
                    </td>
                    <td>
                      <div className="admin-table-title">{booking.driverName || "Unassigned"}</div>
                      <div className="admin-phone-row">
                        <span className="admin-table-subtitle">{booking.driverPhone || "No phone"}</span>
                        <button
                          type="button"
                          className="admin-copy-icon-button"
                          onClick={(event) => copyPhoneNumber(booking.driverPhone, `driver-${booking.id}`, event)}
                          aria-label={`Copy driver phone number ${booking.driverPhone}`}
                          title="Copy phone number"
                        >
                          <CopyIcon />
                        </button>
                        {copiedPhoneKey === `driver-${booking.id}` ? <span className="admin-copy-feedback">Phone number copied.</span> : null}
                      </div>
                    </td>
                    <td>
                      <div className="admin-route-inline" title={`${booking.pickup} -> ${booking.destination}`}>
                        <span className="admin-route-inline-text">{booking.pickup}</span>
                        <span className="admin-route-inline-arrow" aria-hidden="true">
                          →
                        </span>
                        <span className="admin-route-inline-text">{booking.destination}</span>
                      </div>
                    </td>
                    <td>
                      <div className="admin-table-title">{booking.bookingDate || "-"}</div>
                      <div className="admin-table-subtitle">{formatDateTime(booking.createdAt)}</div>
                    </td>
                    <td>
                      <span className={tab === "history" ? "admin-status-badge admin-status-badge-done" : "admin-status-badge admin-status-badge-open"}>
                        {tab === "history" ? "Completed" : "Pending"}
                      </span>
                    </td>
                    <td>
                      {tab === "history" ? (
                        <span className="admin-table-muted">Archived</span>
                      ) : (
                        <button type="button" className="admin-row-action admin-row-action-premium" onClick={() => markDone(booking.id)}>
                          Mark done
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}

export default OperatorPage;

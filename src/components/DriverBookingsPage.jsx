import { useEffect, useMemo, useState } from "react";
import DriverShell from "./driver/DriverShell.jsx";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { invalidateAdminDataCache, useCachedResource } from "../lib/adminCache.js";
import { InlineLoadingNotice, LoadingBlock, Spinner } from "./common/LoadingState.jsx";
import { DriverLocationIcon } from "./driver/DriverIcons.jsx";
import {
  formatBookingStatusLabel,
  formatCompactDate,
  formatDateTime,
  getBookingStatusTone,
  getDriverBookingFilter,
  getRouteQueryFromHash,
  matchesDriverBookingFilter
} from "./driver/driverData.js";

function updateBookingsHash(filter) {
  window.location.hash = filter === "all" ? "#/driver/bookings" : `#/driver/bookings?status=${filter}`;
}

function getActionDefinition(booking) {
  const status = String(booking?.status || "");
  if (["confirmed", "assigned"].includes(status)) {
    return {
      id: "accept",
      label: "Accept booking",
      successMessage: "Booking accepted successfully."
    };
  }

  if (status === "accepted") {
    return {
      id: "start",
      label: "Start trip",
      successMessage: "Trip started successfully."
    };
  }

  if (status === "trip_started") {
    return {
      id: "complete",
      label: "Complete trip",
      successMessage: "Trip completed successfully."
    };
  }

  return null;
}

function BookingCard({ booking, onView, onAction, actionState }) {
  const action = getActionDefinition(booking);
  const isBusy = actionState.bookingId === booking.id;
  const statusTone = getBookingStatusTone(booking.status);
  const statusClassName = [
    "admin-status-badge",
    statusTone === "done" ? "admin-status-badge-done" : "",
    statusTone === "open" ? "admin-status-badge-open" : "",
    statusTone === "muted" ? "driver-status-badge-muted" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className="driver-booking-card driver-booking-card-enhanced">
      <div className="driver-booking-top">
        <div className="driver-booking-ref">
          <strong>{booking.bookingNumber}</strong>
          <span>{booking.source === "driver" ? "Created by driver" : "Assigned booking"}</span>
        </div>
        <span className={statusClassName}>{formatBookingStatusLabel(booking.status)}</span>
      </div>

      <div className="driver-booking-route">
        <div className="driver-booking-route-stop">
          <span className="driver-booking-route-icon">
            <DriverLocationIcon />
          </span>
          <div>
            <span className="driver-booking-route-label">Pickup</span>
            <strong>{booking.pickup || "-"}</strong>
          </div>
        </div>
        <div className="driver-booking-route-stop">
          <span className="driver-booking-route-icon driver-booking-route-icon-destination">
            <DriverLocationIcon />
          </span>
          <div>
            <span className="driver-booking-route-label">Destination</span>
            <strong>{booking.destination || "-"}</strong>
          </div>
        </div>
      </div>

      <div className="driver-booking-info-grid">
        <div className="driver-booking-info-item">
          <span>Customer</span>
          <strong>{booking.customerName || "-"}</strong>
          <em>{booking.customerPhone || "-"}</em>
        </div>
        <div className="driver-booking-info-item">
          <span>Taxi</span>
          <strong>{booking.vehicleNumber || "-"}</strong>
          <em>{booking.taxiLabel || "Assigned taxi"}</em>
        </div>
        <div className="driver-booking-info-item">
          <span>Fare</span>
          <strong>{Number(booking.fare || 0).toLocaleString()}</strong>
          <em>{String(booking.paymentStatus || "pending").replace(/_/g, " ")}</em>
        </div>
        <div className="driver-booking-info-item">
          <span>Date</span>
          <strong>{formatCompactDate(booking.createdAt || booking.bookingDate)}</strong>
          <em>{formatDateTime(booking.updatedAt || booking.createdAt)}</em>
        </div>
      </div>

      <div className="driver-booking-footer">
        <button type="button" className="admin-table-action" onClick={() => onView(booking)}>
          View details
        </button>
        {action ? (
          <button type="button" className="admin-table-action admin-table-action-primary" onClick={() => onAction(booking, action)} disabled={isBusy}>
            {isBusy ? "Updating..." : action.label}
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default function DriverBookingsPage() {
  const { authenticatedRequest, user } = useAdminAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [detailBooking, setDetailBooking] = useState(null);
  const [createState, setCreateState] = useState({ submitting: false, error: "", success: "" });
  const [actionState, setActionState] = useState({ bookingId: "", error: "", success: "" });
  const [form, setForm] = useState({
    qrId: "",
    customerName: "",
    customerPhone: "",
    pickup: "",
    destination: ""
  });

  const {
    data: dashboardData
  } = useCachedResource({
    userId: user?.id,
    cacheKey: "driver:dashboard",
    fetcher: async () => {
      const payload = await authenticatedRequest("/dashboard/driver", { method: "GET" });
      return payload.data || {};
    },
    staleTime: 45_000,
    emptyValue: { assignedTaxis: [] },
    errorMessage: "Unable to load driver profile."
  });

  const assignedTaxis = useMemo(() => dashboardData.assignedTaxis || [], [dashboardData.assignedTaxis]);

  const {
    data: bookingsData,
    error: loadError,
    isLoading,
    isFetching,
    mutate
  } = useCachedResource({
    userId: user?.id,
    cacheKey: "driver:bookings",
    fetcher: async () => {
      const payload = await authenticatedRequest("/bookings", { method: "GET" });
      return payload.data || { items: [] };
    },
    staleTime: 30_000,
    emptyValue: { items: [] },
    errorMessage: "Unable to load bookings."
  });

  const bookings = useMemo(() => bookingsData.items || [], [bookingsData.items]);
  const [activeFilter, setActiveFilter] = useState(() => getDriverBookingFilter(getRouteQueryFromHash(window.location.hash).status).id);

  useEffect(() => {
    function syncFilterFromHash() {
      setActiveFilter(getDriverBookingFilter(getRouteQueryFromHash(window.location.hash).status).id);
    }

    syncFilterFromHash();
    window.addEventListener("hashchange", syncFilterFromHash);
    return () => window.removeEventListener("hashchange", syncFilterFromHash);
  }, []);

  const selectedFilter = useMemo(() => getDriverBookingFilter(activeFilter), [activeFilter]);
  const filteredBookings = useMemo(
    () => bookings.filter((booking) => matchesDriverBookingFilter(booking, selectedFilter.id)),
    [bookings, selectedFilter.id]
  );

  function resetCreateForm() {
    setForm({
      qrId: assignedTaxis[0]?.id || "",
      customerName: "",
      customerPhone: "",
      pickup: "",
      destination: ""
    });
    setCreateState({ submitting: false, error: "", success: "" });
  }

  function updateBookingInList(nextBooking) {
    mutate((current) => {
      const currentItems = current.items || [];
      return {
        ...current,
        items: currentItems.map((item) => (item.id === nextBooking.id ? nextBooking : item))
      };
    });

    setDetailBooking((current) => (current?.id === nextBooking.id ? nextBooking : current));
    invalidateAdminDataCache(user?.id, "driver:dashboard");
  }

  async function handleCreateBooking(event) {
    event.preventDefault();
    if (createState.submitting) {
      return;
    }

    const qrId = String(form.qrId || "").trim();
    const customerName = String(form.customerName || "").trim();
    const customerPhone = String(form.customerPhone || "").trim();
    const pickup = String(form.pickup || "").trim();
    const destination = String(form.destination || "").trim();

    if (!qrId || !customerName || !customerPhone || !pickup || !destination) {
      setCreateState({ submitting: false, error: "All fields are required.", success: "" });
      return;
    }

    setCreateState({ submitting: true, error: "", success: "" });

    try {
      const pricingPayload = await authenticatedRequest("/pricing/estimate", {
        method: "POST",
        body: JSON.stringify({ pickup, destination })
      });

      const bookingPayload = await authenticatedRequest("/bookings/driver", {
        method: "POST",
        body: JSON.stringify({
          qrId,
          customer: { name: customerName, phone: customerPhone },
          trip: { pickup, destination, bookingDate: new Date().toISOString().slice(0, 10) },
          pricing: pricingPayload.data
        })
      });

      mutate((current) => {
        const currentItems = current.items || [];
        return {
          ...current,
          items: [bookingPayload.data, ...currentItems]
        };
      });

      invalidateAdminDataCache(user?.id, "driver:dashboard");
      setCreateState({ submitting: false, error: "", success: "Booking created successfully." });
      window.setTimeout(() => {
        setCreateOpen(false);
        resetCreateForm();
      }, 650);
    } catch (error) {
      setCreateState({ submitting: false, error: error?.message || "Unable to create booking.", success: "" });
    }
  }

  async function handleBookingAction(booking, action) {
    if (!action?.id || actionState.bookingId) {
      return;
    }

    setActionState({ bookingId: booking.id, error: "", success: "" });

    try {
      const payload = await authenticatedRequest(`/bookings/${booking.id}/${action.id}`, {
        method: "PATCH",
        ...(action.id === "complete" ? { body: JSON.stringify({ paymentStatus: "paid" }) } : {})
      });

      updateBookingInList(payload.data || booking);
      setActionState({ bookingId: "", error: "", success: action.successMessage });
    } catch (error) {
      setActionState({ bookingId: "", error: error?.message || "Unable to update this booking.", success: "" });
    }
  }

  return (
    <DriverShell
      activeNav="bookings"
      title="Bookings"
      actions={
        <button
          type="button"
          className="admin-primary-button"
          onClick={() => {
            resetCreateForm();
            setCreateOpen(true);
          }}
          disabled={assignedTaxis.length === 0}
          title={assignedTaxis.length === 0 ? "No taxi assigned yet" : "Create booking"}
        >
          Create booking
        </button>
      }
    >
      <section className="admin-dashboard-grid">
        <div className="admin-panel-card">
          {isFetching && !isLoading ? <InlineLoadingNotice label="Refreshing bookings..." /> : null}
          {loadError ? <div className="admin-inline-feedback">{loadError}</div> : null}
          {actionState.error ? <div className="admin-inline-feedback driver-inline-feedback-error">{actionState.error}</div> : null}
          {actionState.success ? <div className="auth-feedback auth-feedback-success driver-inline-success">{actionState.success}</div> : null}

          {isLoading ? (
            <div className="admin-loading-state">
              <LoadingBlock title="Loading bookings" copy="Fetching bookings assigned to your driver account." compact />
            </div>
          ) : (
            <>
              <div className="admin-section-head">
                <div>
                  <div className="admin-section-title">Driver bookings</div>
                  <div className="admin-section-subtitle">The backend returns only bookings authorized for your authenticated driver account and assigned taxis.</div>
                </div>
              </div>

              {bookings.length === 0 ? (
                <div className="admin-empty-state driver-bookings-empty-state">
                  <div className="admin-empty-state-title">No bookings yet</div>
                  <div className="admin-empty-state-copy">Bookings created by customers or by you will appear here without needing a full-page reload.</div>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="admin-empty-state driver-bookings-empty-state">
                  <div className="admin-empty-state-title">No {selectedFilter.label.toLowerCase()}</div>
                  <div className="admin-empty-state-copy">Try another filter to review the rest of your authorized booking queue.</div>
                </div>
              ) : (
                <div className="driver-bookings-list driver-bookings-list-enhanced">
                  {filteredBookings.map((booking) => (
                    <BookingCard
                      key={booking.id}
                      booking={booking}
                      onView={setDetailBooking}
                      onAction={handleBookingAction}
                      actionState={actionState}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {createOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <button type="button" className="modal-close" onClick={() => setCreateOpen(false)} aria-label="Close">
              ×
            </button>
            <div className="modal-title">Create booking</div>
            <div className="modal-text">Create a booking for your assigned taxi. This will also be visible to admin.</div>

            {createState.error ? <div className="admin-inline-feedback">{createState.error}</div> : null}
            {createState.success ? <div className="auth-feedback auth-feedback-success">{createState.success}</div> : null}

            <form className="form" onSubmit={handleCreateBooking}>
              <div className="form-field">
                <label className="form-label">Taxi</label>
                <select
                  className="form-input"
                  value={form.qrId}
                  onChange={(event) => setForm((current) => ({ ...current, qrId: event.target.value }))}
                >
                  {assignedTaxis.map((taxi) => (
                    <option key={taxi.id} value={taxi.id}>
                      {taxi.vehicleNumber} {taxi.label ? `· ${taxi.label}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-two">
                <div className="form-field">
                  <label className="form-label">Customer name</label>
                  <input
                    className="form-input"
                    value={form.customerName}
                    onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))}
                    placeholder="Required"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Customer phone</label>
                  <input
                    className="form-input"
                    value={form.customerPhone}
                    onChange={(event) => setForm((current) => ({ ...current, customerPhone: event.target.value }))}
                    placeholder="Required"
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Pickup location</label>
                <input
                  className="form-input"
                  value={form.pickup}
                  onChange={(event) => setForm((current) => ({ ...current, pickup: event.target.value }))}
                  placeholder="Required"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Destination</label>
                <input
                  className="form-input"
                  value={form.destination}
                  onChange={(event) => setForm((current) => ({ ...current, destination: event.target.value }))}
                  placeholder="Required"
                />
              </div>

              <button type="submit" className="form-primary" disabled={createState.submitting}>
                <span className="auth-submit-inner">
                  {createState.submitting ? <Spinner size="sm" tone="light" label="Creating booking" /> : null}
                  <span>{createState.submitting ? "Creating..." : "Create booking"}</span>
                </span>
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {detailBooking ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <button type="button" className="modal-close" onClick={() => setDetailBooking(null)} aria-label="Close">
              ×
            </button>
            <div className="modal-title">{detailBooking.bookingNumber}</div>
            <div className="modal-text">Review the booking details scoped to your driver account and update its trip status when needed.</div>

            <div className="admin-detail-grid" style={{ marginTop: "1rem" }}>
              <div className="admin-detail-item">
                <div className="admin-detail-label">Pickup</div>
                <div className="admin-detail-value">{detailBooking.pickup}</div>
              </div>
              <div className="admin-detail-item">
                <div className="admin-detail-label">Destination</div>
                <div className="admin-detail-value">{detailBooking.destination}</div>
              </div>
              <div className="admin-detail-item">
                <div className="admin-detail-label">Status</div>
                <div className="admin-detail-value">{formatBookingStatusLabel(detailBooking.status)}</div>
              </div>
              <div className="admin-detail-item">
                <div className="admin-detail-label">Customer</div>
                <div className="admin-detail-value">
                  {detailBooking.customerName} · {detailBooking.customerPhone}
                </div>
              </div>
              <div className="admin-detail-item">
                <div className="admin-detail-label">Taxi</div>
                <div className="admin-detail-value">
                  {detailBooking.vehicleNumber} {detailBooking.taxiLabel ? `· ${detailBooking.taxiLabel}` : ""}
                </div>
              </div>
              <div className="admin-detail-item">
                <div className="admin-detail-label">Created</div>
                <div className="admin-detail-value">{formatDateTime(detailBooking.createdAt || detailBooking.bookingDate)}</div>
              </div>
              <div className="admin-detail-item">
                <div className="admin-detail-label">Payment</div>
                <div className="admin-detail-value">
                  {String(detailBooking.paymentStatus || "pending").replace(/_/g, " ")} · {Number(detailBooking.fare || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {getActionDefinition(detailBooking) ? (
              <div className="modal-actions">
                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() => handleBookingAction(detailBooking, getActionDefinition(detailBooking))}
                  disabled={actionState.bookingId === detailBooking.id}
                >
                  {actionState.bookingId === detailBooking.id ? "Updating..." : getActionDefinition(detailBooking).label}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </DriverShell>
  );
}

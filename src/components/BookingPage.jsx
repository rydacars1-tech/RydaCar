import { useEffect, useState } from "react";
import logo from "../assets/logo.jpeg";
import { publicGet, publicPost } from "../lib/api.js";
import { formatCurrency } from "./admin/adminData.js";

function todayValue() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatNow(d) {
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function BookingPage({ taxiId, token }) {
  const [now, setNow] = useState(() => new Date());
  const [taxi, setTaxi] = useState(null);
  const [loadingTaxi, setLoadingTaxi] = useState(true);
  const [pricing, setPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadTaxi() {
      if (!taxiId && !token) {
        if (active) {
          setTaxi(null);
          setLoadingTaxi(false);
          setPageError("Invalid QR code. Taxi is missing.");
        }
        return;
      }

      setLoadingTaxi(true);
      setPageError("");

      try {
        const payload = token
          ? await publicGet(`/qr/scan/${encodeURIComponent(token)}`)
          : await publicGet(`/qr/public/${encodeURIComponent(taxiId)}`);

        if (!active) {
          return;
        }

        if (!payload.data?.isActive) {
          setTaxi(null);
          setPageError("This taxi QR code is inactive.");
          return;
        }

        setTaxi(payload.data);
      } catch (error) {
        if (active) {
          setTaxi(null);
          setPageError(error?.message || "Unable to load this taxi QR code.");
        }
      } finally {
        if (active) {
          setLoadingTaxi(false);
        }
      }
    }

    loadTaxi();

    return () => {
      active = false;
    };
  }, [taxiId, token]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [bookingDate, setBookingDate] = useState(() => todayValue());

  const [errors, setErrors] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [submittedBookingId, setSubmittedBookingId] = useState("");
  const [depositIntent, setDepositIntent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!pickup.trim() || !dropoff.trim()) {
      setPricing(null);
      setPricingLoading(false);
      return;
    }

    let active = true;
    const timerId = window.setTimeout(async () => {
      setPricingLoading(true);

      try {
        const payload = await publicPost("/pricing/estimate", {
          pickup: pickup.trim(),
          destination: dropoff.trim()
        });

        if (active) {
          setPricing(payload.data);
        }
      } catch {
        if (active) {
          setPricing(null);
        }
      } finally {
        if (active) {
          setPricingLoading(false);
        }
      }
    }, 280);

    return () => {
      active = false;
      window.clearTimeout(timerId);
    };
  }, [dropoff, pickup]);

  function validate() {
    const nextErrors = {};
    if (!taxiId && !token) nextErrors.taxi = "Invalid QR code. Taxi is missing.";
    if (!taxi) nextErrors.taxi = "This taxi QR code is not recognized.";
    if (!customerName.trim()) nextErrors.customerName = "Your name is required";
    if (!customerPhone.trim()) nextErrors.customerPhone = "Your phone is required";
    if (!pickup.trim()) nextErrors.pickup = "Pickup address is required";
    if (!dropoff.trim()) nextErrors.dropoff = "Drop-off address is required";
    if (!bookingDate) nextErrors.bookingDate = "Booking date is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submitBooking(event) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setPageError("");
    if (!validate()) {
      setIsSubmitting(false);
      return;
    }

    try {
      const nextPricing =
        pricing ||
        (
          await publicPost("/pricing/estimate", {
            pickup: pickup.trim(),
            destination: dropoff.trim()
          })
        ).data;

      setPricing(nextPricing);

      const bookingPayload = await publicPost("/bookings/customer", {
        customer: {
          name: customerName.trim(),
          phone: customerPhone.trim()
        },
        trip: {
          pickup: pickup.trim(),
          destination: dropoff.trim(),
          bookingDate
        },
        pricing: nextPricing,
        qrId: taxi.qrId || taxi.id || null,
        assignedDriverId: taxi.driverId || null,
        taxi: {
          label: taxi.label || taxi.taxiName || taxi.vehicleNumber || "",
          taxiName: taxi.taxiName || taxi.label || "",
          vehicleNumber: taxi.vehicleNumber || ""
        },
        driver: {
          name: taxi.driverName || "",
          phone: taxi.driverPhone || ""
        }
      });

      setSubmittedBookingId(bookingPayload.data.bookingNumber || bookingPayload.data.id || "");
      setDepositIntent(false);
      setModalOpen(true);
    } catch (error) {
      setPageError(error?.message || "Unable to submit booking right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const km = pricing ? `${Number(pricing.distanceKm || 0).toFixed(1)} km` : pricingLoading ? "Calculating..." : "";
  const price = pricing ? formatCurrency(pricing.totalFare) : pricingLoading ? "Calculating..." : "";

  return (
    <div className="page page-book">
      <header className="page-topbar page-topbar-book">
        <div className="topbar-left">
          <div className="brand-mark">
            <img src={logo} alt="Ryda" className="brand-mark-img" />
          </div>
        </div>
        <div className="page-chip">{formatNow(now)}</div>
      </header>

      <main className="page-content">
        <div className="page-card">
          <h1 className="page-title">Book your taxi</h1>

          {pageError || errors.taxi ? <div className="page-alert">{pageError || errors.taxi}</div> : null}

          <div className="form-two">
            <div className="form-field">
              <label className="form-label">Taxi</label>
              <input className="form-input" value={loadingTaxi ? "Loading..." : taxi?.vehicleNumber || ""} disabled />
            </div>
            <div className="form-field">
              <label className="form-label">Taxi name</label>
              <input className="form-input" value={loadingTaxi ? "Loading..." : taxi?.taxiName || taxi?.label || ""} disabled />
            </div>
          </div>

          <div className="form-two">
            <div className="form-field">
              <label className="form-label">Driver name</label>
              <input className="form-input" value={loadingTaxi ? "Loading..." : taxi?.driverName || "Not assigned"} disabled />
            </div>
            <div className="form-field">
              <label className="form-label">Driver phone</label>
              <input className="form-input" value={loadingTaxi ? "Loading..." : taxi?.driverPhone || "Not assigned"} disabled />
            </div>
          </div>

          <form className="form" onSubmit={submitBooking}>
            <div className="form-two">
              <div className="form-field">
                <label className="form-label">Your name</label>
                <input
                  className="form-input"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Required"
                />
                {errors.customerName && <div className="form-error">{errors.customerName}</div>}
              </div>
              <div className="form-field">
                <label className="form-label">Your phone</label>
                <input
                  className="form-input"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Required"
                />
                {errors.customerPhone && <div className="form-error">{errors.customerPhone}</div>}
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Pickup address</label>
              <input
                className="form-input"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="Required"
              />
              {errors.pickup && <div className="form-error">{errors.pickup}</div>}
            </div>

            <div className="form-field">
              <label className="form-label">Drop-off address</label>
              <input
                className="form-input"
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
                placeholder="Required"
              />
              {errors.dropoff && <div className="form-error">{errors.dropoff}</div>}
            </div>

            <div className="form-two">
              <div className="form-field">
                <label className="form-label">Booking date</label>
                <input
                  type="date"
                  className="form-input"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                />
                {errors.bookingDate && <div className="form-error">{errors.bookingDate}</div>}
              </div>
              <div className="form-field">
                <label className="form-label">Current time</label>
                <input className="form-input" value={formatNow(now)} disabled />
              </div>
            </div>

            <div className="form-two">
              <div className="form-field">
                <label className="form-label">KM</label>
                <input className="form-input" value={km} placeholder="Auto-calculated" disabled />
              </div>
              <div className="form-field">
                <label className="form-label">Price</label>
                <input className="form-input" value={price} placeholder="Auto-calculated" disabled />
              </div>
            </div>

            <button
              type="submit"
              className="form-primary"
              disabled={(!taxiId && !token) || !taxi || isSubmitting || loadingTaxi}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="btn-spinner" aria-hidden="true" /> Booking...
                </>
              ) : (
                "Book now"
              )}
            </button>
          </form>
        </div>
      </main>

      {modalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <button
              type="button"
              className="modal-close"
              onClick={() => setModalOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="modal-title">Booking submitted</div>
            <div className="modal-text">
              Your booking is submitted successfully. Reference: <span className="modal-code">{submittedBookingId}</span>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="form-primary"
                onClick={() => {
                  setDepositIntent(true);
                }}
              >
                Pay deposit
              </button>
              <button type="button" className="form-secondary" onClick={() => setModalOpen(false)}>
                Close
              </button>
            </div>
            {depositIntent && (
              <div className="modal-note">
                Deposit payment will be enabled when the payment API is connected.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingPage;

import { useEffect, useMemo, useState } from "react";
import logo from "../assets/logo.jpeg";

const TAXIS_STORAGE_KEY = "ryda.taxis.v1";
const BOOKINGS_STORAGE_KEY = "ryda.bookings.v1";

function readJsonArray(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJsonArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

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

function BookingPage({ taxiId }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const taxi = useMemo(() => {
    const taxis = readJsonArray(TAXIS_STORAGE_KEY);
    return taxis.find((t) => t.id === taxiId) || null;
  }, [taxiId]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [bookingDate, setBookingDate] = useState(() => todayValue());
  const [km] = useState("");
  const [price] = useState("");

  const [errors, setErrors] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [submittedBookingId, setSubmittedBookingId] = useState("");
  const [depositIntent, setDepositIntent] = useState(false);

  function validate() {
    const nextErrors = {};
    if (!taxiId) nextErrors.taxi = "Invalid QR code. Taxi is missing.";
    if (!taxi) nextErrors.taxi = "This taxi QR code is not recognized.";
    if (!customerName.trim()) nextErrors.customerName = "Your name is required";
    if (!customerPhone.trim()) nextErrors.customerPhone = "Your phone is required";
    if (!pickup.trim()) nextErrors.pickup = "Pickup address is required";
    if (!dropoff.trim()) nextErrors.dropoff = "Drop-off address is required";
    if (!bookingDate) nextErrors.bookingDate = "Booking date is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function submitBooking(event) {
    event.preventDefault();
    if (!validate()) return;

    const booking = {
      id: createId(),
      taxiId,
      taxiNumber: taxi.taxiNumber,
      taxiName: taxi.taxiName || "",
      driverName: taxi.driverName,
      driverPhone: taxi.driverPhone,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      pickup: pickup.trim(),
      dropoff: dropoff.trim(),
      bookingDate,
      km,
      price,
      createdAt: new Date().toISOString()
    };

    const existing = readJsonArray(BOOKINGS_STORAGE_KEY);
    const next = [booking, ...existing];
    writeJsonArray(BOOKINGS_STORAGE_KEY, next);

    setSubmittedBookingId(booking.id);
    setDepositIntent(false);
    setModalOpen(true);
  }

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
          <p className="page-subtitle">
            Driver details are shown automatically from the taxi QR code. Fill your details and submit the booking.
          </p>

          {errors.taxi && <div className="page-alert">{errors.taxi}</div>}

          <div className="form-two">
            <div className="form-field">
              <label className="form-label">Driver name</label>
              <input className="form-input" value={taxi?.driverName || ""} disabled />
            </div>
            <div className="form-field">
              <label className="form-label">Driver phone</label>
              <input className="form-input" value={taxi?.driverPhone || ""} disabled />
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

            <button type="submit" className="form-primary" disabled={!taxiId || !taxi}>
              Book now
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

import { useMemo, useState } from "react";
import logo from "../assets/logo.jpeg";

const BOOKINGS_STORAGE_KEY = "ryda.bookings.v1";

function readBookings() {
  try {
    const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeBookings(nextBookings) {
  localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(nextBookings));
}

function formatDateTime(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso || "";
  }
}

function OperatorPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const bookings = useMemo(() => readBookings(), [refreshKey]);

  return (
    <div className="page page-operator">
      <header className="page-topbar">
        <div className="topbar-left">
          <div className="brand-mark">
            <img src={logo} alt="Ryda" className="brand-mark-img" />
          </div>
        </div>
        <div className="topbar-center">
          <button
            type="button"
            className="page-topbar-primary"
            onClick={() => {
              window.location.hash = "#/qr";
            }}
          >
            Generate QR
          </button>
          <button type="button" className="page-topbar-primary">
            Bookings
          </button>
        </div>
        <div className="topbar-right" />
      </header>

      <main className="page-content">
        <div className="page-card">
          <div className="page-card-row">
            <h1 className="page-title">Bookings</h1>
            <div className="operator-actions">
              <button
                type="button"
                className="page-link"
                onClick={() => setRefreshKey((k) => k + 1)}
              >
                Refresh
              </button>
              <button
                type="button"
                className="page-link"
                disabled={bookings.length === 0}
                onClick={() => {
                  writeBookings([]);
                  setRefreshKey((k) => k + 1);
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="page-empty">No bookings yet. They will appear here after QR bookings are submitted.</div>
          ) : (
            <div className="operator-list">
              {bookings.map((b) => (
                <div key={b.id} className="operator-item">
                  <div className="operator-top">
                    <div className="operator-ref">
                      <div className="operator-ref-label">Reference</div>
                      <div className="operator-ref-value">{b.id}</div>
                    </div>
                    <div className="operator-time">{formatDateTime(b.createdAt)}</div>
                  </div>

                  <div className="operator-grid">
                    <div className="operator-kv">
                      <div className="operator-k">Taxi</div>
                      <div className="operator-v">
                        {b.taxiNumber}
                        {b.taxiName ? ` · ${b.taxiName}` : ""}
                      </div>
                    </div>
                    <div className="operator-kv">
                      <div className="operator-k">Driver</div>
                      <div className="operator-v">
                        {b.driverName} · {b.driverPhone}
                      </div>
                    </div>
                    <div className="operator-kv">
                      <div className="operator-k">Customer</div>
                      <div className="operator-v">
                        {b.customerName} · {b.customerPhone}
                      </div>
                    </div>
                    <div className="operator-kv">
                      <div className="operator-k">Booking date</div>
                      <div className="operator-v">{b.bookingDate}</div>
                    </div>
                    <div className="operator-kv">
                      <div className="operator-k">Pickup</div>
                      <div className="operator-v">{b.pickup}</div>
                    </div>
                    <div className="operator-kv">
                      <div className="operator-k">Drop-off</div>
                      <div className="operator-v">{b.dropoff}</div>
                    </div>
                    <div className="operator-kv">
                      <div className="operator-k">KM</div>
                      <div className="operator-v">{b.km || "—"}</div>
                    </div>
                    <div className="operator-kv">
                      <div className="operator-k">Price</div>
                      <div className="operator-v">{b.price || "—"}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default OperatorPage;

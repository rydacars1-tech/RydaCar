import { useEffect, useMemo, useState } from "react";
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

function normalizeStatus(booking) {
  const status = booking?.status;
  return status === "done" ? "done" : "open";
}

function OperatorPage({ initialTab = "bookings" }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [tab, setTab] = useState(initialTab);
  const [menuOpen, setMenuOpen] = useState(false);
  const allBookings = useMemo(() => readBookings(), [refreshKey]);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const id = setInterval(() => setRefreshKey((k) => k + 1), 2500);
    return () => clearInterval(id);
  }, []);

  const openBookings = useMemo(
    () => allBookings.filter((b) => normalizeStatus(b) === "open"),
    [allBookings]
  );
  const doneBookings = useMemo(
    () => allBookings.filter((b) => normalizeStatus(b) === "done"),
    [allBookings]
  );

  const shown = tab === "history" ? doneBookings : openBookings;
  const openCount = openBookings.length;

  function markDone(bookingId) {
    const next = allBookings.map((b) => {
      if (b.id !== bookingId) return b;
      return { ...b, status: "done", doneAt: new Date().toISOString() };
    });
    writeBookings(next);
    setRefreshKey((k) => k + 1);
  }

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
              window.location.hash = "#/dashboard";
            }}
          >
            Dashboard
          </button>
          <button
            type="button"
            className="page-topbar-primary"
            onClick={() => {
              window.location.hash = "#/qr";
            }}
          >
            QR codes
          </button>
          <button
            type="button"
            className={tab === "bookings" ? "page-topbar-primary page-topbar-primary-active" : "page-topbar-primary"}
            onClick={() => {
              setTab("bookings");
            }}
          >
            Bookings
            {openCount > 0 && <span className="tab-badge">{openCount}</span>}
          </button>
          <button
            type="button"
            className={tab === "history" ? "page-topbar-primary page-topbar-primary-active" : "page-topbar-primary"}
            onClick={() => {
              setTab("history");
            }}
          >
            History
          </button>
        </div>
        <div className="topbar-right">
          <button
            type="button"
            className="menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      <main className="page-content">
        <div className="page-card">
          <div className="page-card-row">
            <h1 className="page-title">{tab === "history" ? "History" : "Bookings"}</h1>
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
                disabled={allBookings.length === 0}
                onClick={() => {
                  writeBookings([]);
                  setRefreshKey((k) => k + 1);
                }}
              >
                Clear
              </button>
            </div>
          </div>

          {shown.length === 0 ? (
            <div className="page-empty">
              {tab === "history"
                ? "No completed bookings yet."
                : "No bookings yet. They will appear here after QR bookings are submitted."}
            </div>
          ) : (
            <div className="operator-list">
              {shown.map((b, index) => (
                <div key={b.id} className="operator-item">
                  <div className="operator-top">
                    <div className="operator-ref">
                      <div className="operator-ref-label">Booking</div>
                      <div className="operator-ref-value">#{index + 1}</div>
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

                  {tab !== "history" && (
                    <button type="button" className="operator-done" onClick={() => markDone(b.id)}>
                      Done
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {menuOpen && (
        <div className="drawer-overlay" role="dialog" aria-modal="true" onClick={() => setMenuOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <div className="drawer-title">Menu</div>
              <button type="button" className="drawer-close" onClick={() => setMenuOpen(false)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="drawer-list">
              <button
                type="button"
                className="drawer-item"
                onClick={() => {
                  setMenuOpen(false);
                  window.location.hash = "#/dashboard";
                }}
              >
                Dashboard
              </button>
              <button
                type="button"
                className="drawer-item"
                onClick={() => {
                  setMenuOpen(false);
                  window.location.hash = "#/qr";
                }}
              >
                QR codes
              </button>
              <button
                type="button"
                className="drawer-item"
                onClick={() => {
                  setMenuOpen(false);
                  setTab("bookings");
                }}
              >
                Bookings
                {openCount > 0 && <span className="drawer-badge">{openCount}</span>}
              </button>
              <button
                type="button"
                className="drawer-item"
                onClick={() => {
                  setMenuOpen(false);
                  setTab("history");
                }}
              >
                History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OperatorPage;

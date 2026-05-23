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

function normalizeStatus(booking) {
  const status = booking?.status;
  return status === "done" ? "done" : "open";
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function currentMonthValue() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function filterBookings(bookings, filterMode, filterValue) {
  if (filterMode === "day") {
    return bookings.filter((b) => String(b?.bookingDate || "") === filterValue);
  }
  if (filterMode === "year") {
    return bookings.filter((b) => String(b?.bookingDate || "").slice(0, 4) === filterValue);
  }
  return bookings.filter((b) => String(b?.bookingDate || "").slice(0, 7) === filterValue);
}

function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setRefreshKey((k) => k + 1), 2500);
    return () => clearInterval(id);
  }, []);

  const taxisCount = useMemo(() => readJsonArray(TAXIS_STORAGE_KEY).length, [refreshKey]);
  const allBookings = useMemo(() => readJsonArray(BOOKINGS_STORAGE_KEY), [refreshKey]);
  const filteredBookings = useMemo(() => {
    const month = currentMonthValue();
    return filterBookings(allBookings, "month", month);
  }, [allBookings]);

  const counts = useMemo(() => {
    const total = filteredBookings.length;
    const pending = filteredBookings.filter((b) => normalizeStatus(b) === "open").length;
    const done = filteredBookings.filter((b) => normalizeStatus(b) === "done").length;
    return { total, pending, done };
  }, [filteredBookings]);

  return (
    <div className="page page-dashboard">
      <header className="page-topbar">
        <div className="topbar-left">
          <div className="brand-mark">
            <img src={logo} alt="Ryda" className="brand-mark-img" />
          </div>
        </div>

        <div className="topbar-center">
          <button type="button" className="page-topbar-primary page-topbar-primary-active">
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
            className="page-topbar-primary"
            onClick={() => {
              window.location.hash = "#/bookings";
            }}
          >
            Bookings
            {counts.pending > 0 && <span className="tab-badge">{counts.pending}</span>}
          </button>
          <button
            type="button"
            className="page-topbar-primary"
            onClick={() => {
              window.location.hash = "#/history";
            }}
          >
            History
          </button>
        </div>

        <div className="topbar-right">
          <button type="button" className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu">
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
          <div className="dash-head">
            <div>
              <h1 className="page-title">Dashboard</h1>
            </div>
          </div>

          <div className="dash-grid">
            <button
              type="button"
              className="dash-card dash-card-link"
              onClick={() => {
                window.location.hash = "#/bookings";
              }}
            >
              <div className="dash-card-top">
                <div className="dash-card-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9" />
                    <path d="M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2" />
                    <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
                    <line x1="9" y1="12" x2="15" y2="12" />
                    <line x1="9" y1="16" x2="15" y2="16" />
                  </svg>
                </div>
                <div className="dash-card-label">Bookings</div>
              </div>
              <div className="dash-card-value">{counts.total}</div>
              <div className="dash-card-sub">In selected filter</div>
            </button>

            <button
              type="button"
              className="dash-card dash-card-link"
              onClick={() => {
                window.location.hash = "#/qr";
              }}
            >
              <div className="dash-card-top">
                <div className="dash-card-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <path d="M14 14h3v3h-3z" />
                    <path d="M20 14h1v1h-1z" />
                    <path d="M14 20h1v1h-1z" />
                    <path d="M18 18h3v3h-3z" />
                  </svg>
                </div>
                <div className="dash-card-label">QR codes</div>
              </div>
              <div className="dash-card-value">{taxisCount}</div>
              <div className="dash-card-sub">Total taxis saved</div>
            </button>

            <button
              type="button"
              className="dash-card dash-card-link"
              onClick={() => {
                window.location.hash = "#/history";
              }}
            >
              <div className="dash-card-top">
                <div className="dash-card-icon dash-card-icon-done">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 12l2 2 4-4" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                </div>
                <div className="dash-card-label">Done</div>
              </div>
              <div className="dash-card-value">{counts.done}</div>
              <div className="dash-card-sub">Completed bookings</div>
            </button>

            <button
              type="button"
              className="dash-card dash-card-accent dash-card-link"
              onClick={() => {
                window.location.hash = "#/bookings";
              }}
            >
              <div className="dash-card-top">
                <div className="dash-card-icon dash-card-icon-pending">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div className="dash-card-label">Pending</div>
              </div>
              <div className="dash-card-value">{counts.pending}</div>
              <div className="dash-card-sub">Need operator action</div>
            </button>
          </div>
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
                  window.location.hash = "#/bookings";
                }}
              >
                Bookings
                {counts.pending > 0 && <span className="drawer-badge">{counts.pending}</span>}
              </button>
              <button
                type="button"
                className="drawer-item"
                onClick={() => {
                  setMenuOpen(false);
                  window.location.hash = "#/history";
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

export default DashboardPage;

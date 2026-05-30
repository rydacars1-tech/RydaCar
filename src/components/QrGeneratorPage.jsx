import { useEffect, useMemo, useState } from "react";
import * as QRCode from "qrcode";
import logo from "../assets/logo.jpeg";

const TAXIS_STORAGE_KEY = "ryda.taxis.v1";
const BOOKINGS_STORAGE_KEY = "ryda.bookings.v1";

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readTaxis() {
  try {
    const raw = localStorage.getItem(TAXIS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTaxis(nextTaxis) {
  localStorage.setItem(TAXIS_STORAGE_KEY, JSON.stringify(nextTaxis));
}

function normalizeTaxiNumber(value) {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function buildTaxiBookingUrl(taxiId) {
  const base = window.location.origin;
  return `${base}/#/book?taxi=${encodeURIComponent(taxiId)}`;
}

function readBookings() {
  try {
    const raw = localStorage.getItem(BOOKINGS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getOpenBookingsCount() {
  return readBookings().filter((b) => (b?.status || "open") === "open").length;
}

function QrGeneratorPage() {
  const [taxis, setTaxis] = useState(() => readTaxis());
  const [selectedTaxiId, setSelectedTaxiId] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openBookingsCount, setOpenBookingsCount] = useState(() => getOpenBookingsCount());
  const selectedTaxi = useMemo(
    () => taxis.find((t) => t.id === selectedTaxiId) || null,
    [taxis, selectedTaxiId]
  );

  const [taxiNumber, setTaxiNumber] = useState("");
  const [taxiName, setTaxiName] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [errors, setErrors] = useState({});

  const [qrDataUrl, setQrDataUrl] = useState("");
  const [bookingUrl, setBookingUrl] = useState("");
  const [copyState, setCopyState] = useState("idle");

  useEffect(() => {
    const id = setInterval(() => setOpenBookingsCount(getOpenBookingsCount()), 1500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!selectedTaxi) return;
    const url = buildTaxiBookingUrl(selectedTaxi.id);
    setBookingUrl(url);
    setQrDataUrl("");
    QRCode.toDataURL(url, { width: 720, margin: 2 })
      .then((dataUrl) => setQrDataUrl(dataUrl))
      .catch(() => setQrDataUrl(""));
  }, [selectedTaxi]);

  function validate() {
    const nextErrors = {};
    if (!normalizeTaxiNumber(taxiNumber)) nextErrors.taxiNumber = "Taxi number is required";
    if (!driverName.trim()) nextErrors.driverName = "Driver name is required";
    if (!driverPhone.trim()) nextErrors.driverPhone = "Driver phone is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleGenerate(event) {
    event.preventDefault();
    if (!validate()) return;

    const nextTaxi = {
      id: createId(),
      taxiNumber: normalizeTaxiNumber(taxiNumber),
      taxiName: taxiName.trim(),
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      createdAt: new Date().toISOString()
    };

    const nextTaxis = [nextTaxi, ...taxis];
    setTaxis(nextTaxis);
    writeTaxis(nextTaxis);
    setSelectedTaxiId(nextTaxi.id);
    setCreateModalOpen(false);

    setTaxiNumber("");
    setTaxiName("");
    setDriverName("");
    setDriverPhone("");
    setErrors({});
  }

  async function copyLink() {
    if (!bookingUrl) return;
    setCopyState("copying");
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    } finally {
      setTimeout(() => setCopyState("idle"), 1400);
    }
  }

  return (
    <div className="page page-qr">
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
          <button type="button" className="page-topbar-primary page-topbar-primary-active">
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
            {openBookingsCount > 0 && <span className="tab-badge">{openBookingsCount}</span>}
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
          <button
            type="button"
            className="page-topbar-primary desktop-only"
            onClick={() => setCreateModalOpen(true)}
          >
            Generate QR code
          </button>
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
            <h2 className="page-title-sm">Saved taxis</h2>
            <div className="card-actions">
              <button type="button" className="card-primary" onClick={() => setCreateModalOpen(true)}>
                Generate QR code
              </button>
              <button
                type="button"
                className="page-link"
                onClick={() => {
                  setTaxis([]);
                  writeTaxis([]);
                  setSelectedTaxiId("");
                  setQrDataUrl("");
                  setBookingUrl("");
                }}
                disabled={taxis.length === 0}
              >
                Clear
              </button>
            </div>
          </div>

          {taxis.length === 0 ? (
            <div className="page-empty">
              No taxis yet. Click <span className="page-strong">Generate QR</span> to create your first taxi QR.
            </div>
          ) : (
            <div className="taxis-list">
              {taxis.map((taxi, index) => (
                <button
                  key={taxi.id}
                  type="button"
                  className={taxi.id === selectedTaxiId ? "taxi-item taxi-item-active" : "taxi-item"}
                  onClick={() => setSelectedTaxiId(taxi.id)}
                >
                  <div className="taxi-item-row">
                    <div className="taxi-item-index">{index + 1}</div>
                    <div className="taxi-item-meta">
                      <div className="taxi-item-title">{taxi.taxiNumber}</div>
                      <div className="taxi-item-sub">
                        {taxi.driverName} · {taxi.driverPhone}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedTaxi && (
          <div className="page-card">
            <h2 className="page-title-sm">QR code</h2>
            <div className="qr-wrap">
              <div className="qr-box">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Taxi booking QR code" className="qr-image" />
                ) : (
                  <div className="qr-loading">Generating QR…</div>
                )}
              </div>

              <div className="qr-meta">
                <div className="qr-kv">
                  <div className="qr-k">Taxi</div>
                  <div className="qr-v">
                    {selectedTaxi.taxiNumber}
                    {selectedTaxi.taxiName ? ` · ${selectedTaxi.taxiName}` : ""}
                  </div>
                </div>
                <div className="qr-kv">
                  <div className="qr-k">Driver</div>
                  <div className="qr-v">
                    {selectedTaxi.driverName} · {selectedTaxi.driverPhone}
                  </div>
                </div>
                <div className="qr-kv">
                  <div className="qr-k">Link</div>
                  <div className="qr-v qr-link">{bookingUrl}</div>
                </div>

                <div className="qr-actions">
                  <button type="button" className="form-secondary" onClick={copyLink} disabled={!bookingUrl}>
                    {copyState === "copied"
                      ? "Copied"
                      : copyState === "failed"
                        ? "Copy failed"
                        : "Copy link"}
                  </button>
                  <a
                    className={qrDataUrl ? "form-primary form-primary-link" : "form-primary form-primary-link disabled"}
                    href={qrDataUrl || undefined}
                    download={`${selectedTaxi.taxiNumber}-ryda-qr.png`}
                    aria-disabled={!qrDataUrl}
                  >
                    Download QR
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {createModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <button
              type="button"
              className="modal-close"
              onClick={() => setCreateModalOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="modal-title">Generate taxi QR</div>
            <div className="modal-text">
              Fill taxi and driver details. You can download and print the QR after saving.
            </div>

            <form className="form" onSubmit={handleGenerate}>
              <div className="form-field">
                <label className="form-label">Taxi number</label>
                <input
                  className="form-input"
                  value={taxiNumber}
                  onChange={(e) => setTaxiNumber(e.target.value)}
                  placeholder="e.g. TX-1024"
                />
                {errors.taxiNumber && <div className="form-error">{errors.taxiNumber}</div>}
              </div>

              <div className="form-field">
                <label className="form-label">Taxi name (optional)</label>
                <input
                  className="form-input"
                  value={taxiName}
                  onChange={(e) => setTaxiName(e.target.value)}
                  placeholder="e.g. Ryda Cab 1"
                />
              </div>

              <div className="form-two">
                <div className="form-field">
                  <label className="form-label">Driver name</label>
                  <input
                    className="form-input"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Required"
                  />
                  {errors.driverName && <div className="form-error">{errors.driverName}</div>}
                </div>

                <div className="form-field">
                  <label className="form-label">Driver phone</label>
                  <input
                    className="form-input"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    placeholder="Required"
                  />
                  {errors.driverPhone && <div className="form-error">{errors.driverPhone}</div>}
                </div>
              </div>

              <button type="submit" className="form-primary">
                Save & generate
              </button>
            </form>
          </div>
        </div>
      )}

      {menuOpen && (
        <div
          className="drawer-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setMenuOpen(false)}
        >
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
                {openBookingsCount > 0 && <span className="drawer-badge">{openBookingsCount}</span>}
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

export default QrGeneratorPage;

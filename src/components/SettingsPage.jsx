import { useMemo, useState } from "react";
import AdminShell from "./admin/AdminShell.jsx";
import { getAdminSnapshot } from "./admin/adminData.js";

function SettingsPage() {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [automaticAssignment, setAutomaticAssignment] = useState(true);
  const snapshot = useMemo(() => getAdminSnapshot(), []);

  return (
    <AdminShell
      activeNav="settings"
      openBookingsCount={snapshot.totals.open}
      title="Settings"
      subtitle="A polished configuration screen for pricing, notifications, payments, and system behavior, ready for future backend wiring."
      actions={
        <>
          <button type="button" className="admin-ghost-button">
            Reset changes
          </button>
          <button type="button" className="admin-primary-button">
            Save settings
          </button>
        </>
      }
    >
      <section className="admin-two-column-layout">
        <div className="admin-stack-layout">
          <div className="admin-panel-card">
            <div className="admin-section-head">
              <div>
                <div className="admin-section-title">Pricing settings</div>
                <div className="admin-section-subtitle">Keep the UI ready for base fare, per KM, and time-based adjustments.</div>
              </div>
            </div>

            <div className="admin-form-grid">
              <div className="admin-form-field">
                <label className="admin-field-label">Base fare</label>
                <input className="admin-input" defaultValue="7.50" />
              </div>
              <div className="admin-form-field">
                <label className="admin-field-label">Per KM fare</label>
                <input className="admin-input" defaultValue="1.20" />
              </div>
              <div className="admin-form-field">
                <label className="admin-field-label">Minimum booking amount</label>
                <input className="admin-input" defaultValue="10.00" />
              </div>
              <div className="admin-form-field">
                <label className="admin-field-label">Night surcharge</label>
                <input className="admin-input" defaultValue="15%" />
              </div>
            </div>
          </div>

          <div className="admin-panel-card">
            <div className="admin-section-head">
              <div>
                <div className="admin-section-title">Notification settings</div>
                <div className="admin-section-subtitle">Prepared UI states for email and SMS control preferences.</div>
              </div>
            </div>

            <div className="admin-toggle-list">
              <button type="button" className="admin-toggle-row" onClick={() => setEmailEnabled((value) => !value)}>
                <div>
                  <strong>Email notifications</strong>
                  <span>Send driver and admin alerts after booking confirmation.</span>
                </div>
                <span className={emailEnabled ? "admin-toggle admin-toggle-on" : "admin-toggle"}>
                  <span />
                </span>
              </button>

              <button type="button" className="admin-toggle-row" onClick={() => setSmsEnabled((value) => !value)}>
                <div>
                  <strong>SMS notifications</strong>
                  <span>Prepared for future Twilio integration once enabled.</span>
                </div>
                <span className={smsEnabled ? "admin-toggle admin-toggle-on" : "admin-toggle"}>
                  <span />
                </span>
              </button>

              <button
                type="button"
                className="admin-toggle-row"
                onClick={() => setAutomaticAssignment((value) => !value)}
              >
                <div>
                  <strong>Automatic assignment</strong>
                  <span>Allow the future backend to auto-assign bookings to available drivers.</span>
                </div>
                <span className={automaticAssignment ? "admin-toggle admin-toggle-on" : "admin-toggle"}>
                  <span />
                </span>
              </button>
            </div>
          </div>

          <div className="admin-panel-card">
            <div className="admin-section-head">
              <div>
                <div className="admin-section-title">System keys</div>
                <div className="admin-section-subtitle">Design preview for future secure value management.</div>
              </div>
            </div>

            <div className="admin-form-grid">
              <div className="admin-form-field admin-form-field-full">
                <label className="admin-field-label">Stripe publishable key</label>
                <input className="admin-input" defaultValue="pk_test_xxxxxxxxxxxxxxxxxxxxxx" />
              </div>
              <div className="admin-form-field admin-form-field-full">
                <label className="admin-field-label">Email sender address</label>
                <input className="admin-input" defaultValue="noreply@ryda.local" />
              </div>
              <div className="admin-form-field admin-form-field-full">
                <label className="admin-field-label">Google Maps API key</label>
                <input className="admin-input" defaultValue="AIzaSy-example-placeholder" />
              </div>
            </div>
          </div>
        </div>

        <div className="admin-stack-layout">
          <div className="admin-panel-card admin-panel-card-soft">
            <div className="admin-section-head">
              <div>
                <div className="admin-section-title">Current configuration</div>
                <div className="admin-section-subtitle">A quick visual summary of the main toggles.</div>
              </div>
            </div>

            <div className="admin-summary-list">
              <div className="admin-summary-row">
                <span>Email alerts</span>
                <strong>{emailEnabled ? "Enabled" : "Disabled"}</strong>
              </div>
              <div className="admin-summary-row">
                <span>SMS alerts</span>
                <strong>{smsEnabled ? "Enabled" : "Disabled"}</strong>
              </div>
              <div className="admin-summary-row">
                <span>Auto assignment</span>
                <strong>{automaticAssignment ? "Enabled" : "Disabled"}</strong>
              </div>
              <div className="admin-summary-row">
                <span>Environment</span>
                <strong>Local UI mock</strong>
              </div>
            </div>
          </div>

          <div className="admin-panel-card">
            <div className="admin-section-head">
              <div>
                <div className="admin-section-title">Implementation notes</div>
                <div className="admin-section-subtitle">Keeps the design realistic without connecting APIs yet.</div>
              </div>
            </div>

            <div className="admin-reminder-list">
              <div className="admin-reminder-item">
                <span className="admin-reminder-dot" />
                <span>Pricing values are currently visual only and ready for future backend configuration sync.</span>
              </div>
              <div className="admin-reminder-item">
                <span className="admin-reminder-dot" />
                <span>Notification toggles already present clear active and inactive states for later API wiring.</span>
              </div>
              <div className="admin-reminder-item">
                <span className="admin-reminder-dot" />
                <span>System key inputs are styled for production-like settings management without storing secrets.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

export default SettingsPage;

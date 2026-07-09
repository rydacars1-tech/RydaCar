import { useEffect, useState } from "react";
import AdminShell from "./admin/AdminShell.jsx";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { useCachedResource } from "../lib/adminCache.js";
import { InlineLoadingNotice, LoadingBlock, Spinner } from "./common/LoadingState.jsx";

const DEFAULT_SETTINGS = {
  pricing: {
    baseFare: 7.5,
    perKmRate: 1.2,
    minimumBookingAmount: 10,
    nightSurcharge: 15
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    automaticAssignment: true
  },
  stripe: {
    publishableKey: "pk_test_placeholder",
    currency: "GBP"
  },
  email: {
    fromEmail: "noreply@ryda.com"
  },
  maps: {
    apiKey: ""
  }
};

function SettingsPage() {
  const { authenticatedRequest, user } = useAdminAuth();
  const {
    data: settingsPageData,
    error: loadError,
    isLoading,
    isFetching,
    mutate
  } = useCachedResource({
    userId: user?.id,
    cacheKey: "settings:page",
    fetcher: async () => {
      const [settingsPayload, statsPayload] = await Promise.all([
        authenticatedRequest("/settings", { method: "GET" }),
        authenticatedRequest("/dashboard/admin", { method: "GET" })
      ]);

      const merged = {
        pricing: {
          ...DEFAULT_SETTINGS.pricing,
          ...(settingsPayload.data?.pricing || {})
        },
        notifications: {
          ...DEFAULT_SETTINGS.notifications,
          ...(settingsPayload.data?.notifications || {})
        },
        stripe: {
          ...DEFAULT_SETTINGS.stripe,
          ...(settingsPayload.data?.stripe || {})
        },
        email: {
          ...DEFAULT_SETTINGS.email,
          ...(settingsPayload.data?.email || {})
        },
        maps: {
          ...DEFAULT_SETTINGS.maps,
          ...(settingsPayload.data?.maps || {})
        }
      };

      return {
        settings: merged,
        openBookingsCount: Number(statsPayload.data?.pendingBookings || 0)
      };
    },
    staleTime: 2 * 60_000,
    emptyValue: { settings: DEFAULT_SETTINGS, openBookingsCount: 0 },
    errorMessage: "Unable to load settings."
  });
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [draft, setDraft] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const canSave = user?.role === "super_admin";
  const openBookingsCount = settingsPageData.openBookingsCount || 0;

  useEffect(() => {
    if (!settingsPageData?.settings) {
      return;
    }

    setSettings(settingsPageData.settings);
    setDraft(settingsPageData.settings);
  }, [settingsPageData]);

  function updateSection(section, key, value) {
    setDraft((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [key]: value
      }
    }));
  }

  function resetChanges() {
    setDraft(settings);
    setFeedback("Changes reset.");
  }

  async function saveSettings() {
    if (!canSave || saving) {
      return;
    }

    setSaving(true);
    setFeedback("");

    try {
      const payload = await authenticatedRequest("/settings", {
        method: "PATCH",
        body: JSON.stringify(draft)
      });

      const merged = {
        pricing: {
          ...DEFAULT_SETTINGS.pricing,
          ...(payload.data?.pricing || {})
        },
        notifications: {
          ...DEFAULT_SETTINGS.notifications,
          ...(payload.data?.notifications || {})
        },
        stripe: {
          ...DEFAULT_SETTINGS.stripe,
          ...(payload.data?.stripe || {})
        },
        email: {
          ...DEFAULT_SETTINGS.email,
          ...(payload.data?.email || {})
        },
        maps: {
          ...DEFAULT_SETTINGS.maps,
          ...(payload.data?.maps || {})
        }
      };

      setSettings(merged);
      setDraft(merged);
      mutate((current) => ({
        ...current,
        settings: merged
      }));
      setFeedback("Settings saved successfully.");
    } catch (error) {
      setFeedback(error?.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell
      activeNav="settings"
      openBookingsCount={openBookingsCount}
      title="Settings"
      actions={
        <>
          <button type="button" className="admin-ghost-button" onClick={resetChanges} disabled={isLoading || saving}>
            Reset changes
          </button>
          <button type="button" className="admin-primary-button" onClick={saveSettings} disabled={!canSave || isLoading || saving}>
            {saving ? (
              <span className="auth-submit-inner">
                <Spinner size="sm" tone="light" label="Saving settings" />
                <span>Saving...</span>
              </span>
            ) : (
              "Save settings"
            )}
          </button>
        </>
      }
    >
      {isFetching && !isLoading ? <InlineLoadingNotice label="Refreshing settings..." /> : null}
      {feedback || loadError ? <div className="admin-inline-feedback">{feedback || loadError}</div> : null}
      {isLoading ? (
        <section className="admin-panel-card">
          <div className="admin-loading-state">
            <LoadingBlock title="Loading settings" copy="Fetching system controls, pricing, and notification preferences." compact />
          </div>
        </section>
      ) : (
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
                <input className="admin-input" value={draft.pricing.baseFare} onChange={(event) => updateSection("pricing", "baseFare", Number(event.target.value))} />
              </div>
              <div className="admin-form-field">
                <label className="admin-field-label">Per KM fare</label>
                <input className="admin-input" value={draft.pricing.perKmRate} onChange={(event) => updateSection("pricing", "perKmRate", Number(event.target.value))} />
              </div>
              <div className="admin-form-field">
                <label className="admin-field-label">Minimum booking amount</label>
                <input
                  className="admin-input"
                  value={draft.pricing.minimumBookingAmount}
                  onChange={(event) => updateSection("pricing", "minimumBookingAmount", Number(event.target.value))}
                />
              </div>
              <div className="admin-form-field">
                <label className="admin-field-label">Night surcharge</label>
                <input
                  className="admin-input"
                  value={draft.pricing.nightSurcharge}
                  onChange={(event) => updateSection("pricing", "nightSurcharge", Number(event.target.value))}
                />
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
              <button type="button" className="admin-toggle-row" onClick={() => updateSection("notifications", "emailEnabled", !draft.notifications.emailEnabled)}>
                <div>
                  <strong>Email notifications</strong>
                  <span>Send driver and admin alerts after booking confirmation.</span>
                </div>
                <span className={draft.notifications.emailEnabled ? "admin-toggle admin-toggle-on" : "admin-toggle"}>
                  <span />
                </span>
              </button>

              <button type="button" className="admin-toggle-row" onClick={() => updateSection("notifications", "smsEnabled", !draft.notifications.smsEnabled)}>
                <div>
                  <strong>SMS notifications</strong>
                  <span>Prepared for future Twilio integration once enabled.</span>
                </div>
                <span className={draft.notifications.smsEnabled ? "admin-toggle admin-toggle-on" : "admin-toggle"}>
                  <span />
                </span>
              </button>

              <button
                type="button"
                className="admin-toggle-row"
                onClick={() => updateSection("notifications", "automaticAssignment", !draft.notifications.automaticAssignment)}
              >
                <div>
                  <strong>Automatic assignment</strong>
                  <span>Allow the future backend to auto-assign bookings to available drivers.</span>
                </div>
                <span className={draft.notifications.automaticAssignment ? "admin-toggle admin-toggle-on" : "admin-toggle"}>
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
                <input
                  className="admin-input"
                  value={draft.stripe.publishableKey}
                  onChange={(event) => updateSection("stripe", "publishableKey", event.target.value)}
                />
              </div>
              <div className="admin-form-field admin-form-field-full">
                <label className="admin-field-label">Email sender address</label>
                <input className="admin-input" value={draft.email.fromEmail} onChange={(event) => updateSection("email", "fromEmail", event.target.value)} />
              </div>
              <div className="admin-form-field admin-form-field-full">
                <label className="admin-field-label">Google Maps API key</label>
                <input className="admin-input" value={draft.maps.apiKey} onChange={(event) => updateSection("maps", "apiKey", event.target.value)} />
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
                <strong>{draft.notifications.emailEnabled ? "Enabled" : "Disabled"}</strong>
              </div>
              <div className="admin-summary-row">
                <span>SMS alerts</span>
                <strong>{draft.notifications.smsEnabled ? "Enabled" : "Disabled"}</strong>
              </div>
              <div className="admin-summary-row">
                <span>Auto assignment</span>
                <strong>{draft.notifications.automaticAssignment ? "Enabled" : "Disabled"}</strong>
              </div>
              <div className="admin-summary-row">
                <span>Environment</span>
                <strong>{canSave ? "Live backend" : "Read only"}</strong>
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
                <span>Pricing values now load from and save to the backend settings service.</span>
              </div>
              <div className="admin-reminder-item">
                <span className="admin-reminder-dot" />
                <span>Notification toggles are stored as shared settings for the admin panel configuration.</span>
              </div>
              <div className="admin-reminder-item">
                <span className="admin-reminder-dot" />
                <span>{canSave ? "Super admin can persist these changes immediately." : "Only super admin can save settings changes."}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}
    </AdminShell>
  );
}

export default SettingsPage;

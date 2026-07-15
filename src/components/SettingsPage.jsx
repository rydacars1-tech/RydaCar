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

function mergeSettings(payload = {}) {
  return {
    pricing: {
      ...DEFAULT_SETTINGS.pricing,
      ...(payload.pricing || {})
    },
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      ...(payload.notifications || {})
    },
    stripe: {
      ...DEFAULT_SETTINGS.stripe,
      ...(payload.stripe || {})
    },
    email: {
      ...DEFAULT_SETTINGS.email,
      ...(payload.email || {})
    },
    maps: {
      ...DEFAULT_SETTINGS.maps,
      ...(payload.maps || {})
    }
  };
}

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

      return {
        settings: mergeSettings(settingsPayload.data || {}),
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
  const controlsDisabled = !canSave || saving;
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

      const merged = mergeSettings(payload.data || {});

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
        <section className="settings-layout">
          <div className="admin-two-column-layout">
            <div className="admin-stack-layout">
              <div className="admin-panel-card settings-panel-card">
                <div className="admin-section-head">
                  <div>
                    <div className="admin-section-title">Booking pricing</div>
                    <div className="admin-section-subtitle">Core fare settings used by pricing and checkout flows.</div>
                  </div>
                </div>

                <div className="admin-form-grid">
                  <div className="admin-form-field">
                    <label className="admin-field-label">Base fare</label>
                    <input
                      className="admin-input"
                      type="number"
                      value={draft.pricing.baseFare}
                      disabled={controlsDisabled}
                      onChange={(event) => updateSection("pricing", "baseFare", Number(event.target.value))}
                    />
                  </div>
                  <div className="admin-form-field">
                    <label className="admin-field-label">Per KM fare</label>
                    <input
                      className="admin-input"
                      type="number"
                      value={draft.pricing.perKmRate}
                      disabled={controlsDisabled}
                      onChange={(event) => updateSection("pricing", "perKmRate", Number(event.target.value))}
                    />
                  </div>
                  <div className="admin-form-field">
                    <label className="admin-field-label">Minimum booking amount</label>
                    <input
                      className="admin-input"
                      type="number"
                      value={draft.pricing.minimumBookingAmount}
                      disabled={controlsDisabled}
                      onChange={(event) => updateSection("pricing", "minimumBookingAmount", Number(event.target.value))}
                    />
                  </div>
                  <div className="admin-form-field">
                    <label className="admin-field-label">Night surcharge</label>
                    <input
                      className="admin-input"
                      type="number"
                      value={draft.pricing.nightSurcharge}
                      disabled={controlsDisabled}
                      onChange={(event) => updateSection("pricing", "nightSurcharge", Number(event.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="admin-panel-card settings-panel-card">
                <div className="admin-section-head">
                  <div>
                    <div className="admin-section-title">Operations controls</div>
                    <div className="admin-section-subtitle">These toggles now drive live notification delivery and automatic booking assignment behavior.</div>
                  </div>
                </div>

                <div className="admin-toggle-list">
                  <button
                    type="button"
                    className="admin-toggle-row settings-toggle-row"
                    onClick={() => updateSection("notifications", "emailEnabled", !draft.notifications.emailEnabled)}
                    disabled={controlsDisabled}
                  >
                    <div className="settings-toggle-copy">
                      <strong>Notifications</strong>
                      <span>Enable or disable admin and driver booking alerts across the system.</span>
                    </div>
                    <div className="settings-toggle-side">
                      <span className={draft.notifications.emailEnabled ? "settings-state-pill settings-state-pill-on" : "settings-state-pill"}>
                        {draft.notifications.emailEnabled ? "On" : "Off"}
                      </span>
                      <span className={draft.notifications.emailEnabled ? "admin-toggle admin-toggle-on" : "admin-toggle"}>
                        <span />
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="admin-toggle-row settings-toggle-row"
                    onClick={() => updateSection("notifications", "automaticAssignment", !draft.notifications.automaticAssignment)}
                    disabled={controlsDisabled}
                  >
                    <div className="settings-toggle-copy">
                      <strong>Automatic assign</strong>
                      <span>When enabled, customer bookings can automatically attach the matched driver and taxi during creation.</span>
                    </div>
                    <div className="settings-toggle-side">
                      <span className={draft.notifications.automaticAssignment ? "settings-state-pill settings-state-pill-on" : "settings-state-pill"}>
                        {draft.notifications.automaticAssignment ? "On" : "Off"}
                      </span>
                      <span className={draft.notifications.automaticAssignment ? "admin-toggle admin-toggle-on" : "admin-toggle"}>
                        <span />
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="admin-panel-card settings-panel-card">
                <div className="admin-section-head">
                  <div>
                    <div className="admin-section-title">Integration keys</div>
                    <div className="admin-section-subtitle">Configuration used by payment, email, and mapping integrations.</div>
                  </div>
                </div>

                <div className="admin-form-grid">
                  <div className="admin-form-field admin-form-field-full">
                    <label className="admin-field-label">Stripe publishable key</label>
                    <input
                      className="admin-input"
                      value={draft.stripe.publishableKey}
                      disabled={controlsDisabled}
                      onChange={(event) => updateSection("stripe", "publishableKey", event.target.value)}
                    />
                  </div>
                  <div className="admin-form-field admin-form-field-full">
                    <label className="admin-field-label">Email sender address</label>
                    <input
                      className="admin-input"
                      value={draft.email.fromEmail}
                      disabled={controlsDisabled}
                      onChange={(event) => updateSection("email", "fromEmail", event.target.value)}
                    />
                  </div>
                  <div className="admin-form-field admin-form-field-full">
                    <label className="admin-field-label">Google Maps API key</label>
                    <input
                      className="admin-input"
                      value={draft.maps.apiKey}
                      disabled={controlsDisabled}
                      onChange={(event) => updateSection("maps", "apiKey", event.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-stack-layout">
              <div className="admin-panel-card admin-panel-card-soft settings-panel-card">
                <div className="admin-section-head">
                  <div>
                    <div className="admin-section-title">Current configuration</div>
                    <div className="admin-section-subtitle">A quick summary of the live settings currently prepared for the platform.</div>
                  </div>
                </div>

                <div className="admin-summary-list settings-summary-list">
                  <div className="admin-summary-row">
                    <span>Notifications</span>
                    <strong>{draft.notifications.emailEnabled ? "Enabled" : "Disabled"}</strong>
                  </div>
                  <div className="admin-summary-row">
                    <span>Automatic assign</span>
                    <strong>{draft.notifications.automaticAssignment ? "Enabled" : "Disabled"}</strong>
                  </div>
                  <div className="admin-summary-row">
                    <span>Stripe currency</span>
                    <strong>{draft.stripe.currency || "GBP"}</strong>
                  </div>
                  <div className="admin-summary-row">
                    <span>Environment</span>
                    <strong>{canSave ? "Live backend" : "Read only"}</strong>
                  </div>
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

import DriverShell from "./driver/DriverShell.jsx";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { useCachedResource } from "../lib/adminCache.js";
import { InlineLoadingNotice, LoadingBlock } from "./common/LoadingState.jsx";
import { DriverDetailIcon } from "./driver/DriverIcons.jsx";
import { getInitials } from "./driver/driverData.js";

function formatProfileText(value, fallback = "Not available") {
  const normalized = String(value || "").trim();
  return normalized || fallback;
}

function formatStatusLabel(value) {
  const normalized = String(value || "").trim();
  if (!normalized) {
    return "Unknown";
  }

  return normalized.replace(/[_-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function DriverProfilePage() {
  const { authenticatedRequest, user } = useAdminAuth();

  const {
    data: profile,
    error: loadError,
    isLoading,
    isFetching
  } = useCachedResource({
    userId: user?.id,
    cacheKey: "driver:profile",
    fetcher: async () => {
      const payload = await authenticatedRequest("/users/profile/me", { method: "GET" });
      return payload.data || {};
    },
    staleTime: 60_000,
    emptyValue: {},
    errorMessage: "Unable to load profile."
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
    errorMessage: "Unable to load driver dashboard."
  });

  const assignedTaxis = dashboardData.assignedTaxis || [];
  const profileName = formatProfileText(profile.name || user?.name, "Driver");
  const accountStatus = formatStatusLabel(profile.status || user?.status);
  const summaryItems = [
    { label: "Email", value: formatProfileText(profile.email), icon: "email" },
    { label: "Phone", value: formatProfileText(profile.phone), icon: "phone" },
    { label: "Role", value: user?.role === "driver" ? "Driver" : "User", icon: "role" },
    { label: "Account status", value: accountStatus, icon: "status" }
  ];
  const vehicleItems = [
    { label: "Vehicle number", value: formatProfileText(profile.vehicleNumber), icon: "vehicle" },
    { label: "Vehicle type", value: formatProfileText(profile.vehicleType), icon: "vehicle" },
    { label: "City", value: formatProfileText(profile.city), icon: "city" },
    { label: "License number", value: formatProfileText(profile.licenseNumber), icon: "license" }
  ];

  return (
    <DriverShell activeNav="profile" title="Profile">
      <section className="admin-dashboard-grid">
        <div className="admin-panel-card">
          {isFetching && !isLoading ? <InlineLoadingNotice label="Refreshing profile..." /> : null}
          {loadError ? <div className="admin-inline-feedback">{loadError}</div> : null}

          {isLoading ? (
            <div className="admin-loading-state">
              <LoadingBlock title="Loading profile" copy="Fetching driver account details." compact />
            </div>
          ) : (
            <div className="driver-profile-layout">
              <section className="driver-profile-hero">
                <div className="driver-profile-avatar">{getInitials(profileName)}</div>
                <div className="driver-profile-hero-copy">
                  <div className="driver-profile-label">Authenticated driver profile</div>
                  <h2 className="driver-profile-name">{profileName}</h2>
                  <div className="driver-profile-subtitle">Profile details are loaded from your authenticated driver record and active account session.</div>
                  <div className="driver-profile-badges">
                    <span className="admin-status-badge admin-status-badge-done">Driver</span>
                    <span className={`admin-status-badge ${String(profile.status || user?.status || "").toLowerCase() === "active" ? "admin-status-badge-done" : ""}`}>
                      {accountStatus}
                    </span>
                  </div>
                </div>
              </section>

              <div className="admin-two-column-layout driver-profile-grid">
                <div className="admin-panel-card driver-profile-panel">
                  <div className="admin-section-head">
                    <div>
                      <div className="admin-section-title">Account details</div>
                      <div className="admin-section-subtitle">Only information already available in the backend is displayed here.</div>
                    </div>
                  </div>

                  <div className="driver-profile-info-list">
                    {summaryItems.map((item) => (
                      <div key={item.label} className="driver-profile-info-item">
                        <span className="driver-profile-info-icon">
                          <DriverDetailIcon kind={item.icon} />
                        </span>
                        <div className="driver-profile-info-content">
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admin-panel-card driver-profile-panel">
                  <div className="admin-section-head">
                    <div>
                      <div className="admin-section-title">Vehicle details</div>
                      <div className="admin-section-subtitle">Driver vehicle metadata from the authenticated driver profile.</div>
                    </div>
                  </div>

                  <div className="driver-profile-info-list">
                    {vehicleItems.map((item) => (
                      <div key={item.label} className="driver-profile-info-item">
                        <span className="driver-profile-info-icon">
                          <DriverDetailIcon kind={item.icon} />
                        </span>
                        <div className="driver-profile-info-content">
                          <span>{item.label}</span>
                          <strong>{item.value}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="admin-panel-card driver-profile-panel">
                <div className="admin-section-head">
                  <div>
                    <div className="admin-section-title">Assigned taxis</div>
                    <div className="admin-section-subtitle">These taxi QR assignments are loaded from your driver dashboard data.</div>
                  </div>
                </div>

                {assignedTaxis.length === 0 ? (
                  <div className="admin-empty-state driver-dashboard-empty">
                    <div className="admin-empty-state-title">No taxi assigned</div>
                    <div className="admin-empty-state-copy">Your assigned vehicle information will appear here once an admin links a taxi QR to your account.</div>
                  </div>
                ) : (
                  <div className="admin-summary-list driver-dashboard-summary-list">
                    {assignedTaxis.map((taxi) => (
                      <div key={taxi.id} className="admin-summary-row driver-dashboard-summary-row">
                        <div>
                          <strong>{taxi.vehicleNumber || "-"}</strong>
                          <span>{taxi.label || "Taxi QR"}</span>
                        </div>
                        <span className={`admin-status-badge ${taxi.status === "active" ? "admin-status-badge-done" : ""}`}>{taxi.status || "unknown"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </DriverShell>
  );
}

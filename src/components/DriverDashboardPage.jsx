import { useMemo } from "react";
import DriverShell from "./driver/DriverShell.jsx";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { useCachedResource } from "../lib/adminCache.js";
import { InlineLoadingNotice, LoadingBlock } from "./common/LoadingState.jsx";
import { DriverStatIcon } from "./driver/DriverIcons.jsx";

function navigateToDriverBookings(filter = "all") {
  window.location.hash = filter === "all" ? "#/driver/bookings" : `#/driver/bookings?status=${filter}`;
}

function DriverMetricCard({ label, value, icon, tone = "neutral", interactive = false, onActivate = null }) {
  const className = [
    "admin-metric-card",
    `admin-metric-card-${tone}`,
    interactive ? "driver-dashboard-metric-card-actionable" : ""
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <div className="admin-metric-top">
        <div className="admin-metric-icon">{icon}</div>
        <div className="admin-metric-label">{label}</div>
      </div>
      <div className="admin-metric-value">{value}</div>
    </>
  );

  if (!interactive) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button type="button" className={className} onClick={onActivate}>
      {content}
    </button>
  );
}

export default function DriverDashboardPage() {
  const { authenticatedRequest, user } = useAdminAuth();

  const {
    data: dashboardData,
    error: loadError,
    isLoading,
    isFetching
  } = useCachedResource({
    userId: user?.id,
    cacheKey: "driver:dashboard",
    fetcher: async () => {
      const payload = await authenticatedRequest("/dashboard/driver", { method: "GET" });
      return payload.data || {};
    },
    staleTime: 45_000,
    emptyValue: {
      totalBookings: 0,
      pendingBookings: 0,
      acceptedBookings: 0,
      activeBookings: 0,
      completedBookings: 0,
      cancelledBookings: 0,
      assignedTaxis: [],
      totalEarnings: 0,
      currency: "GBP"
    },
    errorMessage: "Unable to load driver dashboard."
  });

  const assignedTaxis = useMemo(() => dashboardData.assignedTaxis || [], [dashboardData.assignedTaxis]);
  const assignedTaxiCount = assignedTaxis.length;
  const metricCards = useMemo(
    () => [
      {
        key: "total",
        label: "Total bookings",
        value: dashboardData.totalBookings || 0,
        tone: "neutral",
        icon: <DriverStatIcon kind="total" />,
        interactive: true,
        onActivate: () => navigateToDriverBookings("all")
      },
      {
        key: "pending",
        label: "Pending bookings",
        value: dashboardData.pendingBookings || 0,
        tone: "sky",
        icon: <DriverStatIcon kind="pending" />,
        interactive: true,
        onActivate: () => navigateToDriverBookings("pending")
      },
      {
        key: "completed",
        label: "Completed bookings",
        value: dashboardData.completedBookings || 0,
        tone: "dark",
        icon: <DriverStatIcon kind="completed" />,
        interactive: true,
        onActivate: () => navigateToDriverBookings("completed")
      },
      {
        key: "taxis",
        label: "Assigned taxis",
        value: assignedTaxiCount,
        tone: "neutral",
        icon: <DriverStatIcon kind="taxis" />
      }
    ],
    [
      assignedTaxiCount,
      dashboardData.completedBookings,
      dashboardData.pendingBookings,
      dashboardData.totalBookings
    ]
  );

  return (
    <DriverShell activeNav="dashboard" title="Dashboard">
      <section className="admin-dashboard-grid">
        <div className="admin-panel-card">
          {isFetching && !isLoading ? <InlineLoadingNotice label="Refreshing driver stats..." /> : null}
          {loadError ? <div className="admin-inline-feedback">{loadError}</div> : null}

          {isLoading ? (
            <div className="admin-loading-state">
              <LoadingBlock title="Loading dashboard" copy="Fetching your bookings and assigned taxi information." compact />
            </div>
          ) : (
            <>
              <div className="admin-section-head">
                <div>
                  <div className="admin-section-title">Your overview</div>
                  <div className="admin-section-subtitle">Only bookings and taxi assignments linked to your authenticated driver account are shown here.</div>
                </div>
              </div>

              <div className="admin-metrics-grid driver-dashboard-metrics-grid">
                {metricCards.map((card) => (
                  <DriverMetricCard key={card.key} {...card} />
                ))}
              </div>

              <div className="driver-dashboard-detail-grid">
                <div className="admin-panel-card driver-dashboard-panel">
                  <div className="admin-section-title">Assigned taxis</div>

                  {assignedTaxis.length === 0 ? (
                    <div className="admin-empty-state driver-dashboard-empty">
                      <div className="admin-empty-state-title">No taxi assigned</div>
                      <div className="admin-empty-state-copy">Ask the admin to create your taxi QR and assign it to your driver account.</div>
                    </div>
                  ) : (
                    <div className="admin-summary-list driver-dashboard-summary-list">
                      {assignedTaxis.map((taxi) => (
                        <div key={taxi.id} className="admin-summary-row driver-dashboard-summary-row">
                          <div>
                            <strong>{taxi.vehicleNumber || "Assigned vehicle"}</strong>
                            <span>{taxi.label || "Taxi QR"}</span>
                          </div>
                          <span className={`admin-status-badge ${taxi.status === "active" ? "admin-status-badge-done" : ""}`}>{taxi.status || "unknown"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </DriverShell>
  );
}

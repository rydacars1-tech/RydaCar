import { useMemo, useState } from "react";
import DriverShell from "./driver/DriverShell.jsx";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { invalidateAdminDataCache, useCachedResource } from "../lib/adminCache.js";
import { InlineLoadingNotice, LoadingBlock, Spinner } from "./common/LoadingState.jsx";
import { DriverNotificationIcon } from "./driver/DriverIcons.jsx";
import {
  buildNotificationPreview,
  formatDateTime,
  formatTemplateLabel,
  getNotificationTemplateTone
} from "./driver/driverData.js";

export default function DriverNotificationsPage() {
  const { authenticatedRequest, user } = useAdminAuth();
  const [actionState, setActionState] = useState({ busyId: "", error: "", success: "" });

  const {
    data: notifications,
    error: loadError,
    isLoading,
    isFetching,
    mutate
  } = useCachedResource({
    userId: user?.id,
    cacheKey: "driver:notifications",
    fetcher: async () => {
      const payload = await authenticatedRequest("/notifications/me", { method: "GET" });
      return payload.data || [];
    },
    staleTime: 25_000,
    emptyValue: [],
    errorMessage: "Unable to load notifications."
  });

  const items = useMemo(() => notifications || [], [notifications]);
  const unreadCount = useMemo(() => items.filter((item) => !item.readAt).length, [items]);

  function notifyShellRefresh() {
    invalidateAdminDataCache(user?.id, "driver:notifications:unread");
    window.dispatchEvent(new Event("driver-notifications:refresh"));
  }

  async function markAsRead(notificationId) {
    if (!notificationId || actionState.busyId) {
      return;
    }

    setActionState({ busyId: notificationId, error: "", success: "" });

    try {
      const payload = await authenticatedRequest(`/notifications/${notificationId}/read`, {
        method: "PATCH"
      });
      const updatedNotification = payload.data;

      mutate((current) =>
        (current || []).map((item) => (item.notificationId === notificationId ? { ...item, ...updatedNotification } : item))
      );
      notifyShellRefresh();
      setActionState({ busyId: "", error: "", success: "Notification marked as read." });
    } catch (error) {
      setActionState({ busyId: "", error: error?.message || "Unable to mark this notification as read.", success: "" });
    }
  }

  async function markAllAsRead() {
    if (unreadCount === 0 || actionState.busyId) {
      return;
    }

    setActionState({ busyId: "all", error: "", success: "" });

    try {
      await authenticatedRequest("/notifications/read-all", {
        method: "PATCH"
      });

      const now = new Date().toISOString();
      mutate((current) => (current || []).map((item) => (item.readAt ? item : { ...item, readAt: now })));
      notifyShellRefresh();
      setActionState({ busyId: "", error: "", success: "All notifications marked as read." });
    } catch (error) {
      setActionState({ busyId: "", error: error?.message || "Unable to mark notifications as read.", success: "" });
    }
  }

  return (
    <DriverShell activeNav="notifications" title="Notifications">
      <section className="admin-dashboard-grid">
        <div className="admin-panel-card">
          {isFetching && !isLoading ? <InlineLoadingNotice label="Refreshing notifications..." /> : null}
          {loadError ? <div className="admin-inline-feedback">{loadError}</div> : null}
          {actionState.error ? <div className="admin-inline-feedback driver-inline-feedback-error">{actionState.error}</div> : null}
          {actionState.success ? <div className="auth-feedback auth-feedback-success driver-inline-success">{actionState.success}</div> : null}

          {isLoading ? (
            <div className="admin-loading-state">
              <LoadingBlock title="Loading notifications" copy="Fetching driver notifications and booking updates." compact />
            </div>
          ) : items.length === 0 ? (
            <div className="admin-empty-state">
              <div className="admin-empty-state-title">No notifications</div>
              <div className="admin-empty-state-copy">Booking updates and system alerts will appear here.</div>
            </div>
          ) : (
            <>
              <div className="admin-section-head">
                <div>
                  <div className="admin-section-title">Driver notifications</div>
                  <div className="admin-section-subtitle">Only notifications addressed to your authenticated driver account are returned.</div>
                </div>
                <div className="driver-notifications-head-actions">
                  <span className="driver-notifications-unread-pill">{unreadCount} unread</span>
                  <button type="button" className="admin-ghost-button" onClick={markAllAsRead} disabled={unreadCount === 0 || actionState.busyId === "all"}>
                    {actionState.busyId === "all" ? "Updating..." : "Mark all read"}
                  </button>
                </div>
              </div>

              <div className="driver-notifications-list">
                {items.map((item) => {
                  const templateTone = getNotificationTemplateTone(item.template);
                  const deliveryTone = String(item.status || "") === "sent" ? "done" : String(item.status || "") === "queued" ? "open" : "neutral";

                  return (
                    <article
                      key={item.notificationId}
                      className={item.readAt ? "driver-notification-card" : "driver-notification-card driver-notification-card-unread"}
                    >
                      <div className={`driver-notification-icon driver-notification-icon-${templateTone}`}>
                        <DriverNotificationIcon template={item.template} />
                      </div>

                      <div className="driver-notification-main">
                        <div className="driver-notification-top">
                          <div>
                            <strong>{formatTemplateLabel(item.template)}</strong>
                            <div className="driver-notification-meta">
                              <span>{String(item.channel || "email").toUpperCase()}</span>
                              <span>{formatDateTime(item.createdAt)}</span>
                            </div>
                          </div>

                          <div className="driver-notification-badges">
                            <span className={deliveryTone === "done" ? "admin-status-badge admin-status-badge-done" : deliveryTone === "open" ? "admin-status-badge admin-status-badge-open" : "admin-status-badge"}>
                              {String(item.status || "queued")}
                            </span>
                            <span className={item.readAt ? "admin-status-badge" : "admin-status-badge admin-status-badge-open"}>
                              {item.readAt ? "Read" : "Unread"}
                            </span>
                          </div>
                        </div>

                        <div className="driver-notification-preview">{buildNotificationPreview(item.payload)}</div>

                        <div className="driver-notification-footer">
                          <span className="driver-notification-time-label">
                            {item.readAt ? `Read ${formatDateTime(item.readAt)}` : "Unread notification"}
                          </span>
                          {!item.readAt ? (
                            <button
                              type="button"
                              className="admin-table-action"
                              onClick={() => markAsRead(item.notificationId)}
                              disabled={actionState.busyId === item.notificationId}
                            >
                              {actionState.busyId === item.notificationId ? (
                                <span className="driver-inline-button-loading">
                                  <Spinner size="xs" label="Marking notification as read" />
                                  <span>Marking...</span>
                                </span>
                              ) : (
                                "Mark as read"
                              )}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </DriverShell>
  );
}

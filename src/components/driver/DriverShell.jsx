import { useCallback, useEffect, useMemo, useState } from "react";
import logo from "../../assets/logo.jpeg";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";
import { useCachedResource } from "../../lib/adminCache.js";
import MobileAppHeader, { useMobileDrawerEffects } from "../layout/MobileAppHeader.jsx";

function navigateTo(hash) {
  window.location.hash = hash;
}

function DriverIcon({ icon }) {
  const sharedProps = {
    xmlns: "http://www.w3.org/2000/svg",
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.9",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  };

  if (icon === "bookings") {
    return (
      <svg {...sharedProps}>
        <path d="M8 6h11" />
        <path d="M8 12h11" />
        <path d="M8 18h11" />
        <path d="M3 6h.01" />
        <path d="M3 12h.01" />
        <path d="M3 18h.01" />
      </svg>
    );
  }

  if (icon === "notifications") {
    return (
      <svg {...sharedProps}>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    );
  }

  if (icon === "tips") {
    return (
      <svg {...sharedProps} fill="none" aria-hidden="true">
        <text x="12" y="16" textAnchor="middle" fontSize="16" fontWeight="700" fill="currentColor" stroke="none">
          £
        </text>
      </svg>
    );
  }

  if (icon === "profile") {
    return (
      <svg {...sharedProps}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  }

  return (
    <svg {...sharedProps}>
      <path d="M3 13h8V3H3z" />
      <path d="M13 21h8v-6h-8z" />
      <path d="M13 11h8V3h-8z" />
      <path d="M3 21h8v-4H3z" />
    </svg>
  );
}

function SidebarItem({ item, activeId, onNavigate }) {
  const className = ["admin-sidebar-link", item.id === activeId ? "admin-sidebar-link-active" : ""].filter(Boolean).join(" ");

  return (
    <button type="button" className={className} onClick={() => onNavigate(item)}>
      <span className="admin-sidebar-link-icon">
        <DriverIcon icon={item.id} />
      </span>
      <span className="admin-sidebar-link-copy">
        <span className="admin-sidebar-link-label">{item.label}</span>
      </span>
      {item.badge ? <span className="admin-sidebar-link-badge">{item.badge}</span> : null}
    </button>
  );
}

export default function DriverShell({ activeNav = "dashboard", title = "", actions = null, children }) {
  const { authenticatedRequest, user, logout } = useAdminAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileDrawerId = "driver-mobile-drawer";
  const {
    data: unreadData,
    refresh: refreshUnread
  } = useCachedResource({
    userId: user?.id,
    cacheKey: "driver:notifications:unread",
    fetcher: async () => {
      const payload = await authenticatedRequest("/notifications/unread-count", { method: "GET" });
      return payload.data || { unreadCount: 0 };
    },
    staleTime: 15_000,
    emptyValue: { unreadCount: 0 },
    errorMessage: "Unable to load unread notifications."
  });
  const unreadCount = Number(unreadData?.unreadCount || 0);
  const unreadBadge = unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : "";

  useEffect(() => {
    function handleUnreadRefresh() {
      refreshUnread().catch(() => {});
    }

    window.addEventListener("driver-notifications:refresh", handleUnreadRefresh);
    return () => window.removeEventListener("driver-notifications:refresh", handleUnreadRefresh);
  }, [refreshUnread]);

  const navigation = useMemo(
    () => [
      { id: "dashboard", label: "Dashboard", hash: "#/driver/dashboard" },
      { id: "bookings", label: "Bookings", hash: "#/driver/bookings" },
      { id: "notifications", label: "Notifications", hash: "#/driver/notifications", badge: unreadBadge },
      { id: "tips", label: "Tip Amount", hash: "#/driver/tips" },
      { id: "profile", label: "Profile", hash: "#/driver/profile" }
    ],
    [unreadBadge]
  );

  const closeMobileNav = useCallback(() => {
    setMobileNavOpen(false);
  }, []);

  useMobileDrawerEffects(mobileNavOpen, closeMobileNav, mobileDrawerId);

  function handleNavigate(item) {
    closeMobileNav();
    navigateTo(item.hash);
  }

  async function handleLogout() {
    closeMobileNav();
    await logout();
    navigateTo("#/login");
  }

  return (
    <div className="admin-shell driver-shell">
      <MobileAppHeader drawerOpen={mobileNavOpen} onToggle={() => setMobileNavOpen((current) => !current)} drawerId={mobileDrawerId} />
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-mark">
            <img src={logo} alt="Ryda" className="admin-brand-logo" />
          </div>
          <div className="admin-brand-copy">
            <div className="admin-brand-title">Ryda Car</div>
            <div className="admin-brand-subtitle">Driver Portal</div>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {navigation.map((item) => (
            <SidebarItem key={item.id} item={item} activeId={activeNav} onNavigate={handleNavigate} />
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          {user ? (
            <div className="admin-sidebar-user">
              <strong>{user.name}</strong>
              <span>Driver</span>
            </div>
          ) : null}
          <button type="button" className="admin-sidebar-logout" onClick={handleLogout}>
            <span className="admin-sidebar-logout-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <path d="m16 17 5-5-5-5" />
                <path d="M21 12H9" />
              </svg>
            </span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button type="button" className="admin-mobile-menu" onClick={() => setMobileNavOpen((current) => !current)} aria-label="Open navigation">
              <span />
              <span />
              <span />
            </button>
            <div>
              <h1 className="admin-page-title">{title}</h1>
            </div>
          </div>

          <div className="admin-topbar-right">{actions ? <div className="admin-topbar-actions">{actions}</div> : null}</div>
        </header>

        <main className="admin-content">{children}</main>
      </div>

      {mobileNavOpen ? (
        <div className="admin-mobile-overlay" onClick={closeMobileNav} role="dialog" aria-modal="true">
          <aside id={mobileDrawerId} className="admin-mobile-sidebar" onClick={(event) => event.stopPropagation()} tabIndex={-1}>
            <div className="admin-mobile-head">
              <div className="admin-brand">
                <div className="admin-brand-mark">
                  <img src={logo} alt="Ryda" className="admin-brand-logo" />
                </div>
                <div className="admin-brand-copy">
                  <div className="admin-brand-title">Ryda Car</div>
                  <div className="admin-brand-subtitle">Driver Portal</div>
                </div>
              </div>
              <button type="button" className="admin-mobile-close" onClick={closeMobileNav} aria-label="Close navigation">
                ×
              </button>
            </div>

            <nav className="admin-sidebar-nav">
              {navigation.map((item) => (
                <SidebarItem key={item.id} item={item} activeId={activeNav} onNavigate={handleNavigate} />
              ))}
            </nav>

            <div className="admin-sidebar-footer">
              {user ? (
                <div className="admin-sidebar-user">
                  <strong>{user.name}</strong>
                  <span>Driver</span>
                </div>
              ) : null}
              <button type="button" className="admin-sidebar-logout" onClick={handleLogout}>
                <span className="admin-sidebar-logout-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <path d="m16 17 5-5-5-5" />
                    <path d="M21 12H9" />
                  </svg>
                </span>
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

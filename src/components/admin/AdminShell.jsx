import { useMemo, useState } from "react";
import logo from "../../assets/logo.jpeg";
import { useAdminAuth } from "../../context/AdminAuthContext.jsx";
import { getAdminNavigation, navigateTo } from "./adminData.js";

function AdminIcon({ icon }) {
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

  if (icon === "qr") {
    return (
      <svg {...sharedProps}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <path d="M14 14h3v3h-3z" />
        <path d="M18 18h3v3h-3z" />
        <path d="M18 14h3" />
        <path d="M14 20h1" />
      </svg>
    );
  }

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

  if (icon === "users") {
    return (
      <svg {...sharedProps}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    );
  }

  if (icon === "email") {
    return (
      <svg {...sharedProps}>
        <path d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
        <path d="m22 8-8.97 5.7a2 2 0 0 1-2.06 0L2 8" />
      </svg>
    );
  }

  if (icon === "revenue") {
    return (
      <svg {...sharedProps}>
        <path d="M3 3v18h18" />
        <path d="m7 15 4-4 3 3 5-6" />
        <path d="M18 8h1" />
      </svg>
    );
  }

  if (icon === "settings") {
    return (
      <svg {...sharedProps}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-.33-1A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1-.33H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1-.33A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6a1.65 1.65 0 0 0 1-.6 1.65 1.65 0 0 0 .33-1V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 .33 1 1.65 1.65 0 0 0 1 .6 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 8a1.65 1.65 0 0 0 .6 1 1.65 1.65 0 0 0 1 .33H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1 .33A1.65 1.65 0 0 0 19.4 15z" />
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
  const className = [
    "admin-sidebar-link",
    item.id === activeId ? "admin-sidebar-link-active" : "",
    item.disabled ? "admin-sidebar-link-disabled" : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={className} onClick={() => onNavigate(item)} disabled={item.disabled}>
      <span className="admin-sidebar-link-icon">
        <AdminIcon icon={item.id} />
      </span>
      <span className="admin-sidebar-link-copy">
        <span className="admin-sidebar-link-label">{item.label}</span>
      </span>
      {item.badge ? <span className="admin-sidebar-link-badge">{item.badge}</span> : null}
    </button>
  );
}

function SecondaryTab({ tab, active, onClick }) {
  return (
    <button
      type="button"
      className={active ? "admin-secondary-tab admin-secondary-tab-active" : "admin-secondary-tab"}
      onClick={onClick}
    >
      {tab.label}
      {tab.badge ? <span className="admin-secondary-tab-badge">{tab.badge}</span> : null}
    </button>
  );
}

function AdminShell({
  activeNav,
  openBookingsCount = 0,
  title,
  actions = null,
  secondaryTabs = [],
  children
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { logout, user } = useAdminAuth();
  const navigation = useMemo(() => getAdminNavigation(openBookingsCount), [openBookingsCount]);

  function handleNavigate(item) {
    if (!item.disabled && item.hash) {
      setMobileNavOpen(false);
      navigateTo(item.hash);
    }
  }

  async function handleLogout() {
    setMobileNavOpen(false);
    await logout();
    navigateTo("#/dashboard");
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-mark">
            <img src={logo} alt="Ryda" className="admin-brand-logo" />
          </div>
          <div className="admin-brand-copy">
            <div className="admin-brand-title">Ryda Car</div>
            <div className="admin-brand-subtitle">Admin Panel</div>
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
              <span>{user.role.replace("_", " ")}</span>
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
            <button
              type="button"
              className="admin-mobile-menu"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
            >
              <span />
              <span />
              <span />
            </button>
            <div>
              <h1 className="admin-page-title">{title}</h1>
            </div>
          </div>

          <div className="admin-topbar-right">
            {actions ? <div className="admin-topbar-actions">{actions}</div> : null}
          </div>
        </header>

        {secondaryTabs.length > 0 ? (
          <div className="admin-secondary-tabs">
            {secondaryTabs.map((tab) => (
              <SecondaryTab key={tab.id} tab={tab} active={tab.active} onClick={tab.onClick} />
            ))}
          </div>
        ) : null}

        <main className="admin-content">{children}</main>
      </div>

      {mobileNavOpen ? (
        <div className="admin-mobile-overlay" onClick={() => setMobileNavOpen(false)} role="dialog" aria-modal="true">
          <aside className="admin-mobile-sidebar" onClick={(event) => event.stopPropagation()}>
            <div className="admin-mobile-head">
              <div className="admin-brand">
                <div className="admin-brand-mark">
                  <img src={logo} alt="Ryda" className="admin-brand-logo" />
                </div>
                <div className="admin-brand-copy">
                  <div className="admin-brand-title">Ryda Car</div>
                  <div className="admin-brand-subtitle">Admin Panel</div>
                </div>
              </div>
              <button type="button" className="admin-mobile-close" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation">
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
                  <span>{user.role.replace("_", " ")}</span>
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

export default AdminShell;

import { useEffect } from "react";
import logo from "../../assets/logo.jpeg";

export function useMobileDrawerEffects(isOpen, onClose, drawerId = "") {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    if (drawerId) {
      const drawerElement = document.getElementById(drawerId);
      drawerElement?.focus();
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [drawerId, isOpen, onClose]);
}

export default function MobileAppHeader({ drawerOpen, onToggle, drawerId = "app-mobile-drawer" }) {
  return (
    <header className="admin-mobile-topbar">
      <div className="admin-mobile-topbar-brand">
        <img src={logo} alt="Ryda" className="admin-mobile-topbar-logo" />
        <span className="admin-mobile-topbar-title">Ryda Car</span>
      </div>

      <button
        type="button"
        className="admin-mobile-topbar-toggle"
        onClick={onToggle}
        aria-label={drawerOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-controls={drawerId}
        aria-expanded={drawerOpen}
      >
        <span />
        <span />
        <span />
      </button>
    </header>
  );
}

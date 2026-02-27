import { useState } from "react";
import logo from "../assets/logo.jpeg";

function Header() {
  const [active, setActive] = useState("home");

  function handleNavClick(id) {
    setActive(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-brand">
          <img src={logo} alt="Ryda" className="header-logo" />
        </div>
        <nav className="header-nav">
          <button
            type="button"
            onClick={() => handleNavClick("home")}
            className={active === "home" ? "header-link header-link-active" : "header-link"}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => handleNavClick("services")}
            className={active === "services" ? "header-link header-link-active" : "header-link"}
          >
            Service
          </button>
          <button
            type="button"
            onClick={() => handleNavClick("contact")}
            className={
              active === "contact"
                ? "header-link header-link-primary header-link-primary-active"
                : "header-link header-link-primary"
            }
          >
            Contact us
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;

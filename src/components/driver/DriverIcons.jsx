function createSvg(children, extraProps = {}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...extraProps}
    >
      {children}
    </svg>
  );
}

export function DriverStatIcon({ kind }) {
  if (kind === "pending") {
    return createSvg(
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l2.5 2.5" />
      </>
    );
  }

  if (kind === "completed") {
    return createSvg(
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="m8.5 12 2.3 2.3L15.8 9.5" />
      </>
    );
  }

  if (kind === "taxis") {
    return createSvg(
      <>
        <path d="M5 14h14" />
        <path d="m7 14 1.2-4a2 2 0 0 1 1.93-1.42h3.74A2 2 0 0 1 15.8 10L17 14" />
        <path d="M6 17h.01" />
        <path d="M18 17h.01" />
        <path d="M7 17v1.5" />
        <path d="M17 17v1.5" />
      </>
    );
  }

  return createSvg(
    <>
      <rect x="4" y="5" width="16" height="14" rx="2.5" />
      <path d="M8 9h8" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </>
  );
}

export function DriverDetailIcon({ kind }) {
  if (kind === "email") {
    return createSvg(
      <>
        <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </>
    );
  }

  if (kind === "phone") {
    return createSvg(
      <>
        <path d="M22 16.92v2a2 2 0 0 1-2.18 2 19.84 19.84 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.84 19.84 0 0 1 2.12 3.18 2 2 0 0 1 4.11 1h2a2 2 0 0 1 2 1.72l.3 2.48a2 2 0 0 1-.57 1.71l-1.1 1.1a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 1.71-.57l2.48.3A2 2 0 0 1 22 16.92Z" />
      </>
    );
  }

  if (kind === "vehicle") {
    return createSvg(
      <>
        <path d="M5 14h14" />
        <path d="m7 14 1.2-4a2 2 0 0 1 1.93-1.42h3.74A2 2 0 0 1 15.8 10L17 14" />
        <path d="M6 17h.01" />
        <path d="M18 17h.01" />
      </>
    );
  }

  if (kind === "status") {
    return createSvg(
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="m9.5 12 1.7 1.7L15 10" />
      </>
    );
  }

  if (kind === "role") {
    return createSvg(
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" />
        <path d="M17 11h4" />
        <path d="M19 9v4" />
      </>
    );
  }

  if (kind === "city") {
    return createSvg(
      <>
        <path d="M12 21s7-4.6 7-11a7 7 0 1 0-14 0c0 6.4 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    );
  }

  if (kind === "license") {
    return createSvg(
      <>
        <rect x="4" y="5" width="16" height="14" rx="2.5" />
        <path d="M8 10h8" />
        <path d="M8 14h6" />
      </>
    );
  }

  return createSvg(
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  );
}

export function DriverNotificationIcon({ template }) {
  const normalized = String(template || "").trim();

  if (normalized === "trip_completed") {
    return createSvg(
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="m8.5 12 2.3 2.3L15.8 9.5" />
      </>
    );
  }

  if (normalized === "payment_completed") {
    return createSvg(
      <>
        <path d="M12 2v20" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </>
    );
  }

  if (normalized === "password_reset") {
    return createSvg(
      <>
        <rect x="4" y="11" width="16" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 1 1 8 0v3" />
      </>
    );
  }

  return createSvg(
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  );
}

export function DriverArrowIcon() {
  return createSvg(<path d="m9 6 6 6-6 6" />);
}

export function DriverLocationIcon() {
  return createSvg(
    <>
      <path d="M12 21s7-4.6 7-11a7 7 0 1 0-14 0c0 6.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  );
}

export function DriverCalendarIcon() {
  return createSvg(
    <>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
      <path d="M16 3.5v4" />
      <path d="M8 3.5v4" />
      <path d="M3.5 10.5h17" />
    </>
  );
}

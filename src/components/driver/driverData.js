const DRIVER_BOOKING_FILTER_LOOKUP = {
  all: {
    id: "all",
    label: "All bookings",
    matches: () => true
  },
  pending: {
    id: "pending",
    label: "Pending",
    matches: (booking) => ["confirmed", "assigned"].includes(String(booking?.status || ""))
  },
  accepted: {
    id: "accepted",
    label: "Accepted",
    matches: (booking) => String(booking?.status || "") === "accepted"
  },
  active: {
    id: "active",
    label: "Active trips",
    matches: (booking) => String(booking?.status || "") === "trip_started"
  },
  completed: {
    id: "completed",
    label: "Completed",
    matches: (booking) => String(booking?.status || "") === "completed"
  },
  cancelled: {
    id: "cancelled",
    label: "Cancelled",
    matches: (booking) => String(booking?.status || "") === "cancelled"
  }
}

export const DRIVER_BOOKING_FILTERS = [
  DRIVER_BOOKING_FILTER_LOOKUP.all,
  DRIVER_BOOKING_FILTER_LOOKUP.pending,
  DRIVER_BOOKING_FILTER_LOOKUP.accepted,
  DRIVER_BOOKING_FILTER_LOOKUP.active,
  DRIVER_BOOKING_FILTER_LOOKUP.completed,
  DRIVER_BOOKING_FILTER_LOOKUP.cancelled
];

export function getDriverBookingFilter(value) {
  return DRIVER_BOOKING_FILTER_LOOKUP[String(value || "").trim().toLowerCase()] || DRIVER_BOOKING_FILTER_LOOKUP.all;
}

export function matchesDriverBookingFilter(booking, filterValue) {
  return getDriverBookingFilter(filterValue).matches(booking);
}

export function countBookingsByFilter(bookings, filterValue) {
  return (bookings || []).filter((booking) => matchesDriverBookingFilter(booking, filterValue)).length;
}

export function getRouteQueryFromHash(hashValue = "") {
  const normalized = String(hashValue || "").replace(/^#/, "");
  const [, queryString = ""] = normalized.split("?");
  return Object.fromEntries(new URLSearchParams(queryString).entries());
}

export function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleString();
}

export function formatCompactDate(value) {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function formatTemplateLabel(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function buildNotificationPreview(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "";
  }

  const candidates = [
    payload.subject,
    payload.bookingNumber,
    payload.pickup && payload.destination ? `${payload.pickup} to ${payload.destination}` : "",
    payload.pickup,
    payload.customerName,
    payload.driverName
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  if (candidates.length > 0) {
    return candidates[0];
  }

  const keys = Object.keys(payload);
  if (keys.length === 0) {
    return "";
  }

  return `${keys.slice(0, 3).join(" • ")} updated.`;
}

export function getInitials(value) {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "DR";
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

export function formatBookingStatusLabel(status) {
  const value = String(status || "").trim();
  if (!value) {
    return "Unknown";
  }

  if (value === "trip_started") {
    return "Trip Started";
  }

  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function getBookingStatusTone(status) {
  const normalized = String(status || "").trim();
  if (["completed", "paid"].includes(normalized)) {
    return "done";
  }
  if (["confirmed", "assigned", "payment_pending"].includes(normalized)) {
    return "open";
  }
  if (["cancelled", "failed", "payment_failed"].includes(normalized)) {
    return "muted";
  }
  return "neutral";
}

export function getNotificationTemplateTone(template) {
  const normalized = String(template || "").trim();
  if (normalized === "trip_completed" || normalized === "payment_completed") {
    return "done";
  }
  if (normalized === "password_reset") {
    return "neutral";
  }
  return "open";
}

export const TAXIS_STORAGE_KEY = "ryda.taxis.v1";
export const BOOKINGS_STORAGE_KEY = "ryda.bookings.v1";

const DAY_MS = 24 * 60 * 60 * 1000;

export function readJsonArray(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeJsonArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function normalizeBookingStatus(booking) {
  return ["done", "completed"].includes(String(booking?.status || "").toLowerCase()) ? "done" : "open";
}

export function formatDateTime(value) {
  try {
    return new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return value || "";
  }
}

export function formatDateOnly(value) {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit"
    });
  } catch {
    return value || "";
  }
}

export function formatCurrency(value) {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue)) {
    return "£0";
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: numericValue % 1 === 0 ? 0 : 2
    }).format(numericValue);
  } catch {
    return `£${numericValue}`;
  }
}

export function navigateTo(hash) {
  window.location.hash = hash;
}

export function createId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function toDateInputValue(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCurrentMonthDateRange(reference = new Date()) {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);

  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end)
  };
}

function parseRangeBoundary(value, isEnd = false) {
  if (!value) {
    return null;
  }

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? `${value}T${isEnd ? "23:59:59.999" : "00:00:00.000"}` : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    date.setHours(isEnd ? 23 : 0, isEnd ? 59 : 0, isEnd ? 59 : 0, isEnd ? 999 : 0);
  }

  return date;
}

export function getBookingDateValue(booking) {
  return booking?.bookingDate || booking?.createdAt || "";
}

export function getTaxiDateValue(taxi) {
  return taxi?.createdAt || "";
}

export function isDateInRange(value, range) {
  if (!range?.startDate || !range?.endDate || !value) {
    return false;
  }

  const start = parseRangeBoundary(range.startDate, false);
  const end = parseRangeBoundary(range.endDate, true);
  const target = parseRangeBoundary(value, false);

  if (!start || !end || !target) {
    return false;
  }

  return target >= start && target <= end;
}

export function filterItemsByDateRange(items, range, getValue) {
  if (!range?.startDate || !range?.endDate) {
    return items;
  }

  return items.filter((item) => isDateInRange(getValue(item), range));
}

function formatBucketLabel(start, end, compact = false) {
  if (compact) {
    return start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    return start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })}-${end.getDate()}`;
  }

  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  })}`;
}

export function buildDateBuckets(range) {
  const start = parseRangeBoundary(range?.startDate, false);
  const end = parseRangeBoundary(range?.endDate, true);

  if (!start || !end || end < start) {
    return [];
  }

  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime() + 1) / DAY_MS));

  if (totalDays <= 7) {
    return Array.from({ length: totalDays }, (_, index) => {
      const bucketStart = new Date(start.getTime() + index * DAY_MS);
      const bucketEnd = new Date(bucketStart);
      bucketEnd.setHours(23, 59, 59, 999);

      return {
        label: formatBucketLabel(bucketStart, bucketEnd, true),
        start: bucketStart,
        end: bucketEnd
      };
    });
  }

  const bucketCount = Math.min(6, Math.max(1, Math.ceil(totalDays / 7)));
  const bucketSize = Math.ceil(totalDays / bucketCount);

  return Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = new Date(start.getTime() + index * bucketSize * DAY_MS);
    const bucketEnd = new Date(Math.min(end.getTime(), bucketStart.getTime() + bucketSize * DAY_MS - 1));
    bucketEnd.setHours(23, 59, 59, 999);

    return {
      label: formatBucketLabel(bucketStart, bucketEnd),
      start: bucketStart,
      end: bucketEnd
    };
  }).filter((bucket) => bucket.start <= end);
}

export function buildDateCountSeries(items, range, getValue) {
  const buckets = buildDateBuckets(range);
  if (buckets.length === 0) {
    return [];
  }

  return buckets.map((bucket) => ({
    label: bucket.label,
    count: items.filter((item) => {
      const value = getValue(item);
      const date = parseRangeBoundary(value, false);
      return date && date >= bucket.start && date <= bucket.end;
    }).length
  }));
}

export function formatDateRangeLabel(range) {
  const start = parseRangeBoundary(range?.startDate, false);
  const end = parseRangeBoundary(range?.endDate, false);

  if (!start || !end) {
    return "Date filter";
  }

  const currentMonth = getCurrentMonthDateRange(start);
  const isCurrentMonth = range.startDate === currentMonth.startDate && range.endDate === currentMonth.endDate;
  if (isCurrentMonth) {
    return start.toLocaleDateString(undefined, {
      month: "long",
      year: "numeric"
    });
  }

  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - ${end.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  })}`;
}

function getMonthLabel(offset) {
  const date = new Date();
  date.setMonth(date.getMonth() - offset);
  return date.toLocaleString(undefined, { month: "short" });
}

function getMonthKey(offset) {
  const date = new Date();
  date.setMonth(date.getMonth() - offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getRecentMonthSeries(bookings) {
  return Array.from({ length: 6 }, (_, index) => {
    const offset = 5 - index;
    const key = getMonthKey(offset);
    return {
      label: getMonthLabel(offset),
      count: bookings.filter((booking) => String(booking?.bookingDate || "").slice(0, 7) === key).length
    };
  });
}

export function getAdminSnapshot(options = {}) {
  const range = options.range || null;
  const allTaxis = readJsonArray(TAXIS_STORAGE_KEY);
  const allBookings = readJsonArray(BOOKINGS_STORAGE_KEY);
  const taxis = filterItemsByDateRange(allTaxis, range, getTaxiDateValue);
  const bookings = filterItemsByDateRange(allBookings, range, getBookingDateValue);
  const openBookings = bookings.filter((booking) => normalizeBookingStatus(booking) === "open");
  const doneBookings = bookings.filter((booking) => normalizeBookingStatus(booking) === "done");
  const revenue = doneBookings.reduce((total, booking) => {
    const numeric = Number(String(booking?.price || "").replace(/[^\d.]/g, ""));
    return Number.isFinite(numeric) ? total + numeric : total;
  }, 0);

  return {
    taxis,
    bookings,
    openBookings,
    doneBookings,
    totals: {
      taxis: taxis.length,
      bookings: bookings.length,
      open: openBookings.length,
      done: doneBookings.length,
      revenue
    },
    latestTaxi: taxis[0] || null,
    latestBooking: bookings[0] || null,
    monthlyBookings: range ? buildDateCountSeries(bookings, range, getBookingDateValue) : getRecentMonthSeries(bookings),
    recentBookings: bookings.slice(0, 6)
  };
}

export function buildAdminSnapshotFromCollections({ bookings = [], taxis = [], range = null } = {}) {
  const filteredTaxis = filterItemsByDateRange(taxis, range, getTaxiDateValue);
  const filteredBookings = filterItemsByDateRange(bookings, range, getBookingDateValue);
  const openBookings = filteredBookings.filter((booking) => normalizeBookingStatus(booking) === "open");
  const doneBookings = filteredBookings.filter((booking) => normalizeBookingStatus(booking) === "done");
  const revenue = doneBookings.reduce((total, booking) => {
    const numeric = Number(booking?.fare ?? booking?.price ?? 0);
    return Number.isFinite(numeric) ? total + numeric : total;
  }, 0);

  return {
    taxis: filteredTaxis,
    bookings: filteredBookings,
    openBookings,
    doneBookings,
    totals: {
      taxis: filteredTaxis.length,
      bookings: filteredBookings.length,
      open: openBookings.length,
      done: doneBookings.length,
      revenue
    },
    latestTaxi: filteredTaxis[0] || null,
    latestBooking: filteredBookings[0] || null,
    monthlyBookings: range ? buildDateCountSeries(filteredBookings, range, getBookingDateValue) : getRecentMonthSeries(filteredBookings),
    recentBookings: filteredBookings.slice(0, 6)
  };
}

export function getAdminNavigation(openCount) {
  return [
    {
      id: "dashboard",
      label: "Dashboard",
      description: "Overview and analytics",
      hash: "#/dashboard"
    },
    {
      id: "qr",
      label: "QR Code Management",
      description: "Create and manage taxi QR codes",
      hash: "#/qr"
    },
    {
      id: "bookings",
      label: "Bookings",
      description: "Track active and completed bookings",
      hash: "#/bookings",
      badge: openCount > 0 ? String(openCount) : ""
    },
    {
      id: "users",
      label: "User Management",
      description: "Drivers and sub admins",
      hash: "#/users",
      badge: "8"
    },
    {
      id: "email",
      label: "Email",
      description: "Admin inbox and messages",
      hash: "#/emails",
      badge: "12"
    },
    {
      id: "revenue",
      label: "Revenue",
      description: "Platform revenue overview",
      hash: "#/revenue"
    },
    {
      id: "settings",
      label: "Settings",
      description: "Pricing and system controls",
      hash: "#/settings"
    }
  ];
}

function sanitizeAnalyticsBooking(item) {
  return {
    id: item.bookingId || item.id || "",
    status: item.status || "",
    fare: Number(item.fare || 0),
    bookingDate: item.bookingDate || "",
    createdAt: item.createdAt || ""
  };
}

function sanitizeAnalyticsTaxi(item) {
  return {
    id: item.id || item.qrId || "",
    createdAt: item.createdAt || "",
    status: item.status || "active"
  };
}

export async function fetchAdminAnalytics(authenticatedRequest) {
  const [bookingsPayload, qrPayload] = await Promise.all([
    authenticatedRequest("/dashboard/reports/bookings", { method: "GET" }),
    authenticatedRequest("/qr", { method: "GET" })
  ]);

  return {
    bookings: (bookingsPayload.data || []).map(sanitizeAnalyticsBooking),
    taxis: (qrPayload.data || []).map(sanitizeAnalyticsTaxi)
  };
}

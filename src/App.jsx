import { useEffect, useMemo, useState } from "react";
import AdminLoginPage from "./components/AdminLoginPage.jsx";
import DashboardPage from "./components/DashboardPage.jsx";
import QrGeneratorPage from "./components/QrGeneratorPage.jsx";
import BookingPage from "./components/BookingPage.jsx";
import OperatorPage from "./components/OperatorPage.jsx";
import UserManagementPage from "./components/UserManagementPage.jsx";
import SettingsPage from "./components/SettingsPage.jsx";
import EmailPage from "./components/EmailPage.jsx";
import RevenuePage from "./components/RevenuePage.jsx";
import { useAdminAuth } from "./context/AdminAuthContext.jsx";

function parseHashRoute(hashValue) {
  const raw = (hashValue || "").replace(/^#/, "");
  const normalized = raw.startsWith("/") ? raw : raw ? `/${raw}` : "/";
  const [path, queryString = ""] = normalized.split("?");
  const searchParams = new URLSearchParams(queryString);
  const query = Object.fromEntries(searchParams.entries());
  return { path, query };
}

function App() {
  const { authReady, isAuthenticated } = useAdminAuth();
  const [hashValue, setHashValue] = useState(() => window.location.hash);

  useEffect(() => {
    function onHashChange() {
      setHashValue(window.location.hash);
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const route = useMemo(() => parseHashRoute(hashValue), [hashValue]);
  const isPublicBookingRoute = route.path === "/book";

  if (!authReady) {
    return <div className="auth-page auth-page-loading">Loading admin session...</div>;
  }

  if (!isPublicBookingRoute && !isAuthenticated) {
    return <AdminLoginPage />;
  }

  if (route.path === "/" || route.path === "/dashboard") {
    return <DashboardPage />;
  }

  if (route.path === "/book") {
    return <BookingPage taxiId={route.query.taxi || ""} token={route.query.token || ""} />;
  }

  if (route.path === "/qr") {
    return <QrGeneratorPage />;
  }

  if (route.path === "/bookings" || route.path === "/operator" || route.path === "/history") {
    const initialTab = route.path === "/history" ? "history" : route.query.tab || "bookings";
    return <OperatorPage initialTab={initialTab} />;
  }

  if (route.path === "/users") {
    return <UserManagementPage />;
  }

  if (route.path === "/settings") {
    return <SettingsPage />;
  }

  if (route.path === "/emails") {
    return <EmailPage />;
  }

  if (route.path === "/revenue") {
    return <RevenuePage />;
  }

  return <DashboardPage />;
}

export default App;

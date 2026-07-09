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
import ForgotPasswordPage from "./components/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./components/ResetPasswordPage.jsx";
import DriverDashboardPage from "./components/DriverDashboardPage.jsx";
import DriverBookingsPage from "./components/DriverBookingsPage.jsx";
import DriverNotificationsPage from "./components/DriverNotificationsPage.jsx";
import DriverProfilePage from "./components/DriverProfilePage.jsx";
import { useAdminAuth } from "./context/AdminAuthContext.jsx";
import { LoadingBlock } from "./components/common/LoadingState.jsx";

function parseHashRoute(hashValue) {
  const raw = (hashValue || "").replace(/^#/, "");
  const normalized = raw.startsWith("/") ? raw : raw ? `/${raw}` : "/";
  const [path, queryString = ""] = normalized.split("?");
  const searchParams = new URLSearchParams(queryString);
  const query = Object.fromEntries(searchParams.entries());
  return { path, query };
}

function App() {
  const { authReady, isAuthenticated, isAdmin, isDriver } = useAdminAuth();
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
  const isPublicAuthRoute = ["/login", "/forgot-password", "/reset-password"].includes(route.path);
  const isDriverRoute = route.path.startsWith("/driver");

  const redirect = (hash) => {
    if (window.location.hash !== hash) {
      window.location.hash = hash;
      return null;
    }
    return null;
  };

  if (!authReady) {
    return (
      <div className="auth-page auth-page-loading">
        <div className="auth-card">
          <LoadingBlock title="Checking session" copy="Restoring your saved session and permissions." />
        </div>
      </div>
    );
  }

  if (route.path === "/login") {
    if (isAuthenticated) {
      return redirect(isDriver ? "#/driver/dashboard" : "#/dashboard");
    }
    return <AdminLoginPage notice={route.query.reset === "success" ? "Password updated successfully. Sign in with your new password." : ""} />;
  }

  if (route.path === "/forgot-password") {
    return <ForgotPasswordPage />;
  }

  if (route.path === "/reset-password") {
    return <ResetPasswordPage token={route.query.token || ""} />;
  }

  if (!isPublicBookingRoute && !isPublicAuthRoute && !isAuthenticated) {
    return <AdminLoginPage />;
  }

  if (isAuthenticated && isAdmin && isDriverRoute) {
    return redirect("#/dashboard");
  }

  if (isAuthenticated && isDriver && !isDriverRoute && !isPublicBookingRoute) {
    if (route.path === "/" || route.path === "/dashboard") {
      return redirect("#/driver/dashboard");
    }
    return redirect("#/driver/dashboard");
  }

  if (route.path === "/" || route.path === "/dashboard") {
    return isDriver ? <DriverDashboardPage /> : <DashboardPage />;
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

  if (route.path === "/driver" || route.path === "/driver/dashboard") {
    if (!isDriver) {
      return redirect("#/dashboard");
    }
    return <DriverDashboardPage />;
  }

  if (route.path === "/driver/bookings") {
    if (!isDriver) {
      return redirect("#/dashboard");
    }
    return <DriverBookingsPage />;
  }

  if (route.path === "/driver/notifications") {
    if (!isDriver) {
      return redirect("#/dashboard");
    }
    return <DriverNotificationsPage />;
  }

  if (route.path === "/driver/profile") {
    if (!isDriver) {
      return redirect("#/dashboard");
    }
    return <DriverProfilePage />;
  }

  return isDriver ? <DriverDashboardPage /> : <DashboardPage />;
}

export default App;

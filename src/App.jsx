import { useEffect, useMemo, useState } from "react";
import DashboardPage from "./components/DashboardPage.jsx";
import QrGeneratorPage from "./components/QrGeneratorPage.jsx";
import BookingPage from "./components/BookingPage.jsx";
import OperatorPage from "./components/OperatorPage.jsx";

function parseHashRoute(hashValue) {
  const raw = (hashValue || "").replace(/^#/, "");
  const normalized = raw.startsWith("/") ? raw : raw ? `/${raw}` : "/";
  const [path, queryString = ""] = normalized.split("?");
  const searchParams = new URLSearchParams(queryString);
  const query = Object.fromEntries(searchParams.entries());
  return { path, query };
}

function App() {
  const [hashValue, setHashValue] = useState(() => window.location.hash);

  useEffect(() => {
    function onHashChange() {
      setHashValue(window.location.hash);
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const route = useMemo(() => parseHashRoute(hashValue), [hashValue]);

  if (route.path === "/" || route.path === "/dashboard") {
    return <DashboardPage />;
  }

  if (route.path === "/book") {
    return <BookingPage taxiId={route.query.taxi || ""} />;
  }

  if (route.path === "/qr") {
    return <QrGeneratorPage />;
  }

  if (route.path === "/bookings" || route.path === "/operator" || route.path === "/history") {
    const initialTab = route.path === "/history" ? "history" : route.query.tab || "bookings";
    return <OperatorPage initialTab={initialTab} />;
  }

  return <DashboardPage />;
}

export default App;

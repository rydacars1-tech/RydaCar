import { useEffect, useMemo, useRef, useState } from "react";
import AdminShell from "./admin/AdminShell.jsx";
import DateRangeFilter from "./admin/DateRangeFilter.jsx";
import { formatDateRangeLabel, getAdminSnapshot, getCurrentMonthDateRange, navigateTo } from "./admin/adminData.js";

function MetricCard({ label, value, hint, icon, tone = "default", onClick }) {
  return (
    <button type="button" className={`admin-metric-card admin-metric-card-${tone}`} onClick={onClick}>
      <div className="admin-metric-top">
        <div className="admin-metric-icon">{icon}</div>
        <div className="admin-metric-label">{label}</div>
      </div>
      <div className="admin-metric-value">{value}</div>
      <div className="admin-metric-hint">{hint}</div>
    </button>
  );
}

function StatusAnalyticsCard({ openCount, doneCount, totalBookings }) {
  const total = Math.max(openCount + doneCount, 1);
  const donePercent = Math.round((doneCount / total) * 100);
  const openPercent = 100 - donePercent;
  const style = {
    background: `conic-gradient(#22c55e 0 ${donePercent}%, #ff5b6a ${donePercent}% 100%)`
  };

  return (
    <div className="admin-status-card admin-analytics-card">
      <div className="admin-section-head">
        <div>
          <div className="admin-section-title">Booking Status</div>
          <div className="admin-section-subtitle">Live distribution of completed and pending requests.</div>
        </div>
        <div className="admin-pill">Live</div>
      </div>

      {totalBookings === 0 ? (
        <div className="admin-empty-state">
          <div className="admin-empty-state-title">No booking status yet</div>
          <div className="admin-empty-state-copy">The status chart appears after the first booking is added.</div>
        </div>
      ) : (
        <div className="admin-status-card-body">
          <div className="admin-status-ring-wrap">
            <div className="admin-status-chip-row">
              <div className="admin-status-chip admin-status-chip-green">
                <span>Completed</span>
                <strong>{donePercent}%</strong>
              </div>
              <div className="admin-status-chip admin-status-chip-red">
                <span>Pending</span>
                <strong>{openPercent}%</strong>
              </div>
            </div>

            <div className="admin-status-ring" style={style}>
              <div className="admin-status-ring-center">
                <strong>{donePercent}%</strong>
                <span>Completed</span>
              </div>
            </div>
          </div>

          <div className="admin-status-legend admin-status-legend-wide">
            <div className="admin-status-legend-item">
                <span className="admin-status-swatch admin-status-swatch-green" />
              <span>Completed</span>
              <strong>{doneCount}</strong>
            </div>
            <div className="admin-status-legend-item">
              <span className="admin-status-swatch admin-status-swatch-red" />
              <span>Pending</span>
              <strong>{openCount}</strong>
            </div>
            <div className="admin-status-legend-item">
              <span className="admin-status-swatch admin-status-swatch-soft" />
              <span>Total</span>
              <strong>{totalBookings}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function buildSmoothPath(points) {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const middleX = (current.x + next.x) / 2;
    const middleY = (current.y + next.y) / 2;
    path += ` Q ${current.x} ${current.y} ${middleX} ${middleY}`;
  }

  const last = points[points.length - 1];
  path += ` T ${last.x} ${last.y}`;

  return path;
}

function TrendAnalyticsCard({ items }) {
  const [activeIndex, setActiveIndex] = useState(items.length > 0 ? items.length - 1 : null);
  const width = 560;
  const height = 250;
  const paddingX = 26;
  const paddingTop = 24;
  const paddingBottom = 42;
  const chartHeight = height - paddingTop - paddingBottom;
  const max = Math.max(...items.map((item) => item.count), 1);
  const baseline = height - paddingBottom;
  const hasData = items.some((item) => item.count > 0);
  const points = items.map((item, index) => {
    const progress = items.length === 1 ? 0.5 : index / Math.max(items.length - 1, 1);
    return {
      ...item,
      x: paddingX + progress * (width - paddingX * 2),
      y: paddingTop + chartHeight - (item.count / max) * chartHeight
    };
  });
  const linePath = buildSmoothPath(points);
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`
    : "";
  const activePoint = activeIndex === null ? null : points[activeIndex] || null;
  const topMonth = items.reduce((best, item) => (item.count > best.count ? item : best), items[0] || { label: "-", count: 0 });

  useEffect(() => {
    setActiveIndex(items.length > 0 ? items.length - 1 : null);
  }, [items]);

  return (
    <div className="admin-panel-card admin-analytics-card">
      <div className="admin-section-head">
        <div>
          <div className="admin-section-title">Booking Trend</div>
          <div className="admin-section-subtitle">Curved monthly booking performance from the live dashboard data.</div>
        </div>
        <div className="admin-pill">{topMonth.label} peak</div>
      </div>

      {!hasData ? (
        <div className="admin-empty-state">
          <div className="admin-empty-state-title">No trend data yet</div>
          <div className="admin-empty-state-copy">Monthly analytics appear once bookings start coming in.</div>
        </div>
      ) : (
        <div className="admin-line-chart-shell">
          <div className="admin-line-chart-highlights">
            <div className="admin-line-chart-highlight">
              <span>Peak month</span>
              <strong>{topMonth.label}</strong>
            </div>
            <div className="admin-line-chart-highlight">
              <span>Bookings</span>
              <strong>{topMonth.count}</strong>
            </div>
          </div>

          <svg viewBox={`0 0 ${width} ${height}`} className="admin-line-chart" role="img" aria-label="Booking trend chart">
            <defs>
              <linearGradient id="adminTrendAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#366dff" stopOpacity="0.34" />
                <stop offset="100%" stopColor="#366dff" stopOpacity="0.03" />
              </linearGradient>
            </defs>

            {[0, 0.5, 1].map((marker) => {
              const y = paddingTop + chartHeight * marker;
              return <line key={marker} x1={paddingX} x2={width - paddingX} y1={y} y2={y} className="admin-line-grid" />;
            })}

            <path d={areaPath} className="admin-line-area" />
            <path d={linePath} className="admin-line-path" />

            {points.map((point, index) => (
              <g key={point.label}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={activeIndex === index ? 6 : 4}
                  className={activeIndex === index ? "admin-line-point admin-line-point-active" : "admin-line-point"}
                  onMouseEnter={() => setActiveIndex(index)}
                />
                <text x={point.x} y={height - 12} textAnchor="middle" className="admin-line-label">
                  {point.label}
                </text>
              </g>
            ))}
          </svg>

          {activePoint ? (
            <div
              className="admin-line-tooltip"
              style={{
                left: `${(activePoint.x / width) * 100}%`,
                top: `${Math.max((activePoint.y / height) * 100 - 8, 10)}%`
              }}
            >
              <strong>{activePoint.label}</strong>
              <span>{activePoint.count} bookings</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [range, setRange] = useState(() => getCurrentMonthDateRange());
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => setRefreshKey((key) => key + 1), 2500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const allSnapshot = useMemo(() => getAdminSnapshot(), [refreshKey]);
  const snapshot = useMemo(() => getAdminSnapshot({ range }), [refreshKey, range]);
  const completionRate = snapshot.totals.bookings
    ? `${Math.round((snapshot.totals.done / snapshot.totals.bookings) * 100)}%`
    : "0%";
  const metricCards = [
    {
      label: "Total bookings",
      value: snapshot.totals.bookings,
      hint: "Recorded bookings",
      tone: "neutral",
      onClick: () => navigateTo("#/bookings"),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 6h13" />
          <path d="M8 12h13" />
          <path d="M8 18h13" />
          <path d="M3 6h.01" />
          <path d="M3 12h.01" />
          <path d="M3 18h.01" />
        </svg>
      )
    },
    {
      label: "Active QR codes",
      value: snapshot.totals.taxis,
      hint: "QR codes ready",
      tone: "sky",
      onClick: () => navigateTo("#/qr"),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <path d="M14 14h3v3h-3z" />
          <path d="M18 18h3v3h-3z" />
        </svg>
      )
    },
    {
      label: "Pending requests",
      value: snapshot.totals.open,
      hint: "Awaiting action",
      tone: "danger",
      onClick: () => navigateTo("#/bookings"),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )
    },
    {
      label: "Completion rate",
      value: completionRate,
      hint: "Ride completion",
      tone: "dark",
      onClick: () => navigateTo("#/history"),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )
    }
  ];

  function runFilterUpdate(nextRange) {
    window.clearTimeout(timerRef.current);
    setLoading(true);
    setRange(nextRange);
    timerRef.current = window.setTimeout(() => setLoading(false), 220);
  }

  return (
    <AdminShell
      activeNav="dashboard"
      openBookingsCount={allSnapshot.totals.open}
      title="Dashboard"
      actions={
        <DateRangeFilter value={range} loading={loading} onApply={runFilterUpdate} onReset={() => runFilterUpdate(getCurrentMonthDateRange())} />
      }
    >
      <section className="admin-dashboard-grid">
        <div className="admin-dashboard-main">
          {loading ? (
            <div className="admin-panel-card">
              <div className="admin-loading-state">Updating dashboard data for {formatDateRangeLabel(range)}...</div>
            </div>
          ) : (
            <>
              <div className="admin-metrics-grid">
                {metricCards.map((card) => (
                  <MetricCard key={card.label} {...card} />
                ))}
              </div>

              <div className="admin-analytics-grid">
                <StatusAnalyticsCard
                  openCount={snapshot.totals.open}
                  doneCount={snapshot.totals.done}
                  totalBookings={snapshot.totals.bookings}
                />
                <TrendAnalyticsCard items={snapshot.monthlyBookings} />
              </div>

              {snapshot.totals.bookings === 0 && snapshot.totals.taxis === 0 ? (
                <div className="admin-panel-card">
                  <div className="admin-empty-state">
                    <div className="admin-empty-state-title">No dashboard data for this range</div>
                    <div className="admin-empty-state-copy">Try another date range to view bookings, QR activity, and revenue performance.</div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </AdminShell>
  );
}

export default DashboardPage;

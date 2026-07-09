import { useEffect, useMemo, useState } from "react";
import AdminShell from "./admin/AdminShell.jsx";
import DateRangeFilter from "./admin/DateRangeFilter.jsx";
import { buildAdminSnapshotFromCollections, buildDateBuckets, formatCurrency, formatDateRangeLabel, getCurrentMonthDateRange } from "./admin/adminData.js";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { useCachedResource } from "../lib/adminCache.js";
import { fetchAdminAnalytics } from "../lib/adminFetchers.js";
import { InlineLoadingNotice, LoadingBlock } from "./common/LoadingState.jsx";

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

function getRevenueSeries(bookings, range) {
  return buildDateBuckets(range).map((bucket) => {
    const amount = bookings.reduce((total, booking) => {
      const bookingDate = new Date(booking?.bookingDate || booking?.createdAt || "");
      if (Number.isNaN(bookingDate.getTime()) || bookingDate < bucket.start || bookingDate > bucket.end) {
        return total;
      }

      const numeric = Number(String(booking?.price || "").replace(/[^\d.]/g, ""));
      return Number.isFinite(numeric) ? total + numeric : total;
    }, 0);

    return {
      label: bucket.label,
      amount
    };
  });
}

function RevenueOverviewCard({ items, totalRevenue }) {
  const total = Math.max(totalRevenue, 0);
  const topItem = items.reduce((best, item) => (item.amount > best.amount ? item : best), items[0] || { label: "-", amount: 0 });
  const hasData = total > 0 && items.some((item) => item.amount > 0);
  const normalizedItems = hasData
    ? items.map((item) => ({
        ...item,
        percent: total > 0 ? Math.round((item.amount / total) * 100) : 0
      }))
    : [];
  const gradientStops = normalizedItems.length
    ? normalizedItems.reduce(
        (accumulator, item, index) => {
          const colors = ["#22c55e", "#366dff", "#f59e0b", "#8b5cf6", "#ff5b6a", "#14b8a6"];
          const start = accumulator.offset;
          const end = start + (item.amount / total) * 100;
          accumulator.parts.push(`${colors[index % colors.length]} ${start}% ${end}%`);
          accumulator.offset = end;
          return accumulator;
        },
        { parts: [], offset: 0 }
      ).parts
    : [];
  const chartStyle = hasData
    ? { background: `conic-gradient(${gradientStops.join(", ")})` }
    : { background: "conic-gradient(#e2e8f0 0 100%)" };

  return (
    <div className="admin-panel-card admin-analytics-card">
      <div className="admin-section-head">
        <div>
          <div className="admin-section-title">Revenue overview</div>
          <div className="admin-section-subtitle">Circular breakdown of revenue across the selected period buckets.</div>
        </div>
        <div className="admin-pill">{topItem.label}</div>
      </div>

      {!hasData ? (
        <div className="admin-empty-state">
          <div className="admin-empty-state-title">No revenue data in this range</div>
          <div className="admin-empty-state-copy">Try another date range to review revenue totals and performance.</div>
        </div>
      ) : (
        <div className="admin-revenue-overview-body">
          <div className="admin-revenue-donut-wrap">
            <div className="admin-revenue-donut" style={chartStyle}>
              <div className="admin-revenue-donut-center">
                <strong>{formatCurrency(totalRevenue)}</strong>
                <span>Total revenue</span>
              </div>
            </div>
          </div>

          <div className="admin-revenue-legend">
            {normalizedItems.map((item, index) => {
              const colors = ["#22c55e", "#366dff", "#f59e0b", "#8b5cf6", "#ff5b6a", "#14b8a6"];
              return (
                <div key={item.label} className="admin-revenue-legend-item">
                  <span className="admin-revenue-legend-swatch" style={{ background: colors[index % colors.length] }} />
                  <span className="admin-revenue-legend-label">{item.label}</span>
                  <strong>{formatCurrency(item.amount)}</strong>
                  <em>{item.percent}%</em>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function RevenueTrendCard({ items }) {
  const [activeIndex, setActiveIndex] = useState(items.length > 0 ? items.length - 1 : null);
  const width = 560;
  const height = 240;
  const paddingX = 26;
  const paddingTop = 24;
  const paddingBottom = 42;
  const chartHeight = height - paddingTop - paddingBottom;
  const max = Math.max(...items.map((item) => item.amount), 1);
  const baseline = height - paddingBottom;
  const hasData = items.some((item) => item.amount > 0);
  const points = items.map((item, index) => {
    const progress = items.length === 1 ? 0.5 : index / Math.max(items.length - 1, 1);
    return {
      ...item,
      x: paddingX + progress * (width - paddingX * 2),
      y: paddingTop + chartHeight - (item.amount / max) * chartHeight
    };
  });
  const linePath = buildSmoothPath(points);
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`
    : "";
  const activePoint = activeIndex === null ? null : points[activeIndex] || null;
  const bestPoint = items.reduce((best, item) => (item.amount > best.amount ? item : best), items[0] || { label: "-", amount: 0 });

  useEffect(() => {
    setActiveIndex(items.length > 0 ? items.length - 1 : null);
  }, [items]);

  return (
    <div className="admin-panel-card admin-analytics-card">
      <div className="admin-section-head">
        <div>
          <div className="admin-section-title">Revenue trend</div>
          <div className="admin-section-subtitle">Platform earnings across the selected date range.</div>
        </div>
        <div className="admin-pill">{bestPoint.label}</div>
      </div>

      {!hasData ? (
        <div className="admin-empty-state">
          <div className="admin-empty-state-title">No revenue for this range</div>
          <div className="admin-empty-state-copy">Completed bookings with pricing data will appear here once revenue is available.</div>
        </div>
      ) : (
        <div className="admin-line-chart-shell admin-line-chart-shell-revenue">
          <div className="admin-line-chart-highlights">
            <div className="admin-line-chart-highlight">
              <span>Best period</span>
              <strong>{bestPoint.label}</strong>
            </div>
            <div className="admin-line-chart-highlight">
              <span>Revenue</span>
              <strong>{formatCurrency(bestPoint.amount)}</strong>
            </div>
          </div>

          <svg viewBox={`0 0 ${width} ${height}`} className="admin-line-chart" role="img" aria-label="Revenue trend chart">
            <defs>
              <linearGradient id="adminRevenueAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.34" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.04" />
              </linearGradient>
            </defs>

            {[0, 0.5, 1].map((marker) => {
              const y = paddingTop + chartHeight * marker;
              const tickValue = max - max * marker;
              return (
                <g key={marker}>
                  <line x1={paddingX} x2={width - paddingX} y1={y} y2={y} className="admin-line-grid" />
                  <text x={6} y={y + 4} className="admin-line-axis-label">
                    {formatCurrency(tickValue)}
                  </text>
                </g>
              );
            })}

            <path d={areaPath} className="admin-line-area admin-line-area-revenue" />
            <path d={linePath} className="admin-line-path admin-line-path-revenue" />

            {points.map((point, index) => (
              <g key={point.label}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={activeIndex === index ? 6 : 4}
                  className={activeIndex === index ? "admin-line-point admin-line-point-revenue admin-line-point-active" : "admin-line-point admin-line-point-revenue"}
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
              <span>{formatCurrency(activePoint.amount)}</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function RevenuePage() {
  const { authenticatedRequest, user } = useAdminAuth();
  const [range, setRange] = useState(() => getCurrentMonthDateRange());
  const {
    data: analyticsData,
    error: loadError,
    isLoading,
    isFetching
  } = useCachedResource({
    userId: user?.id,
    cacheKey: "dashboard:analytics",
    fetcher: () => fetchAdminAnalytics(authenticatedRequest),
    staleTime: 90_000,
    persist: true,
    persistMaxAge: 5 * 60_000,
    emptyValue: { bookings: [], taxis: [] },
    errorMessage: "Unable to load revenue data."
  });
  const bookings = analyticsData.bookings || [];
  const allSnapshot = useMemo(() => buildAdminSnapshotFromCollections({ bookings }), [bookings]);
  const snapshot = useMemo(() => buildAdminSnapshotFromCollections({ bookings, range }), [bookings, range]);
  const revenueSeries = useMemo(() => getRevenueSeries(snapshot.doneBookings, range), [snapshot.doneBookings, range]);
  const bestMonth = revenueSeries.reduce((best, item) => (item.amount > best.amount ? item : best), revenueSeries[0] || { label: "-", amount: 0 });
  const avgRevenue = revenueSeries.length ? snapshot.totals.revenue / revenueSeries.length : 0;

  return (
    <AdminShell
      activeNav="revenue"
      openBookingsCount={allSnapshot.totals.open}
      title="Revenue"
      actions={
        <DateRangeFilter value={range} loading={isFetching} onApply={setRange} onReset={() => setRange(getCurrentMonthDateRange())} />
      }
    >
      <section className="admin-dashboard-grid">
        <div className="admin-dashboard-main">
          {isFetching && !isLoading ? <InlineLoadingNotice label={`Refreshing revenue data for ${formatDateRangeLabel(range)}...`} /> : null}

          {isLoading ? (
            <div className="admin-panel-card">
              <div className="admin-loading-state">
                <LoadingBlock title="Loading revenue" copy="Preparing live earnings totals and trend charts." compact />
              </div>
            </div>
          ) : (
            <>
              {loadError ? <div className="admin-inline-feedback">{loadError}</div> : null}
              <div className="admin-metrics-grid admin-metrics-grid-three">
                <div className="admin-metric-card admin-metric-card-dark">
                  <div className="admin-metric-top">
                    <div className="admin-metric-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1v22" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </div>
                    <div className="admin-metric-label">Platform revenue</div>
                  </div>
                  <div className="admin-metric-value">{formatCurrency(snapshot.totals.revenue)}</div>
                  <div className="admin-metric-hint">Completed booking earnings</div>
                </div>

                <div className="admin-metric-card admin-metric-card-neutral">
                  <div className="admin-metric-top">
                    <div className="admin-metric-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3v18h18" />
                        <path d="m7 15 4-4 3 3 5-6" />
                      </svg>
                    </div>
                    <div className="admin-metric-label">Best period</div>
                  </div>
                  <div className="admin-metric-value">{bestMonth.label}</div>
                  <div className="admin-metric-hint">{formatCurrency(bestMonth.amount)}</div>
                </div>

                <div className="admin-metric-card admin-metric-card-sky">
                  <div className="admin-metric-top">
                    <div className="admin-metric-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20V10" />
                        <path d="m18 20-6-6-6 6" />
                        <path d="M5 4h14" />
                      </svg>
                    </div>
                    <div className="admin-metric-label">Average period</div>
                  </div>
                  <div className="admin-metric-value">{formatCurrency(avgRevenue)}</div>
                  <div className="admin-metric-hint">Selected range average</div>
                </div>
              </div>

              <div className="admin-analytics-grid">
                <RevenueOverviewCard items={revenueSeries} totalRevenue={snapshot.totals.revenue} />
                <RevenueTrendCard items={revenueSeries} />
              </div>
            </>
          )}
        </div>
      </section>
    </AdminShell>
  );
}

export default RevenuePage;

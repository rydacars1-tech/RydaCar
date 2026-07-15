import { useMemo, useState } from "react";
import DriverShell from "./driver/DriverShell.jsx";
import DateRangeFilter from "./admin/DateRangeFilter.jsx";
import { filterItemsByDateRange, formatCurrency, formatDateOnly, getCurrentMonthDateRange } from "./admin/adminData.js";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";

const TIP_TRANSACTIONS = [
  {
    id: "tip_001",
    bookingNumber: "BOOK-1086",
    riderName: "Amelia Stone",
    pickup: "Heathrow Terminal 5",
    destination: "Canary Wharf",
    amount: 8,
    status: "settled",
    payoutDate: "2026-07-02",
    createdAt: "2026-07-01T10:25:00Z"
  },
  {
    id: "tip_002",
    bookingNumber: "BOOK-1089",
    riderName: "Jacob Reed",
    pickup: "Paddington Station",
    destination: "Chelsea Harbour",
    amount: 5,
    status: "pending",
    payoutDate: "",
    createdAt: "2026-07-03T08:10:00Z"
  },
  {
    id: "tip_003",
    bookingNumber: "BOOK-1094",
    riderName: "Olivia Green",
    pickup: "King's Cross",
    destination: "Camden Town",
    amount: 12,
    status: "settled",
    payoutDate: "2026-07-06",
    createdAt: "2026-07-05T19:40:00Z"
  },
  {
    id: "tip_004",
    bookingNumber: "BOOK-1102",
    riderName: "Noah Bennett",
    pickup: "Oxford Circus",
    destination: "Southbank Centre",
    amount: 4,
    status: "processing",
    payoutDate: "",
    createdAt: "2026-07-07T14:20:00Z"
  }
];

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "settled", label: "Settled" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" }
];

function getStatusBadgeClass(status) {
  if (status === "settled") {
    return "admin-status-badge admin-status-badge-done";
  }

  if (status === "pending" || status === "processing") {
    return "admin-status-badge admin-status-badge-open";
  }

  return "admin-status-badge";
}

export default function DriverTipAmountPage() {
  const { user } = useAdminAuth();
  const [range, setRange] = useState(() => getCurrentMonthDateRange());
  const [statusFilter, setStatusFilter] = useState("all");

  const dateFilteredTips = useMemo(
    () => filterItemsByDateRange(TIP_TRANSACTIONS, range, (item) => item.createdAt),
    [range]
  );
  const filteredTips = useMemo(() => {
    if (statusFilter === "all") {
      return dateFilteredTips;
    }

    return dateFilteredTips.filter((item) => item.status === statusFilter);
  }, [dateFilteredTips, statusFilter]);

  const summary = useMemo(() => {
    const totalAmount = filteredTips.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const settledAmount = filteredTips
      .filter((item) => item.status === "settled")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const averageAmount = filteredTips.length > 0 ? totalAmount / filteredTips.length : 0;

    return {
      totalAmount,
      settledAmount,
      averageAmount
    };
  }, [filteredTips]);

  return (
    <DriverShell activeNav="tips" title="Tip Amount">
      <section className="admin-dashboard-grid">
        <div className="admin-panel-card">
          <div className="admin-section-head">
            <div>
              <div className="admin-section-title">Driver tips</div>
              <div className="admin-section-subtitle">
                Future-ready tip reporting for {user?.name || "your driver account"} with filters, payout visibility, and a clean transaction history.
              </div>
            </div>
          </div>

          <div className="admin-metrics-grid admin-metrics-grid-three driver-tip-summary-grid">
            <div className="admin-metric-card admin-metric-card-dark">
              <div className="admin-metric-top">
                <div className="admin-metric-icon">£</div>
                <div className="admin-metric-label">Total tips</div>
              </div>
              <div className="admin-metric-value">{formatCurrency(summary.totalAmount)}</div>
              <div className="admin-metric-hint">Within the selected filter</div>
            </div>

            <div className="admin-metric-card admin-metric-card-sky">
              <div className="admin-metric-top">
                <div className="admin-metric-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m20 6-11 11-5-5" />
                  </svg>
                </div>
                <div className="admin-metric-label">Settled tips</div>
              </div>
              <div className="admin-metric-value">{formatCurrency(summary.settledAmount)}</div>
              <div className="admin-metric-hint">Ready in completed payouts</div>
            </div>

            <div className="admin-metric-card admin-metric-card-neutral">
              <div className="admin-metric-top">
                <div className="admin-metric-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20V10" />
                    <path d="m18 20-6-6-6 6" />
                    <path d="M5 4h14" />
                  </svg>
                </div>
                <div className="admin-metric-label">Average tip</div>
              </div>
              <div className="admin-metric-value">{formatCurrency(summary.averageAmount)}</div>
              <div className="admin-metric-hint">Per tip transaction</div>
            </div>
          </div>

          <div className="admin-panel-card driver-tip-filter-card">
            <div className="admin-section-head">
              <div>
                <div className="admin-section-title">Filter tips</div>
                <div className="admin-section-subtitle">Review tip transactions by date range and payout state.</div>
              </div>
            </div>

            <div className="driver-tip-filter-bar">
              <DateRangeFilter value={range} onApply={setRange} onReset={() => setRange(getCurrentMonthDateRange())} />

              <label className="admin-filter-select-wrap driver-tip-select-wrap">
                <span className="admin-filter-select-label">Status</span>
                <select className="admin-filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {filteredTips.length === 0 ? (
            <div className="admin-empty-state driver-tip-empty-state">
              <div className="admin-empty-state-title">No tip transactions in this filter</div>
              <div className="admin-empty-state-copy">
                Tip records will appear here once passengers start sending tips in the upcoming backend release.
              </div>
            </div>
          ) : (
            <div className="admin-table-wrap admin-table-wrap-rich">
              <table className="admin-table driver-tip-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Booking</th>
                    <th>Rider</th>
                    <th>Route</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Payout date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTips.map((tip) => (
                    <tr key={tip.id}>
                      <td>
                        <div className="admin-table-title">{formatDateOnly(tip.createdAt)}</div>
                        <div className="admin-table-subtitle">Recorded tip</div>
                      </td>
                      <td>
                        <div className="admin-table-title">{tip.bookingNumber}</div>
                        <div className="admin-table-subtitle">Trip reference</div>
                      </td>
                      <td>
                        <div className="admin-table-title">{tip.riderName}</div>
                        <div className="admin-table-subtitle">Passenger</div>
                      </td>
                      <td>
                        <div className="driver-tip-route" title={`${tip.pickup} -> ${tip.destination}`}>
                          <span className="driver-tip-route-stop">{tip.pickup}</span>
                          <span className="driver-tip-route-arrow" aria-hidden="true">
                            →
                          </span>
                          <span className="driver-tip-route-stop">{tip.destination}</span>
                        </div>
                      </td>
                      <td>
                        <div className="driver-tip-amount">{formatCurrency(tip.amount)}</div>
                        <div className="admin-table-subtitle">British Pound</div>
                      </td>
                      <td>
                        <span className={getStatusBadgeClass(tip.status)}>{tip.status}</span>
                      </td>
                      <td>
                        <div className="admin-table-title">{tip.payoutDate ? formatDateOnly(tip.payoutDate) : "Pending"}</div>
                        <div className="admin-table-subtitle">{tip.payoutDate ? "Payout scheduled" : "Awaiting backend flow"}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </DriverShell>
  );
}

import { useEffect, useRef, useState } from "react";
import { formatDateRangeLabel } from "./adminData.js";

function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function DateRangeFilter({ value, onApply, onReset, loading = false }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const rootRef = useRef(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    function handleOutside(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const invalid = !draft?.startDate || !draft?.endDate || draft.startDate > draft.endDate;

  function handleApply() {
    if (invalid || loading) {
      return;
    }

    onApply(draft);
    setOpen(false);
  }

  function handleReset() {
    if (loading) {
      return;
    }

    onReset();
    setOpen(false);
  }

  return (
    <div className="admin-date-filter" ref={rootRef}>
      <button
        type="button"
        className={open ? "admin-filter-button admin-filter-button-open" : "admin-filter-button"}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span className="admin-filter-button-icon">
          <CalendarIcon />
        </span>
        <span className="admin-filter-button-copy">
          <span className="admin-filter-button-label">Date filter</span>
          <strong>{formatDateRangeLabel(value)}</strong>
        </span>
      </button>

      {open ? (
        <div className="admin-filter-panel" role="dialog" aria-label="Date filter">
          <div className="admin-filter-panel-title">Select date range</div>

          <div className="admin-filter-grid">
            <label className="admin-filter-field">
              <span>Start date</span>
              <input
                type="date"
                value={draft.startDate || ""}
                onChange={(event) => setDraft((current) => ({ ...current, startDate: event.target.value }))}
              />
            </label>

            <label className="admin-filter-field">
              <span>End date</span>
              <input
                type="date"
                value={draft.endDate || ""}
                onChange={(event) => setDraft((current) => ({ ...current, endDate: event.target.value }))}
              />
            </label>
          </div>

          {invalid ? <div className="admin-filter-error">Choose a valid start and end date.</div> : null}

          <div className="admin-filter-actions">
            <button type="button" className="admin-filter-reset" onClick={handleReset} disabled={loading}>
              Reset
            </button>
            <button type="button" className="admin-filter-apply" onClick={handleApply} disabled={invalid || loading}>
              {loading ? "Updating..." : "Apply"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default DateRangeFilter;

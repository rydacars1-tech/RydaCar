function joinClassNames(...values) {
  return values.filter(Boolean).join(" ");
}

export function Spinner({ size = "md", tone = "primary", label = "Loading", className = "" }) {
  return (
    <span className={joinClassNames("ui-spinner", `ui-spinner-${size}`, `ui-spinner-${tone}`, className)} role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function LoadingBlock({ title = "Loading data", copy = "", compact = false, className = "" }) {
  return (
    <div className={joinClassNames("ui-loading-block", compact ? "ui-loading-block-compact" : "", className)}>
      <Spinner size={compact ? "sm" : "md"} label={title} />
      <div className="ui-loading-copy">
        <div className="ui-loading-title">{title}</div>
        {copy ? <div className="ui-loading-text">{copy}</div> : null}
      </div>
    </div>
  );
}

export function InlineLoadingNotice({ label = "Refreshing data...", className = "" }) {
  return (
    <div className={joinClassNames("ui-inline-loading", className)}>
      <Spinner size="xs" label={label} />
      <span>{label}</span>
    </div>
  );
}

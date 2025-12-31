import s from "./style.module.css";

/**
 * Ideas Page Loading Skeleton
 * Shows instantly during navigation while server fetches data.
 */
export default function IdeasLoading() {
  return (
    <div className={s.page}>
      {/* Header skeleton */}
      <header className={s.header}>
        <div className="skeleton" style={{ height: 32, width: 220, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 20, width: 320 }} />
      </header>

      {/* Loading state - matching the page's loading style */}
      <div className={s.loading}>
        <div className={s.spinner} />
        <span>Loading ideas...</span>
      </div>
    </div>
  );
}

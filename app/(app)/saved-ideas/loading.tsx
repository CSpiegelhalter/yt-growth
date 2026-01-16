import s from "./style.module.css";

/**
 * Saved Ideas Loading Skeleton
 * Shows instantly during navigation while server fetches data.
 */
export default function SavedIdeasLoading() {
  return (
    <div className={s.container}>
      <div className={s.inner}>
        {/* Header skeleton */}
        <div className={s.header}>
          <div className={s.titleRow}>
            <div className={s.headerIcon}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            </div>
            <div>
              <div
                className="skeleton"
                style={{ height: 28, width: 160, marginBottom: 8 }}
              />
              <div className="skeleton" style={{ height: 18, width: 240 }} />
            </div>
          </div>
        </div>

        {/* Loading state */}
        <div className={s.loadingContainer}>
          <div className={s.spinner} />
          <span className={s.loadingText}>Loading saved ideas...</span>
        </div>
      </div>
    </div>
  );
}

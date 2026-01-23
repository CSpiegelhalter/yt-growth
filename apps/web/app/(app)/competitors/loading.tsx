import s from "./style.module.css";

/**
 * Competitors Page Loading Skeleton
 * Shows instantly during navigation while server fetches data.
 */
export default function CompetitorsLoading() {
  return (
    <div className={s.page}>
      {/* Header skeleton */}
      <header className={s.header}>
        <div
          className="skeleton"
          style={{ height: 32, width: 200, marginBottom: 8 }}
        />
        <div className="skeleton" style={{ height: 20, width: 360 }} />
      </header>

      {/* Video grid skeleton - using existing skeleton styles */}
      <div className={s.videoGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={s.videoCardSkeleton}>
            <div className={s.skeletonThumb} />
            <div className={s.skeletonContent}>
              <div className={s.skeletonTitle} />
              <div className={s.skeletonMeta} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

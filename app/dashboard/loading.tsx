import s from "./style.module.css";

/**
 * Dashboard Loading Skeleton
 * Shows instantly during navigation while server fetches data.
 */
export default function DashboardLoading() {
  return (
    <div className={s.page}>
      {/* Header skeleton */}
      <header className={s.header}>
        <div
          className="skeleton"
          style={{ height: 32, width: 180, marginBottom: 8 }}
        />
        <div className="skeleton" style={{ height: 20, width: 280 }} />
      </header>

      {/* Video grid skeleton */}
      <div className={s.content}>
        <div className={s.videoList}>
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
    </div>
  );
}

import s from "./style.module.css";

/**
 * Profile Page Loading Skeleton
 * Shows instantly during navigation while server fetches data.
 */
export default function ProfileLoading() {
  return (
    <div className={s.page}>
      {/* Header skeleton */}
      <header className={s.header}>
        <div className="skeleton" style={{ height: 32, width: 120, marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 18, width: 200 }} />
      </header>

      <div className={s.grid}>
        {/* Card skeleton */}
        <div className={s.card}>
          <div className="skeleton" style={{ height: 22, width: 140, marginBottom: 16 }} />
          <div className={s.loadingState}>
            <div className={s.spinner} />
            <span>Loading profile...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

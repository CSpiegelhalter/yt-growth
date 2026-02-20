import { VideoCardSkeletons } from "@/components/skeletons/VideoCardSkeletons";
import s from "./style.module.css";

/**
 * Dashboard Loading Skeleton
 * Shows instantly during navigation while server fetches data.
 */
export default function DashboardLoading() {
  return (
    <div className={s.page}>
      <header className={s.header}>
        <div
          className="skeleton"
          style={{ height: 32, width: 180, marginBottom: 8 }}
        />
        <div className="skeleton" style={{ height: 20, width: 280 }} />
      </header>

      <div className={s.content}>
        <div className={s.videoList}>
          <VideoCardSkeletons s={s} />
        </div>
      </div>
    </div>
  );
}

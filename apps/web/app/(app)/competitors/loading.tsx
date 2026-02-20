import { VideoCardSkeletons } from "@/components/skeletons/VideoCardSkeletons";
import s from "./style.module.css";

/**
 * Competitors Page Loading Skeleton
 * Shows instantly during navigation while server fetches data.
 */
export default function CompetitorsLoading() {
  return (
    <div className={s.page}>
      <header className={s.header}>
        <div
          className="skeleton"
          style={{ height: 32, width: 200, marginBottom: 8 }}
        />
        <div className="skeleton" style={{ height: 20, width: 360 }} />
      </header>

      <div className={s.videoGrid}>
        <VideoCardSkeletons s={s} />
      </div>
    </div>
  );
}

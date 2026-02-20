import { VideoCardSkeletons } from "@/components/skeletons/VideoCardSkeletons";
import s from "./style.module.css";

/**
 * Subscriber Insights Loading Skeleton
 * Shows instantly during navigation while server fetches data.
 */
export default function SubscriberInsightsLoading() {
  return (
    <div className={s.page}>
      <header className={s.header}>
        <div
          className="skeleton"
          style={{ height: 32, width: 220, marginBottom: 8 }}
        />
        <div className="skeleton" style={{ height: 20, width: 300 }} />
      </header>

      <div className={s.summarySection}>
        <div className={s.summaryGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={s.summaryCard}>
              <div
                className="skeleton"
                style={{ height: 28, width: "60%", margin: "0 auto 8px" }}
              />
              <div
                className="skeleton"
                style={{ height: 12, width: "40%", margin: "0 auto" }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className={s.videoGrid}>
        <VideoCardSkeletons s={s} />
      </div>
    </div>
  );
}

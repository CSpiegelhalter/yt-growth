import Image from "next/image";

import type { VideoWithMetrics } from "@/lib/video-tools";

import s from "./video-list.module.css";
import { VideoListItem } from "./VideoListItem";

type VideoListProps = {
  videos: VideoWithMetrics[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  loading: boolean;
};

export function VideoList({
  videos,
  selectedId,
  onSelect,
  loading,
}: VideoListProps) {
  const isOverviewSelected = selectedId === null;

  return (
    <nav className={s.list} aria-label="Video list">
      {/* Overview item (always first, always present) */}
      <button
        type="button"
        className={`${s.listItem} ${s.overviewItem} ${isOverviewSelected ? s.listItemSelected : ""}`}
        onClick={() => onSelect(null)}
        aria-current={isOverviewSelected ? "true" : undefined}
      >
        <div className={s.overviewIcon}>
          <Image
            src="/overview.svg"
            alt=""
            width={36}
            height={36}
            aria-hidden="true"
          />
        </div>
        <div className={s.listItemContent}>
          <h3 className={s.listItemTitle}>Overview: Last 30 Days</h3>
          <span className={s.listItemMeta}>Channel performance summary</span>
        </div>
      </button>

      {/* Video items */}
      {loading ? (
        <VideoListSkeleton />
      ) : (
        videos.map((video) => (
          <VideoListItem
            key={video.videoId}
            videoId={video.videoId}
            title={video.title ?? "Untitled"}
            thumbnailUrl={video.thumbnailUrl ?? null}
            publishedAt={video.publishedAt ?? null}
            views={video.views ?? null}
            selected={selectedId === video.videoId}
            onSelect={onSelect}
          />
        ))
      )}
    </nav>
  );
}

function VideoListSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={s.skeletonItem}>
          <div className={s.skeletonThumb} />
          <div className={s.skeletonContent}>
            <div className={s.skeletonTitle} />
            <div className={s.skeletonMeta} />
          </div>
        </div>
      ))}
    </>
  );
}

import type { VideoWithMetrics } from "@/lib/video-tools";

import s from "./video-list.module.css";
import { VideoListItem } from "./VideoListItem";

type VideoListProps = {
  videos: VideoWithMetrics[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
};

export function VideoList({
  videos,
  selectedId,
  onSelect,
  loading,
}: VideoListProps) {
  return (
    <div className={s.listContainer}>
      <nav className={s.list} aria-label="Video list">
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
      <div className={s.fadeGradient} />
    </div>
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

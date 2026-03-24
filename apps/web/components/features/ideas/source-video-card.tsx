import type { SourceVideoSnapshot } from "@/lib/features/suggestions/types";

import s from "./source-video-card.module.css";

type SourceVideoCardProps = {
  video: SourceVideoSnapshot;
};

export function SourceVideoCard({ video }: SourceVideoCardProps) {
  const publishedDate = new Date(video.publishedAt).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" },
  );

  return (
    <div className={s.card}>
      {video.thumbnailUrl ? (
        <img
          src={video.thumbnailUrl}
          alt=""
          className={s.thumbnail}
          loading="lazy"
        />
      ) : (
        <div className={s.thumbnailPlaceholder} />
      )}
      <div className={s.info}>
        <p className={s.title}>{video.title}</p>
        <p className={s.channel}>{video.channelTitle}</p>
        <div className={s.stats}>
          <span>{video.stats.viewCount.toLocaleString()} views</span>
          <span className={s.dot} />
          <span>{Math.round(video.stats.viewsPerDay).toLocaleString()} views/day</span>
          <span className={s.dot} />
          <span>{publishedDate}</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import s from "../style.module.css";
import type { RisingVideo } from "../types";

import { RisingVideoCard } from "./RisingVideoCard";

type Props = {
  videos: RisingVideo[];
  isLoading: boolean;
};

export function YouTubeRising({ videos, isLoading }: Props) {
  return (
    <section className={s.risingSection}>
      <div className={s.risingHeader}>
        <h2 className={s.risingHeaderTitle}>Rising on YouTube</h2>
        <span className={s.risingHeaderMeta}>
          Videos gaining momentum in the last 24h
        </span>
      </div>

      {isLoading ? (
        <div className={s.risingGrid}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={s.risingCardSkeleton} />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className={s.risingEmpty}>
          <p>No rising videos found yet. Data refreshes every hour.</p>
        </div>
      ) : (
        <div className={s.risingGrid}>
          {videos.map((video) => (
            <RisingVideoCard key={video.videoId} video={video} />
          ))}
        </div>
      )}
    </section>
  );
}

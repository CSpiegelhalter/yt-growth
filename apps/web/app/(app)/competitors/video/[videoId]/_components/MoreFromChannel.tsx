/**
 * MoreFromChannel - Async server component for "More from this channel" section.
 *
 * Fetches data server-side. If fetch fails, renders nothing (non-critical section).
 * Does NOT fabricate data on failure.
 */
import Link from "next/link";
import Image from "next/image";
import { fetchMoreFromChannel } from "./serverFetch";
import { formatCompact } from "@/lib/format";
import s from "../style.module.css";

type Props = {
  videoId: string;
  channelId: string;
  channelTitle: string;
};

export default async function MoreFromChannel({
  videoId,
  channelId,
  channelTitle,
}: Props) {
  const result = await fetchMoreFromChannel(videoId, channelId);

  // Non-critical: if fetch fails, render nothing
  if (!result.ok || result.data.length === 0) {
    return null;
  }

  const videos = result.data;

  return (
    <section className={s.moreSection}>
      <h2 className={s.sectionTitle}>More from {channelTitle}</h2>
      <div className={s.moreGrid}>
        {videos.map((v) => (
          <Link
            key={v.videoId}
            href={`/competitors/video/${v.videoId}?channelId=${channelId}`}
            className={s.moreCard}
          >
            {v.thumbnailUrl ? (
              <Image
                src={v.thumbnailUrl}
                alt={`${v.title} thumbnail`}
                width={320}
                height={180}
                className={s.moreThumb}
                sizes="(max-width: 639px) 50vw, 25vw"
              />
            ) : (
              <div className={s.moreThumbPlaceholder} />
            )}
            <div className={s.moreInfo}>
              <p className={s.moreTitle}>{v.title}</p>
              <span className={s.moreMeta}>
                {formatCompact(v.stats.viewCount)} views
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

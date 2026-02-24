import Image from "next/image";
import { useState } from "react";

import { formatCompactSafe, formatDateShort } from "@/lib/shared/format";

import s from "./video-list.module.css";

type VideoListItemProps = {
  videoId: string;
  title: string;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  views: number | null;
  selected: boolean;
  onSelect: (videoId: string) => void;
};

export function VideoListItem({
  videoId,
  title,
  thumbnailUrl,
  publishedAt,
  views,
  selected,
  onSelect,
}: VideoListItemProps) {
  const [imgError, setImgError] = useState(false);
  const showPlaceholder = !thumbnailUrl || imgError;

  return (
    <button
      type="button"
      className={`${s.listItem} ${selected ? s.listItemSelected : ""}`}
      onClick={() => onSelect(videoId)}
      aria-current={selected ? "true" : undefined}
    >
      <div className={s.listItemThumb}>
        {showPlaceholder ? (
          <div className={s.listItemThumbPlaceholder}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        ) : (
          <Image
            src={thumbnailUrl!}
            alt={`${title} thumbnail`}
            fill
            className={s.listItemThumbImg}
            sizes="80px"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <div className={s.listItemContent}>
        <h3 className={s.listItemTitle}>{title}</h3>
        <span className={s.listItemMeta}>
          {publishedAt && formatDateShort(publishedAt)}
          {publishedAt && views != null && " \u00B7 "}
          {views != null && `${formatCompactSafe(views)} views`}
        </span>
      </div>
    </button>
  );
}

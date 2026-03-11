"use client";

import type { VideoIdea } from "@/lib/features/video-ideas/types";

import s from "./planned-ideas-list.module.css";

type IdeaListItemProps = {
  idea: VideoIdea;
  selected: boolean;
  onClick: () => void;
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) {return "";}
  const d = new Date(dateStr);
  return `Planned for ${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}`;
}

export function IdeaListItem({ idea, selected, onClick }: IdeaListItemProps) {
  const displayTitle = idea.title || idea.summary;
  const dateLabel = formatDate(idea.postDate);

  return (
    <button
      type="button"
      className={`${s.ideaItem} ${selected ? s.ideaItemSelected : ""}`}
      onClick={onClick}
    >
      <span className={s.ideaIcon}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      </span>
      <span className={s.ideaContent}>
        <span className={s.ideaTitle}>{displayTitle}</span>
        {dateLabel && <span className={s.ideaDate}>{dateLabel}</span>}
      </span>
    </button>
  );
}

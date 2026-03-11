"use client";

import s from "./planned-ideas-list.module.css";

type NewIdeaCardProps = {
  selected: boolean;
  onClick: () => void;
};

export function NewIdeaCard({ selected, onClick }: NewIdeaCardProps) {
  return (
    <button
      type="button"
      className={`${s.newIdeaCard} ${selected ? s.newIdeaCardSelected : ""}`}
      onClick={onClick}
    >
      <span className={s.newIdeaIcon}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
      <span className={s.newIdeaText}>
        <span className={s.newIdeaTitle}>Start a new idea</span>
        <span className={s.newIdeaSubtitle}>Plan your next video</span>
      </span>
    </button>
  );
}

"use client";

import s from "./style.module.css";
import type { Idea } from "@/types/api";

type IdeaCardProps = {
  idea: Idea;
  isSaved: boolean;
  isSaving?: boolean;
  onSelect: () => void;
  onSave: () => void;
  onCopyHook: (text: string) => void;
  copiedId: string | null;
};

/**
 * IdeaCard - Vertical feed card for a single idea
 */
export function IdeaCard({
  idea,
  isSaved,
  isSaving,
  onSelect,
  onSave,
}: IdeaCardProps) {
  return (
    <article className={s.ideaCard}>
      {/* Card content - clickable */}
      <div className={s.ideaCardMain} onClick={onSelect}>
        <div className={s.ideaCardHeader}>
          <h3 className={s.ideaTitle}>{idea.title}</h3>
        </div>
        <p className={s.ideaAngle}>{idea.angle}</p>
      </div>

      {/* Action row */}
      <div className={s.ideaActions}>
        <button className={s.ideaActionPrimary} onClick={onSelect}>
          Open
        </button>
        <button
          className={`${s.ideaSaveBtn} ${isSaved ? s.saved : ""} ${
            isSaving ? s.saving : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (!isSaving) onSave();
          }}
          disabled={isSaving}
          title={isSaved ? "Remove from saved" : "Save idea"}
        >
          {isSaving ? (
            <span className={s.savingSpinner} />
          ) : isSaved ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          )}
        </button>
      </div>
    </article>
  );
}


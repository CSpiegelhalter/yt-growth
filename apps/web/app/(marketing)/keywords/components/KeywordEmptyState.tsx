"use client";

import s from "../keywords.module.css";

const EXAMPLE_KEYWORDS = ["youtube shorts", "gaming setup", "how to edit videos"];

export function KeywordEmptyState({ onAddKeyword }: { onAddKeyword: (kw: string) => void }) {
  return (
    <div className={s.emptyState}>
      <div className={s.emptyStateIcon}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </div>
      <h3 className={s.emptyStateTitle}>Research any keyword</h3>
      <p className={s.emptyStateText}>
        Enter a keyword to discover search volume, competition, YouTube rankings, and related terms.
      </p>
      <div className={s.emptyStateHints}>
        {EXAMPLE_KEYWORDS.map((kw) => (
          <button key={kw} type="button" className={s.emptyStateHint} onClick={() => onAddKeyword(kw)}>
            {kw}
          </button>
        ))}
      </div>
    </div>
  );
}

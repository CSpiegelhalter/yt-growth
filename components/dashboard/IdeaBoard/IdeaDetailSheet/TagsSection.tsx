"use client";

import s from "../style.module.css";

type TagsSectionProps = {
  tags: string[];
  copiedId: string | null;
  isLoading: boolean;
  hasError: boolean;
  showAll: boolean;
  onShowAllToggle: () => void;
  onCopy: (text: string, id: string) => void;
  onRetry: () => void;
};

/**
 * Tags/Keywords section within the idea detail sheet
 */
export function TagsSection({
  tags,
  copiedId,
  isLoading,
  hasError,
  showAll,
  onShowAllToggle,
  onCopy,
  onRetry,
}: TagsSectionProps) {
  const displayList = showAll ? tags : tags.slice(0, 10);
  const allKeywords = tags
    .map((k) => String(k ?? "").trim())
    .filter(Boolean)
    .join(", ");

  return (
    <section className={s.sheetSection}>
      <div className={s.sectionHeader}>
        <h3 className={s.sectionTitle}>Recommended tags</h3>
        <button
          className={s.copyAllBtn}
          onClick={() => onCopy(allKeywords, "all-keywords")}
          disabled={!allKeywords}
        >
          {copiedId === "all-keywords" ? "Copied" : "Copy all"}
        </button>
      </div>
      <p className={s.sectionIntro}>
        Add these as tags/keywords. Keep them aligned to the description.
      </p>

      {isLoading && tags.length === 0 && (
        <div className={s.skeletonChips} aria-hidden="true">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className={s.skeletonChip} />
          ))}
        </div>
      )}

      {hasError && !tags.length && (
        <div className={s.errorCallout} role="alert">
          <div className={s.errorText}>Couldn't generate tags.</div>
          <button className={s.retryBtn} onClick={onRetry}>
            Retry
          </button>
        </div>
      )}

      <div className={s.keywordChips}>
        {displayList.map((kw, i) => {
          const text = String(kw ?? "").trim();
          if (!text) return null;
          const id = `kw-${i}`;
          const isCopied = copiedId === id;
          return (
            <button
              key={id}
              className={`${s.keywordChip} ${isCopied ? s.keywordChipCopied : ""}`}
              onClick={() => onCopy(text, id)}
              aria-label={`Copy tag: ${text}`}
            >
              <span className={s.keywordChipText}>{text}</span>
              {isCopied && <span className={s.keywordChipState}>Copied</span>}
            </button>
          );
        })}
      </div>

      {tags.length > 10 && (
        <div className={s.sectionFooter}>
          <button
            className={s.showMoreBtn}
            onClick={onShowAllToggle}
            aria-expanded={showAll}
          >
            {showAll ? "Show less" : `Show all (${tags.length})`}
          </button>
        </div>
      )}
    </section>
  );
}


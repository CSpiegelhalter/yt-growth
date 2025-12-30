"use client";

import s from "../style.module.css";

type TitleOptionsSectionProps = {
  titles: string[];
  copiedId: string | null;
  isLoading: boolean;
  hasError: boolean;
  showAll: boolean;
  onShowAllToggle: () => void;
  onCopy: (text: string, id: string) => void;
  onRetry: () => void;
};

/**
 * Title options section within the idea detail sheet
 */
export function TitleOptionsSection({
  titles,
  copiedId,
  isLoading,
  hasError,
  showAll,
  onShowAllToggle,
  onCopy,
  onRetry,
}: TitleOptionsSectionProps) {
  const displayList = showAll ? titles : titles.slice(0, 5);

  return (
    <section className={s.sheetSection}>
      <div className={s.sectionHeader}>
        <h3 className={s.sectionTitle}>Title options</h3>
        <button
          className={s.copyAllBtn}
          onClick={() => onCopy(titles.join("\n"), "all-titles")}
          disabled={!titles.length}
        >
          {copiedId === "all-titles" ? "Copied" : "Copy all"}
        </button>
      </div>
      <p className={s.sectionIntro}>
        Choose one that matches your tone, then film the description above.
      </p>

      {isLoading && !titles.length && (
        <div className={s.skeletonList} aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={s.skeletonRow}>
              <div className={s.skeletonIndex} />
              <div className={s.skeletonBody}>
                <div className={s.skeletonLine} />
                <div className={`${s.skeletonLine} ${s.skeletonLineShort}`} />
              </div>
            </div>
          ))}
        </div>
      )}

      {hasError && !titles.length && (
        <div className={s.errorCallout} role="alert">
          <div className={s.errorText}>Couldn't generate title options.</div>
          <button className={s.retryBtn} onClick={onRetry}>
            Retry
          </button>
        </div>
      )}

      <div className={s.optionList}>
        {displayList.map((text, i) => {
          const t = String(text ?? "").trim();
          if (!t) return null;
          return (
            <div key={`title-${i}`} className={s.optionRow}>
              <div className={s.optionIndex}>{i + 1}</div>
              <div className={s.optionBody}>
                <p className={s.optionText}>{t}</p>
              </div>
              <button
                className={s.copyIconBtn}
                onClick={() => onCopy(t, `title-${i}`)}
                title="Copy"
                aria-label={`Copy title option ${i + 1}`}
              >
                {copiedId === `title-${i}` ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {titles.length > 5 && (
        <div className={s.sectionFooter}>
          <button
            className={s.showMoreBtn}
            onClick={onShowAllToggle}
            aria-expanded={showAll}
          >
            {showAll ? "Show less" : `Show all (${titles.length})`}
          </button>
        </div>
      )}
    </section>
  );
}


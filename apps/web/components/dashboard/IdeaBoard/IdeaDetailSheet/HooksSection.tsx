"use client";

import s from "../style.module.css";

type HooksSectionProps = {
  hooks: string[];
  copiedId: string | null;
  isLoading: boolean;
  hasError: boolean;
  showAll: boolean;
  onShowAllToggle: () => void;
  onCopy: (text: string, id: string) => void;
  onRetry: () => void;
};

/**
 * Hooks section within the idea detail sheet
 */
export function HooksSection({
  hooks,
  copiedId,
  isLoading,
  hasError,
  showAll,
  onShowAllToggle,
  onCopy,
  onRetry,
}: HooksSectionProps) {
  const displayList = showAll ? hooks : hooks.slice(0, 5);

  return (
    <section className={s.sheetSection}>
      <div className={s.sectionHeader}>
        <h3 className={s.sectionTitle}>Hooks</h3>
        <button
          className={s.copyAllBtn}
          onClick={() => onCopy(hooks.join("\n"), "all-hooks")}
          disabled={!hooks.length}
        >
          {copiedId === "all-hooks" ? "Copied" : "Copy all"}
        </button>
      </div>
      <p className={s.sectionIntro}>
        Use one as your first line and commit to it in the first 10 seconds.
      </p>

      {isLoading && !hooks.length && (
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

      {hasError && !hooks.length && (
        <div className={s.errorCallout} role="alert">
          <div className={s.errorText}>Couldn't generate hooks.</div>
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
            <div key={`hook-${i}`} className={s.optionRow}>
              <div className={s.optionIndex}>{i + 1}</div>
              <div className={s.optionBody}>
                <p className={s.optionText}>&ldquo;{t}&rdquo;</p>
              </div>
              <button
                className={s.copyIconBtn}
                onClick={() => onCopy(t, `hook-${i}`)}
                title="Copy"
                aria-label={`Copy hook ${i + 1}`}
              >
                {copiedId === `hook-${i}` ? (
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

      {hooks.length > 5 && (
        <div className={s.sectionFooter}>
          <button
            className={s.showMoreBtn}
            onClick={onShowAllToggle}
            aria-expanded={showAll}
          >
            {showAll ? "Show less" : `Show all (${hooks.length})`}
          </button>
        </div>
      )}
    </section>
  );
}


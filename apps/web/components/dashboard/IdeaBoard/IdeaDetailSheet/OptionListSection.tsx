"use client";

import { CheckIcon, CopyIcon } from "@/components/icons";
import s from "../style.module.css";

type OptionListSectionProps = {
  title: string;
  intro: string;
  items: string[];
  keyPrefix: string;
  copyAllId: string;
  errorLabel: string;
  copiedId: string | null;
  isLoading: boolean;
  hasError: boolean;
  showAll: boolean;
  /** When true, items are wrapped in smart quotes */
  quoteItems?: boolean;
  onShowAllToggle: () => void;
  onCopy: (text: string, id: string) => void;
  onRetry: () => void;
};

/**
 * Reusable numbered option list with copy, loading, error, and show-more.
 * Powers both the Hooks and Title Options sections.
 */
export function OptionListSection({
  title,
  intro,
  items,
  keyPrefix,
  copyAllId,
  errorLabel,
  copiedId,
  isLoading,
  hasError,
  showAll,
  quoteItems,
  onShowAllToggle,
  onCopy,
  onRetry,
}: OptionListSectionProps) {
  const displayList = showAll ? items : items.slice(0, 5);

  return (
    <section className={s.sheetSection}>
      <div className={s.sectionHeader}>
        <h3 className={s.sectionTitle}>{title}</h3>
        <button
          className={s.copyAllBtn}
          onClick={() => onCopy(items.join("\n"), copyAllId)}
          disabled={!items.length}
        >
          {copiedId === copyAllId ? "Copied" : "Copy all"}
        </button>
      </div>
      <p className={s.sectionIntro}>{intro}</p>

      {isLoading && !items.length && (
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

      {hasError && !items.length && (
        <div className={s.errorCallout} role="alert">
          <div className={s.errorText}>{errorLabel}</div>
          <button className={s.retryBtn} onClick={onRetry}>
            Retry
          </button>
        </div>
      )}

      <div className={s.optionList}>
        {displayList.map((text, i) => {
          const t = String(text ?? "").trim();
          if (!t) {return null;}
          const itemId = `${keyPrefix}-${i}`;
          return (
            <div key={itemId} className={s.optionRow}>
              <div className={s.optionIndex}>{i + 1}</div>
              <div className={s.optionBody}>
                <p className={s.optionText}>
                  {quoteItems ? <>&ldquo;{t}&rdquo;</> : t}
                </p>
              </div>
              <button
                className={s.copyIconBtn}
                onClick={() => onCopy(t, itemId)}
                title="Copy"
                aria-label={`Copy ${keyPrefix} ${i + 1}`}
              >
                {copiedId === itemId ? (
                  <CheckIcon size={16} />
                ) : (
                  <CopyIcon size={16} />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {items.length > 5 && (
        <div className={s.sectionFooter}>
          <button
            className={s.showMoreBtn}
            onClick={onShowAllToggle}
            aria-expanded={showAll}
          >
            {showAll ? "Show less" : `Show all (${items.length})`}
          </button>
        </div>
      )}
    </section>
  );
}

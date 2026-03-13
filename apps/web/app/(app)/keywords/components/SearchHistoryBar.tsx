"use client";

import s from "../keywords.module.css";

type SearchHistoryBarProps = {
  searchHistory: string[][];
  canGoBack: boolean;
  onGoBack: () => void;
  onHistoryClick: (index: number) => void;
  onClearHistory: () => void;
};

export function SearchHistoryBar({
  searchHistory, canGoBack, onGoBack, onHistoryClick, onClearHistory,
}: SearchHistoryBarProps) {
  return (
    <div className={s.searchHistoryBar}>
      <div className={s.searchHistoryNav}>
        {canGoBack && (
          <button type="button" className={s.backButton} onClick={onGoBack} aria-label="Go back to previous search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        )}
        <nav className={s.breadcrumbs} aria-label="Search history">
          {searchHistory.map((kws, index) => {
            const isLast = index === searchHistory.length - 1;
            const label = kws.length > 1 ? `${kws[0]} +${kws.length - 1}` : kws[0];
            return (
              <span key={`${kws.join(",")}-${index}`} className={s.breadcrumbItem}>
                {index > 0 && <span className={s.breadcrumbSeparator}>/</span>}
                {isLast ? (
                  <span className={s.breadcrumbCurrent} title={kws.join(", ")}>{label}</span>
                ) : (
                  <button type="button" className={s.breadcrumbLink} onClick={() => onHistoryClick(index)} title={kws.join(", ")}>
                    {label}
                  </button>
                )}
              </span>
            );
          })}
        </nav>
      </div>
      {searchHistory.length > 1 && (
        <button type="button" className={s.clearHistoryButton} onClick={onClearHistory} aria-label="Clear search history">
          Clear
        </button>
      )}
    </div>
  );
}

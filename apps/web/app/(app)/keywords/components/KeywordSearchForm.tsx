"use client";

import { MAX_KEYWORDS } from "../constants";
import s from "../keywords.module.css";

type KeywordSearchFormProps = {
  inputRef: React.RefObject<HTMLInputElement | null>;
  inputValue: string;
  setInputValue: (v: string) => void;
  keywords: string[];
  database: string;
  setDatabase: (v: string) => void;
  databaseOptions: ReadonlyArray<{ value: string; label: string }>;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onRemoveKeyword: (kw: string) => void;
};

export function KeywordSearchForm({
  inputRef, inputValue, setInputValue, keywords, database, setDatabase,
  databaseOptions, isLoading, onSubmit, onKeyDown, onRemoveKeyword,
}: KeywordSearchFormProps) {
  const hasKeywords = keywords.length > 0;
  const canSubmit = !isLoading && (hasKeywords || !!inputValue.trim());

  return (
    <>
      <form onSubmit={onSubmit} className={s.searchForm}>
        <div className={s.searchInputGroup}>
          <div className={s.searchInputWrapper}>
            <svg className={s.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={hasKeywords ? "Add another keyword..." : "Enter keywords to research..."}
              className={s.searchInputField}
              disabled={isLoading}
            />
          </div>
          <select value={database} onChange={(e) => setDatabase(e.target.value)} className={s.databaseSelect} disabled={isLoading}>
            {databaseOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button type="submit" className={s.searchButton} disabled={!canSubmit}>
            {isLoading ? <span className={s.spinner} /> : "Search"}
          </button>
        </div>
        {!hasKeywords && (
          <p className={s.searchFormHint}>Enter keywords and press Enter to add them, then click Search</p>
        )}
      </form>
      {hasKeywords && (
        <div className={s.keywordListBox}>
          <div className={s.keywordListHeader}>
            <span className={s.keywordListTitle}>Keywords to search</span>
            <span className={s.keywordListCount}>{keywords.length}/{MAX_KEYWORDS}</span>
          </div>
          <ol className={s.keywordList}>
            {keywords.map((kw, index) => (
              <li key={kw} className={s.keywordListItem}>
                <span className={s.keywordListNumber}>{index + 1}</span>
                <span className={s.keywordListText}>{kw}</span>
                <button type="button" className={s.keywordListRemove} onClick={() => onRemoveKeyword(kw)} aria-label={`Remove ${kw}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
}

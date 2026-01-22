"use client";

import { useState, useCallback, type FormEvent } from "react";
import s from "./style.module.css";

export type SearchMode = "competitor_search" | "search_my_niche";

type Props = {
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  onSearch: (nicheText: string, referenceVideoUrl: string) => void;
  isSearching: boolean;
  hasChannel: boolean;
  /** Initial niche text value (for restoring from saved state) */
  initialNicheText?: string;
  /** Initial reference URL value (for restoring from saved state) */
  initialReferenceUrl?: string;
};

/**
 * CompetitorSearchPanel - Mode switch and search inputs
 *
 * Provides:
 * - Toggle between "Competitor Search" and "Search My Niche" modes
 * - Niche text input (textarea)
 * - Reference video URL input
 * - Search button
 */
export default function CompetitorSearchPanel({
  mode,
  onModeChange,
  onSearch,
  isSearching,
  hasChannel,
  initialNicheText = "",
  initialReferenceUrl = "",
}: Props) {
  const [nicheText, setNicheText] = useState(initialNicheText);
  const [referenceUrl, setReferenceUrl] = useState(initialReferenceUrl);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (mode === "competitor_search") {
        onSearch(nicheText.trim(), referenceUrl.trim());
      } else {
        onSearch("", "");
      }
    },
    [mode, nicheText, referenceUrl, onSearch]
  );

  const canSearch =
    mode === "search_my_niche" ||
    nicheText.trim().length > 0 ||
    referenceUrl.trim().length > 0;

  return (
    <div className={s.searchPanel}>
      {/* Mode Toggle */}
      <div className={s.modeToggle} role="tablist" aria-label="Search mode">
        <button
          role="tab"
          aria-selected={mode === "competitor_search"}
          className={`${s.modeTab} ${mode === "competitor_search" ? s.modeTabActive : ""}`}
          onClick={() => onModeChange("competitor_search")}
          type="button"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          Competitor Search
        </button>
        <button
          role="tab"
          aria-selected={mode === "search_my_niche"}
          className={`${s.modeTab} ${mode === "search_my_niche" ? s.modeTabActive : ""}`}
          onClick={() => onModeChange("search_my_niche")}
          type="button"
          disabled={!hasChannel}
          title={!hasChannel ? "Connect a channel first" : undefined}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Search My Niche
        </button>
      </div>

      {/* Search Form - Only show for competitor_search mode */}
      {mode === "competitor_search" && (
        <form onSubmit={handleSubmit} className={s.searchForm}>
          <div className={s.searchInputGroup}>
            <label htmlFor="niche-text" className={s.searchLabel}>
              Describe your niche
            </label>
            <textarea
              id="niche-text"
              className={s.searchTextarea}
              placeholder="e.g., DIY home espresso, budget travel tips, React tutorials..."
              value={nicheText}
              onChange={(e) => setNicheText(e.target.value)}
              rows={2}
              maxLength={500}
              disabled={isSearching}
            />
          </div>

          <div className={s.searchInputGroup}>
            <label htmlFor="reference-url" className={s.searchLabel}>
              Reference video URL <span className={s.searchLabelOptional}>(optional)</span>
            </label>
            <input
              id="reference-url"
              type="url"
              className={s.searchInput}
              placeholder="https://youtube.com/watch?v=..."
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              disabled={isSearching}
            />
            <p className={s.searchHint}>
              Paste a YouTube video URL to find similar competitors in that niche
            </p>
          </div>

          <button
            type="submit"
            className={s.searchButton}
            disabled={!canSearch || isSearching}
          >
            {isSearching ? (
              <>
                <span className={s.spinnerSmall} />
                Searching...
              </>
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                Find Competitors
              </>
            )}
          </button>
        </form>
      )}

      {/* My Niche Mode - Show message */}
      {mode === "search_my_niche" && (
        <div className={s.myNicheInfo}>
          <p>
            Search for competitors based on your channel's detected niche and content.
          </p>
          <button
            type="button"
            className={s.searchButton}
            onClick={() => onSearch("", "")}
            disabled={isSearching}
          >
            {isSearching ? (
              <>
                <span className={s.spinnerSmall} />
                Searching...
              </>
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search My Niche
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

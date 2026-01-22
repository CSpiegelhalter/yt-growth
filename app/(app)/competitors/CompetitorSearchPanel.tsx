"use client";

import { useState, useCallback, useEffect, type FormEvent } from "react";
import { validateYouTubeUrl, validateNicheText } from "./utils";
import s from "./style.module.css";

export type TopLevelMode = "search" | "discover";
export type SearchMode = "competitor_search" | "search_my_niche";

type Props = {
  mode: TopLevelMode;
  onSearch: (nicheText: string, referenceVideoUrl: string) => void;
  onSearchMyNiche: () => void;
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
 * - Segmented control: "Search" | "Discover"
 * - Search mode: Niche text input + Reference video URL
 * - Validation with inline error messages
 * - "Search My Niche" shortcut button
 */
export default function CompetitorSearchPanel({
  mode,
  onSearch,
  onSearchMyNiche,
  isSearching,
  hasChannel,
  initialNicheText = "",
  initialReferenceUrl = "",
}: Props) {
  const [nicheText, setNicheText] = useState(initialNicheText);
  const [referenceUrl, setReferenceUrl] = useState(initialReferenceUrl);
  
  // Validation states
  const [nicheError, setNicheError] = useState<string | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ niche: false, url: false });

  // Reset errors when inputs change
  useEffect(() => {
    if (touched.niche) {
      const result = validateNicheText(nicheText);
      setNicheError(result.error);
    }
  }, [nicheText, touched.niche]);

  useEffect(() => {
    if (touched.url && referenceUrl.trim()) {
      const result = validateYouTubeUrl(referenceUrl);
      setUrlError(result.error);
    } else {
      setUrlError(null);
    }
  }, [referenceUrl, touched.url]);

  const handleNicheBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, niche: true }));
  }, []);

  const handleUrlBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, url: true }));
  }, []);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      
      // Validate before submitting
      const nicheValidation = validateNicheText(nicheText);
      const urlValidation = validateYouTubeUrl(referenceUrl);
      
      setTouched({ niche: true, url: true });
      setNicheError(nicheValidation.error);
      setUrlError(urlValidation.error);
      
      // Need at least one valid input
      const hasNiche = nicheText.trim().length >= 3;
      const hasValidUrl = urlValidation.isValid && urlValidation.videoId;
      
      if (!hasNiche && !hasValidUrl) {
        if (!nicheText.trim() && !referenceUrl.trim()) {
          setNicheError("Please describe a niche or paste a video URL");
        }
        return;
      }
      
      if (nicheValidation.error || urlValidation.error) {
        return;
      }
      
      onSearch(nicheText.trim(), referenceUrl.trim());
    },
    [nicheText, referenceUrl, onSearch]
  );

  const handleSearchMyNiche = useCallback(() => {
    setNicheError(null);
    setUrlError(null);
    onSearchMyNiche();
  }, [onSearchMyNiche]);

  const canSearch =
    (nicheText.trim().length >= 3 || (referenceUrl.trim().length > 0 && !urlError));

  // Only render search form when in search mode
  if (mode !== "search") {
    return null;
  }

  return (
    <div className={s.searchPanel}>
      {/* Search Form */}
      <form onSubmit={handleSubmit} className={s.searchForm}>
        {/* My Niche Shortcut - prominent when user has a channel */}
        {hasChannel && (
          <div className={s.myNicheShortcut}>
            <button
              type="button"
              className={s.myNicheShortcutBtn}
              onClick={handleSearchMyNiche}
              disabled={isSearching}
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
            <span className={s.myNicheHint}>
              Use your channel's detected niche
            </span>
          </div>
        )}

        {/* Divider */}
        {hasChannel && (
          <div className={s.orDivider}>
            <span>or search any niche</span>
          </div>
        )}

        {/* Niche Input Section */}
        <div className={s.nicheInputSection}>
          <p className={s.sectionHint}>
            Use one or both. We'll infer the niche and find competitors.
          </p>

          {/* Niche Text */}
          <div className={s.searchInputGroup}>
            <label htmlFor="niche-text" className={s.searchLabel}>
              Describe your niche
            </label>
            <textarea
              id="niche-text"
              className={`${s.searchTextarea} ${nicheError ? s.inputError : ""}`}
              placeholder="e.g., DIY home espresso, budget travel tips, React tutorials..."
              value={nicheText}
              onChange={(e) => setNicheText(e.target.value)}
              onBlur={handleNicheBlur}
              rows={2}
              maxLength={500}
              disabled={isSearching}
              aria-invalid={!!nicheError}
              aria-describedby={nicheError ? "niche-error" : undefined}
            />
            {nicheError && (
              <p id="niche-error" className={s.fieldError} role="alert">
                {nicheError}
              </p>
            )}
          </div>

          {/* Reference Video URL */}
          <div className={s.searchInputGroup}>
            <label htmlFor="reference-url" className={s.searchLabel}>
              Reference video URL{" "}
              <span className={s.searchLabelOptional}>(optional)</span>
            </label>
            <input
              id="reference-url"
              type="url"
              className={`${s.searchInput} ${urlError ? s.inputError : ""}`}
              placeholder="https://youtube.com/watch?v=... or youtu.be/..."
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              onBlur={handleUrlBlur}
              disabled={isSearching}
              aria-invalid={!!urlError}
              aria-describedby={urlError ? "url-error" : "url-hint"}
            />
            {urlError ? (
              <p id="url-error" className={s.fieldError} role="alert">
                {urlError}
              </p>
            ) : (
              <p id="url-hint" className={s.searchHint}>
                Paste a YouTube video URL to find similar competitors in that niche
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
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
    </div>
  );
}

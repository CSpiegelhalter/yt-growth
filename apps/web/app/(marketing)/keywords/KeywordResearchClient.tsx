"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { z } from "zod";
import s from "./keywords.module.css";
import { useToast } from "@/components/ui/Toast";
import { AuthModal } from "@/components/auth";
import { apiFetchJson, isApiClientError } from "@/lib/client/api";
import { ResearchTab } from "./components/ResearchTab";
import { SUBSCRIPTION, formatUsd } from "@/lib/shared/product";
import type { RelatedKeyword, YouTubeRanking, GoogleTrendsData } from "./types";

type KeywordTaskResponse = {
  pending?: boolean;
  taskId?: string;
  rows?: unknown;
  [key: string]: unknown;
};

type KeywordResearchResponse = {
  needsAuth?: boolean;
  pending?: boolean;
  taskId?: string;
  rows?: unknown;
  [key: string]: unknown;
};

type KeywordTrendsResponse = {
  pending?: boolean;
  taskId?: string;
  [key: string]: unknown;
};

type YoutubeSerpResponse = {
  needsAuth?: boolean;
  results?: unknown[];
  [key: string]: unknown;
};

// ============================================
// ZOD SCHEMAS - Response validation for API data
// ============================================

/**
 * Schema for monthly search data points.
 */
const MonthlySearchSchema = z.object({
  year: z.number(),
  month: z.number(),
  searchVolume: z.number(),
});

/**
 * Schema for keyword metrics from the API.
 * Validates and coerces nullable fields safely.
 */
const KeywordMetricsResponseSchema = z.object({
  keyword: z.string(),
  searchVolume: z.number().default(0),
  keywordDifficulty: z.number().default(0),
  trend: z.array(z.number()).default([]),
  monthlySearches: z.array(MonthlySearchSchema).optional(),
  intent: z.string().nullable().optional(),
  cpc: z.number().nullable().optional(),
  competition: z.number().nullable().optional(),
  competitionIndex: z.number().nullable().optional(),
  competitionLevel: z.string().nullable().optional(),
  lowTopOfPageBid: z.number().nullable().optional(),
  highTopOfPageBid: z.number().nullable().optional(),
  difficultyIsEstimate: z.boolean().optional().default(true),
});

/**
 * Schema for related keyword rows.
 */
const RelatedKeywordResponseSchema = KeywordMetricsResponseSchema.extend({
  relevance: z.number().nullable().optional(),
});

/**
 * Schema for YouTube ranking video.
 */
const YouTubeRankingResponseSchema = z.object({
  position: z.number(),
  title: z.string(),
  channelName: z.string(),
  channelUrl: z.string(),
  videoUrl: z.string(),
  videoId: z.string(),
  views: z.number().nullable(),
  publishedDate: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  duration: z.string().nullable(),
});

/**
 * Schema for Google Trends data.
 */
const GoogleTrendsTimePointSchema = z.object({
  dateFrom: z.string(),
  dateTo: z.string(),
  timestamp: z.number(),
  value: z.number(),
  missingData: z.boolean(),
});

const GoogleTrendsRisingQuerySchema = z.object({
  query: z.string(),
  value: z.number(),
});

const GoogleTrendsRegionSchema = z.object({
  geoId: z.string(),
  geoName: z.string(),
  value: z.number(),
});

const GoogleTrendsResponseSchema = z.object({
  keyword: z.string(),
  interestOverTime: z.array(GoogleTrendsTimePointSchema).default([]),
  risingQueries: z.array(GoogleTrendsRisingQuerySchema).default([]),
  topQueries: z.array(z.object({ query: z.string(), value: z.number() })).default([]),
  regionBreakdown: z.array(GoogleTrendsRegionSchema).default([]),
  averageInterest: z.number().default(0),
});

// Video idea schema defined in VideoIdeasTab, omitted here to avoid unused declaration

/**
 * Safely parse related keyword row from API response.
 */
function parseRelatedKeyword(data: unknown): RelatedKeyword | null {
  try {
    const parsed = RelatedKeywordResponseSchema.parse(data);
    return {
      ...parsed,
      intent: parsed.intent ?? null,
      cpc: parsed.cpc ?? null,
      competition: parsed.competition ?? null,
      competitionIndex: parsed.competitionIndex ?? null,
      competitionLevel: parsed.competitionLevel ?? null,
      relevance: parsed.relevance ?? undefined,
    };
  } catch (e) {
    console.warn("Failed to parse related keyword:", e);
    return null;
  }
}

/**
 * Safely parse YouTube ranking video from API response.
 */
function parseYouTubeRanking(data: unknown): YouTubeRanking | null {
  try {
    return YouTubeRankingResponseSchema.parse(data);
  } catch (e) {
    console.warn("Failed to parse YouTube ranking:", e);
    return null;
  }
}

// Types imported from ./types to avoid circular dependency with ResearchTab

// Database options
const DATABASE_OPTIONS = [
  { value: "us", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "ca", label: "Canada" },
  { value: "au", label: "Australia" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "es", label: "Spain" },
  { value: "it", label: "Italy" },
  { value: "br", label: "Brazil" },
  { value: "mx", label: "Mexico" },
  { value: "in", label: "India" },
  { value: "jp", label: "Japan" },
] as const;

// Polling configuration
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 15;

// Trends polling - longer since Google Trends API is slower
const TRENDS_POLL_INTERVAL_MS = 3000;
const TRENDS_MAX_POLL_ATTEMPTS = 20; // Up to 60 seconds of client-side polling

// ============================================
// COMPONENT
// ============================================

const MAX_KEYWORDS = 10;

export function KeywordResearchClient() {
  const { toast } = useToast();

  // Keyword collection state (form-like - collect then search)
  const [keywords, setKeywords] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [database, setDatabase] = useState("us");
  const inputRef = useRef<HTMLInputElement>(null);

  // Searched keywords (what was actually searched)
  const [searchedKeywords, setSearchedKeywords] = useState<string[]>([]);

  // Search history for breadcrumb navigation (each entry is an array of keywords)
  const [searchHistory, setSearchHistory] = useState<string[][]>([]);
  const currentSearch = searchHistory[searchHistory.length - 1] || [];

  // Loading states
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [polling, setPolling] = useState(false);

  // Results (no separate seed metrics - just related keywords)
  const [relatedKeywords, setRelatedKeywords] = useState<RelatedKeyword[]>([]);
  const [rankings, setRankings] = useState<YouTubeRanking[]>([]);
  const [trends, setTrends] = useState<GoogleTrendsData | null>(null);

  // Auth/Error state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);

  // Refs
  const pendingRequestRef = useRef<{ keyword: string; database: string } | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollAttemptsRef = useRef(0);
  const trendsPollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const trendsPollAttemptsRef = useRef(0);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (trendsPollIntervalRef.current) {
        clearInterval(trendsPollIntervalRef.current);
      }
    };
  }, []);

  // Reset results when keyword changes
  const resetResults = useCallback(() => {
    setRelatedKeywords([]);
    setRankings([]);
    setTrends(null);
    setError(null);
  }, []);

  const applyParsedRows = useCallback((data: { rows?: unknown }) => {
    if (data.rows && Array.isArray(data.rows)) {
      const parsedRows = (data.rows as unknown[])
        .map((row) => parseRelatedKeyword(row))
        .filter((row): row is RelatedKeyword => row !== null);
      setRelatedKeywords(parsedRows);
    }
  }, []);

  // Poll for task results
  const pollForResults = useCallback(
    async (taskId: string) => {
      pollAttemptsRef.current++;

      if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setPolling(false);
        setLoadingKeywords(false);
        setError({
          title: "Request timeout",
          message: "The search is taking longer than expected. Please try again.",
        });
        return;
      }

      try {
        const data = await apiFetchJson<KeywordTaskResponse>(`/api/keywords/task/${taskId}`);

        if (data.pending) {
          return; // Keep polling
        }

        // Got results - stop polling
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setPolling(false);
        pollAttemptsRef.current = 0;
        setLoadingKeywords(false);

        applyParsedRows(data);

      } catch (err) {
        console.error("Poll error:", err);
      }
    },
    []
  );

  // Fetch related keywords (supports multiple keywords in single API call)
  const fetchRelatedKeywords = useCallback(
    async (kws: string | string[], db: string) => {
      const keywords = Array.isArray(kws) ? kws : [kws];
      setLoadingKeywords(true);
      try {
        const data = await apiFetchJson<KeywordResearchResponse>("/api/keywords/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "related", phrases: keywords, database: db }),
        });

        if (data.needsAuth) {
          pendingRequestRef.current = { keyword: keywords[0], database: db };
          setShowAuthModal(true);
          setLoadingKeywords(false);
          return;
        }

        // Handle pending state - start polling
        if (data.pending && data.taskId) {
          const tid = data.taskId;
          setPolling(true);
          pollAttemptsRef.current = 0;
          pollIntervalRef.current = setInterval(() => {
            pollForResults(tid);
          }, POLL_INTERVAL_MS);
          return;
        }

        setLoadingKeywords(false);
        applyParsedRows(data);
      } catch (err) {
        setLoadingKeywords(false);
        if (isApiClientError(err)) {
          if (err.code === "LIMIT_REACHED") {
            setShowPaywall(true);
            toast("You've reached your daily search limit", "info");
            return;
          }
          if (err.status === 503) {
            setError({
              title: "Service temporarily unavailable",
              message: "The keyword research service is temporarily unavailable. Please try again in a few minutes.",
            });
            return;
          }
          setError({ title: "Search failed", message: err.message });
        } else {
          setError({ title: "Search failed", message: "An unexpected error occurred" });
        }
      }
    },
    [pollForResults, toast]
  );

  // Poll for trends task results - uses longer intervals since Trends API is slow
  const pollForTrendsResults = useCallback(
    async (taskId: string) => {
      trendsPollAttemptsRef.current++;

      if (trendsPollAttemptsRef.current >= TRENDS_MAX_POLL_ATTEMPTS) {
        if (trendsPollIntervalRef.current) {
          clearInterval(trendsPollIntervalRef.current);
          trendsPollIntervalRef.current = null;
        }
        setLoadingTrends(false);
        // Trends are supplementary - don't show error, just fail silently
        console.log("Trends polling timed out after", TRENDS_MAX_POLL_ATTEMPTS, "attempts");
        return;
      }

      try {
        const data = await apiFetchJson<KeywordTaskResponse>(`/api/keywords/task/${taskId}`);

        if (data.pending) {
          return; // Keep polling
        }

        // Got results - stop polling
        if (trendsPollIntervalRef.current) {
          clearInterval(trendsPollIntervalRef.current);
          trendsPollIntervalRef.current = null;
        }
        trendsPollAttemptsRef.current = 0;
        setLoadingTrends(false);

        // Parse and set trends data
        const parsed = GoogleTrendsResponseSchema.safeParse(data);
        if (parsed.success) {
          setTrends(parsed.data);
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Trends poll error:", err);
        }
      }
    },
    []
  );

  // Fetch Google Trends data
  const fetchTrends = useCallback(async (kw: string, db: string) => {
    setLoadingTrends(true);
    // Clear any existing trends poll
    if (trendsPollIntervalRef.current) {
      clearInterval(trendsPollIntervalRef.current);
      trendsPollIntervalRef.current = null;
    }
    trendsPollAttemptsRef.current = 0;

    try {
      const data = await apiFetchJson<KeywordTrendsResponse>("/api/keywords/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: kw, database: db }),
      });

      // Handle pending - start polling with longer intervals for trends
      if (data.pending && data.taskId) {
        const tid = data.taskId;
        trendsPollAttemptsRef.current = 0;
        trendsPollIntervalRef.current = setInterval(() => {
          pollForTrendsResults(tid);
        }, TRENDS_POLL_INTERVAL_MS);
        return;
      }

      setLoadingTrends(false);

      // Parse and set trends data
      const parsed = GoogleTrendsResponseSchema.safeParse(data);
      if (parsed.success) {
        setTrends(parsed.data);
      }
    } catch (err) {
      // Trends are supplementary - fail silently
      setLoadingTrends(false);
      if (process.env.NODE_ENV === "development") {
        console.warn("Trends fetch error:", err);
      }
    }
  }, [pollForTrendsResults]);

  // Fetch YouTube rankings
  const fetchRankings = useCallback(async (kw: string, db: string) => {
    setLoadingRankings(true);
    try {
      const data = await apiFetchJson<YoutubeSerpResponse>("/api/keywords/youtube-serp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: kw, location: db, limit: 10 }),
      });

      setLoadingRankings(false);
      
      // Handle auth requirement - don't show rankings for unauthenticated users
      if (data.needsAuth) {
        setRankings([]);
        return;
      }
      
      if (data.results && Array.isArray(data.results)) {
        // Use Zod-validated parsing, filter out any failed parses
        const results = data.results as unknown[];
        const parsedRankings = results
          .map((item) => parseYouTubeRanking(item))
          .filter((item): item is YouTubeRanking => item !== null);
        setRankings(parsedRankings);
      }
    } catch {
      // Rankings are supplementary - silently handle all errors
      // (service unavailable, rate limits, network issues, etc.)
      setLoadingRankings(false);
      setRankings([]);
    }
  }, []);

  // Add a keyword to the list
  const addKeyword = useCallback((kw: string) => {
    const keyword = kw.trim().toLowerCase();
    if (!keyword) {return;}
    if (keywords.includes(keyword)) {
      toast("Keyword already added", "info");
      return;
    }
    if (keywords.length >= MAX_KEYWORDS) {
      toast(`Maximum ${MAX_KEYWORDS} keywords allowed`, "info");
      return;
    }
    setKeywords(prev => [...prev, keyword]);
    setInputValue("");
  }, [keywords, toast]);

  // Remove a keyword from the list
  const removeKeyword = useCallback((kw: string) => {
    setKeywords(prev => prev.filter(k => k !== kw));
  }, []);

  // Handle input key events
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) {
        addKeyword(inputValue);
      } else if (keywords.length > 0) {
        // If no input but we have keywords, trigger search
        handleSearch();
      }
    } else if (e.key === "," || e.key === "Tab") {
      if (inputValue.trim()) {
        e.preventDefault();
        addKeyword(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && keywords.length > 0) {
      removeKeyword(keywords[keywords.length - 1]);
    }
  };

  // Execute search for keywords
  const executeSearch = useCallback(
    (kws: string[], db: string, addToHistory = true) => {
      if (kws.length === 0) {return;}

      resetResults();
      setError(null);
      setShowPaywall(false);
      setSearchedKeywords(kws);

      // Add to history
      if (addToHistory) {
        setSearchHistory(prev => {
          // Keep last 5 searches (each is an array of keywords)
          const newHistory = [...prev, kws].slice(-5);
          return newHistory;
        });
      }

      // Fetch related keywords with all keywords
      fetchRelatedKeywords(kws, db);
      // Fetch rankings and trends for primary keyword only
      fetchRankings(kws[0], db);
      fetchTrends(kws[0], db);
    },
    [resetResults, fetchRelatedKeywords, fetchRankings, fetchTrends]
  );

  // Main search handler (from form)
  const handleSearch = useCallback(() => {
    // Combine keywords with any pending input
    const allKeywords = inputValue.trim()
      ? [...keywords, inputValue.trim().toLowerCase()]
      : keywords;

    if (allKeywords.length === 0) {
      toast("Please add at least one keyword", "error");
      return;
    }

    // Clear form state
    setKeywords([]);
    setInputValue("");
    
    executeSearch(allKeywords, database);
  }, [keywords, inputValue, database, executeSearch, toast]);

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  // Handle auth success - retry pending request
  const handleAuthSuccess = useCallback(() => {
    if (pendingRequestRef.current) {
      const { keyword: kw, database: db } = pendingRequestRef.current;
      pendingRequestRef.current = null;
      setTimeout(() => {
        executeSearch([kw], db);
      }, 500);
    }
  }, [executeSearch]);

  // Handle clicking a related keyword (drill down from results)
  const handleKeywordClick = useCallback(
    (kw: string) => {
      setKeywords([]);
      setInputValue("");
      executeSearch([kw], database);
    },
    [database, executeSearch]
  );

  // Navigate back in history
  const handleHistoryClick = useCallback(
    (index: number) => {
      const historyEntry = searchHistory[index];
      if (historyEntry) {
        setSearchHistory(prev => prev.slice(0, index + 1));
        // Re-fetch data for these keywords
        resetResults();
        setError(null);
        setSearchedKeywords(historyEntry);
        fetchRelatedKeywords(historyEntry, database);
        fetchRankings(historyEntry[0], database);
        fetchTrends(historyEntry[0], database);
      }
    },
    [searchHistory, database, resetResults, fetchRelatedKeywords, fetchRankings, fetchTrends]
  );

  // Go back one step
  const handleGoBack = useCallback(() => {
    if (searchHistory.length > 1) {
      handleHistoryClick(searchHistory.length - 2);
    }
  }, [searchHistory, handleHistoryClick]);

  // Clear all history and start fresh
  const handleClearHistory = useCallback(() => {
    setSearchHistory([]);
    resetResults();
    setInputValue("");
  }, [resetResults]);

  const isLoading = loadingKeywords || loadingRankings || loadingTrends || polling;
  const hasResults = relatedKeywords.length > 0 || rankings.length > 0;
  const canGoBack = searchHistory.length > 1;

  return (
    <div className={s.container}>
      {/* Search Form */}
      <form onSubmit={handleSubmit} className={s.searchForm}>
        {/* Input Row */}
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
              onKeyDown={handleInputKeyDown}
              placeholder={keywords.length > 0 ? "Add another keyword..." : "Enter keywords to research..."}
              className={s.searchInputField}
              disabled={isLoading}
            />
          </div>
          <select
            value={database}
            onChange={(e) => setDatabase(e.target.value)}
            className={s.databaseSelect}
            disabled={isLoading}
          >
            {DATABASE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className={s.searchButton}
            disabled={isLoading || (keywords.length === 0 && !inputValue.trim())}
          >
            {isLoading ? (
              <span className={s.spinner} />
            ) : (
              "Search"
            )}
          </button>
        </div>

        {/* Helper text when no keywords */}
        {keywords.length === 0 && (
          <p className={s.searchFormHint}>
            Enter keywords and press Enter to add them, then click Search
          </p>
        )}
      </form>

      {/* Keyword List Box */}
      {keywords.length > 0 && (
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
                <button
                  type="button"
                  className={s.keywordListRemove}
                  onClick={() => removeKeyword(kw)}
                  aria-label={`Remove ${kw}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Search History / Breadcrumbs */}
      {searchHistory.length > 0 && (
        <div className={s.searchHistoryBar}>
          <div className={s.searchHistoryNav}>
            {canGoBack && (
              <button
                type="button"
                className={s.backButton}
                onClick={handleGoBack}
                aria-label="Go back to previous search"
              >
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
                      <button
                        type="button"
                        className={s.breadcrumbLink}
                        onClick={() => handleHistoryClick(index)}
                        title={kws.join(", ")}
                      >
                        {label}
                      </button>
                    )}
                  </span>
                );
              })}
            </nav>
          </div>
          {searchHistory.length > 1 && (
            <button
              type="button"
              className={s.clearHistoryButton}
              onClick={handleClearHistory}
              aria-label="Clear search history"
            >
              Clear
            </button>
          )}
        </div>
      )}


      {/* Error state */}
      {error && (
        <div className={s.errorCard}>
          <h3>{error.title}</h3>
          <p>{error.message}</p>
          <button onClick={handleSearch} className={s.retryButton}>
            Try again
          </button>
        </div>
      )}

      {/* Results area */}
      {(hasResults || isLoading) && !error && (
        <ResearchTab
          keyword={searchedKeywords[0] || currentSearch[0] || ""}
          relatedKeywords={relatedKeywords}
          rankings={rankings}
          trends={trends}
          loadingKeywords={loadingKeywords}
          loadingRankings={loadingRankings}
          loadingTrends={loadingTrends}
          onKeywordClick={handleKeywordClick}
          onSignInClick={() => setShowAuthModal(true)}
        />
      )}

      {/* Empty state */}
      {!hasResults && !isLoading && !error && searchHistory.length === 0 && (
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
            <button
              type="button"
              className={s.emptyStateHint}
              onClick={() => addKeyword("youtube shorts")}
            >
              youtube shorts
            </button>
            <button
              type="button"
              className={s.emptyStateHint}
              onClick={() => addKeyword("gaming setup")}
            >
              gaming setup
            </button>
            <button
              type="button"
              className={s.emptyStateHint}
              onClick={() => addKeyword("how to edit videos")}
            >
              how to edit videos
            </button>
          </div>
        </div>
      )}

      {/* Paywall */}
      {showPaywall && (
        <div className={s.paywallOverlay} onClick={() => setShowPaywall(false)}>
          <div className={s.paywallCard} onClick={(e) => e.stopPropagation()}>
            <button
              className={s.paywallClose}
              onClick={() => setShowPaywall(false)}
              type="button"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <div className={s.paywallIcon}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3>Unlock Unlimited Research</h3>
            <p>You&apos;ve used your free searches for today. Upgrade to Pro for unlimited keyword research and more.</p>
            <div className={s.paywallFeatures}>
              <div className={s.paywallFeature}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span>Unlimited keyword searches</span>
              </div>
              <div className={s.paywallFeature}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span>200 AI video ideas per day</span>
              </div>
              <div className={s.paywallFeature}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                <span>Full channel analytics &amp; competitor tracking</span>
              </div>
            </div>
            <a href="/api/integrations/stripe/checkout" className={s.upgradeButton}>
              Upgrade to Pro — {formatUsd(SUBSCRIPTION.PRO_MONTHLY_PRICE_USD)}/{SUBSCRIPTION.PRO_INTERVAL}
            </a>
            <button className={s.dismissButton} onClick={() => setShowPaywall(false)}>
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        title="Sign in to search"
        description="Create a free account to search keywords and get video ideas."
      />
    </div>
  );
}

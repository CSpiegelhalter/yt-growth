"use client";

import { useCallback, useEffect,useRef, useState } from "react";
import { z } from "zod";

import { AuthModal } from "@/components/auth";
import { useToast } from "@/components/ui/Toast";
import { apiFetchJson, isApiClientError } from "@/lib/client/api";
import { formatUsd,SUBSCRIPTION } from "@/lib/shared/product";

import { ResearchTab } from "./components/ResearchTab";
import s from "./keywords.module.css";
import type { GoogleTrendsData,RelatedKeyword, YouTubeRanking } from "./types";

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
  } catch (error) {
    console.warn("Failed to parse related keyword:", error);
    return null;
  }
}

/**
 * Safely parse YouTube ranking video from API response.
 */
function parseYouTubeRanking(data: unknown): YouTubeRanking | null {
  try {
    return YouTubeRankingResponseSchema.parse(data);
  } catch (error) {
    console.warn("Failed to parse YouTube ranking:", error);
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

function KeywordSearchForm({
  inputRef, inputValue, setInputValue, keywords, database, setDatabase,
  isLoading, onSubmit, onKeyDown, onRemoveKeyword,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  inputValue: string;
  setInputValue: (v: string) => void;
  keywords: string[];
  database: string;
  setDatabase: (v: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onRemoveKeyword: (kw: string) => void;
}) {
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
            {DATABASE_OPTIONS.map((opt) => (
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

function SearchHistoryBar({
  searchHistory, canGoBack, onGoBack, onHistoryClick, onClearHistory,
}: {
  searchHistory: string[][];
  canGoBack: boolean;
  onGoBack: () => void;
  onHistoryClick: (index: number) => void;
  onClearHistory: () => void;
}) {
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

function KeywordEmptyState({ onAddKeyword }: { onAddKeyword: (kw: string) => void }) {
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
        {["youtube shorts", "gaming setup", "how to edit videos"].map((kw) => (
          <button key={kw} type="button" className={s.emptyStateHint} onClick={() => onAddKeyword(kw)}>
            {kw}
          </button>
        ))}
      </div>
    </div>
  );
}

function KeywordPaywall({ onClose }: { onClose: () => void }) {
  return (
    <div className={s.paywallOverlay} onClick={onClose}>
      <div className={s.paywallCard} onClick={(e) => e.stopPropagation()}>
        <button className={s.paywallClose} onClick={onClose} type="button" aria-label="Close">
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
          {["Unlimited keyword searches", "200 AI video ideas per day", "Full channel analytics & competitor tracking"].map((feat) => (
            <div key={feat} className={s.paywallFeature}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>{feat}</span>
            </div>
          ))}
        </div>
        <a href="/api/integrations/stripe/checkout" className={s.upgradeButton}>
          Upgrade to Pro — {formatUsd(SUBSCRIPTION.PRO_MONTHLY_PRICE_USD)}/{SUBSCRIPTION.PRO_INTERVAL}
        </a>
        <button className={s.dismissButton} onClick={onClose}>Maybe later</button>
      </div>
    </div>
  );
}

function useKeywordSearch(toast: ReturnType<typeof useToast>["toast"]) {
  const [loadingKeywords, setLoadingKeywords] = useState(false);
  const [loadingRankings, setLoadingRankings] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [polling, setPolling] = useState(false);

  const [relatedKeywords, setRelatedKeywords] = useState<RelatedKeyword[]>([]);
  const [rankings, setRankings] = useState<YouTubeRanking[]>([]);
  const [trends, setTrends] = useState<GoogleTrendsData | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);

  const pendingRequestRef = useRef<{ keyword: string; database: string } | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollAttemptsRef = useRef(0);
  const trendsPollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const trendsPollAttemptsRef = useRef(0);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); }
      if (trendsPollIntervalRef.current) { clearInterval(trendsPollIntervalRef.current); }
    };
  }, []);

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

  const stopKeywordPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    pollAttemptsRef.current = 0;
  }, []);

  const stopTrendsPolling = useCallback(() => {
    if (trendsPollIntervalRef.current) {
      clearInterval(trendsPollIntervalRef.current);
      trendsPollIntervalRef.current = null;
    }
    trendsPollAttemptsRef.current = 0;
  }, []);

  const applyTrendsData = useCallback((data: unknown) => {
    const parsed = GoogleTrendsResponseSchema.safeParse(data);
    if (parsed.success) { setTrends(parsed.data); }
  }, []);

  const pollForResults = useCallback(
    async (taskId: string) => {
      pollAttemptsRef.current++;
      if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
        stopKeywordPolling();
        setPolling(false);
        setLoadingKeywords(false);
        setError({ title: "Request timeout", message: "The search is taking longer than expected. Please try again." });
        return;
      }
      try {
        const data = await apiFetchJson<KeywordTaskResponse>(`/api/keywords/task/${taskId}`);
        if (data.pending) { return; }
        stopKeywordPolling();
        setPolling(false);
        setLoadingKeywords(false);
        applyParsedRows(data);
      } catch (error_) {
        console.error("Poll error:", error_);
      }
    },
    [stopKeywordPolling, applyParsedRows],
  );

  const handleFetchKeywordsError = useCallback((err: unknown) => {
    setLoadingKeywords(false);
    if (!isApiClientError(err)) {
      setError({ title: "Search failed", message: "An unexpected error occurred" });
      return;
    }
    if (err.code === "LIMIT_REACHED") {
      setShowPaywall(true);
      toast("You've reached your daily search limit", "info");
      return;
    }
    if (err.status === 503) {
      setError({ title: "Service temporarily unavailable", message: "The keyword research service is temporarily unavailable. Please try again in a few minutes." });
      return;
    }
    setError({ title: "Search failed", message: err.message });
  }, [toast]);

  const fetchRelatedKeywords = useCallback(
    async (kws: string | string[], db: string) => {
      const kwArr = Array.isArray(kws) ? kws : [kws];
      setLoadingKeywords(true);
      try {
        const data = await apiFetchJson<KeywordResearchResponse>("/api/keywords/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "related", phrases: kwArr, database: db }),
        });
        if (data.needsAuth) {
          pendingRequestRef.current = { keyword: kwArr[0], database: db };
          setShowAuthModal(true);
          setLoadingKeywords(false);
          return;
        }
        if (data.pending && data.taskId) {
          setPolling(true);
          pollAttemptsRef.current = 0;
          pollIntervalRef.current = setInterval(() => { void pollForResults(data.taskId!); }, POLL_INTERVAL_MS);
          return;
        }
        setLoadingKeywords(false);
        applyParsedRows(data);
      } catch (error_) {
        handleFetchKeywordsError(error_);
      }
    },
    [pollForResults, applyParsedRows, handleFetchKeywordsError],
  );

  const pollForTrendsResults = useCallback(
    async (taskId: string) => {
      trendsPollAttemptsRef.current++;
      if (trendsPollAttemptsRef.current >= TRENDS_MAX_POLL_ATTEMPTS) {
        stopTrendsPolling();
        setLoadingTrends(false);
        return;
      }
      try {
        const data = await apiFetchJson<KeywordTaskResponse>(`/api/keywords/task/${taskId}`);
        if (data.pending) { return; }
        stopTrendsPolling();
        setLoadingTrends(false);
        applyTrendsData(data);
      } catch (error_) {
        if (process.env.NODE_ENV === "development") { console.warn("Trends poll error:", error_); }
      }
    },
    [stopTrendsPolling, applyTrendsData],
  );

  const fetchTrends = useCallback(async (kw: string, db: string) => {
    setLoadingTrends(true);
    stopTrendsPolling();
    try {
      const data = await apiFetchJson<KeywordTrendsResponse>("/api/keywords/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: kw, database: db }),
      });
      if (data.pending && data.taskId) {
        trendsPollIntervalRef.current = setInterval(() => { void pollForTrendsResults(data.taskId!); }, TRENDS_POLL_INTERVAL_MS);
        return;
      }
      setLoadingTrends(false);
      applyTrendsData(data);
    } catch (error_) {
      setLoadingTrends(false);
      if (process.env.NODE_ENV === "development") { console.warn("Trends fetch error:", error_); }
    }
  }, [pollForTrendsResults, stopTrendsPolling, applyTrendsData]);

  const fetchRankings = useCallback(async (kw: string, db: string) => {
    setLoadingRankings(true);
    try {
      const data = await apiFetchJson<YoutubeSerpResponse>("/api/keywords/youtube-serp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: kw, location: db, limit: 10 }),
      });
      setLoadingRankings(false);
      if (data.needsAuth) { setRankings([]); return; }
      if (data.results && Array.isArray(data.results)) {
        const results = data.results as unknown[];
        setRankings(results.map((item) => parseYouTubeRanking(item)).filter((item): item is YouTubeRanking => item !== null));
      }
    } catch {
      setLoadingRankings(false);
      setRankings([]);
    }
  }, []);

  const isLoading = loadingKeywords || loadingRankings || loadingTrends || polling;
  const hasResults = relatedKeywords.length > 0 || rankings.length > 0;

  return {
    relatedKeywords, rankings, trends,
    loadingKeywords, loadingRankings, loadingTrends, isLoading, hasResults,
    showAuthModal, setShowAuthModal, showPaywall, setShowPaywall,
    error, setError,
    pendingRequestRef, resetResults,
    fetchRelatedKeywords, fetchRankings, fetchTrends,
  };
}

function handleKeyDown(
  e: React.KeyboardEvent<HTMLInputElement>,
  inputValue: string,
  keywords: string[],
  addKeyword: (kw: string) => void,
  removeKeyword: (kw: string) => void,
  onSearch: () => void,
) {
  if (e.key === "Enter") {
    e.preventDefault();
    if (inputValue.trim()) { addKeyword(inputValue); }
    else if (keywords.length > 0) { onSearch(); }
  } else if (e.key === "," || e.key === "Tab") {
    if (inputValue.trim()) { e.preventDefault(); addKeyword(inputValue); }
  } else if (e.key === "Backspace" && !inputValue && keywords.length > 0) {
    const lastKeyword = keywords.at(-1);
    if (lastKeyword) { removeKeyword(lastKeyword); }
  }
}

export function KeywordResearchClient() {
  const { toast } = useToast();

  const [keywords, setKeywords] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [database, setDatabase] = useState("us");
  const inputRef = useRef<HTMLInputElement>(null);

  const [searchedKeywords, setSearchedKeywords] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[][]>([]);
  const currentSearch = searchHistory.at(-1) || [];

  const {
    relatedKeywords, rankings, trends,
    loadingKeywords, loadingRankings, loadingTrends, isLoading, hasResults,
    showAuthModal, setShowAuthModal, showPaywall, setShowPaywall,
    error, setError,
    pendingRequestRef, resetResults,
    fetchRelatedKeywords, fetchRankings, fetchTrends,
  } = useKeywordSearch(toast);

  const addKeyword = useCallback((kw: string) => {
    const keyword = kw.trim().toLowerCase();
    if (!keyword) {return;}
    if (keywords.includes(keyword)) { toast("Keyword already added", "info"); return; }
    if (keywords.length >= MAX_KEYWORDS) { toast(`Maximum ${MAX_KEYWORDS} keywords allowed`, "info"); return; }
    setKeywords(prev => [...prev, keyword]);
    setInputValue("");
  }, [keywords, toast]);

  const removeKeyword = useCallback((kw: string) => {
    setKeywords(prev => prev.filter(k => k !== kw));
  }, []);

  const executeSearch = useCallback(
    (kws: string[], db: string, addToHistory = true) => {
      if (kws.length === 0) {return;}
      resetResults();
      setError(null);
      setShowPaywall(false);
      setSearchedKeywords(kws);
      if (addToHistory) {
        setSearchHistory(prev => [...prev, kws].slice(-5));
      }
      void fetchRelatedKeywords(kws, db);
      void fetchRankings(kws[0], db);
      void fetchTrends(kws[0], db);
    },
    [resetResults, setError, setShowPaywall, fetchRelatedKeywords, fetchRankings, fetchTrends],
  );

  const handleSearch = useCallback(() => {
    const allKeywords = inputValue.trim()
      ? [...keywords, inputValue.trim().toLowerCase()]
      : keywords;
    if (allKeywords.length === 0) { toast("Please add at least one keyword", "error"); return; }
    setKeywords([]);
    setInputValue("");
    executeSearch(allKeywords, database);
  }, [keywords, inputValue, database, executeSearch, toast]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); handleSearch(); };

  const handleAuthSuccess = useCallback(() => {
    if (pendingRequestRef.current) {
      const { keyword: kw, database: db } = pendingRequestRef.current;
      pendingRequestRef.current = null;
      setTimeout(() => { executeSearch([kw], db); }, 500);
    }
  }, [executeSearch, pendingRequestRef]);

  const handleKeywordClick = useCallback(
    (kw: string) => { setKeywords([]); setInputValue(""); executeSearch([kw], database); },
    [database, executeSearch],
  );

  const handleHistoryClick = useCallback(
    (index: number) => {
      const historyEntry = searchHistory[index];
      if (!historyEntry) {return;}
      setSearchHistory(prev => prev.slice(0, index + 1));
      resetResults();
      setError(null);
      setSearchedKeywords(historyEntry);
      void fetchRelatedKeywords(historyEntry, database);
      void fetchRankings(historyEntry[0], database);
      void fetchTrends(historyEntry[0], database);
    },
    [searchHistory, database, resetResults, setError, fetchRelatedKeywords, fetchRankings, fetchTrends],
  );

  const handleGoBack = useCallback(() => {
    if (searchHistory.length > 1) { handleHistoryClick(searchHistory.length - 2); }
  }, [searchHistory, handleHistoryClick]);

  const handleClearHistory = useCallback(() => {
    setSearchHistory([]);
    resetResults();
    setInputValue("");
  }, [resetResults]);

  const canGoBack = searchHistory.length > 1;

  return (
    <div className={s.container}>
      <KeywordSearchForm
        inputRef={inputRef}
        inputValue={inputValue}
        setInputValue={setInputValue}
        keywords={keywords}
        database={database}
        setDatabase={setDatabase}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        onKeyDown={(e) => handleKeyDown(e, inputValue, keywords, addKeyword, removeKeyword, handleSearch)}
        onRemoveKeyword={removeKeyword}
      />

      {searchHistory.length > 0 && (
        <SearchHistoryBar
          searchHistory={searchHistory}
          canGoBack={canGoBack}
          onGoBack={handleGoBack}
          onHistoryClick={handleHistoryClick}
          onClearHistory={handleClearHistory}
        />
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

      {!hasResults && !isLoading && !error && searchHistory.length === 0 && (
        <KeywordEmptyState onAddKeyword={addKeyword} />
      )}

      {showPaywall && (
        <KeywordPaywall onClose={() => setShowPaywall(false)} />
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

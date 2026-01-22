"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import s from "./style.module.css";
import { useSyncActiveChannelIdToLocalStorage } from "@/lib/use-sync-active-channel";
import type { Me, Channel, CompetitorVideo } from "@/types/api";
import { SUBSCRIPTION, formatUsd } from "@/lib/product";
import CompetitorSearchPanel, { type SearchMode } from "./CompetitorSearchPanel";
import CompetitorFilters, {
  type FilterState,
  DEFAULT_FILTER_STATE,
} from "./CompetitorFilters";
import CompetitorResultsStream from "./CompetitorResultsStream";

type Props = {
  initialMe: Me;
  initialChannels: Channel[];
  initialActiveChannelId: string | null;
};

// ============================================
// SESSION STORAGE STATE MANAGEMENT
// ============================================

const STORAGE_KEY = "competitor-search-state";
const CLICKED_VIDEO_KEY = "competitor-clicked-video";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

type SearchCursor = {
  queryIndex: number;
  pageToken?: string;
  seenIds: string[];
  scannedCount: number;
};

type SavedState = {
  mode: SearchMode;
  nicheText: string;
  referenceVideoUrl: string;
  filters: FilterState;
  videos: CompetitorVideo[];
  nextCursor: SearchCursor | null;
  hasSearched: boolean;
  timestamp: number;
};

function saveState(state: Omit<SavedState, "timestamp">) {
  try {
    const data: SavedState = { ...state, timestamp: Date.now() };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors (quota, private mode, etc.)
  }
}

function loadState(): SavedState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const state = JSON.parse(raw) as SavedState;
    
    // Expire after TTL
    if (Date.now() - state.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return state;
  } catch {
    return null;
  }
}

/** Save the clicked video ID for scroll restoration */
function saveClickedVideo(videoId: string) {
  try {
    sessionStorage.setItem(CLICKED_VIDEO_KEY, videoId);
  } catch {
    // Ignore
  }
}

/** Get and clear the clicked video ID */
function getAndClearClickedVideo(): string | null {
  try {
    const videoId = sessionStorage.getItem(CLICKED_VIDEO_KEY);
    if (videoId) {
      sessionStorage.removeItem(CLICKED_VIDEO_KEY);
    }
    return videoId;
  } catch {
    return null;
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

/**
 * CompetitorsClient - Unified competitor search experience
 *
 * State is preserved in sessionStorage so back button works properly.
 */
export default function CompetitorsClient({
  initialMe,
  initialChannels,
  initialActiveChannelId,
}: Props) {
  const searchParams = useSearchParams();
  const urlChannelId = searchParams.get("channelId");

  // Active channel
  const [channels] = useState<Channel[]>(initialChannels);
  const activeChannelId = urlChannelId ?? initialActiveChannelId ?? null;
  const activeChannel = useMemo(
    () => channels.find((c) => c.channel_id === activeChannelId) ?? null,
    [channels, activeChannelId]
  );

  // Subscription check
  const isSubscribed = useMemo(
    () => initialMe.subscription?.isActive ?? false,
    [initialMe]
  );

  // Default mode based on whether user has a channel
  const defaultMode: SearchMode = activeChannel ? "search_my_niche" : "competitor_search";

  // Initialize all state with server-safe defaults (no sessionStorage access during SSR)
  const [mode, setMode] = useState<SearchMode>(defaultMode);
  const [nicheText, setNicheText] = useState("");
  const [referenceVideoUrl, setReferenceVideoUrl] = useState("");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [filtersCollapsed, setFiltersCollapsed] = useState(true);

  // Search state
  const [hasSearched, setHasSearched] = useState(false);
  const [searchKey, setSearchKey] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cached videos and cursor (populated after hydration)
  const [cachedVideos, setCachedVideos] = useState<CompetitorVideo[] | null>(null);
  const [cachedNextCursor, setCachedNextCursor] = useState<SearchCursor | null>(null);
  const [currentVideos, setCurrentVideos] = useState<CompetitorVideo[]>([]);
  const [currentNextCursor, setCurrentNextCursor] = useState<SearchCursor | null>(null);
  
  // Track whether we've restored from sessionStorage (to avoid saving during restore)
  const hasRestoredRef = useRef(false);
  
  // Track clicked video ID for scroll restoration (passed to results stream)
  const [scrollToVideoId, setScrollToVideoId] = useState<string | null>(null);

  useSyncActiveChannelIdToLocalStorage(activeChannelId);

  // Restore state from sessionStorage AFTER hydration (client-only)
  useEffect(() => {
    const savedState = loadState();
    const clickedVideoId = getAndClearClickedVideo();

    if (savedState) {
      hasRestoredRef.current = true;
      
      // Restore all state
      setMode(savedState.mode);
      setNicheText(savedState.nicheText);
      setReferenceVideoUrl(savedState.referenceVideoUrl);
      setFilters(savedState.filters);
      setHasSearched(savedState.hasSearched);
      setCurrentVideos(savedState.videos);
      setCurrentNextCursor(savedState.nextCursor);
      setCachedVideos(savedState.videos);
      setCachedNextCursor(savedState.nextCursor);
      
      if (savedState.hasSearched) {
        setSearchKey(`restored:${Date.now()}`);
      }

      // Set the video ID to scroll to (CompetitorResultsStream handles the actual scroll)
      if (clickedVideoId && savedState.videos.length > 0) {
        setScrollToVideoId(clickedVideoId);
      }
      
      // Allow saving again after a tick
      setTimeout(() => {
        hasRestoredRef.current = false;
      }, 0);
    }
  }, []); // Only run once on mount

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    // Don't save if no search has happened or we're in the middle of restoring
    if (!hasSearched || hasRestoredRef.current) return;

    saveState({
      mode,
      nicheText,
      referenceVideoUrl,
      filters,
      videos: currentVideos,
      nextCursor: currentNextCursor,
      hasSearched,
    });
  }, [mode, nicheText, referenceVideoUrl, filters, currentVideos, currentNextCursor, hasSearched]);

  // Handle mode change
  const handleModeChange = useCallback((newMode: SearchMode) => {
    setMode(newMode);
    // Don't clear results when switching modes
  }, []);

  // Handle search initiation
  const handleSearch = useCallback(
    (text: string, url: string) => {
      setNicheText(text);
      setReferenceVideoUrl(url);
      setError(null);
      setIsSearching(true);
      setHasSearched(true);
      setCurrentVideos([]); // Clear old results
      setSearchKey(`${mode}:${Date.now()}`);
    },
    [mode]
  );

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      if (hasSearched) {
        setCurrentVideos([]); // Clear old results
        setSearchKey(`${mode}:${Date.now()}`);
      }
    },
    [mode, hasSearched]
  );

  // Handle search complete
  const handleSearchComplete = useCallback(() => {
    setIsSearching(false);
  }, []);

  // Handle results update (for caching)
  const handleResultsUpdate = useCallback((videos: CompetitorVideo[]) => {
    setCurrentVideos(videos);
  }, []);

  // Handle cursor update (for Load More)
  const handleCursorUpdate = useCallback((cursor: SearchCursor | null) => {
    setCurrentNextCursor(cursor);
  }, []);

  // Handle video click (save for scroll restoration)
  const handleVideoClick = useCallback((videoId: string) => {
    saveClickedVideo(videoId);
  }, []);

  // Handle search error
  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setIsSearching(false);
  }, []);

  // Show locked state if subscription is required
  if (!isSubscribed) {
    return (
      <main className={s.page}>
        <div className={s.header}>
          <div>
            <h1 className={s.title}>Competitor Search</h1>
            <p className={s.subtitle}>Find winning videos in any niche</p>
          </div>
        </div>
        <div className={s.lockedState}>
          <div className={s.lockedIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <h2 className={s.lockedTitle}>Unlock Competitor Search</h2>
          <p className={s.lockedDesc}>
            Discover winning videos in any niche. Search by topic, analyze
            competitors' best content, and find proven ideas to remix.
          </p>
          <a href="/api/integrations/stripe/checkout" className={s.lockedBtn}>
            Subscribe to Pro — {formatUsd(SUBSCRIPTION.PRO_MONTHLY_PRICE_USD)}/
            {SUBSCRIPTION.PRO_INTERVAL}
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Competitor Search</h1>
          <p className={s.subtitle}>Find winning videos in any niche or your own</p>
        </div>
      </div>

      {/* Search Panel */}
      <CompetitorSearchPanel
        mode={mode}
        onModeChange={handleModeChange}
        onSearch={handleSearch}
        isSearching={isSearching}
        hasChannel={!!activeChannel}
        initialNicheText={nicheText}
        initialReferenceUrl={referenceVideoUrl}
      />

      {/* Filters */}
      <CompetitorFilters
        filters={filters}
        onChange={handleFiltersChange}
        isCollapsed={filtersCollapsed}
        onToggleCollapse={() => setFiltersCollapsed((prev) => !prev)}
        disabled={isSearching}
      />

      {/* Error Banner */}
      {error && (
        <div className={s.errorBanner}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <p className={s.errorMessage}>{error}</p>
          <button className={s.errorDismiss} onClick={() => setError(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}

      {/* Results Stream */}
      {(searchKey || hasSearched) && (
        <CompetitorResultsStream
          searchKey={searchKey}
          mode={mode}
          nicheText={nicheText}
          referenceVideoUrl={referenceVideoUrl}
          channelId={activeChannelId}
          filters={filters}
          onSearchComplete={handleSearchComplete}
          onResultsUpdate={handleResultsUpdate}
          onCursorUpdate={handleCursorUpdate}
          onVideoClick={handleVideoClick}
          onError={handleError}
          initialVideos={cachedVideos}
          initialNextCursor={cachedNextCursor}
          scrollToVideoId={scrollToVideoId}
        />
      )}

      {/* Initial state - no search yet */}
      {!hasSearched && mode === "competitor_search" && (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <h2 className={s.emptyTitle}>Search Any Niche</h2>
          <p className={s.emptyDesc}>
            Describe a niche or paste a reference video URL to find competitors
            and winning content ideas.
          </p>
        </div>
      )}
    </main>
  );
}

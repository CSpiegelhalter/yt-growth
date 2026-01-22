"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import s from "./style.module.css";
import { useSyncActiveChannelIdToLocalStorage } from "@/lib/use-sync-active-channel";
import type { Me, Channel, CompetitorVideo } from "@/types/api";
import { SUBSCRIPTION, formatUsd } from "@/lib/product";
import ModeToggle, { type TopLevelMode } from "./ModeToggle";
import CompetitorSearchPanel from "./CompetitorSearchPanel";
import NicheDiscoveryPanel from "./NicheDiscoveryPanel";
import CompetitorFilters, {
  type FilterState,
  DEFAULT_FILTER_STATE,
} from "./CompetitorFilters";
import CompetitorResultsStream from "./CompetitorResultsStream";
import type { DiscoveredNiche, DiscoveryFilters } from "./types";
import { DEFAULT_DISCOVERY_FILTERS } from "./types";

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
  topLevelMode: TopLevelMode;
  nicheText: string;
  referenceVideoUrl: string;
  filters: FilterState;
  discoveryFilters: DiscoveryFilters;
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
 * Two top-level modes:
 * - Search: Manual niche search or "Search My Niche"
 * - Discover: Explore trending niches
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

  // Initialize all state with server-safe defaults (Search is default)
  const [topLevelMode, setTopLevelMode] = useState<TopLevelMode>("search");
  const [nicheText, setNicheText] = useState("");
  const [referenceVideoUrl, setReferenceVideoUrl] = useState("");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [discoveryFilters, setDiscoveryFilters] = useState<DiscoveryFilters>(
    DEFAULT_DISCOVERY_FILTERS
  );

  // Search state
  const [hasSearched, setHasSearched] = useState(false);
  const [searchKey, setSearchKey] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<"competitor_search" | "search_my_niche">("competitor_search");

  // Cached videos and cursor (populated after hydration)
  const [cachedVideos, setCachedVideos] = useState<CompetitorVideo[] | null>(null);
  const [cachedNextCursor, setCachedNextCursor] = useState<SearchCursor | null>(null);
  const [currentVideos, setCurrentVideos] = useState<CompetitorVideo[]>([]);
  const [currentNextCursor, setCurrentNextCursor] = useState<SearchCursor | null>(null);
  
  // Track whether we've restored from sessionStorage
  const hasRestoredRef = useRef(false);
  
  // Track clicked video ID for scroll restoration
  const [scrollToVideoId, setScrollToVideoId] = useState<string | null>(null);

  useSyncActiveChannelIdToLocalStorage(activeChannelId);

  // Restore state from sessionStorage AFTER hydration
  useEffect(() => {
    const savedState = loadState();
    const clickedVideoId = getAndClearClickedVideo();

    if (savedState) {
      hasRestoredRef.current = true;
      
      // Restore all state
      setTopLevelMode(savedState.topLevelMode);
      setNicheText(savedState.nicheText);
      setReferenceVideoUrl(savedState.referenceVideoUrl);
      setFilters(savedState.filters);
      setDiscoveryFilters(savedState.discoveryFilters);
      setHasSearched(savedState.hasSearched);
      setCurrentVideos(savedState.videos);
      setCurrentNextCursor(savedState.nextCursor);
      setCachedVideos(savedState.videos);
      setCachedNextCursor(savedState.nextCursor);
      
      if (savedState.hasSearched) {
        setSearchKey(`restored:${Date.now()}`);
      }

      // Set scroll target
      if (clickedVideoId && savedState.videos.length > 0) {
        setScrollToVideoId(clickedVideoId);
      }
      
      // Allow saving again after a tick
      setTimeout(() => {
        hasRestoredRef.current = false;
      }, 0);
    }
  }, []);

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    if (!hasSearched || hasRestoredRef.current) return;

    saveState({
      topLevelMode,
      nicheText,
      referenceVideoUrl,
      filters,
      discoveryFilters,
      videos: currentVideos,
      nextCursor: currentNextCursor,
      hasSearched,
    });
  }, [topLevelMode, nicheText, referenceVideoUrl, filters, discoveryFilters, currentVideos, currentNextCursor, hasSearched]);

  // Handle top-level mode change
  const handleModeChange = useCallback((newMode: TopLevelMode) => {
    setTopLevelMode(newMode);
    // Don't clear results when switching modes - allows returning to see previous results
  }, []);

  // Handle search initiation (manual niche)
  const handleSearch = useCallback(
    (text: string, url: string) => {
      setNicheText(text);
      setReferenceVideoUrl(url);
      setSearchMode("competitor_search");
      setError(null);
      setIsSearching(true);
      setHasSearched(true);
      setCurrentVideos([]);
      setSearchKey(`competitor_search:${Date.now()}`);
    },
    []
  );

  // Handle "Search My Niche" shortcut
  const handleSearchMyNiche = useCallback(() => {
    setSearchMode("search_my_niche");
    setError(null);
    setIsSearching(true);
    setHasSearched(true);
    setCurrentVideos([]);
    setSearchKey(`search_my_niche:${Date.now()}`);
  }, []);

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      if (hasSearched) {
        setCurrentVideos([]);
        setSearchKey(`${searchMode}:${Date.now()}`);
      }
    },
    [searchMode, hasSearched]
  );

  // Handle search complete
  const handleSearchComplete = useCallback(() => {
    setIsSearching(false);
  }, []);

  // Handle results update (for caching)
  const handleResultsUpdate = useCallback((videos: CompetitorVideo[]) => {
    setCurrentVideos(videos);
  }, []);

  // Handle cursor update
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

  // Handle "Search this niche" from discovery
  const handleSearchDiscoveredNiche = useCallback((niche: DiscoveredNiche) => {
    setTopLevelMode("search");
    setNicheText(niche.nicheLabel);
    setReferenceVideoUrl("");
    setSearchMode("competitor_search");
    setError(null);
    setIsSearching(true);
    setHasSearched(true);
    setCurrentVideos([]);
    setSearchKey(`competitor_search:${Date.now()}`);
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
      {/* Header - appears once */}
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Competitor Search</h1>
          <p className={s.subtitle}>Find winning videos in any niche or discover trending opportunities</p>
        </div>
      </div>

      {/* Mode Toggle: Search | Discover */}
      <ModeToggle mode={topLevelMode} onModeChange={handleModeChange} />

      {/* Search Mode */}
      {topLevelMode === "search" && (
        <>
          <CompetitorSearchPanel
            mode={topLevelMode}
            onSearch={handleSearch}
            onSearchMyNiche={handleSearchMyNiche}
            isSearching={isSearching}
            hasChannel={!!activeChannel}
            initialNicheText={nicheText}
            initialReferenceUrl={referenceVideoUrl}
          />

          {/* Filters - only show after first search */}
          {hasSearched && (
            <CompetitorFilters
              filters={filters}
              onChange={handleFiltersChange}
              disabled={isSearching}
            />
          )}

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
              mode={searchMode}
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
          {!hasSearched && (
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
        </>
      )}

      {/* Discover Mode */}
      {topLevelMode === "discover" && (
        <NicheDiscoveryPanel
          onSearchNiche={handleSearchDiscoveredNiche}
          initialFilters={discoveryFilters}
        />
      )}
    </main>
  );
}

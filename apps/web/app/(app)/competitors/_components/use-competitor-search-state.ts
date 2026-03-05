"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useSessionStorage } from "@/lib/hooks/use-session-storage";
import type { CompetitorVideo } from "@/types/api";

import { DEFAULT_FILTER_STATE, type FilterState } from "./CompetitorFilters";

export type SearchCursor = {
  queryIndex: number;
  pageToken?: string;
  seenIds: string[];
  scannedCount: number;
};

type SavedSearchState = {
  nicheText: string;
  referenceVideoUrl: string;
  filters: FilterState;
  videos: CompetitorVideo[];
  nextCursor: SearchCursor | null;
  hasSearched: boolean;
};

const DEFAULT_SAVED: SavedSearchState = {
  nicheText: "",
  referenceVideoUrl: "",
  filters: DEFAULT_FILTER_STATE,
  videos: [],
  nextCursor: null,
  hasSearched: false,
};

type SearchMode = "competitor_search" | "search_my_niche";

export function useCompetitorSearchState({ urlNiche }: { urlNiche: string | null }) {
  const {
    value: saved, setValue: setSaved, isHydrated,
  } = useSessionStorage<SavedSearchState>({
    key: "competitor-search-state",
    defaultValue: DEFAULT_SAVED,
    ttl: 30 * 60 * 1000,
  });

  const {
    value: clickedVideoId, setValue: setClickedVideoId,
    isHydrated: isClickedHydrated, clear: clearClickedVideo,
  } = useSessionStorage<string | null>({
    key: "competitor-clicked-video",
    defaultValue: null,
  });

  const [searchKey, setSearchKey] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<SearchMode>("competitor_search");
  const [cachedVideos, setCachedVideos] = useState<CompetitorVideo[] | null>(null);
  const [cachedNextCursor, setCachedNextCursor] = useState<SearchCursor | null>(null);
  const [scrollToVideoId, setScrollToVideoId] = useState<string | null>(null);
  const hasRestoredRef = useRef(false);

  function startSearch(mode: SearchMode) {
    setSearchMode(mode);
    setError(null);
    setIsSearching(true);
    setSearchKey(`${mode}:${Date.now()}`);
  }

  // Handle URL niche parameter (from trending "Search this niche" action)
  useEffect(() => {
    if (!urlNiche || hasRestoredRef.current) {return;}
    setSaved((prev) => ({ ...prev, nicheText: urlNiche, hasSearched: true, videos: [] }));
    startSearch("competitor_search");
  }, [urlNiche, setSaved]);

  // Restore from sessionStorage after hydration
  useEffect(() => {
    if (!isHydrated || !isClickedHydrated || hasRestoredRef.current) {return;}
    if (urlNiche) {return;}
    hasRestoredRef.current = true;
    if (!saved.hasSearched) {return;}

    setCachedVideos(saved.videos);
    setCachedNextCursor(saved.nextCursor);
    setSearchKey(`restored:${Date.now()}`);
    if (clickedVideoId && saved.videos.length > 0) {setScrollToVideoId(clickedVideoId);}
    clearClickedVideo();
  }, [isHydrated, isClickedHydrated, urlNiche, saved, clickedVideoId, clearClickedVideo]);

  return {
    nicheText: saved.nicheText,
    referenceVideoUrl: saved.referenceVideoUrl,
    filters: saved.filters,
    hasSearched: saved.hasSearched,
    searchKey,
    isSearching,
    error,
    searchMode,
    cachedVideos,
    cachedNextCursor,
    scrollToVideoId,

    handleSearch(text: string, url: string) {
      setSaved((prev) => ({
        ...prev, nicheText: text, referenceVideoUrl: url,
        hasSearched: true, videos: [], nextCursor: null,
      }));
      startSearch("competitor_search");
    },

    handleSearchMyNiche() {
      setSaved((prev) => ({ ...prev, hasSearched: true, videos: [], nextCursor: null }));
      startSearch("search_my_niche");
    },

    handleFiltersChange(newFilters: FilterState) {
      const shouldRetrigger = saved.hasSearched;
      setSaved((prev) => ({ ...prev, filters: newFilters, videos: [] }));
      if (shouldRetrigger) { setSearchKey(`${searchMode}:${Date.now()}`); }
    },

    handleSearchComplete: useCallback(() => setIsSearching(false), []),
    handleResultsUpdate: useCallback((videos: CompetitorVideo[]) => setSaved((p) => ({ ...p, videos })), [setSaved]),
    handleCursorUpdate: useCallback((cursor: SearchCursor | null) => setSaved((p) => ({ ...p, nextCursor: cursor })), [setSaved]),
    handleVideoClick: (videoId: string) => setClickedVideoId(videoId),
    handleError(msg: string) { setError(msg); setIsSearching(false); },
    dismissError: () => setError(null),
  };
}

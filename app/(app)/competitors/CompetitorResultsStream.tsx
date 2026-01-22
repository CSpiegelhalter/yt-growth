"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import CompetitorVideoCard from "./CompetitorVideoCard";
import s from "./style.module.css";
import type { CompetitorVideo } from "@/types/api";

// Types matching the server's SearchEvent types
type SearchStatusEvent = {
  type: "status";
  status: "searching" | "filtering" | "refilling" | "done";
  message: string;
  scannedCount: number;
  matchedCount: number;
};

type SearchItemsEvent = {
  type: "items";
  items: Array<{
    videoId: string;
    title: string;
    channelId: string;
    channelTitle: string;
    channelThumbnailUrl: string | null;
    thumbnailUrl: string | null;
    publishedAt: string;
    durationSec?: number;
    stats: {
      viewCount: number;
      likeCount?: number;
      commentCount?: number;
    };
    derived: {
      viewsPerDay: number;
      daysSincePublished: number;
      velocity24h?: number;
      velocity7d?: number;
      engagementPerView?: number;
    };
  }>;
  totalMatched: number;
};

type SearchCursor = {
  queryIndex: number;
  pageToken?: string;
  seenIds: string[];
  scannedCount: number;
};

type SearchDoneEvent = {
  type: "done";
  summary: {
    scannedCount: number;
    returnedCount: number;
    cacheHit: boolean;
    timeMs: number;
    exhausted: boolean;
  };
  nextCursor?: SearchCursor;
};

type SearchErrorEvent = {
  type: "error";
  error: string;
  code?: string;
  partial?: boolean;
};

type SearchEvent =
  | SearchStatusEvent
  | SearchItemsEvent
  | SearchDoneEvent
  | SearchErrorEvent;

type StreamState = "idle" | "loading" | "streaming" | "done" | "error";

type Props = {
  searchKey: string | null; // Changes trigger new search
  mode: "competitor_search" | "search_my_niche";
  nicheText: string;
  referenceVideoUrl: string;
  channelId: string | null;
  filters: {
    contentType: "shorts" | "long" | "both";
    dateRange: "7d" | "30d" | "90d" | "365d";
    minViewsPerDay: number;
    sortBy: "viewsPerDay" | "totalViews" | "newest" | "engagement";
  };
  onSearchComplete: () => void;
  onResultsUpdate?: (videos: CompetitorVideo[]) => void;
  onCursorUpdate?: (cursor: SearchCursor | null) => void;
  onVideoClick?: (videoId: string) => void;
  onError: (error: string) => void;
  /** Initial videos from cache (for back button restoration) */
  initialVideos?: CompetitorVideo[] | null;
  /** Initial cursor from cache (for Load More restoration) */
  initialNextCursor?: SearchCursor | null;
  /** Video ID to scroll to after restoration */
  scrollToVideoId?: string | null;
};

/**
 * CompetitorResultsStream - Streaming results reader
 *
 * Handles:
 * - Initiating search requests
 * - Reading NDJSON stream
 * - Progressive UI updates
 * - Cancellation on filter change
 */
export default function CompetitorResultsStream({
  searchKey,
  mode,
  nicheText,
  referenceVideoUrl,
  channelId,
  filters,
  onSearchComplete,
  onResultsUpdate,
  onCursorUpdate,
  onVideoClick,
  onError,
  initialVideos,
  initialNextCursor,
  scrollToVideoId,
}: Props) {
  // Initialize videos and cursor from cache if available
  const [videos, setVideos] = useState<CompetitorVideo[]>(initialVideos ?? []);
  const [state, setState] = useState<StreamState>(initialVideos?.length ? "done" : "idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [summary, setSummary] = useState<SearchDoneEvent["summary"] | null>(null);
  const [nextCursor, setNextCursor] = useState<SearchCursor | null>(initialNextCursor ?? null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasScrolledRef = useRef(false);
  
  // Track whether we've handled a restoration (to avoid notifying parent of cached data)
  const handledRestorationRef = useRef(false);
  const prevInitialVideosLengthRef = useRef(initialVideos?.length ?? 0);

  // Handle late restoration from cache (when parent loads from sessionStorage after mount)
  useEffect(() => {
    const prevLength = prevInitialVideosLengthRef.current;
    const newLength = initialVideos?.length ?? 0;
    
    // Detect restoration: went from no videos to having videos
    if (newLength > 0 && prevLength === 0 && initialVideos) {
      handledRestorationRef.current = true;
      setVideos(initialVideos);
      setNextCursor(initialNextCursor ?? null);
      setState("done");
      // Create a synthetic summary for restored results
      setSummary({
        scannedCount: initialVideos.length,
        returnedCount: initialVideos.length,
        cacheHit: true,
        timeMs: 0,
        exhausted: !initialNextCursor,
      });
    }
    
    prevInitialVideosLengthRef.current = newLength;
  }, [initialVideos, initialNextCursor]);

  // Dedicated scroll effect - scrolls to the clicked video when we have videos and a scroll target
  useEffect(() => {
    if (!scrollToVideoId || hasScrolledRef.current) return;
    if (videos.length === 0) return;
    
    // Mark as scrolled immediately to prevent re-triggering
    hasScrolledRef.current = true;
    
    // Wait for DOM to fully render the video cards
    const scrollToElement = () => {
      const element = document.getElementById(`video-${scrollToVideoId}`);
      if (element) {
        element.scrollIntoView({ behavior: "instant", block: "center" });
        // Add a visual highlight briefly
        element.style.outline = "2px solid var(--color-primary, #3b82f6)";
        element.style.outlineOffset = "4px";
        setTimeout(() => {
          element.style.outline = "";
          element.style.outlineOffset = "";
        }, 1500);
      } else {
        console.warn(`[Scroll] Could not find element video-${scrollToVideoId}`);
      }
    };
    
    // Use multiple frames to ensure DOM is ready
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToElement();
      });
    });
  }, [scrollToVideoId, videos.length]);

  // Notify parent when videos change (for caching) - skip if it's from restoration
  useEffect(() => {
    // Only notify for fresh search results, not restoration
    if (videos.length > 0 && !handledRestorationRef.current) {
      onResultsUpdate?.(videos);
    }
    // Reset the flag after first notification check
    if (handledRestorationRef.current) {
      handledRestorationRef.current = false;
    }
  }, [videos, onResultsUpdate]);

  // Notify parent when cursor changes (for caching)
  useEffect(() => {
    onCursorUpdate?.(nextCursor);
  }, [nextCursor, onCursorUpdate]);

  // Convert stream items to CompetitorVideo format
  const mapToCompetitorVideo = useCallback(
    (item: SearchItemsEvent["items"][0]): CompetitorVideo => ({
      videoId: item.videoId,
      title: item.title,
      channelId: item.channelId,
      channelTitle: item.channelTitle,
      channelThumbnailUrl: item.channelThumbnailUrl,
      videoUrl: `https://youtube.com/watch?v=${item.videoId}`,
      channelUrl: `https://youtube.com/channel/${item.channelId}`,
      thumbnailUrl: item.thumbnailUrl,
      publishedAt: item.publishedAt,
      durationSec: item.durationSec,
      stats: item.stats,
      derived: {
        viewsPerDay: item.derived.viewsPerDay,
        velocity24h: item.derived.velocity24h,
        velocity7d: item.derived.velocity7d,
        engagementPerView: item.derived.engagementPerView,
        dataStatus: "ready",
      },
    }),
    []
  );

  // Process search events
  const processEvent = useCallback(
    (event: SearchEvent) => {
      switch (event.type) {
        case "status":
          setStatusMessage(event.message);
          if (event.status === "searching" || event.status === "filtering") {
            setState("streaming");
          }
          break;

        case "items":
          setVideos((prev) => {
            const existingIds = new Set(prev.map((v) => v.videoId));
            const newItems = event.items
              .filter((item) => !existingIds.has(item.videoId))
              .map(mapToCompetitorVideo);
            return [...prev, ...newItems];
          });
          break;

        case "done":
          setSummary(event.summary);
          setNextCursor(event.nextCursor ?? null);
          setState("done");
          setStatusMessage("");
          setIsLoadingMore(false);
          onSearchComplete();
          break;

        case "error":
          setState("error");
          onError(event.error);
          if (!event.partial) {
            setVideos([]);
          }
          break;
      }
    },
    [mapToCompetitorVideo, onSearchComplete, onError]
  );

  // Shared function to perform search (initial or load more)
  const performSearch = useCallback(async (
    controller: AbortController,
    cursor?: SearchCursor
  ) => {
    try {
      const body = {
        mode,
        ...(mode === "competitor_search"
          ? { nicheText, referenceVideoUrl }
          : { channelId }),
        filters: {
          contentType: filters.contentType,
          dateRangePreset: filters.dateRange,
          minViewsPerDay: filters.minViewsPerDay,
          sortBy: filters.sortBy,
        },
        ...(cursor ? { cursor } : {}),
      };

      const response = await fetch("/api/competitors/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = typeof errorData.error === 'string' 
          ? errorData.error 
          : typeof errorData.message === 'string'
            ? errorData.message
            : `HTTP ${response.status}`;
        throw new Error(errorMsg);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      // Read NDJSON stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const event = JSON.parse(line) as SearchEvent;
            processEvent(event);
          } catch {
            console.warn("[Stream] Failed to parse event:", line);
          }
        }
      }

      // Process any remaining data
      if (buffer.trim()) {
        try {
          const event = JSON.parse(buffer) as SearchEvent;
          processEvent(event);
        } catch {
          // Ignore incomplete final chunk
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // Request was cancelled, ignore
        return;
      }

      console.error("[Stream] Search error:", err);
      setState("error");
      setIsLoadingMore(false);
      onError(err instanceof Error ? err.message : "Search failed");
    }
  }, [mode, nicheText, referenceVideoUrl, channelId, filters, processEvent, onError]);

  // Handle "Load More" button click
  const handleLoadMore = useCallback(() => {
    if (!nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    setState("streaming");
    setStatusMessage("Loading more results...");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    performSearch(controller, nextCursor);
  }, [nextCursor, isLoadingMore, performSearch]);

  // Perform initial search when searchKey changes
  useEffect(() => {
    if (!searchKey) return;

    // If this is a restoration (searchKey starts with "restored:") AND we have cached data,
    // skip the API call - we'll use the cached data from initialVideos
    if (searchKey.startsWith("restored:") && initialVideos && initialVideos.length > 0) {
      // Mark as complete since we already have cached results
      onSearchComplete();
      return;
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Reset state for new search
    setVideos([]);
    setSummary(null);
    setNextCursor(null);
    setState("loading");
    setStatusMessage("Starting search...");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    performSearch(controller);

    return () => {
      controller.abort();
    };
  }, [searchKey, performSearch, onSearchComplete, initialVideos]);

  // Loading skeleton
  if (state === "loading" && videos.length === 0) {
    return (
      <div className={s.resultsContainer}>
        <div className={s.loadingStatus}>
          <span className={s.spinner} />
          <p>{statusMessage || "Starting search..."}</p>
        </div>
        <div className={s.videoGrid}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={s.videoCardSkeleton}>
              <div className={s.skeletonThumb} />
              <div className={s.skeletonContent}>
                <div className={s.skeletonTitle} />
                <div className={s.skeletonMeta} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Idle state (no search yet)
  if (state === "idle") {
    return null;
  }

  // Error state with no results
  if (state === "error" && videos.length === 0) {
    return (
      <div className={s.emptyVideos}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        <p>
          Something went wrong. Please try again or adjust your search criteria.
        </p>
      </div>
    );
  }

  // No results found
  if (state === "done" && videos.length === 0) {
    return (
      <div className={s.emptyVideos}>
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <p>
          No competitor videos found. Try broadening your filters or adjusting
          your niche description.
        </p>
      </div>
    );
  }

  return (
    <div className={s.resultsContainer}>
      {/* Streaming status */}
      {(state === "streaming" || state === "loading") && statusMessage && (
        <div className={s.streamingStatus}>
          <span className={s.spinnerSmall} />
          <p>{statusMessage}</p>
        </div>
      )}

      {/* Video grid */}
      <div className={s.videoGrid}>
        {videos.map((video) => (
          <div key={video.videoId} id={`video-${video.videoId}`}>
            <CompetitorVideoCard
              video={video}
              channelId={channelId || ""}
              onClick={() => onVideoClick?.(video.videoId)}
            />
          </div>
        ))}
      </div>

      {/* Summary and Load More when done */}
      {state === "done" && summary && (
        <div className={s.searchSummary}>
          <p>
            Found {videos.length} videos
            {summary.cacheHit ? " (cached)" : ` from ${summary.scannedCount} scanned`}
            {summary.exhausted && !nextCursor && videos.length < 24 && (
              <span className={s.exhaustedNote}>
                {" "}· Searched all available sources
              </span>
            )}
          </p>
          
          {/* Load More button */}
          {nextCursor && !summary.exhausted && (
            <button
              onClick={handleLoadMore}
              className={s.loadMoreButton}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <span className={s.spinnerSmall} />
                  Loading...
                </>
              ) : (
                "Load More"
              )}
            </button>
          )}
        </div>
      )}
      
      {/* Loading more indicator (when streaming after Load More) */}
      {isLoadingMore && state === "streaming" && (
        <div className={s.loadingMore}>
          <span className={s.spinnerSmall} />
          <p>{statusMessage || "Loading more results..."}</p>
        </div>
      )}
    </div>
  );
}

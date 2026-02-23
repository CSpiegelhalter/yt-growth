/**
 * Competitor Search Engine
 *
 * Core search + filter + refill engine that:
 * - Fetches videos from YouTube in batches
 * - Applies filters progressively
 * - Refills until target count is met or source is exhausted
 * - Yields events for streaming to client
 * - Handles rate limits, cancellation, and deduplication
 */
import "server-only";

import { fetchVideosStatsBatch,searchNicheVideos } from "@/lib/youtube";
import type { GoogleAccount } from "@/lib/youtube/types";

import type {
  CompetitorSearchFilters,
  CompetitorVideoResult,
  InferredNiche,
  SearchCursor,
  SearchEngineConfig,
  SearchEvent,
} from "./types";
import { DEFAULT_ENGINE_CONFIG,DEFAULT_FILTERS } from "./types";
import {
  calculateDerivedMetrics,
  passesFilters,
  sortVideos,
} from "./utils";

// ============================================
// SEARCH ENGINE HELPERS
// ============================================

const DATE_RANGE_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "365d": 365,
};

function resolvePublishedAfterDays(filters: CompetitorSearchFilters): number {
  const preset = filters.dateRangePreset ?? DEFAULT_FILTERS.dateRangePreset;

  if (preset === "custom" && filters.postedAfter) {
    const days = Math.ceil(
      (Date.now() - new Date(filters.postedAfter).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return Math.max(7, Math.min(365, days));
  }

  return DATE_RANGE_DAYS[preset] ?? 90;
}

function resolveVideoDuration(
  filters: CompetitorSearchFilters,
): "short" | "medium" | "long" | "any" {
  const contentType = filters.contentType ?? DEFAULT_FILTERS.contentType;
  if (contentType === "shorts") {return "short";}
  if (contentType === "long") {return "medium";}
  return "any";
}

function isQuotaError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : "";
  return message.toLowerCase().includes("quota") || message.includes("429");
}

type SearchBatchVideo = {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  publishedAt: string;
};

function processVideoMatch(
  video: SearchBatchVideo,
  statsMap: Map<string, { viewCount?: number; likeCount?: number; commentCount?: number }>,
  filters: CompetitorSearchFilters,
): CompetitorVideoResult | null {
  const stats = statsMap.get(video.videoId);
  const viewCount = stats?.viewCount ?? 0;
  const derived = calculateDerivedMetrics(
    viewCount,
    video.publishedAt,
    stats?.likeCount,
    stats?.commentCount,
  );

  const videoData = {
    publishedAt: video.publishedAt,
    durationSec: undefined as number | undefined,
    viewCount,
    derived,
  };

  if (!passesFilters(videoData, filters)) {
    return null;
  }

  return {
    videoId: video.videoId,
    title: video.title,
    channelId: video.channelId,
    channelTitle: video.channelTitle,
    channelThumbnailUrl: null,
    thumbnailUrl: video.thumbnailUrl,
    publishedAt: video.publishedAt,
    stats: {
      viewCount,
      likeCount: stats?.likeCount,
      commentCount: stats?.commentCount,
    },
    derived,
  };
}

// ============================================
// SEARCH ENGINE
// ============================================

type SearchState = {
  seenVideoIds: Set<string>;
  matchedVideos: CompetitorVideoResult[];
  scannedCount: number;
  currentQueryIndex: number;
  currentPageToken: string | undefined;
  pagesFetched: number;
};

function initSearchState(cursor?: SearchCursor): SearchState {
  return {
    seenVideoIds: new Set<string>(cursor?.seenIds),
    matchedVideos: [],
    scannedCount: cursor?.scannedCount ?? 0,
    currentQueryIndex: cursor?.queryIndex ?? 0,
    currentPageToken: cursor?.pageToken,
    pagesFetched: 0,
  };
}

function shouldContinueSearch(
  state: SearchState,
  targetResults: number,
  config: SearchEngineConfig,
  queryCount: number,
): boolean {
  return (
    state.matchedVideos.length < targetResults &&
    state.scannedCount < config.maxCandidatesScanned &&
    state.pagesFetched < config.maxPages &&
    state.currentQueryIndex < queryCount
  );
}

function advanceToNextQuery(state: SearchState): void {
  state.currentQueryIndex++;
  state.currentPageToken = undefined;
}

/**
 * Search for competitor videos with filter and refill loop.
 *
 * This is an AsyncGenerator that yields events for streaming:
 * - status: Progress updates
 * - items: New matching videos found
 * - done: Search completed (includes nextCursor for pagination)
 * - error: Error occurred
 */
async function* searchCompetitors(
  ga: GoogleAccount,
  niche: InferredNiche,
  filters: CompetitorSearchFilters,
  config: SearchEngineConfig = DEFAULT_ENGINE_CONFIG,
  signal?: AbortSignal,
  cursor?: SearchCursor
): AsyncGenerator<SearchEvent, void, unknown> {
  const startTime = Date.now();
  const state = initSearchState(cursor);
  const targetResults = filters.targetResultCount ?? config.targetResults;
  const queries = niche.queryTerms;

  console.log(`[SearchEngine] ====== SEARCH STARTED ======`);
  console.log(`[SearchEngine] Niche: "${niche.niche}", Source: ${niche.source}`);
  console.log(`[SearchEngine] Query terms (${queries.length}):`, queries);
  if (niche.referenceVideo) {
    console.log(`[SearchEngine] Reference video: "${niche.referenceVideo.title}" by ${niche.referenceVideo.channelTitle}`);
  }

  if (queries.length === 0) {
    yield { type: "error", error: "No search queries available for this niche", code: "NO_QUERIES" };
    return;
  }

  const publishedAfterDays = resolvePublishedAfterDays(filters);
  const videoDuration = resolveVideoDuration(filters);

  yield {
    type: "status",
    status: "searching",
    message: `Searching for "${niche.niche}" videos...`,
    scannedCount: 0,
    matchedCount: 0,
  };

  while (shouldContinueSearch(state, targetResults, config, queries.length)) {
    if (signal?.aborted) {
      yield { type: "error", error: "Search cancelled", code: "CANCELLED", partial: state.matchedVideos.length > 0 };
      return;
    }

    const currentQuery = queries[state.currentQueryIndex];
    console.log(`[SearchEngine] YouTube Search: query="${currentQuery}", page=${state.pagesFetched + 1}, pageToken=${state.currentPageToken || 'initial'}`);

    try {
      const batchEvents = await processSearchBatch(
        ga, currentQuery, state, filters, config, videoDuration, publishedAfterDays, targetResults,
      );
      for (const event of batchEvents) {yield event;}
    } catch (error) {
      if (isQuotaError(error)) {
        yield { type: "error", error: "YouTube API quota exceeded. Please try again later.", code: "QUOTA_EXCEEDED", partial: state.matchedVideos.length > 0 };
        return;
      }
      console.error("[SearchEngine] Batch error:", error);
      advanceToNextQuery(state);
    }
  }

  yield* emitSearchCompletion(state, filters, queries, config, startTime);
}

async function processSearchBatch(
  ga: GoogleAccount,
  query: string,
  state: SearchState,
  filters: CompetitorSearchFilters,
  config: SearchEngineConfig,
  videoDuration: "short" | "medium" | "long" | "any",
  publishedAfterDays: number,
  targetResults: number,
): Promise<SearchEvent[]> {
  const searchResult = await searchNicheVideos(
    ga, query, config.batchSize, state.currentPageToken, videoDuration, publishedAfterDays,
  );

  state.pagesFetched++;
  const videos = searchResult.videos;
  state.currentPageToken = searchResult.nextPageToken;

  if (videos.length === 0) {
    advanceToNextQuery(state);
    return [];
  }

  const newVideoIds = videos.map((v) => v.videoId).filter((id) => !state.seenVideoIds.has(id));

  if (newVideoIds.length === 0) {
    if (!state.currentPageToken) {advanceToNextQuery(state);}
    return [];
  }

  const statsMap = await fetchVideosStatsBatch(ga, newVideoIds);
  const newMatches: CompetitorVideoResult[] = [];

  for (const video of videos) {
    if (state.seenVideoIds.has(video.videoId)) {continue;}
    state.seenVideoIds.add(video.videoId);
    state.scannedCount++;

    const result = processVideoMatch(video, statsMap, filters);
    if (!result) {continue;}

    newMatches.push(result);
    state.matchedVideos.push(result);

    if (state.matchedVideos.length >= targetResults) {break;}
  }

  if (!state.currentPageToken) {advanceToNextQuery(state);}

  if (newMatches.length === 0) {return [];}

  return [
    { type: "items", items: newMatches, totalMatched: state.matchedVideos.length },
    {
      type: "status",
      status: "filtering",
      message: `Found ${state.matchedVideos.length}/${targetResults} matching videos...`,
      scannedCount: state.scannedCount,
      matchedCount: state.matchedVideos.length,
    },
  ];
}

function* emitSearchCompletion(
  state: SearchState,
  filters: CompetitorSearchFilters,
  queries: string[],
  config: SearchEngineConfig,
  startTime: number,
): Generator<SearchEvent, void, unknown> {
  const exhausted =
    state.currentQueryIndex >= queries.length ||
    state.scannedCount >= config.maxCandidatesScanned ||
    state.pagesFetched >= config.maxPages;

  const sortedResults = sortVideos(
    state.matchedVideos,
    filters.sortBy ?? DEFAULT_FILTERS.sortBy,
  );

  let nextCursor: SearchCursor | undefined;
  if (!exhausted || (state.currentPageToken && state.currentQueryIndex < queries.length)) {
    nextCursor = {
      queryIndex: state.currentQueryIndex,
      pageToken: state.currentPageToken,
      seenIds: [...state.seenVideoIds],
      scannedCount: state.scannedCount,
    };
  }

  console.log(`[SearchEngine] ====== SEARCH COMPLETE ======`);
  console.log(`[SearchEngine] Scanned: ${state.scannedCount}, Matched: ${sortedResults.length}, Exhausted: ${exhausted}`);

  yield {
    type: "done",
    summary: {
      scannedCount: state.scannedCount,
      returnedCount: sortedResults.length,
      cacheHit: false,
      timeMs: Date.now() - startTime,
      exhausted: !nextCursor,
    },
    nextCursor,
  };
}

/**
 * Search with caching layer.
 *
 * Checks cache first, then falls back to live search.
 * Caches results after successful search.
 * 
 * @param cursor - Optional cursor to resume from previous search (skips cache when provided)
 */
export async function* searchCompetitorsWithCache(
  ga: GoogleAccount,
  niche: InferredNiche,
  filters: CompetitorSearchFilters,
  cacheKey: string,
  getCached: () => Promise<{
    results: CompetitorVideoResult[];
    scannedCount: number;
    exhausted: boolean;
  } | null>,
  setCache: (
    results: CompetitorVideoResult[],
    scannedCount: number,
    exhausted: boolean
  ) => Promise<void>,
  config: SearchEngineConfig = DEFAULT_ENGINE_CONFIG,
  signal?: AbortSignal,
  cursor?: SearchCursor
): AsyncGenerator<SearchEvent, void, unknown> {
  const startTime = Date.now();
  const keyPreview = cacheKey.slice(0, 8);
  const isLoadMore = !!cursor;

  console.log(`[SearchEngine] Starting search with cacheKey: ${keyPreview}...${isLoadMore ? ' (LOAD MORE)' : ''}`);

  // Check cache first (but skip if this is a "load more" request)
  if (!isLoadMore) {
    try {
      const cached = await getCached();
      if (cached) {
        // Sort cached results according to current filter
        const sortedResults = sortVideos(cached.results, filters.sortBy);

        yield {
          type: "status",
          status: "done",
          message: "Loaded from cache",
          scannedCount: cached.scannedCount,
          matchedCount: sortedResults.length,
        };

        yield {
          type: "items",
          items: sortedResults,
          totalMatched: sortedResults.length,
        };

        // Build a synthetic cursor for cached results that aren't exhausted
        // This allows Load More to continue from where the cache left off
        const cachedNextCursor: SearchCursor | undefined = !cached.exhausted
          ? {
              queryIndex: 0, // Start from first query
              pageToken: undefined, // No page token, will start fresh
              seenIds: sortedResults.map((v) => v.videoId), // Skip cached videos
              scannedCount: cached.scannedCount,
            }
          : undefined;

        yield {
          type: "done",
          summary: {
            scannedCount: cached.scannedCount,
            returnedCount: sortedResults.length,
            cacheHit: true,
            timeMs: Date.now() - startTime,
            exhausted: cached.exhausted,
          },
          nextCursor: cachedNextCursor,
        };
        return;
      }
    } catch (error) {
      console.warn("[SearchEngine] Cache read error:", error);
      // Continue with live search
    }
  }

  // Live search (with optional cursor for pagination)
  const allResults: CompetitorVideoResult[] = [];
  let finalScannedCount = 0;
  let finalExhausted = false;

  for await (const event of searchCompetitors(ga, niche, filters, config, signal, cursor)) {
    // Collect results for caching
    if (event.type === "items") {
      allResults.push(...event.items);
    } else if (event.type === "done") {
      finalScannedCount = event.summary.scannedCount;
      finalExhausted = event.summary.exhausted;
    }

    yield event;
  }

  // Cache results (fire and forget)
  if (allResults.length > 0) {
    setCache(allResults, finalScannedCount, finalExhausted).catch((error) => {
      console.warn("[SearchEngine] Cache write error:", error);
    });
  }
}

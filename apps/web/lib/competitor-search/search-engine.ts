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

import type {
  CompetitorSearchFilters,
  InferredNiche,
  SearchEvent,
  CompetitorVideoResult,
  SearchEngineConfig,
  SearchCursor,
} from "./types";
import { DEFAULT_FILTERS, DEFAULT_ENGINE_CONFIG } from "./types";
import {
  calculateDerivedMetrics,
  passesFilters,
  sortVideos,
} from "./utils";
import type { GoogleAccount } from "@/lib/youtube/types";
import { searchNicheVideos, fetchVideosStatsBatch } from "@/lib/youtube";

// ============================================
// SEARCH ENGINE
// ============================================

/**
 * Search for competitor videos with filter and refill loop.
 *
 * This is an AsyncGenerator that yields events for streaming:
 * - status: Progress updates
 * - items: New matching videos found
 * - done: Search completed (includes nextCursor for pagination)
 * - error: Error occurred
 *
 * @param ga - Google account for YouTube API
 * @param niche - Inferred niche with query terms
 * @param filters - Search filters to apply
 * @param config - Engine configuration
 * @param signal - AbortSignal for cancellation
 * @param cursor - Optional cursor to resume from previous search
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
  
  // Initialize from cursor or fresh start
  const seenVideoIds = new Set<string>(cursor?.seenIds ?? []);
  const matchedVideos: CompetitorVideoResult[] = [];
  let scannedCount = cursor?.scannedCount ?? 0;
  let currentQueryIndex = cursor?.queryIndex ?? 0;
  let currentPageToken: string | undefined = cursor?.pageToken;
  let exhausted = false;

  const targetResults =
    filters.targetResultCount ?? config.targetResults;
  const queries = niche.queryTerms;

  // Log the niche inference and search queries for debugging
  console.log(`[SearchEngine] ====== SEARCH STARTED ======`);
  console.log(`[SearchEngine] Niche: "${niche.niche}"`);
  console.log(`[SearchEngine] Source: ${niche.source}`);
  console.log(`[SearchEngine] Query terms (${queries.length}):`, queries);
  if (niche.referenceVideo) {
    console.log(`[SearchEngine] Reference video: "${niche.referenceVideo.title}" by ${niche.referenceVideo.channelTitle}`);
  }
  console.log(`[SearchEngine] Target results: ${targetResults}, max pages: ${config.maxPages}`);

  if (queries.length === 0) {
    yield {
      type: "error",
      error: "No search queries available for this niche",
      code: "NO_QUERIES",
    };
    return;
  }

  // Calculate publishedAfter based on date range preset
  const dateRangePreset = filters.dateRangePreset ?? DEFAULT_FILTERS.dateRangePreset;
  let publishedAfterDays = 90;
  switch (dateRangePreset) {
    case "7d":
      publishedAfterDays = 7;
      break;
    case "30d":
      publishedAfterDays = 30;
      break;
    case "90d":
      publishedAfterDays = 90;
      break;
    case "365d":
      publishedAfterDays = 365;
      break;
    case "custom":
      // Calculate from postedAfter if provided
      if (filters.postedAfter) {
        const days = Math.ceil(
          (Date.now() - new Date(filters.postedAfter).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        publishedAfterDays = Math.max(7, Math.min(365, days));
      }
      break;
  }

  // Convert content type filter to YouTube duration filter
  const contentType = filters.contentType ?? DEFAULT_FILTERS.contentType;
  let videoDuration: "short" | "medium" | "long" | "any" = "any";
  if (contentType === "shorts") {
    videoDuration = "short"; // YouTube "short" = under 4 min, but we'll filter more precisely
  } else if (contentType === "long") {
    videoDuration = "medium"; // Start with medium+, filter out shorts later
  }

  yield {
    type: "status",
    status: "searching",
    message: `Searching for "${niche.niche}" videos...`,
    scannedCount: 0,
    matchedCount: 0,
  };

  // Main search loop
  let pagesFetched = 0;

  while (
    matchedVideos.length < targetResults &&
    scannedCount < config.maxCandidatesScanned &&
    pagesFetched < config.maxPages &&
    currentQueryIndex < queries.length
  ) {
    // Check for cancellation
    if (signal?.aborted) {
      yield {
        type: "error",
        error: "Search cancelled",
        code: "CANCELLED",
        partial: matchedVideos.length > 0,
      };
      return;
    }

    const currentQuery = queries[currentQueryIndex];

    // Log each YouTube search query
    console.log(`[SearchEngine] YouTube Search: query="${currentQuery}", page=${pagesFetched + 1}, pageToken=${currentPageToken || 'initial'}`);

    try {
      // Fetch a batch from YouTube
      const searchResult = await searchNicheVideos(
        ga,
        currentQuery,
        config.batchSize,
        currentPageToken,
        videoDuration,
        publishedAfterDays
      );

      pagesFetched++;

      const videos = searchResult.videos;
      currentPageToken = searchResult.nextPageToken;

      if (videos.length === 0) {
        // No more videos from this query, try next query
        currentQueryIndex++;
        currentPageToken = undefined;
        continue;
      }

      // Get stats for videos we haven't seen
      const newVideoIds = videos
        .map((v) => v.videoId)
        .filter((id) => !seenVideoIds.has(id));

      if (newVideoIds.length === 0) {
        // All videos in this batch were duplicates
        if (!currentPageToken) {
          currentQueryIndex++;
          currentPageToken = undefined;
        }
        continue;
      }

      // Fetch stats for new videos
      const statsMap = await fetchVideosStatsBatch(ga, newVideoIds);

      // Process and filter videos
      const newMatches: CompetitorVideoResult[] = [];

      for (const video of videos) {
        if (seenVideoIds.has(video.videoId)) continue;
        seenVideoIds.add(video.videoId);
        scannedCount++;

        const stats = statsMap.get(video.videoId);
        const viewCount = stats?.viewCount ?? 0;

        const derived = calculateDerivedMetrics(
          viewCount,
          video.publishedAt,
          stats?.likeCount,
          stats?.commentCount
        );

        // Apply filters
        const videoData = {
          publishedAt: video.publishedAt,
          durationSec: undefined, // Duration not available from search, will need separate fetch
          viewCount,
          derived,
        };

        if (!passesFilters(videoData, filters)) {
          continue;
        }

        // Build result
        const result: CompetitorVideoResult = {
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

        newMatches.push(result);
        matchedVideos.push(result);

        // Stop if we've reached target
        if (matchedVideos.length >= targetResults) {
          break;
        }
      }

      // Yield new items if we found any
      if (newMatches.length > 0) {
        yield {
          type: "items",
          items: newMatches,
          totalMatched: matchedVideos.length,
        };

        yield {
          type: "status",
          status: "filtering",
          message: `Found ${matchedVideos.length}/${targetResults} matching videos...`,
          scannedCount,
          matchedCount: matchedVideos.length,
        };
      }

      // Move to next query if no more pages
      if (!currentPageToken) {
        currentQueryIndex++;
        currentPageToken = undefined;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed";

      // Check for rate limit
      if (message.toLowerCase().includes("quota") || message.includes("429")) {
        yield {
          type: "error",
          error: "YouTube API quota exceeded. Please try again later.",
          code: "QUOTA_EXCEEDED",
          partial: matchedVideos.length > 0,
        };
        return;
      }

      console.error("[SearchEngine] Batch error:", err);

      // Try next query on error
      currentQueryIndex++;
      currentPageToken = undefined;
    }
  }

  // Check if we exhausted all sources
  exhausted =
    currentQueryIndex >= queries.length ||
    scannedCount >= config.maxCandidatesScanned ||
    pagesFetched >= config.maxPages;

  // Sort final results
  const sortedResults = sortVideos(
    matchedVideos,
    filters.sortBy ?? DEFAULT_FILTERS.sortBy
  );

  // Build next cursor if there's more to fetch
  let nextCursor: SearchCursor | undefined;
  if (!exhausted || (currentPageToken && currentQueryIndex < queries.length)) {
    nextCursor = {
      queryIndex: currentQueryIndex,
      pageToken: currentPageToken,
      seenIds: Array.from(seenVideoIds),
      scannedCount,
    };
  }

  console.log(`[SearchEngine] ====== SEARCH COMPLETE ======`);
  console.log(`[SearchEngine] Scanned: ${scannedCount}, Matched: ${sortedResults.length}, Exhausted: ${exhausted}`);
  if (nextCursor) {
    console.log(`[SearchEngine] Next cursor available: queryIndex=${nextCursor.queryIndex}, seenIds=${nextCursor.seenIds.length}`);
  }

  // Yield final done event
  yield {
    type: "done",
    summary: {
      scannedCount,
      returnedCount: sortedResults.length,
      cacheHit: false,
      timeMs: Date.now() - startTime,
      exhausted: !nextCursor, // Only truly exhausted if no cursor
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
    } catch (err) {
      console.warn("[SearchEngine] Cache read error:", err);
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
    setCache(allResults, finalScannedCount, finalExhausted).catch((err) => {
      console.warn("[SearchEngine] Cache write error:", err);
    });
  }
}

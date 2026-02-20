/**
 * YouTube API - Public Module Interface
 *
 * Orchestrates YouTube Data API and Analytics API operations.
 * This module exports the same function signatures as the original youtube-api.ts
 * to maintain backward compatibility while providing a cleaner internal structure.
 */
import "server-only";

import { CACHE_TTL_MS } from "./constants";
import { getCache, setCache } from "./cache";
import {
  getUploadsPlaylistId,
  listUploadsVideoIds,
  fetchVideosDetailsBatch,
  fetchVideoDetails as fetchVideoDetailsCore,
  fetchVideosStatsBatch as fetchVideosStatsBatchCore,
  searchVideos,
  fetchRecentChannelVideosCore,
  fetchVideoComments as   fetchVideoCommentsCore,
} from "./data-api";
import {
  fetchVideoMetrics as fetchVideoMetricsCore,
  fetchRetentionCurve as fetchRetentionCurveCore,
} from "./analytics-api";
import type {
  GoogleAccount,
  YouTubeVideo,
  VideoDetails,
  VideoMetricsData,
  RetentionPoint,
  SimilarChannelResult,
  RecentVideoResult,
  VideoDurationFilter,
  FetchCommentsResult,
  VideoStats,
} from "./types";

// Re-export account lookup
export { getGoogleAccount } from "./accounts";


// ============================================
// Channel Videos
// ============================================

/**
 * Fetch videos for a channel (last N uploads).
 * Uses uploads playlist (cheap) then videos.list for details.
 */
export async function fetchChannelVideos(
  ga: GoogleAccount,
  channelId: string,
  maxResults: number = 25
): Promise<YouTubeVideo[]> {
  // Get uploads playlist ID
  const uploadsPlaylistId = await getUploadsPlaylistId(ga, channelId);

  // List video IDs from playlist
  const videoIds = await listUploadsVideoIds(ga, uploadsPlaylistId, maxResults);
  if (videoIds.length === 0) return [];

  // Fetch full video details with concurrency-limited batching
  return fetchVideosDetailsBatch(ga, videoIds);
}

// ============================================
// Video Metrics (Analytics)
// ============================================

/**
 * Fetch video metrics from YouTube Analytics API.
 */
export async function fetchVideoMetrics(
  ga: GoogleAccount,
  channelId: string,
  videoIds: string[],
  startDate: string,
  endDate: string
): Promise<VideoMetricsData[]> {
  return fetchVideoMetricsCore(ga, channelId, videoIds, startDate, endDate);
}

/**
 * Fetch retention curve for a video.
 */
export async function fetchRetentionCurve(
  ga: GoogleAccount,
  channelId: string,
  videoId: string
): Promise<RetentionPoint[]> {
  return fetchRetentionCurveCore(ga, channelId, videoId);
}

// ============================================
// Niche Video Search
// ============================================

/**
 * Search for videos matching a niche query and extract unique channels.
 * This is more accurate for niche matching than channel search.
 */
export async function searchNicheVideos(
  ga: GoogleAccount,
  query: string,
  maxVideos: number = 25,
  pageToken?: string,
  videoDuration: VideoDurationFilter = "any",
  publishedAfterDays?: number
): Promise<{
  videos: Array<{
    videoId: string;
    channelId: string;
    channelTitle: string;
    title: string;
    thumbnailUrl: string | null;
    publishedAt: string;
  }>;
  uniqueChannels: SimilarChannelResult[];
  nextPageToken?: string;
}> {
  const now = new Date();
  const daysAgo = publishedAfterDays ?? 180;
  const publishedAfterDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

  const result = await searchVideos(ga, {
    query,
    maxVideos,
    pageToken,
    videoDuration,
    publishedAfterIso: publishedAfterDate.toISOString(),
  });

  const videos = result.videos.slice(0, maxVideos);

  // Log search results count (no filter applied, just logging)
  console.log(
    `[YouTube Search] Found ${result.videos.length} videos for query "${query}"`
  );

  // Extract unique channels
  const channelMap = new Map<string, SimilarChannelResult>();
  videos.forEach((v) => {
    if (!channelMap.has(v.channelId)) {
      channelMap.set(v.channelId, {
        channelId: v.channelId,
        channelTitle: v.channelTitle,
        description: "", // Will be fetched later when analyzing specific video
        thumbnailUrl: null,
      });
    }
  });

  return {
    videos,
    uniqueChannels: Array.from(channelMap.values()),
    nextPageToken: result.nextPageToken,
  };
}

// ============================================
// Recent Channel Videos
// ============================================

/**
 * Fetch recent videos from a channel (for similar channel analysis).
 * Caches results for 24h to save quota.
 */
export async function fetchRecentChannelVideos(
  ga: GoogleAccount,
  channelId: string,
  publishedAfter: string,
  maxResults: number = 10
): Promise<RecentVideoResult[]> {
  // Normalize publishedAfter to date only (YYYY-MM-DD) for stable cache keys
  const publishedAfterDate = publishedAfter.split("T")[0];
  const cacheKey = `${channelId}:${publishedAfterDate}`;

  // Try cache first
  const cached = await getCache("channelVideos", cacheKey);
  if (cached.hit) {
    const items = (cached.value as RecentVideoResult[]) ?? [];
    return items.slice(0, maxResults);
  }

  // Fetch from API
  const result = await fetchRecentChannelVideosCore(
    ga,
    channelId,
    publishedAfter,
    maxResults
  );

  // Cache result (even empty results to avoid repeated calls)
  await setCache("channelVideos", cacheKey, result, CACHE_TTL_MS);

  return result;
}

// ============================================
// Single Video Details
// ============================================

/**
 * Fetch details for a single video by ID.
 */
export async function fetchVideoDetails(
  ga: GoogleAccount,
  videoId: string
): Promise<VideoDetails | null> {
  return fetchVideoDetailsCore(ga, videoId);
}

// ============================================
// Video Comments
// ============================================

/**
 * Fetch top comments for a video using commentThreads.list.
 */
export async function fetchVideoComments(
  ga: GoogleAccount,
  videoId: string,
  maxResults: number = 50
): Promise<FetchCommentsResult> {
  return fetchVideoCommentsCore(ga, videoId, maxResults);
}

// ============================================
// Video Stats Batch
// ============================================

/**
 * Fetch video statistics in batch (for snapshotting).
 */
export async function fetchVideosStatsBatch(
  ga: GoogleAccount,
  videoIds: string[]
): Promise<Map<string, VideoStats>> {
  return fetchVideosStatsBatchCore(ga, videoIds);
}

/**
 * YouTube Data API Operations
 *
 * Focused functions for YouTube Data API v3 endpoints.
 * Each function is responsible for a single API operation.
 */

import { ApiError } from "@/lib/api/errors";

import {
  DEFAULT_CONCURRENCY_LIMIT,
  MAX_PLAYLIST_PAGES,
  VIDEO_BATCH_SIZE,
  YOUTUBE_DATA_API,
} from "./constants";
import {
  isCommentsDisabled,
  isInsufficientScope,
  isQuotaExceeded,
  MISSING_COMMENTS_SCOPE_ERROR,
} from "./errors";
import { youtubeFetch } from "./transport";
import type {
  FetchCommentsResult,
  GoogleAccount,
  RecentVideoResult,
  VideoDetails,
  VideoDurationFilter,
  VideoStats,
  YouTubeComment,
  YouTubeVideo,
} from "./types";
import {
  chunk,
  daysSince,
  decodeHtmlEntities,
  mapLimit,
  parseDuration,
} from "./utils";

// ============================================
// API-Key Video Snippet (public/unauthenticated routes)
// ============================================

/**
 * Shape returned by YouTube Data API videos.list when requesting part=snippet.
 * All sub-fields are optional because callers use `fields=` to request subsets.
 */
type YouTubeVideoSnippetItem = {
  snippet: {
    title?: string;
    description?: string;
    channelTitle?: string;
    tags?: string[];
    thumbnails?: {
      medium?: { url: string };
      high?: { url: string };
      maxres?: { url: string };
      default?: { url: string };
    };
  };
};

/**
 * Fetch a single video's snippet using API-key auth (no OAuth required).
 * Used by public routes that don't have a user OAuth context.
 *
 * Throws ApiError on HTTP failures or missing API key.
 * Returns null when the API responds 200 but no matching video item exists.
 */
export async function fetchVideoSnippetByApiKey(
  videoId: string,
  options?: {
    fields?: string;
    timeoutMs?: number;
  }
): Promise<YouTubeVideoSnippetItem | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new ApiError({
      code: "INTERNAL",
      status: 500,
      message: "YouTube API is not configured. Please contact support.",
    });
  }

  const url = new URL(`${YOUTUBE_DATA_API}/videos`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", apiKey);
  if (options?.fields) {
    url.searchParams.set("fields", options.fields);
  }

  const timeoutMs = options?.timeoutMs ?? 10_000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new ApiError({
          code: "NOT_FOUND",
          status: 404,
          message: "Video not found. Please check the URL and try again.",
        });
      }
      if (response.status === 403) {
        throw new ApiError({
          code: "FORBIDDEN",
          status: 403,
          message:
            "Unable to access this video. It may be private or restricted.",
        });
      }
      throw new ApiError({
        code: "INTERNAL",
        status: 500,
        message: "Failed to fetch video data. Please try again.",
      });
    }

    const data = await response.json();
    const item = data.items?.[0];
    return (item as YouTubeVideoSnippetItem) ?? null;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof ApiError) {throw error;}
    throw new ApiError({
      code: "INTERNAL",
      status: 500,
      message: "Failed to fetch video data. Please try again.",
    });
  }
}

// ============================================
// API-Key Full Video Details (public/unauthenticated routes)
// ============================================

/**
 * Fetch full video details using API-key auth (no OAuth required).
 * Returns the same VideoDetails shape as the OAuth version.
 * Used by the public analyze endpoint for anonymous users.
 */
export async function fetchVideoDetailsByApiKey(
  videoId: string,
): Promise<VideoDetails | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new ApiError({
      code: "INTERNAL",
      status: 500,
      message: "YouTube API is not configured.",
    });
  }

  const cred = { kind: "apiKey" as const, apiKey };
  const url = new URL(`${YOUTUBE_DATA_API}/videos`);
  url.searchParams.set("part", "snippet,contentDetails,statistics");
  url.searchParams.set("id", videoId);

  const data = await youtubeFetch<{
    items?: Array<{
      id: string;
      snippet: {
        title: string;
        description: string;
        publishedAt: string;
        channelId: string;
        channelTitle: string;
        tags?: string[];
        categoryId: string;
        thumbnails: {
          maxres?: { url: string };
          high?: { url: string };
          default?: { url: string };
        };
      };
      contentDetails: { duration: string };
      statistics: {
        viewCount?: string;
        likeCount?: string;
        commentCount?: string;
      };
    }>;
  }>(cred, url.toString());

  const item = data.items?.[0];
  if (!item) {return null;}

  return {
    videoId: item.id,
    title: decodeHtmlEntities(item.snippet.title),
    description: decodeHtmlEntities(item.snippet.description),
    publishedAt: item.snippet.publishedAt,
    channelId: item.snippet.channelId,
    channelTitle: decodeHtmlEntities(item.snippet.channelTitle),
    tags: item.snippet.tags ?? [],
    category: item.snippet.categoryId,
    thumbnailUrl: pickBestThumbnail(item.snippet.thumbnails),
    durationSec: parseDuration(item.contentDetails.duration),
    viewCount: parseIntStat(item.statistics.viewCount),
    likeCount: parseIntStat(item.statistics.likeCount),
    commentCount: parseIntStat(item.statistics.commentCount),
  };
}

// ============================================
// API-Key Video Comments (public/unauthenticated routes)
// ============================================

/**
 * Fetch video comments using API-key auth (no OAuth required).
 * Returns the same FetchCommentsResult shape as the OAuth version.
 */
export async function fetchVideoCommentsByApiKey(
  videoId: string,
  maxResults: number = 50,
): Promise<FetchCommentsResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return { comments: [], error: "YouTube API not configured" };
  }

  const cred = { kind: "apiKey" as const, apiKey };
  const url = new URL(`${YOUTUBE_DATA_API}/commentThreads`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("videoId", videoId);
  url.searchParams.set("order", "relevance");
  url.searchParams.set("maxResults", String(Math.min(maxResults, 100)));

  try {
    const data = await youtubeFetch<{
      items?: Array<{
        id: string;
        snippet: {
          topLevelComment: {
            id: string;
            snippet: {
              textDisplay: string;
              textOriginal: string;
              likeCount: number;
              authorDisplayName: string;
              authorChannelId?: { value: string };
              publishedAt: string;
            };
          };
          totalReplyCount: number;
        };
      }>;
      error?: {
        code: number;
        message: string;
        errors?: Array<{ reason: string }>;
      };
    }>(cred, url.toString());

    if (!data.items) {
      if (data.error?.errors?.some((e) => e.reason === "commentsDisabled")) {
        return { comments: [], commentsDisabled: true };
      }
      return {
        comments: [],
        error: data.error?.message || "No comments found",
      };
    }

    const comments = data.items.map((item) => ({
      commentId: item.snippet.topLevelComment.id,
      text: item.snippet.topLevelComment.snippet.textOriginal,
      likeCount: item.snippet.topLevelComment.snippet.likeCount,
      authorName: item.snippet.topLevelComment.snippet.authorDisplayName,
      authorChannelId: item.snippet.topLevelComment.snippet.authorChannelId?.value,
      publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
      replyCount: item.snippet.totalReplyCount,
    }));

    return { comments };
  } catch {
    return { comments: [], error: "Failed to fetch comments" };
  }
}

// ============================================
// Channel Operations
// ============================================

/**
 * Fetch the subscriber count for a channel.
 * Returns null when the channel hides its subscriber count.
 */
export async function fetchChannelSubscriberCount(
  ga: GoogleAccount,
  channelId: string,
): Promise<number | null> {
  const url = new URL(`${YOUTUBE_DATA_API}/channels`);
  url.searchParams.set("part", "statistics");
  url.searchParams.set("id", channelId);

  const data = await youtubeFetch<{
    items?: Array<{
      statistics: {
        subscriberCount?: string;
        hiddenSubscriberCount?: boolean;
      };
    }>;
  }>(ga, url.toString());

  const stats = data.items?.[0]?.statistics;
  if (!stats || stats.hiddenSubscriberCount) {
    return null;
  }
  return Number.parseInt(stats.subscriberCount ?? "0", 10);
}

/**
 * Get the uploads playlist ID for a channel.
 * This is the recommended way to get channel videos (1 unit vs 100 for search).
 */
export async function getUploadsPlaylistId(
  ga: GoogleAccount,
  channelId: string
): Promise<string> {
  const url = new URL(`${YOUTUBE_DATA_API}/channels`);
  url.searchParams.set("part", "contentDetails");
  url.searchParams.set("id", channelId);

  const data = await youtubeFetch<{
    items?: Array<{
      contentDetails: {
        relatedPlaylists: { uploads: string };
      };
    }>;
  }>(ga, url.toString());

  const uploadsPlaylistId =
    data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    throw new Error("Could not find uploads playlist for channel");
  }

  return uploadsPlaylistId;
}

// ============================================
// Playlist Operations
// ============================================

/**
 * List video IDs from an uploads playlist with pagination.
 * Returns video IDs in reverse chronological order (newest first).
 */
export async function listUploadsVideoIds(
  ga: GoogleAccount,
  uploadsPlaylistId: string,
  maxResults: number
): Promise<string[]> {
  const allVideoIds: string[] = [];
  let nextPageToken: string | undefined;
  const perPage = Math.min(50, maxResults);

  while (allVideoIds.length < maxResults) {
    const url = new URL(`${YOUTUBE_DATA_API}/playlistItems`);
    url.searchParams.set("part", "contentDetails");
    url.searchParams.set("playlistId", uploadsPlaylistId);
    url.searchParams.set("maxResults", String(perPage));
    if (nextPageToken) {
      url.searchParams.set("pageToken", nextPageToken);
    }

    const data = await youtubeFetch<{
      nextPageToken?: string;
      items?: Array<{
        contentDetails: { videoId: string };
      }>;
    }>(ga, url.toString());

    const pageVideoIds = data.items?.map((i) => i.contentDetails.videoId) ?? [];
    allVideoIds.push(...pageVideoIds);

    nextPageToken = data.nextPageToken;
    if (!nextPageToken || pageVideoIds.length === 0) {
      break;
    }
  }

  return allVideoIds.slice(0, maxResults);
}

// ============================================
// Video Operations
// ============================================

/**
 * Fetch video details for a batch of video IDs.
 * Handles batching (max 50 per request) and concurrency limiting.
 * Preserves order matching the input videoIds array.
 */
export async function fetchVideosDetailsBatch(
  ga: GoogleAccount,
  videoIds: string[]
): Promise<YouTubeVideo[]> {
  if (videoIds.length === 0) {return [];}

  const batches = chunk(videoIds, VIDEO_BATCH_SIZE);

  // Process batches with concurrency limit
  const batchResults = await mapLimit(
    batches,
    DEFAULT_CONCURRENCY_LIMIT,
    async (batchIds) => {
      const url = new URL(`${YOUTUBE_DATA_API}/videos`);
      url.searchParams.set("part", "contentDetails,snippet,statistics,status");
      url.searchParams.set("id", batchIds.join(","));

      const data = await youtubeFetch<{
        items?: Array<{
          id: string;
          snippet: {
            title: string;
            description: string;
            publishedAt: string;
            tags?: string[];
            thumbnails: { high?: { url: string }; default?: { url: string } };
          };
          contentDetails: { duration: string };
          statistics: {
            viewCount?: string;
            likeCount?: string;
            commentCount?: string;
          };
          status?: {
            privacyStatus?: string;
            uploadStatus?: string;
          };
        }>;
      }>(ga, url.toString());

      const items = data.items ?? [];
      for (const v of items) {
        console.log(`[VideoFilter] ${v.id} "${v.snippet.title}" — privacyStatus=${v.status?.privacyStatus}, uploadStatus=${v.status?.uploadStatus}`);
      }

      return items
        .filter((v) => v.status?.privacyStatus === "public")
        .map((v) => ({
          videoId: v.id,
          title: decodeHtmlEntities(v.snippet.title),
          description: decodeHtmlEntities(v.snippet.description),
          publishedAt: v.snippet.publishedAt,
          durationSec: parseDuration(v.contentDetails.duration),
          tags: v.snippet.tags?.join(",") ?? null,
          thumbnailUrl:
            v.snippet.thumbnails?.high?.url ??
            v.snippet.thumbnails?.default?.url ??
            null,
          views: Number.parseInt(v.statistics.viewCount ?? "0", 10),
          likes: Number.parseInt(v.statistics.likeCount ?? "0", 10),
          comments: Number.parseInt(v.statistics.commentCount ?? "0", 10),
        }));
    }
  );

  // Flatten results - order is preserved because mapLimit preserves order
  return batchResults.flat();
}

function pickBestThumbnail(thumbnails?: {
  maxres?: { url: string };
  high?: { url: string };
  medium?: { url: string };
  default?: { url: string };
}): string | null {
  return (
    thumbnails?.maxres?.url ??
    thumbnails?.high?.url ??
    thumbnails?.medium?.url ??
    thumbnails?.default?.url ??
    null
  );
}

function parseIntStat(value: string | undefined): number {
  return Number.parseInt(value ?? "0", 10);
}

/**
 * Fetch details for a single video by ID.
 */
export async function fetchVideoDetails(
  ga: GoogleAccount,
  videoId: string
): Promise<VideoDetails | null> {
  const url = new URL(`${YOUTUBE_DATA_API}/videos`);
  url.searchParams.set("part", "snippet,contentDetails,statistics");
  url.searchParams.set("id", videoId);

  const data = await youtubeFetch<{
    items?: Array<{
      id: string;
      snippet: {
        title: string;
        description: string;
        publishedAt: string;
        channelId: string;
        channelTitle: string;
        tags?: string[];
        categoryId: string;
        thumbnails: {
          maxres?: { url: string };
          high?: { url: string };
          default?: { url: string };
        };
      };
      contentDetails: { duration: string };
      statistics: {
        viewCount?: string;
        likeCount?: string;
        commentCount?: string;
      };
    }>;
  }>(ga, url.toString());

  const item = data.items?.[0];
  if (!item) {return null;}

  return {
    videoId: item.id,
    title: decodeHtmlEntities(item.snippet.title),
    description: decodeHtmlEntities(item.snippet.description),
    publishedAt: item.snippet.publishedAt,
    channelId: item.snippet.channelId,
    channelTitle: decodeHtmlEntities(item.snippet.channelTitle),
    tags: item.snippet.tags ?? [],
    category: item.snippet.categoryId,
    thumbnailUrl: pickBestThumbnail(item.snippet.thumbnails),
    durationSec: parseDuration(item.contentDetails.duration),
    viewCount: parseIntStat(item.statistics.viewCount),
    likeCount: parseIntStat(item.statistics.likeCount),
    commentCount: parseIntStat(item.statistics.commentCount),
  };
}

/**
 * Fetch video statistics in batch.
 * Handles batching and concurrency limiting.
 */
export async function fetchVideosStatsBatch(
  ga: GoogleAccount,
  videoIds: string[]
): Promise<Map<string, VideoStats>> {
  if (videoIds.length === 0) {return new Map();}

  const results = new Map<string, VideoStats>();
  const batches = chunk(videoIds, VIDEO_BATCH_SIZE);

  // Process batches with concurrency limit
  await mapLimit(batches, DEFAULT_CONCURRENCY_LIMIT, async (batchIds) => {
    const url = new URL(`${YOUTUBE_DATA_API}/videos`);
    url.searchParams.set("part", "statistics");
    url.searchParams.set("id", batchIds.join(","));

    try {
      const data = await youtubeFetch<{
        items?: Array<{
          id: string;
          statistics: {
            viewCount?: string;
            likeCount?: string;
            commentCount?: string;
          };
        }>;
      }>(ga, url.toString());

      for (const item of data.items ?? []) {
        results.set(item.id, {
          viewCount: Number.parseInt(item.statistics.viewCount ?? "0", 10),
          likeCount: item.statistics.likeCount
            ? Number.parseInt(item.statistics.likeCount, 10)
            : undefined,
          commentCount: item.statistics.commentCount
            ? Number.parseInt(item.statistics.commentCount, 10)
            : undefined,
        });
      }
    } catch (error) {
      console.warn(`Failed to fetch stats batch:`, error);
    }

    return null; // mapLimit requires a return value
  });

  return results;
}

// ============================================
// Search Operations
// ============================================

/**
 * Search for videos by query.
 * This is an expensive operation (100 quota units).
 */
export async function searchVideos(
  ga: GoogleAccount,
  options: {
    query: string;
    maxVideos: number;
    pageToken?: string;
    videoDuration?: VideoDurationFilter;
    publishedAfterIso?: string;
  }
): Promise<{
  videos: Array<{
    videoId: string;
    channelId: string;
    channelTitle: string;
    title: string;
    thumbnailUrl: string | null;
    publishedAt: string;
  }>;
  nextPageToken?: string;
}> {
  const {
    query,
    maxVideos,
    pageToken,
    videoDuration = "any",
    publishedAfterIso,
  } = options;

  const url = new URL(`${YOUTUBE_DATA_API}/search`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", String(Math.min(50, maxVideos)));
  url.searchParams.set("order", "relevance");
  url.searchParams.set("regionCode", "US");
  url.searchParams.set("relevanceLanguage", "en");
  url.searchParams.set("videoDefinition", "high");

  if (publishedAfterIso) {
    url.searchParams.set("publishedAfter", publishedAfterIso);
  }

  if (videoDuration !== "any") {
    url.searchParams.set("videoDuration", videoDuration);
  }

  if (pageToken) {
    url.searchParams.set("pageToken", pageToken);
  }

  // Add query parameter separately to ensure proper encoding
  const fullUrl = `${url.toString()}&q=${query}`;

  console.log(`[YouTube Search] URL: ${fullUrl}`);

  const data = await youtubeFetch<{
    items?: Array<{
      id: { videoId: string };
      snippet: {
        channelId: string;
        channelTitle: string;
        title: string;
        publishedAt: string;
        thumbnails: { medium?: { url: string }; default?: { url: string } };
      };
    }>;
    nextPageToken?: string;
  }>(ga, fullUrl);

  const videos = (data.items ?? []).map((i) => ({
    videoId: i.id.videoId,
    channelId: i.snippet.channelId,
    channelTitle: decodeHtmlEntities(i.snippet.channelTitle),
    title: decodeHtmlEntities(i.snippet.title),
    thumbnailUrl:
      i.snippet.thumbnails?.medium?.url ??
      i.snippet.thumbnails?.default?.url ??
      null,
    publishedAt: i.snippet.publishedAt,
  }));

  return {
    videos,
    nextPageToken: data.nextPageToken,
  };
}

// ============================================
// Recent Channel Videos (Core Logic)
// ============================================

type PlaylistCandidate = {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string | null;
};

async function fetchCandidatesFromPlaylist(
  ga: GoogleAccount,
  uploadsPlaylistId: string,
  publishedAfterMs: number,
): Promise<PlaylistCandidate[]> {
  const candidates: PlaylistCandidate[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < MAX_PLAYLIST_PAGES; page++) {
    const url = new URL(`${YOUTUBE_DATA_API}/playlistItems`);
    url.searchParams.set("part", "snippet,contentDetails");
    url.searchParams.set("playlistId", uploadsPlaylistId);
    url.searchParams.set("maxResults", "50");
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const data = await youtubeFetch<{
      items?: Array<{
        snippet: {
          title: string;
          publishedAt: string;
          thumbnails: { medium?: { url: string }; default?: { url: string } };
        };
        contentDetails: { videoId: string };
      }>;
      nextPageToken?: string;
    }>(ga, url.toString());

    const items = data.items ?? [];
    let crossedCutoff = false;

    for (const i of items) {
      const publishedAt = i.snippet.publishedAt;
      if (new Date(publishedAt).getTime() < publishedAfterMs) {
        crossedCutoff = true;
        break;
      }
      candidates.push({
        videoId: i.contentDetails.videoId,
        title: decodeHtmlEntities(i.snippet.title),
        publishedAt,
        thumbnailUrl: pickBestThumbnail(i.snippet.thumbnails),
      });
    }

    if (crossedCutoff || !data.nextPageToken || candidates.length >= 50) { break; }
    pageToken = data.nextPageToken;
  }

  return candidates;
}

/**
 * Fetch recent videos from a channel using the uploads playlist.
 * Falls back to search.list if uploads playlist is not available.
 * This is the core logic without caching.
 */
export async function fetchRecentChannelVideosCore(
  ga: GoogleAccount,
  channelId: string,
  publishedAfterIso: string,
  maxResults: number
): Promise<RecentVideoResult[]> {
  let uploadsPlaylistId: string | null = null;
  try {
    uploadsPlaylistId = await getUploadsPlaylistId(ga, channelId);
  } catch {
    // Playlist lookup failed, will use search fallback
  }

  if (!uploadsPlaylistId) {
    return fetchRecentVideosViaSearch(ga, channelId, publishedAfterIso, maxResults);
  }

  const publishedAfterMs = new Date(publishedAfterIso).getTime();
  const candidates = await fetchCandidatesFromPlaylist(ga, uploadsPlaylistId, publishedAfterMs);
  if (candidates.length === 0) { return []; }

  const ids = candidates.slice(0, 50).map((v) => v.videoId);
  const statsMap = await fetchVideosStatsBatch(ga, ids);

  const withViews = candidates.map((v) => {
    const views = statsMap.get(v.videoId)?.viewCount ?? 0;
    return {
      ...v,
      views,
      viewsPerDay: Math.round(views / daysSince(v.publishedAt)),
    };
  });

  withViews.sort((a, b) => b.views - a.views);
  return withViews.slice(0, maxResults);
}

/**
 * Fallback: fetch recent videos via search.list (expensive: 100 units/call).
 */
async function fetchRecentVideosViaSearch(
  ga: GoogleAccount,
  channelId: string,
  publishedAfterIso: string,
  maxResults: number
): Promise<RecentVideoResult[]> {
  const url = new URL(`${YOUTUBE_DATA_API}/search`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("channelId", channelId);
  url.searchParams.set("publishedAfter", publishedAfterIso);
  url.searchParams.set("order", "viewCount");
  url.searchParams.set("maxResults", String(Math.min(25, maxResults)));

  const searchData = await youtubeFetch<{
    items?: Array<{
      id: { videoId: string };
      snippet: {
        title: string;
        publishedAt: string;
        thumbnails: { medium?: { url: string }; default?: { url: string } };
      };
    }>;
  }>(ga, url.toString());

  const videoIds = searchData.items?.map((i) => i.id.videoId) ?? [];
  if (videoIds.length === 0) {return [];}

  // Fetch stats for these videos
  const statsMap = await fetchVideosStatsBatch(ga, videoIds);

  return (searchData.items ?? []).map((i) => {
    const stats = statsMap.get(i.id.videoId);
    const views = stats?.viewCount ?? 0;
    const publishedAt = i.snippet.publishedAt;

    return {
      videoId: i.id.videoId,
      title: decodeHtmlEntities(i.snippet.title),
      publishedAt,
      thumbnailUrl:
        i.snippet.thumbnails?.medium?.url ??
        i.snippet.thumbnails?.default?.url ??
        null,
      views,
      viewsPerDay: Math.round(views / daysSince(publishedAt)),
    };
  });
}

// ============================================
// Comments
// ============================================

/**
 * Fetch top comments for a video using commentThreads.list.
 * Handles various error conditions gracefully.
 */
export async function fetchVideoComments(
  ga: GoogleAccount,
  videoId: string,
  maxResults: number = 50
): Promise<FetchCommentsResult> {
  try {
    const url = new URL(`${YOUTUBE_DATA_API}/commentThreads`);
    url.searchParams.set("part", "snippet");
    url.searchParams.set("videoId", videoId);
    url.searchParams.set("order", "relevance");
    url.searchParams.set("maxResults", String(Math.min(maxResults, 100)));

    const data = await youtubeFetch<{
      items?: Array<{
        id: string;
        snippet: {
          topLevelComment: {
            id: string;
            snippet: {
              textDisplay: string;
              textOriginal: string;
              likeCount: number;
              authorDisplayName: string;
              authorChannelId?: { value: string };
              publishedAt: string;
            };
          };
          totalReplyCount: number;
        };
      }>;
      error?: {
        code: number;
        message: string;
        errors?: Array<{ reason: string }>;
      };
    }>(ga, url.toString());

    if (!data.items) {
      // Check if comments are disabled
      if (data.error?.errors?.some((e) => e.reason === "commentsDisabled")) {
        return { comments: [], commentsDisabled: true };
      }
      return {
        comments: [],
        error: data.error?.message || "No comments found",
      };
    }

    const comments: YouTubeComment[] = data.items.map((item) => ({
      commentId: item.snippet.topLevelComment.id,
      text: item.snippet.topLevelComment.snippet.textOriginal,
      likeCount: item.snippet.topLevelComment.snippet.likeCount,
      authorName: item.snippet.topLevelComment.snippet.authorDisplayName,
      authorChannelId:
        item.snippet.topLevelComment.snippet.authorChannelId?.value,
      publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
      replyCount: item.snippet.totalReplyCount,
    }));

    return { comments };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (isCommentsDisabled(error)) {
      return { comments: [], commentsDisabled: true };
    }
    if (isQuotaExceeded(error)) {
      return { comments: [], error: "YouTube API quota exceeded" };
    }
    if (isInsufficientScope(error)) {
      return { comments: [], error: MISSING_COMMENTS_SCOPE_ERROR };
    }

    return { comments: [], error: message };
  }
}

// ============================================
// Trending / Most Popular Videos (API-key, public)
// ============================================

function formatDurationForDisplay(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export type TrendingVideo = {
  videoId: string;
  title: string;
  channelName: string;
  channelId: string;
  thumbnailUrl: string;
  duration: string;
  publishedAt: string;
  viewCount: number;
  viewVelocity: number;
  categoryId: string;
};

type MostPopularItem = {
  id: string;
  snippet: {
    title: string;
    channelTitle: string;
    channelId: string;
    publishedAt: string;
    thumbnails?: { medium?: { url: string }; high?: { url: string } };
    categoryId?: string;
  };
  statistics: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
  contentDetails: {
    duration: string;
  };
};

type MostPopularResponse = {
  items: MostPopularItem[];
  pageInfo: { totalResults: number };
};

/**
 * Fetch YouTube's most popular (trending) videos.
 * Uses API key mode — no OAuth needed.
 * Costs 1 quota unit per call.
 */
export async function fetchTrendingVideos(options?: {
  regionCode?: string;
  videoCategoryId?: string;
  maxResults?: number;
}): Promise<TrendingVideo[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new ApiError({ code: "INTERNAL", status: 500, message: "YOUTUBE_API_KEY not set" });

  const params = new URLSearchParams({
    part: "snippet,statistics,contentDetails",
    chart: "mostPopular",
    regionCode: options?.regionCode ?? "US",
    maxResults: String(options?.maxResults ?? 50),
  });
  if (options?.videoCategoryId) {
    params.set("videoCategoryId", options.videoCategoryId);
  }

  const url = `${YOUTUBE_DATA_API}/videos?${params.toString()}`;
  const cred = { kind: "apiKey" as const, apiKey };
  const data = await youtubeFetch<MostPopularResponse>(cred, url);

  const now = Date.now();
  return (data.items ?? [])
    .map((item): TrendingVideo | null => {
      const publishedMs = new Date(item.snippet.publishedAt).getTime();
      const hoursOld = (now - publishedMs) / 3_600_000;

      // Exclude videos < 1 hour or > 72 hours old
      if (hoursOld < 1 || hoursOld > 72) return null;

      const viewCount = Number(item.statistics.viewCount ?? 0);
      return {
        videoId: item.id,
        title: decodeHtmlEntities(item.snippet.title),
        channelName: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        thumbnailUrl: item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.medium?.url ?? "",
        duration: formatDurationForDisplay(parseDuration(item.contentDetails.duration)),
        publishedAt: item.snippet.publishedAt,
        viewCount,
        viewVelocity: Math.round(viewCount / hoursOld),
        categoryId: item.snippet.categoryId ?? "",
      };
    })
    .filter((v): v is TrendingVideo => v !== null)
    .sort((a, b) => b.viewVelocity - a.viewVelocity);
}

export type VideoCategory = { id: string; title: string };

type CategoryListResponse = {
  items: Array<{ id: string; snippet: { title: string } }>;
};

/** Fetch YouTube video category names. Cache-safe — categories rarely change. */
export async function fetchVideoCategories(
  regionCode = "US",
): Promise<VideoCategory[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new ApiError({ code: "INTERNAL", status: 500, message: "YOUTUBE_API_KEY not set" });

  const url = `${YOUTUBE_DATA_API}/videoCategories?part=snippet&regionCode=${regionCode}`;
  const cred = { kind: "apiKey" as const, apiKey };
  const data = await youtubeFetch<CategoryListResponse>(cred, url);

  return (data.items ?? []).map((item) => ({
    id: item.id,
    title: item.snippet.title,
  }));
}

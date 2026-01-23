/**
 * YouTube Data API Operations
 *
 * Focused functions for YouTube Data API v3 endpoints.
 * Each function is responsible for a single API operation.
 */

import {
  YOUTUBE_DATA_API,
  VIDEO_BATCH_SIZE,
  DEFAULT_CONCURRENCY_LIMIT,
  MAX_PLAYLIST_PAGES,
} from "./constants";
import { youtubeFetch } from "./transport";
import {
  decodeHtmlEntities,
  parseDuration,
  chunk,
  mapLimit,
  daysSince,
} from "./utils";
import {
  isCommentsDisabled,
  isQuotaExceeded,
  isInsufficientScope,
  MISSING_COMMENTS_SCOPE_ERROR,
} from "./errors";
import type {
  GoogleAccount,
  YouTubeVideo,
  VideoDetails,
  SimilarChannelResult,
  RecentVideoResult,
  VideoDurationFilter,
  YouTubeComment,
  FetchCommentsResult,
  VideoStats,
} from "./types";

// ============================================
// Channel Operations
// ============================================

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

/**
 * Fetch basic channel details for a batch of channel IDs.
 * Used for discovery features (subscriber counts + channel age).
 *
 * Note: subscriberCount may be hidden by some channels; in that case it returns null.
 */
export async function fetchChannelsDetailsBatch(
  ga: GoogleAccount,
  channelIds: string[]
): Promise<
  Array<{
    channelId: string;
    subscriberCount: number | null;
    publishedAt: string | null;
  }>
> {
  if (channelIds.length === 0) return [];

  const batches = chunk(channelIds, VIDEO_BATCH_SIZE);

  const batchResults = await mapLimit(
    batches,
    DEFAULT_CONCURRENCY_LIMIT,
    async (batchIds) => {
      const url = new URL(`${YOUTUBE_DATA_API}/channels`);
      url.searchParams.set("part", "snippet,statistics");
      url.searchParams.set("id", batchIds.join(","));

      const data = await youtubeFetch<{
        items?: Array<{
          id: string;
          snippet?: { publishedAt?: string };
          statistics?: { subscriberCount?: string };
        }>;
      }>(ga, url.toString());

      return (data.items ?? []).map((c) => ({
        channelId: c.id,
        subscriberCount: c.statistics?.subscriberCount
          ? parseInt(c.statistics.subscriberCount, 10)
          : null,
        publishedAt: c.snippet?.publishedAt ?? null,
      }));
    }
  );

  return batchResults.flat();
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
  if (videoIds.length === 0) return [];

  const batches = chunk(videoIds, VIDEO_BATCH_SIZE);

  // Process batches with concurrency limit
  const batchResults = await mapLimit(
    batches,
    DEFAULT_CONCURRENCY_LIMIT,
    async (batchIds) => {
      const url = new URL(`${YOUTUBE_DATA_API}/videos`);
      url.searchParams.set("part", "contentDetails,snippet,statistics");
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
        }>;
      }>(ga, url.toString());

      return (data.items ?? []).map((v) => ({
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
        views: parseInt(v.statistics.viewCount ?? "0", 10),
        likes: parseInt(v.statistics.likeCount ?? "0", 10),
        comments: parseInt(v.statistics.commentCount ?? "0", 10),
      }));
    }
  );

  // Flatten results - order is preserved because mapLimit preserves order
  return batchResults.flat();
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
  if (!item) return null;

  return {
    videoId: item.id,
    title: decodeHtmlEntities(item.snippet.title),
    description: decodeHtmlEntities(item.snippet.description),
    publishedAt: item.snippet.publishedAt,
    channelId: item.snippet.channelId,
    channelTitle: decodeHtmlEntities(item.snippet.channelTitle),
    tags: item.snippet.tags ?? [],
    category: item.snippet.categoryId,
    thumbnailUrl:
      item.snippet.thumbnails?.maxres?.url ??
      item.snippet.thumbnails?.high?.url ??
      item.snippet.thumbnails?.default?.url ??
      null,
    durationSec: parseDuration(item.contentDetails.duration),
    viewCount: parseInt(item.statistics.viewCount ?? "0", 10),
    likeCount: parseInt(item.statistics.likeCount ?? "0", 10),
    commentCount: parseInt(item.statistics.commentCount ?? "0", 10),
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
  if (videoIds.length === 0) return new Map();

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
          viewCount: parseInt(item.statistics.viewCount ?? "0", 10),
          likeCount: item.statistics.likeCount
            ? parseInt(item.statistics.likeCount, 10)
            : undefined,
          commentCount: item.statistics.commentCount
            ? parseInt(item.statistics.commentCount, 10)
            : undefined,
        });
      }
    } catch (err) {
      console.warn(`Failed to fetch stats batch:`, err);
    }

    return null; // mapLimit requires a return value
  });

  return results;
}

// ============================================
// Search Operations
// ============================================

/**
 * Search for channels by query.
 * This is an expensive operation (100 quota units).
 */
export async function searchChannels(
  ga: GoogleAccount,
  query: string,
  maxResults: number
): Promise<SimilarChannelResult[]> {
  const url = new URL(`${YOUTUBE_DATA_API}/search`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "channel");
  url.searchParams.set("q", query);
  url.searchParams.set(
    "maxResults",
    String(Math.min(50, Math.max(1, maxResults)))
  );
  url.searchParams.set("relevanceLanguage", "en");

  const data = await youtubeFetch<{
    items?: Array<{
      id: { channelId: string };
      snippet: {
        title: string;
        description: string;
        thumbnails: { medium?: { url: string }; default?: { url: string } };
      };
    }>;
  }>(ga, url.toString());

  return (data.items ?? []).map((i) => ({
    channelId: i.id.channelId,
    channelTitle: decodeHtmlEntities(i.snippet.title),
    description: decodeHtmlEntities(i.snippet.description),
    thumbnailUrl:
      i.snippet.thumbnails?.medium?.url ??
      i.snippet.thumbnails?.default?.url ??
      null,
  }));
}

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
  const publishedAfterMs = new Date(publishedAfterIso).getTime();

  // Try to get uploads playlist ID
  let uploadsPlaylistId: string | null = null;
  try {
    uploadsPlaylistId = await getUploadsPlaylistId(ga, channelId);
  } catch {
    // Playlist lookup failed, will use search fallback
  }

  // If no uploads playlist, fall back to expensive search.list
  if (!uploadsPlaylistId) {
    return fetchRecentVideosViaSearch(
      ga,
      channelId,
      publishedAfterIso,
      maxResults
    );
  }

  // Read uploads pages (reverse-chronological)
  const candidates: Array<{
    videoId: string;
    title: string;
    publishedAt: string;
    thumbnailUrl: string | null;
  }> = [];

  let pageToken: string | undefined;
  let crossedCutoff = false;

  for (let page = 0; page < MAX_PLAYLIST_PAGES; page++) {
    const url = new URL(`${YOUTUBE_DATA_API}/playlistItems`);
    url.searchParams.set("part", "snippet,contentDetails");
    url.searchParams.set("playlistId", uploadsPlaylistId);
    url.searchParams.set("maxResults", "50");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

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
    for (const i of items) {
      const publishedAt = i.snippet.publishedAt;
      if (new Date(publishedAt).getTime() < publishedAfterMs) {
        // Playlist is reverse-chronological, so rest is too old
        crossedCutoff = true;
        break;
      }
      candidates.push({
        videoId: i.contentDetails.videoId,
        title: decodeHtmlEntities(i.snippet.title),
        publishedAt,
        thumbnailUrl:
          i.snippet.thumbnails?.medium?.url ??
          i.snippet.thumbnails?.default?.url ??
          null,
      });
    }

    if (crossedCutoff) break;
    if (!data.nextPageToken) break;
    if (candidates.length >= 50) break;
    pageToken = data.nextPageToken;
  }

  if (candidates.length === 0) {
    return [];
  }

  // Fetch view counts for candidates (single videos.list call, up to 50 IDs)
  const ids = candidates.slice(0, 50).map((v) => v.videoId);
  const statsMap = await fetchVideosStatsBatch(ga, ids);

  const withViews = candidates.map((v) => {
    const stats = statsMap.get(v.videoId);
    const views = stats?.viewCount ?? 0;
    return {
      ...v,
      views,
      viewsPerDay: Math.round(views / daysSince(v.publishedAt)),
    };
  });

  // Sort by views (descending) to match prior behavior
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
  if (videoIds.length === 0) return [];

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (isCommentsDisabled(err)) {
      return { comments: [], commentsDisabled: true };
    }
    if (isQuotaExceeded(err)) {
      return { comments: [], error: "YouTube API quota exceeded" };
    }
    if (isInsufficientScope(err)) {
      return { comments: [], error: MISSING_COMMENTS_SCOPE_ERROR };
    }

    return { comments: [], error: message };
  }
}

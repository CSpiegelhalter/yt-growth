/**
 * YouTube Analytics API client for owned videos (server-only)
 *
 * Fetches detailed analytics metrics that are only available for the authenticated user's own channel.
 * Uses stored OAuth tokens and handles automatic refresh.
 *
 * NOTE: This module should only be used on the server side (API routes, server components).
 */
import { googleFetchWithAutoRefresh } from "@/lib/google-tokens";

const YOUTUBE_ANALYTICS_API = "https://youtubeanalytics.googleapis.com/v2";
const YOUTUBE_DATA_API = "https://www.googleapis.com/youtube/v3";

type GoogleAccount = {
  id: number;
  refreshTokenEnc: string | null;
  tokenExpiresAt: Date | null;
};

// Metrics we attempt to fetch (some may not be available for all channels)
const CORE_METRICS = [
  "views",
  "likes",
  "comments",
  "shares",
  "subscribersGained",
  "subscribersLost",
  "estimatedMinutesWatched",
  "averageViewDuration",
  "averageViewPercentage",
  "videosAddedToPlaylists",
  "videosRemovedFromPlaylists",
];

const ENGAGEMENT_METRICS = ["engagedViews"];

const MONETIZATION_METRICS = [
  "estimatedRevenue",
  "estimatedAdRevenue",
  "grossRevenue",
  "monetizedPlaybacks",
  "playbackBasedCpm",
  "adImpressions",
  "cpm",
];

export type DailyAnalyticsRow = {
  date: string; // YYYY-MM-DD
  views: number;
  engagedViews: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  estimatedMinutesWatched: number | null;
  averageViewDuration: number | null;
  averageViewPercentage: number | null;
  subscribersGained: number | null;
  subscribersLost: number | null;
  videosAddedToPlaylists: number | null;
  videosRemovedFromPlaylists: number | null;
  estimatedRevenue: number | null;
  estimatedAdRevenue: number | null;
  grossRevenue: number | null;
  monetizedPlaybacks: number | null;
  playbackBasedCpm: number | null;
  adImpressions: number | null;
  cpm: number | null;
};

export type AnalyticsTotals = DailyAnalyticsRow & {
  startDate: string;
  endDate: string;
  daysInRange: number;
};

/**
 * Fetch daily analytics for a single video
 */
export async function fetchVideoAnalyticsDaily(
  ga: GoogleAccount,
  channelId: string,
  videoId: string,
  startDate: string,
  endDate: string
): Promise<DailyAnalyticsRow[]> {
  // First try with all metrics
  const allMetrics = [...CORE_METRICS, ...ENGAGEMENT_METRICS, ...MONETIZATION_METRICS];

  let result = await tryFetchAnalytics(ga, channelId, videoId, startDate, endDate, allMetrics, "day");

  // If that fails, try without monetization
  if (!result) {
    const withoutMonetization = [...CORE_METRICS, ...ENGAGEMENT_METRICS];
    result = await tryFetchAnalytics(ga, channelId, videoId, startDate, endDate, withoutMonetization, "day");
  }

  // If still fails, try just core metrics
  if (!result) {
    result = await tryFetchAnalytics(ga, channelId, videoId, startDate, endDate, CORE_METRICS, "day");
  }

  return result ?? [];
}

/**
 * Fetch totals for a single video (no dimension, aggregated over range)
 */
export async function fetchVideoAnalyticsTotals(
  ga: GoogleAccount,
  channelId: string,
  videoId: string,
  startDate: string,
  endDate: string
): Promise<AnalyticsTotals | null> {
  const allMetrics = [...CORE_METRICS, ...ENGAGEMENT_METRICS, ...MONETIZATION_METRICS];

  let result = await tryFetchAnalyticsTotals(ga, channelId, videoId, startDate, endDate, allMetrics);

  if (!result) {
    const withoutMonetization = [...CORE_METRICS, ...ENGAGEMENT_METRICS];
    result = await tryFetchAnalyticsTotals(ga, channelId, videoId, startDate, endDate, withoutMonetization);
  }

  if (!result) {
    result = await tryFetchAnalyticsTotals(ga, channelId, videoId, startDate, endDate, CORE_METRICS);
  }

  if (!result) return null;

  // Calculate days in range
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysInRange = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  return {
    ...result,
    startDate,
    endDate,
    daysInRange,
    date: startDate, // Use startDate as the "date" for type compatibility
  };
}

/**
 * Try to fetch analytics with a specific set of metrics
 */
async function tryFetchAnalytics(
  ga: GoogleAccount,
  channelId: string,
  videoId: string,
  startDate: string,
  endDate: string,
  metrics: string[],
  dimension: "day" | null
): Promise<DailyAnalyticsRow[] | null> {
  try {
    const url = new URL(`${YOUTUBE_ANALYTICS_API}/reports`);
    url.searchParams.set("ids", `channel==${channelId}`);
    url.searchParams.set("startDate", startDate);
    url.searchParams.set("endDate", endDate);
    url.searchParams.set("metrics", metrics.join(","));
    url.searchParams.set("filters", `video==${videoId}`);
    if (dimension) {
      url.searchParams.set("dimensions", dimension);
      url.searchParams.set("sort", dimension);
    }

    const data = await googleFetchWithAutoRefresh<{
      columnHeaders: Array<{ name: string }>;
      rows?: Array<Array<string | number>>;
    }>(ga, url.toString());

    if (!data.rows || data.rows.length === 0) return [];

    const headers = data.columnHeaders.map((h) => h.name);

    return data.rows.map((row) => {
      const obj: Record<string, string | number | null> = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] ?? null;
      });

      return {
        date: String(obj.day ?? startDate),
        views: Number(obj.views ?? 0),
        engagedViews: obj.engagedViews != null ? Number(obj.engagedViews) : null,
        likes: obj.likes != null ? Number(obj.likes) : null,
        comments: obj.comments != null ? Number(obj.comments) : null,
        shares: obj.shares != null ? Number(obj.shares) : null,
        estimatedMinutesWatched: obj.estimatedMinutesWatched != null ? Number(obj.estimatedMinutesWatched) : null,
        averageViewDuration: obj.averageViewDuration != null ? Math.round(Number(obj.averageViewDuration)) : null,
        averageViewPercentage: obj.averageViewPercentage != null ? Number(obj.averageViewPercentage) : null,
        subscribersGained: obj.subscribersGained != null ? Number(obj.subscribersGained) : null,
        subscribersLost: obj.subscribersLost != null ? Number(obj.subscribersLost) : null,
        videosAddedToPlaylists: obj.videosAddedToPlaylists != null ? Number(obj.videosAddedToPlaylists) : null,
        videosRemovedFromPlaylists: obj.videosRemovedFromPlaylists != null ? Number(obj.videosRemovedFromPlaylists) : null,
        estimatedRevenue: obj.estimatedRevenue != null ? Number(obj.estimatedRevenue) : null,
        estimatedAdRevenue: obj.estimatedAdRevenue != null ? Number(obj.estimatedAdRevenue) : null,
        grossRevenue: obj.grossRevenue != null ? Number(obj.grossRevenue) : null,
        monetizedPlaybacks: obj.monetizedPlaybacks != null ? Number(obj.monetizedPlaybacks) : null,
        playbackBasedCpm: obj.playbackBasedCpm != null ? Number(obj.playbackBasedCpm) : null,
        adImpressions: obj.adImpressions != null ? Number(obj.adImpressions) : null,
        cpm: obj.cpm != null ? Number(obj.cpm) : null,
      };
    });
  } catch (err) {
    console.error(`Analytics fetch failed for metrics ${metrics.join(",")}:`, err);
    return null;
  }
}

/**
 * Try to fetch totals without dimension (aggregated)
 */
async function tryFetchAnalyticsTotals(
  ga: GoogleAccount,
  channelId: string,
  videoId: string,
  startDate: string,
  endDate: string,
  metrics: string[]
): Promise<Omit<DailyAnalyticsRow, "date"> | null> {
  const result = await tryFetchAnalytics(ga, channelId, videoId, startDate, endDate, metrics, null);
  if (!result || result.length === 0) return null;
  return result[0];
}

/**
 * Fetch video metadata from YouTube Data API
 */
export async function fetchOwnedVideoMetadata(
  ga: GoogleAccount,
  videoId: string
): Promise<VideoMetadata | null> {
  try {
    const url = new URL(`${YOUTUBE_DATA_API}/videos`);
    url.searchParams.set("part", "snippet,contentDetails,statistics,topicDetails");
    url.searchParams.set("id", videoId);

    const data = await googleFetchWithAutoRefresh<{
      items?: Array<{
        id: string;
        snippet: {
          title: string;
          description: string;
          publishedAt: string;
          tags?: string[];
          categoryId?: string;
          thumbnails: {
            maxres?: { url: string };
            high?: { url: string };
            default?: { url: string };
          };
        };
        contentDetails: {
          duration: string;
        };
        statistics: {
          viewCount?: string;
          likeCount?: string;
          commentCount?: string;
        };
        topicDetails?: {
          topicCategories?: string[];
        };
      }>;
    }>(ga, url.toString());

    const item = data.items?.[0];
    if (!item) return null;

    return {
      videoId: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      tags: item.snippet.tags ?? [],
      categoryId: item.snippet.categoryId ?? null,
      thumbnailUrl:
        item.snippet.thumbnails?.maxres?.url ??
        item.snippet.thumbnails?.high?.url ??
        item.snippet.thumbnails?.default?.url ??
        null,
      durationSec: parseDuration(item.contentDetails.duration),
      viewCount: parseInt(item.statistics.viewCount ?? "0", 10),
      likeCount: parseInt(item.statistics.likeCount ?? "0", 10),
      commentCount: parseInt(item.statistics.commentCount ?? "0", 10),
      topicCategories: item.topicDetails?.topicCategories ?? [],
    };
  } catch (err) {
    console.error("Failed to fetch video metadata:", err);
    return null;
  }
}

export type VideoMetadata = {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  tags: string[];
  categoryId: string | null;
  thumbnailUrl: string | null;
  durationSec: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  topicCategories: string[];
};

/**
 * Fetch top comments for a video (for LLM analysis context)
 */
export async function fetchOwnedVideoComments(
  ga: GoogleAccount,
  videoId: string,
  maxResults: number = 30
): Promise<VideoComment[]> {
  try {
    const url = new URL(`${YOUTUBE_DATA_API}/commentThreads`);
    url.searchParams.set("part", "snippet");
    url.searchParams.set("videoId", videoId);
    url.searchParams.set("maxResults", String(maxResults));
    url.searchParams.set("order", "relevance");
    url.searchParams.set("textFormat", "plainText");

    const data = await googleFetchWithAutoRefresh<{
      items?: Array<{
        snippet: {
          topLevelComment: {
            snippet: {
              authorDisplayName: string;
              textDisplay: string;
              likeCount: number;
              publishedAt: string;
            };
          };
        };
      }>;
    }>(ga, url.toString());

    return (data.items ?? []).map((item) => ({
      author: item.snippet.topLevelComment.snippet.authorDisplayName,
      text: item.snippet.topLevelComment.snippet.textDisplay,
      likes: item.snippet.topLevelComment.snippet.likeCount,
      publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
    }));
  } catch (err) {
    // Comments may be disabled
    console.error("Failed to fetch comments:", err);
    return [];
  }
}

export type VideoComment = {
  author: string;
  text: string;
  likes: number;
  publishedAt: string;
};

/**
 * Parse ISO 8601 duration (PT1H30M45S) to seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] ?? "0", 10);
  const minutes = parseInt(match[2] ?? "0", 10);
  const seconds = parseInt(match[3] ?? "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Get date range strings for a given range type
 */
export function getDateRange(range: "7d" | "28d" | "90d"): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();

  switch (range) {
    case "7d":
      startDate.setDate(endDate.getDate() - 7);
      break;
    case "28d":
      startDate.setDate(endDate.getDate() - 28);
      break;
    case "90d":
      startDate.setDate(endDate.getDate() - 90);
      break;
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
}


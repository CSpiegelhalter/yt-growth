/**
 * YouTube Analytics API client for owned videos (server-only)
 *
 * Fetches detailed analytics metrics that are only available for the authenticated user's own channel.
 * Uses stored OAuth tokens and handles automatic refresh.
 *
 * NOTE: This module should only be used on the server side (API routes, server components).
 */
import {
  googleFetchWithAutoRefresh,
  GoogleTokenRefreshError,
} from "@/lib/google-tokens";

const YOUTUBE_ANALYTICS_API = "https://youtubeanalytics.googleapis.com/v2";
const YOUTUBE_DATA_API = "https://www.googleapis.com/youtube/v3";

type GoogleAccount = {
  id: number;
  refreshTokenEnc: string | null;
  accessTokenEnc?: string | null;
  tokenExpiresAt: Date | null;
};

type AnalyticsPermissionStatus =
  | { ok: true }
  | {
      ok: false;
      reason: "permission_denied";
      message?: string;
    };

// Metrics we attempt to fetch (some may not be available for all channels)
const CORE_METRICS = [
  "views",
  "likes",
  "dislikes",
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

const ENGAGEMENT_METRICS = [
  "engagedViews",
  "redViews", // YouTube Premium views
  "cardClicks",
  "cardImpressions",
  "cardClickRate",
  "annotationClicks",
  "annotationImpressions",
  "annotationClickThroughRate",
];

// Monetization metrics require yt-analytics-monetary.readonly scope
// We don't use these currently, so they're commented out to avoid permission errors
// const MONETIZATION_METRICS = [
//   "estimatedRevenue",
//   "estimatedAdRevenue",
//   "grossRevenue",
//   "monetizedPlaybacks",
//   "playbackBasedCpm",
//   "adImpressions",
//   "cpm",
// ];

export type DailyAnalyticsRow = {
  date: string; // YYYY-MM-DD
  views: number;
  engagedViews: number | null;
  likes: number | null;
  dislikes: number | null;
  comments: number | null;
  shares: number | null;
  estimatedMinutesWatched: number | null;
  averageViewDuration: number | null;
  averageViewPercentage: number | null;
  subscribersGained: number | null;
  subscribersLost: number | null;
  videosAddedToPlaylists: number | null;
  videosRemovedFromPlaylists: number | null;
  // YouTube Premium metrics
  redViews: number | null;
  // Card & End Screen performance
  cardClicks: number | null;
  cardImpressions: number | null;
  cardClickRate: number | null;
  annotationClicks: number | null;
  annotationImpressions: number | null;
  annotationClickThroughRate: number | null;
  // Monetization
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
  const { rows } = await fetchVideoAnalyticsDailyWithStatus(
    ga,
    channelId,
    videoId,
    startDate,
    endDate
  );
  return rows;
}

/**
 * Fetch daily analytics for a single video + permission status
 * (Used by owned-video insights route to fail fast when scopes are missing)
 */
export async function fetchVideoAnalyticsDailyWithStatus(
  ga: GoogleAccount,
  channelId: string,
  videoId: string,
  startDate: string,
  endDate: string
): Promise<{
  rows: DailyAnalyticsRow[];
  permission: AnalyticsPermissionStatus;
}> {
  // Try with all available metrics (no monetization - requires separate scope)
  const allMetrics = [...CORE_METRICS, ...ENGAGEMENT_METRICS];

  const attempts: Array<string[]> = [allMetrics, CORE_METRICS];

  let sawPermissionDenied = false;
  let permissionMessage: string | undefined;

  for (const metrics of attempts) {
    const result = await tryFetchAnalyticsWithStatus(
      ga,
      channelId,
      videoId,
      startDate,
      endDate,
      metrics,
      "day"
    );
    if (result.ok) {
      return { rows: result.rows, permission: { ok: true } };
    }
    if (result.reason === "permission_denied") {
      sawPermissionDenied = true;
      permissionMessage = result.message;
      continue;
    }
  }

  return {
    rows: [],
    permission: sawPermissionDenied
      ? { ok: false, reason: "permission_denied", message: permissionMessage }
      : { ok: true },
  };
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
  const { totals } = await fetchVideoAnalyticsTotalsWithStatus(
    ga,
    channelId,
    videoId,
    startDate,
    endDate
  );
  if (!totals) return null;

  // Calculate days in range
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysInRange = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  return {
    ...totals,
    startDate,
    endDate,
    daysInRange,
    date: startDate, // Use startDate as the "date" for type compatibility
  };
}

/**
 * Fetch totals for a single video + permission status
 */
export async function fetchVideoAnalyticsTotalsWithStatus(
  ga: GoogleAccount,
  channelId: string,
  videoId: string,
  startDate: string,
  endDate: string
): Promise<{
  totals: AnalyticsTotals | null;
  permission: AnalyticsPermissionStatus;
}> {
  // No monetization metrics - requires separate scope we don't request
  const allMetrics = [...CORE_METRICS, ...ENGAGEMENT_METRICS];

  const attempts: Array<string[]> = [allMetrics, CORE_METRICS];

  let sawPermissionDenied = false;
  let permissionMessage: string | undefined;

  for (const metrics of attempts) {
    const result = await tryFetchAnalyticsTotalsWithStatus(
      ga,
      channelId,
      videoId,
      startDate,
      endDate,
      metrics
    );
    if (result.ok) {
      if (!result.totals) continue;
      const totalsRaw = result.totals;
      // Calculate days in range
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysInRange = Math.max(
        1,
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      );

      return {
        totals: {
          ...totalsRaw,
          startDate,
          endDate,
          daysInRange,
          date: startDate,
        },
        permission: { ok: true },
      };
    }
    if (result.reason === "permission_denied") {
      sawPermissionDenied = true;
      permissionMessage = result.message;
      continue;
    }
  }

  return {
    totals: null,
    permission: sawPermissionDenied
      ? { ok: false, reason: "permission_denied", message: permissionMessage }
      : { ok: true },
  };
}

/**
 * Try to fetch analytics with a specific set of metrics
 */
async function tryFetchAnalyticsWithStatus(
  ga: GoogleAccount,
  channelId: string,
  videoId: string,
  startDate: string,
  endDate: string,
  metrics: string[],
  dimension: "day" | null
): Promise<
  | { ok: true; rows: DailyAnalyticsRow[] }
  | { ok: false; reason: "permission_denied" | "other"; message?: string }
> {
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

    if (!data.rows || data.rows.length === 0) return { ok: true, rows: [] };

    const headers = data.columnHeaders.map((h) => h.name);

    return {
      ok: true,
      rows: data.rows.map((row) => {
        const obj: Record<string, string | number | null> = {};
        headers.forEach((h, i) => {
          obj[h] = row[i] ?? null;
        });

        return {
          date: String(obj.day ?? startDate),
          views: Number(obj.views ?? 0),
          engagedViews:
            obj.engagedViews != null ? Number(obj.engagedViews) : null,
          likes: obj.likes != null ? Number(obj.likes) : null,
          dislikes: obj.dislikes != null ? Number(obj.dislikes) : null,
          comments: obj.comments != null ? Number(obj.comments) : null,
          shares: obj.shares != null ? Number(obj.shares) : null,
          estimatedMinutesWatched:
            obj.estimatedMinutesWatched != null
              ? Number(obj.estimatedMinutesWatched)
              : null,
          averageViewDuration:
            obj.averageViewDuration != null
              ? Math.round(Number(obj.averageViewDuration))
              : null,
          averageViewPercentage:
            obj.averageViewPercentage != null
              ? Number(obj.averageViewPercentage)
              : null,
          subscribersGained:
            obj.subscribersGained != null
              ? Number(obj.subscribersGained)
              : null,
          subscribersLost:
            obj.subscribersLost != null ? Number(obj.subscribersLost) : null,
          videosAddedToPlaylists:
            obj.videosAddedToPlaylists != null
              ? Number(obj.videosAddedToPlaylists)
              : null,
          videosRemovedFromPlaylists:
            obj.videosRemovedFromPlaylists != null
              ? Number(obj.videosRemovedFromPlaylists)
              : null,
          // YouTube Premium
          redViews: obj.redViews != null ? Number(obj.redViews) : null,
          // Card & End Screen
          cardClicks: obj.cardClicks != null ? Number(obj.cardClicks) : null,
          cardImpressions:
            obj.cardImpressions != null ? Number(obj.cardImpressions) : null,
          cardClickRate:
            obj.cardClickRate != null ? Number(obj.cardClickRate) : null,
          annotationClicks:
            obj.annotationClicks != null ? Number(obj.annotationClicks) : null,
          annotationImpressions:
            obj.annotationImpressions != null
              ? Number(obj.annotationImpressions)
              : null,
          annotationClickThroughRate:
            obj.annotationClickThroughRate != null
              ? Number(obj.annotationClickThroughRate)
              : null,
          // Monetization
          estimatedRevenue:
            obj.estimatedRevenue != null ? Number(obj.estimatedRevenue) : null,
          estimatedAdRevenue:
            obj.estimatedAdRevenue != null
              ? Number(obj.estimatedAdRevenue)
              : null,
          grossRevenue:
            obj.grossRevenue != null ? Number(obj.grossRevenue) : null,
          monetizedPlaybacks:
            obj.monetizedPlaybacks != null
              ? Number(obj.monetizedPlaybacks)
              : null,
          playbackBasedCpm:
            obj.playbackBasedCpm != null ? Number(obj.playbackBasedCpm) : null,
          adImpressions:
            obj.adImpressions != null ? Number(obj.adImpressions) : null,
          cpm: obj.cpm != null ? Number(obj.cpm) : null,
        };
      }),
    };
  } catch (err: any) {
    // Re-throw auth errors so they trigger the reconnect prompt
    if (err instanceof GoogleTokenRefreshError) {
      throw err;
    }
    // Analytics metric permission errors (e.g., requesting monetization metrics without scope)
    // Return permission_denied so the fallback logic can try with fewer metrics
    if (err?.isAnalyticsPermError) {
      // Permission denied for these metrics - fallback logic will try with fewer metrics
      return { ok: false, reason: "permission_denied", message: err?.message };
    }
    // Clean error message for scope/permission issues
    if (err?.isScopeError || err?.message?.includes("SCOPE_ERROR")) {
      console.warn(
        `[Analytics] Permission denied - user may have declined required scopes`
      );
      return { ok: false, reason: "permission_denied", message: err?.message };
    } else {
      console.error(
        `[Analytics] Fetch failed for metrics ${metrics.join(",")}:`,
        err?.message || err
      );
      return { ok: false, reason: "other", message: err?.message };
    }
  }
}

/**
 * Try to fetch totals without dimension (aggregated)
 */
async function tryFetchAnalyticsTotalsWithStatus(
  ga: GoogleAccount,
  channelId: string,
  videoId: string,
  startDate: string,
  endDate: string,
  metrics: string[]
): Promise<
  | { ok: true; totals: Omit<DailyAnalyticsRow, "date"> | null }
  | { ok: false; reason: "permission_denied" | "other"; message?: string }
> {
  const result = await tryFetchAnalyticsWithStatus(
    ga,
    channelId,
    videoId,
    startDate,
    endDate,
    metrics,
    null
  );
  if (!result.ok) return result;
  if (!result.rows || result.rows.length === 0)
    return { ok: true, totals: null };
  return { ok: true, totals: result.rows[0] as any };
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
    url.searchParams.set(
      "part",
      "snippet,contentDetails,statistics,topicDetails"
    );
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
    // Re-throw auth errors so they trigger the reconnect prompt
    if (err instanceof GoogleTokenRefreshError) {
      throw err;
    }
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
  } catch (err: any) {
    // Re-throw auth errors so they trigger the reconnect prompt
    if (err instanceof GoogleTokenRefreshError) {
      throw err;
    }

    const msg = String(err?.message ?? err ?? "");

    // Clean error message for scope/permission issues
    if (err?.isScopeError || err?.message?.includes("SCOPE_ERROR")) {
      console.warn(
        `[Comments] Permission denied - user may have declined youtube.force-ssl scope`
      );
      return [];
    }

    // Explicit handling: comments disabled for this video (NOT a permission issue)
    // YouTube returns 403 with reason "commentsDisabled"
    if (msg.includes("commentsDisabled") || msg.includes("disabled comments")) {
      console.info(
        `[Comments] Disabled for this video (${videoId}); skipping comments fetch`
      );
      return [];
    }

    // If the error is wrapped as google_api_error_403: {json}, parse it for reason=commentsDisabled
    if (msg.startsWith("google_api_error_403:")) {
      const jsonPart = msg.slice("google_api_error_403:".length).trim();
      try {
        const parsed = JSON.parse(jsonPart) as any;
        const reasons: string[] =
          parsed?.error?.errors
            ?.map((e: any) => String(e?.reason ?? ""))
            .filter(Boolean) ?? [];
        if (reasons.includes("commentsDisabled")) {
          console.info(
            `[Comments] Disabled for this video (${videoId}); skipping comments fetch`
          );
          return [];
        }
      } catch {
        // ignore parse failure; fall through to generic warning
      }
    }

    // Other errors (quota, transient, etc.)
    console.warn(`[Comments] Could not fetch (video ${videoId})`);
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
export function getDateRange(range: "7d" | "28d" | "90d"): {
  startDate: string;
  endDate: string;
} {
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

// ============================================
// DISCOVERY METRICS (Impressions, CTR, Traffic Sources)
// ============================================

export type TrafficSourceBreakdown = {
  browse: number | null;
  suggested: number | null;
  search: number | null;
  external: number | null;
  notifications: number | null;
  other: number | null;
  total: number | null;
};

export type DiscoveryMetrics = {
  impressions: number | null;
  impressionsCtr: number | null;
  trafficSources: TrafficSourceBreakdown | null;
  hasData: boolean;
  reason?: string;
};

/**
 * Fetch discovery metrics (impressions, CTR, traffic sources) for a video
 * These require yt-analytics.readonly scope
 */
export async function fetchVideoDiscoveryMetrics(
  ga: GoogleAccount,
  channelId: string,
  videoId: string,
  startDate: string,
  endDate: string
): Promise<DiscoveryMetrics> {
  const noData: DiscoveryMetrics = {
    impressions: null,
    impressionsCtr: null,
    trafficSources: null,
    hasData: false,
    reason: "connect_analytics",
  };

  try {
    // Fetch impressions and CTR
    const impressionsUrl = new URL(`${YOUTUBE_ANALYTICS_API}/reports`);
    impressionsUrl.searchParams.set("ids", `channel==${channelId}`);
    impressionsUrl.searchParams.set("startDate", startDate);
    impressionsUrl.searchParams.set("endDate", endDate);
    impressionsUrl.searchParams.set("metrics", "views,annotationImpressions");
    impressionsUrl.searchParams.set("filters", `video==${videoId}`);

    // Fetch traffic sources by insightTrafficSourceType
    const trafficUrl = new URL(`${YOUTUBE_ANALYTICS_API}/reports`);
    trafficUrl.searchParams.set("ids", `channel==${channelId}`);
    trafficUrl.searchParams.set("startDate", startDate);
    trafficUrl.searchParams.set("endDate", endDate);
    trafficUrl.searchParams.set("metrics", "views");
    trafficUrl.searchParams.set("dimensions", "insightTrafficSourceType");
    trafficUrl.searchParams.set("filters", `video==${videoId}`);

    const [impressionsData, trafficData] = await Promise.all([
      googleFetchWithAutoRefresh<{
        columnHeaders: Array<{ name: string }>;
        rows?: Array<Array<string | number>>;
      }>(ga, impressionsUrl.toString()).catch(() => null),
      googleFetchWithAutoRefresh<{
        columnHeaders: Array<{ name: string }>;
        rows?: Array<Array<string | number>>;
      }>(ga, trafficUrl.toString()).catch(() => null),
    ]);

    let impressions: number | null = null;
    let impressionsCtr: number | null = null;

    // Parse impressions data
    // Note: YouTube Analytics doesn't directly provide "impressions" for videos
    // We use annotationImpressions as a proxy (end screen impressions)
    // True impressions would require the YouTube Studio API (not public)
    if (impressionsData?.rows && impressionsData.rows.length > 0) {
      const headers = impressionsData.columnHeaders.map((h) => h.name);
      const row = impressionsData.rows[0];
      const viewsIdx = headers.indexOf("views");
      const impIdx = headers.indexOf("annotationImpressions");

      if (viewsIdx >= 0) {
        const views = Number(row[viewsIdx] ?? 0);
        // Estimate impressions from views (typical CTR is 2-10%)
        // This is an approximation; real impressions require YouTube Studio access
        impressions = views > 0 ? Math.round(views / 0.05) : null; // Assume ~5% CTR
      }
      if (impIdx >= 0 && viewsIdx >= 0) {
        const annImp = Number(row[impIdx] ?? 0);
        const views = Number(row[viewsIdx] ?? 0);
        if (annImp > 0 && views > 0) {
          // This is actually end screen impressions, but we can derive a rough CTR
          impressionsCtr = (views / annImp) * 100;
        }
      }
    }

    // Parse traffic sources
    let trafficSources: TrafficSourceBreakdown | null = null;
    if (trafficData?.rows && trafficData.rows.length > 0) {
      const sources: TrafficSourceBreakdown = {
        browse: null,
        suggested: null,
        search: null,
        external: null,
        notifications: null,
        other: null,
        total: 0,
      };

      for (const row of trafficData.rows) {
        const sourceType = String(row[0] ?? "").toUpperCase();
        const views = Number(row[1] ?? 0);
        sources.total = (sources.total ?? 0) + views;

        // Map YouTube traffic source types
        if (sourceType.includes("BROWSE") || sourceType.includes("HOME")) {
          sources.browse = (sources.browse ?? 0) + views;
        } else if (
          sourceType.includes("SUGGESTED") ||
          sourceType.includes("RELATED")
        ) {
          sources.suggested = (sources.suggested ?? 0) + views;
        } else if (
          sourceType.includes("SEARCH") ||
          sourceType.includes("YT_SEARCH")
        ) {
          sources.search = (sources.search ?? 0) + views;
        } else if (
          sourceType.includes("EXTERNAL") ||
          sourceType.includes("EXT_URL")
        ) {
          sources.external = (sources.external ?? 0) + views;
        } else if (sourceType.includes("NOTIFICATION")) {
          sources.notifications = (sources.notifications ?? 0) + views;
        } else {
          sources.other = (sources.other ?? 0) + views;
        }
      }

      trafficSources = sources;
    }

    return {
      impressions,
      impressionsCtr,
      trafficSources,
      hasData: impressions != null || trafficSources != null,
    };
  } catch (err: any) {
    // Re-throw auth errors
    if (err instanceof GoogleTokenRefreshError) {
      throw err;
    }

    // Permission denied - user needs to connect analytics
    if (err?.isScopeError || err?.message?.includes("permission")) {
      return { ...noData, reason: "connect_analytics" };
    }

    console.warn("[Discovery] Failed to fetch discovery metrics:", err?.message);
    return noData;
  }
}

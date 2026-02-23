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
import type {
  AnalyticsTotals,
  DailyAnalyticsRow,
  DemographicBreakdown,
  GeographicBreakdown,
  SubscriberBreakdown,
  TrafficSourceDetail,
  VideoMetadata,
} from "@/lib/ports/YouTubePort";
import { getDateRange } from "@/lib/shared/date-range";

import { YOUTUBE_ANALYTICS_API, YOUTUBE_DATA_API } from "./constants";
import type { GoogleAccount } from "./types";
import { parseDuration } from "./utils";

type AnalyticsApiError = Error & {
  isAnalyticsPermError?: boolean;
  isScopeError?: boolean;
};

function isAnalyticsApiError(err: unknown): err is AnalyticsApiError {
  return err instanceof Error;
}

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

// ---------------------------------------------------------------------------
// Shared parsing helpers
// ---------------------------------------------------------------------------

function mapRowToRecord(
  headers: string[],
  row: Array<string | number>,
): Record<string, string | number | null> {
  const obj: Record<string, string | number | null> = {};
  for (const [i, header] of headers.entries()) {
    obj[header] = row[i] ?? null;
  }
  return obj;
}

function numOrNull(
  obj: Record<string, string | number | null>,
  key: string,
): number | null {
  return obj[key] != null ? Number(obj[key]) : null;
}

function mapAnalyticsRowToDaily(
  obj: Record<string, string | number | null>,
  fallbackDate: string,
): DailyAnalyticsRow {
  return {
    date: String(obj.day ?? fallbackDate),
    views: Number(obj.views ?? 0),
    engagedViews: numOrNull(obj, "engagedViews"),
    likes: numOrNull(obj, "likes"),
    dislikes: numOrNull(obj, "dislikes"),
    comments: numOrNull(obj, "comments"),
    shares: numOrNull(obj, "shares"),
    estimatedMinutesWatched: numOrNull(obj, "estimatedMinutesWatched"),
    averageViewDuration:
      obj.averageViewDuration != null
        ? Math.round(Number(obj.averageViewDuration))
        : null,
    averageViewPercentage: numOrNull(obj, "averageViewPercentage"),
    subscribersGained: numOrNull(obj, "subscribersGained"),
    subscribersLost: numOrNull(obj, "subscribersLost"),
    videosAddedToPlaylists: numOrNull(obj, "videosAddedToPlaylists"),
    videosRemovedFromPlaylists: numOrNull(obj, "videosRemovedFromPlaylists"),
    redViews: numOrNull(obj, "redViews"),
    cardClicks: numOrNull(obj, "cardClicks"),
    cardImpressions: numOrNull(obj, "cardImpressions"),
    cardClickRate: numOrNull(obj, "cardClickRate"),
    annotationClicks: numOrNull(obj, "annotationClicks"),
    annotationImpressions: numOrNull(obj, "annotationImpressions"),
    annotationClickThroughRate: numOrNull(obj, "annotationClickThroughRate"),
    estimatedRevenue: numOrNull(obj, "estimatedRevenue"),
    estimatedAdRevenue: numOrNull(obj, "estimatedAdRevenue"),
    grossRevenue: numOrNull(obj, "grossRevenue"),
    monetizedPlaybacks: numOrNull(obj, "monetizedPlaybacks"),
    playbackBasedCpm: numOrNull(obj, "playbackBasedCpm"),
    adImpressions: numOrNull(obj, "adImpressions"),
    cpm: numOrNull(obj, "cpm"),
  };
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

function isCommentsDisabledFromMsg(msg: string): boolean {
  if (msg.includes("commentsDisabled") || msg.includes("disabled comments")) {
    return true;
  }
  if (!msg.startsWith("google_api_error_403:")) { return false; }
  const jsonPart = msg.slice("google_api_error_403:".length).trim();
  try {
    const parsed = JSON.parse(jsonPart) as {
      error?: { errors?: Array<{ reason?: string }> };
    };
    const reasons =
      parsed?.error?.errors
        ?.map((e) => String(e?.reason ?? ""))
        .filter(Boolean) ?? [];
    return reasons.includes("commentsDisabled");
  } catch {
    return false;
  }
}

// DailyAnalyticsRow and AnalyticsTotals re-exported from @/lib/ports/YouTubePort above

/**
 * Fetch daily analytics for a single video + permission status
 * (Used by owned-video insights route to fail fast when scopes are missing)
 */
export async function fetchVideoAnalyticsDailyWithStatus(
  ga: GoogleAccount,
  channelId: string,
  videoId: string,
  startDate: string,
  endDate: string,
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
      "day",
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
 * Fetch totals for a single video + permission status
 */
export async function fetchVideoAnalyticsTotalsWithStatus(
  ga: GoogleAccount,
  channelId: string,
  videoId: string,
  startDate: string,
  endDate: string,
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
      metrics,
    );
    if (result.ok) {
      if (!result.totals) {continue;}
      const totalsRaw = result.totals;
      // Calculate days in range
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysInRange = Math.max(
        1,
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
          1,
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
  dimension: "day" | null,
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

    if (!data.rows || data.rows.length === 0) {return { ok: true, rows: [] };}

    const headers = data.columnHeaders.map((h) => h.name);

    return {
      ok: true,
      rows: data.rows.map((row) =>
        mapAnalyticsRowToDaily(mapRowToRecord(headers, row), startDate),
      ),
    };
  } catch (error: unknown) {
    if (error instanceof GoogleTokenRefreshError) {
      throw error;
    }
    const errMsg = error instanceof Error ? error.message : String(error ?? "");
    if (isAnalyticsApiError(error) && error.isAnalyticsPermError) {
      return { ok: false, reason: "permission_denied", message: errMsg };
    }
    if (isAnalyticsApiError(error) && (error.isScopeError || errMsg.includes("SCOPE_ERROR"))) {
      console.warn(
        `[Analytics] Permission denied - user may have declined required scopes`,
      );
      return { ok: false, reason: "permission_denied", message: errMsg };
    }
    console.error(
      `[Analytics] Fetch failed for metrics ${metrics.join(",")}:`,
      errMsg,
    );
    return { ok: false, reason: "other", message: errMsg };
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
  metrics: string[],
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
    null,
  );
  if (!result.ok) {return result;}
  if (!result.rows || result.rows.length === 0)
    {return { ok: true, totals: null };}
  return { ok: true, totals: result.rows[0] as Omit<DailyAnalyticsRow, "date"> };
}

/**
 * Fetch video metadata from YouTube Data API
 */
export async function fetchOwnedVideoMetadata(
  ga: GoogleAccount,
  videoId: string,
): Promise<VideoMetadata | null> {
  try {
    const url = new URL(`${YOUTUBE_DATA_API}/videos`);
    url.searchParams.set(
      "part",
      "snippet,contentDetails,statistics,topicDetails",
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
    if (!item) {return null;}

    return {
      videoId: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      tags: item.snippet.tags ?? [],
      categoryId: item.snippet.categoryId ?? null,
      thumbnailUrl: pickBestThumbnail(item.snippet.thumbnails),
      durationSec: parseDuration(item.contentDetails.duration),
      viewCount: parseIntStat(item.statistics.viewCount),
      likeCount: parseIntStat(item.statistics.likeCount),
      commentCount: parseIntStat(item.statistics.commentCount),
      topicCategories: item.topicDetails?.topicCategories ?? [],
    };
  } catch (error) {
    // Re-throw auth errors so they trigger the reconnect prompt
    if (error instanceof GoogleTokenRefreshError) {
      throw error;
    }
    console.error("Failed to fetch video metadata:", error);
    return null;
  }
}

// VideoMetadata re-exported from @/lib/ports/YouTubePort above

/**
 * Fetch top comments for a video (for LLM analysis context)
 */
export async function fetchOwnedVideoComments(
  ga: GoogleAccount,
  videoId: string,
  maxResults: number = 30,
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
  } catch (error: unknown) {
    if (error instanceof GoogleTokenRefreshError) {
      throw error;
    }

    const msg = error instanceof Error ? error.message : String(error ?? "");

    if ((isAnalyticsApiError(error) && error.isScopeError) || msg.includes("SCOPE_ERROR")) {
      console.warn(`[Comments] Permission denied - user may have declined youtube.force-ssl scope`);
      return [];
    }

    if (isCommentsDisabledFromMsg(msg)) {
      console.info(`[Comments] Disabled for this video (${videoId}); skipping comments fetch`);
      return [];
    }

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


// getDateRange re-exported from @/lib/shared/date-range above

// ============================================
// DISCOVERY METRICS (Impressions, CTR, Traffic Sources)
// ============================================

type TrafficSourceBreakdown = {
  browse: number | null;
  suggested: number | null;
  search: number | null;
  external: number | null;
  notifications: number | null;
  other: number | null;
  total: number | null;
};

// ============================================
// TRAFFIC SOURCE CTR (for audit)
// ============================================

type TrafficSourceCTR = {
  browse: { views: number; ctr: number | null } | null;
  suggested: { views: number; ctr: number | null } | null;
  search: { views: number; ctr: number | null } | null;
  external: { views: number; ctr: number | null } | null;
  total: { views: number; ctr: number | null };
};

// ============================================
// VIEWER TYPE METRICS (Returning vs New)
// ============================================

type ViewerTypeMetrics = {
  returning: {
    views: number;
    percentage: number;
    avgViewDuration: number | null;
  } | null;
  new: {
    views: number;
    percentage: number;
    avgViewDuration: number | null;
  } | null;
  subscribers: {
    views: number;
    percentage: number;
  } | null;
};

// ============================================
// CHANNEL-LEVEL AUDIT METRICS
// ============================================

export type ChannelAuditMetrics = {
  // Aggregate metrics (last 28 days)
  totalViews: number;
  totalWatchTimeMin: number;
  avgViewPercentage: number | null;
  subscribersGained: number;
  subscribersLost: number;
  netSubscribers: number;

  // Discovery
  estimatedImpressions: number | null;
  estimatedCtr: number | null;

  // Traffic sources
  trafficSources: TrafficSourceBreakdown | null;
  trafficSourceCtr: TrafficSourceCTR | null;

  // Viewer types
  viewerTypes: ViewerTypeMetrics | null;

  // End screen performance
  endScreenClicks: number | null;
  endScreenImpressions: number | null;
  endScreenCtr: number | null;

  // Trends (comparing recent 7d to previous 7d)
  viewsTrend: number | null; // % change
  watchTimeTrend: number | null;
  subsTrend: number | null;

  // Video count
  videoCount: number;
  videosInRange: number;
};

type DiscoveryMetrics = {
  impressions: number | null;
  impressionsCtr: number | null;
  trafficSources: TrafficSourceBreakdown | null;
  hasData: boolean;
  reason?: string;
};

// SubscriberBreakdown, GeographicBreakdown, TrafficSourceDetail, DemographicBreakdown
// re-exported from @/lib/ports/YouTubePort above

/**
 * Map insightTrafficSourceType values to our TrafficSourceBreakdown keys.
 * Returns the key to increment, or "other" for unrecognized sources.
 */
const TRAFFIC_SOURCE_MAP: Record<
  string,
  keyof Omit<TrafficSourceBreakdown, "total">
> = {
  BROWSE: "browse",
  YT_BROWSE: "browse",
  HOME: "browse",
  SUGGESTED: "suggested",
  RELATED_VIDEO: "suggested",
  YT_RELATED: "suggested",
  SEARCH: "search",
  YT_SEARCH: "search",
  EXTERNAL: "external",
  EXT_URL: "external",
  NOTIFICATION: "notifications",
  SUBSCRIBER: "notifications",
  PLAYLIST: "other",
  CHANNEL: "other",
  OTHER: "other",
};

function mapTrafficSource(
  sourceType: string,
): keyof Omit<TrafficSourceBreakdown, "total"> {
  const normalized = sourceType.toUpperCase().replaceAll('-', "_");
  // Check exact match first
  if (normalized in TRAFFIC_SOURCE_MAP) {
    return TRAFFIC_SOURCE_MAP[normalized];
  }
  // Fallback: check if the normalized string contains a known key
  for (const [key, bucket] of Object.entries(TRAFFIC_SOURCE_MAP)) {
    if (normalized.includes(key)) {
      return bucket;
    }
  }
  return "other";
}

function parseReachMetrics(
  reachData: {
    columnHeaders: Array<{ name: string }>;
    rows?: Array<Array<string | number>>;
  } | null,
): { impressions: number | null; impressionsCtr: number | null } {
  if (!reachData?.rows || reachData.rows.length === 0) {
    return { impressions: null, impressionsCtr: null };
  }
  const headers = reachData.columnHeaders.map((h) => h.name);
  const row = reachData.rows[0];
  const impIdx = headers.indexOf("videoThumbnailImpressions");
  const ctrIdx = headers.indexOf("videoThumbnailImpressionsClickRate");

  let impressions: number | null = null;
  let impressionsCtr: number | null = null;

  if (impIdx !== -1) {
    const rawImp = Number(row[impIdx] ?? 0);
    impressions = rawImp > 0 ? rawImp : null;
  }
  if (ctrIdx !== -1) {
    const rawCtr = Number(row[ctrIdx] ?? 0);
    impressionsCtr = rawCtr > 0 ? rawCtr * 100 : null;
  }
  return { impressions, impressionsCtr };
}

function parseTrafficSourceRows(
  rows: Array<Array<string | number>>,
): TrafficSourceBreakdown {
  const sources: TrafficSourceBreakdown = {
    browse: null,
    suggested: null,
    search: null,
    external: null,
    notifications: null,
    other: null,
    total: 0,
  };
  for (const row of rows) {
    const sourceType = String(row[0] ?? "");
    const views = Number(row[1] ?? 0);
    sources.total = (sources.total ?? 0) + views;
    const bucket = mapTrafficSource(sourceType);
    sources[bucket] = (sources[bucket] ?? 0) + views;
  }
  return sources;
}

function viewsOrNull(v: number | null): { views: number; ctr: null } | null {
  return v ? { views: v, ctr: null } : null;
}

function buildTrafficSourceCtr(sources: TrafficSourceBreakdown): TrafficSourceCTR {
  return {
    browse: viewsOrNull(sources.browse),
    suggested: viewsOrNull(sources.suggested),
    search: viewsOrNull(sources.search),
    external: viewsOrNull(sources.external),
    total: { views: sources.total ?? 1, ctr: null },
  };
}

function calcPercentChange(current: number, previous: number): number | null {
  if (previous === 0) { return null; }
  return ((current - previous) / Math.abs(previous)) * 100;
}

function buildSubscriberBreakdown(
  data: {
    columnHeaders: Array<{ name: string }>;
    rows?: Array<Array<string | number>>;
  },
): SubscriberBreakdown {
  const noData: SubscriberBreakdown = {
    subscribers: null,
    nonSubscribers: null,
    subscriberViewPct: null,
  };

  if (!data.rows || data.rows.length === 0) { return noData; }

  const headers = data.columnHeaders.map((h) => h.name);
  const statusIdx = headers.indexOf("subscribedStatus");
  const viewsIdx = headers.indexOf("views");
  const avgViewPctIdx = headers.indexOf("averageViewPercentage");

  const byStatus = new Map<string, { views: number; avgViewPct: number }>();
  let totalViews = 0;

  for (const row of data.rows) {
    const status = String(row[statusIdx] ?? "");
    const views = Number(row[viewsIdx] ?? 0);
    totalViews += views;
    byStatus.set(status, { views, avgViewPct: Number(row[avgViewPctIdx] ?? 0) });
  }

  const sub = byStatus.get("SUBSCRIBED");
  const nonSub = byStatus.get("UNSUBSCRIBED");
  const subscriberViewPct =
    totalViews > 0 && sub ? (sub.views / totalViews) * 100 : null;

  return {
    subscribers: sub
      ? { views: sub.views, avgViewPct: sub.avgViewPct, ctr: null }
      : null,
    nonSubscribers: nonSub
      ? { views: nonSub.views, avgViewPct: nonSub.avgViewPct, ctr: null }
      : null,
    subscriberViewPct,
  };
}

/**
 * Fetch discovery metrics (impressions, CTR, traffic sources) for a video.
 * Uses official YouTube Reach metrics: videoThumbnailImpressions and
 * videoThumbnailImpressionsClickRate.
 * Requires yt-analytics.readonly scope.
 */
export async function fetchVideoDiscoveryMetrics(
  ga: GoogleAccount,
  channelId: string,
  videoId: string,
  startDate: string,
  endDate: string,
): Promise<DiscoveryMetrics> {
  const noData: DiscoveryMetrics = {
    impressions: null,
    impressionsCtr: null,
    trafficSources: null,
    hasData: false,
    reason: "connect_analytics",
  };

  try {
    // Fetch official Reach metrics: thumbnail impressions and CTR
    const reachUrl = new URL(`${YOUTUBE_ANALYTICS_API}/reports`);
    reachUrl.searchParams.set("ids", `channel==${channelId}`);
    reachUrl.searchParams.set("startDate", startDate);
    reachUrl.searchParams.set("endDate", endDate);
    reachUrl.searchParams.set(
      "metrics",
      "videoThumbnailImpressions,videoThumbnailImpressionsClickRate",
    );
    reachUrl.searchParams.set("filters", `video==${videoId}`);

    // Fetch traffic sources by insightTrafficSourceType
    const trafficUrl = new URL(`${YOUTUBE_ANALYTICS_API}/reports`);
    trafficUrl.searchParams.set("ids", `channel==${channelId}`);
    trafficUrl.searchParams.set("startDate", startDate);
    trafficUrl.searchParams.set("endDate", endDate);
    trafficUrl.searchParams.set("metrics", "views");
    trafficUrl.searchParams.set("dimensions", "insightTrafficSourceType");
    trafficUrl.searchParams.set("filters", `video==${videoId}`);

    const [reachData, trafficData] = await Promise.all([
      googleFetchWithAutoRefresh<{
        columnHeaders: Array<{ name: string }>;
        rows?: Array<Array<string | number>>;
      }>(ga, reachUrl.toString()).catch(() => null),
      googleFetchWithAutoRefresh<{
        columnHeaders: Array<{ name: string }>;
        rows?: Array<Array<string | number>>;
      }>(ga, trafficUrl.toString()).catch(() => null),
    ]);

    const { impressions, impressionsCtr } = parseReachMetrics(reachData);

    const trafficSources =
      trafficData?.rows && trafficData.rows.length > 0
        ? parseTrafficSourceRows(trafficData.rows)
        : null;

    return {
      impressions,
      impressionsCtr,
      trafficSources,
      hasData: impressions != null || trafficSources != null,
    };
  } catch (error: unknown) {
    if (error instanceof GoogleTokenRefreshError) {
      throw error;
    }

    const errMsg = error instanceof Error ? error.message : String(error);
    if ((isAnalyticsApiError(error) && error.isScopeError) || errMsg.includes("permission")) {
      return { ...noData, reason: "connect_analytics" };
    }

    console.warn("[Discovery] Failed to fetch discovery metrics:", errMsg);
    return noData;
  }
}

// ============================================
// CHANNEL-LEVEL AUDIT METRICS
// ============================================

type ChannelTotals = {
  views: number;
  watchTimeMin: number;
  avgViewPercentage: number | null;
  subscribersGained: number;
  subscribersLost: number;
  netSubscribers: number;
};

const RANGE_DAYS: Record<string, number> = { "7d": 7, "28d": 28, "90d": 90 };

function getPreviousPeriodDates(startDate: string, range: "7d" | "28d" | "90d") {
  const daysInRange = RANGE_DAYS[range] ?? 28;
  const prevEndDate = new Date(startDate);
  prevEndDate.setDate(prevEndDate.getDate() - 1);
  const prevStartDate = new Date(prevEndDate);
  prevStartDate.setDate(prevStartDate.getDate() - daysInRange);
  return {
    prevStartStr: prevStartDate.toISOString().split("T")[0],
    prevEndStr: prevEndDate.toISOString().split("T")[0],
  };
}

function computeAuditTrends(current: ChannelTotals, prev: ChannelTotals | null) {
  return {
    viewsTrend: prev ? calcPercentChange(current.views, prev.views) : null,
    watchTimeTrend: prev ? calcPercentChange(current.watchTimeMin, prev.watchTimeMin) : null,
    subsTrend: prev ? calcPercentChange(current.netSubscribers, prev.netSubscribers) : null,
  };
}

function buildAuditResult(
  current: ChannelTotals,
  prev: ChannelTotals | null,
  trafficData: { sources: TrafficSourceBreakdown; ctr: TrafficSourceCTR } | null,
  endScreenData: { clicks: number; impressions: number; ctr: number | null } | null,
): ChannelAuditMetrics {
  const trends = computeAuditTrends(current, prev);
  return {
    totalViews: current.views,
    totalWatchTimeMin: current.watchTimeMin,
    avgViewPercentage: current.avgViewPercentage,
    subscribersGained: current.subscribersGained,
    subscribersLost: current.subscribersLost,
    netSubscribers: current.netSubscribers,
    estimatedImpressions: current.views > 0 ? Math.round(current.views / 0.05) : null,
    estimatedCtr: 5,
    trafficSources: trafficData?.sources ?? null,
    trafficSourceCtr: trafficData?.ctr ?? null,
    viewerTypes: null,
    endScreenClicks: endScreenData?.clicks ?? null,
    endScreenImpressions: endScreenData?.impressions ?? null,
    endScreenCtr: endScreenData?.ctr ?? null,
    ...trends,
    videoCount: 0,
    videosInRange: 0,
  };
}

/**
 * Fetch channel-level audit metrics (aggregated across all videos)
 * Used for bottleneck detection
 */
export async function fetchChannelAuditMetrics(
  ga: GoogleAccount,
  channelId: string,
  range: "7d" | "28d" | "90d" = "28d",
): Promise<ChannelAuditMetrics | null> {
  try {
    const { startDate, endDate } = getDateRange(range);
    const { prevStartStr, prevEndStr } = getPreviousPeriodDates(startDate, range);

    const [currentTotals, prevTotals, trafficData, endScreenData] =
      await Promise.all([
        fetchChannelTotals(ga, channelId, startDate, endDate),
        fetchChannelTotals(ga, channelId, prevStartStr, prevEndStr),
        fetchChannelTrafficSources(ga, channelId, startDate, endDate),
        fetchChannelEndScreenMetrics(ga, channelId, startDate, endDate),
      ]);

    if (!currentTotals) { return null; }

    return buildAuditResult(currentTotals, prevTotals, trafficData, endScreenData);
  } catch (error: unknown) {
    if (error instanceof GoogleTokenRefreshError) {
      throw error;
    }
    console.error(
      "[ChannelAudit] Failed to fetch audit metrics:",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

/**
 * Fetch channel totals (no video filter)
 */
async function fetchChannelTotals(
  ga: GoogleAccount,
  channelId: string,
  startDate: string,
  endDate: string,
): Promise<{
  views: number;
  watchTimeMin: number;
  avgViewPercentage: number | null;
  subscribersGained: number;
  subscribersLost: number;
  netSubscribers: number;
} | null> {
  try {
    const url = new URL(`${YOUTUBE_ANALYTICS_API}/reports`);
    url.searchParams.set("ids", `channel==${channelId}`);
    url.searchParams.set("startDate", startDate);
    url.searchParams.set("endDate", endDate);
    url.searchParams.set(
      "metrics",
      "views,estimatedMinutesWatched,averageViewPercentage,subscribersGained,subscribersLost",
    );

    const data = await googleFetchWithAutoRefresh<{
      columnHeaders: Array<{ name: string }>;
      rows?: Array<Array<string | number>>;
    }>(ga, url.toString());

    if (!data.rows || data.rows.length === 0) {
      return {
        views: 0,
        watchTimeMin: 0,
        avgViewPercentage: null,
        subscribersGained: 0,
        subscribersLost: 0,
        netSubscribers: 0,
      };
    }

    const headers = data.columnHeaders.map((h) => h.name);
    const row = data.rows[0];

    const getValue = (name: string) => {
      const idx = headers.indexOf(name);
      return idx !== -1 ? Number(row[idx] ?? 0) : 0;
    };

    const subscribersGained = getValue("subscribersGained");
    const subscribersLost = getValue("subscribersLost");

    return {
      views: getValue("views"),
      watchTimeMin: getValue("estimatedMinutesWatched"),
      avgViewPercentage: getValue("averageViewPercentage") || null,
      subscribersGained,
      subscribersLost,
      netSubscribers: subscribersGained - subscribersLost,
    };
  } catch (error) {
    console.warn("[ChannelTotals] Failed:", error);
    return null;
  }
}

/**
 * Fetch channel traffic sources
 */
async function fetchChannelTrafficSources(
  ga: GoogleAccount,
  channelId: string,
  startDate: string,
  endDate: string,
): Promise<{
  sources: TrafficSourceBreakdown;
  ctr: TrafficSourceCTR;
} | null> {
  try {
    const url = new URL(`${YOUTUBE_ANALYTICS_API}/reports`);
    url.searchParams.set("ids", `channel==${channelId}`);
    url.searchParams.set("startDate", startDate);
    url.searchParams.set("endDate", endDate);
    url.searchParams.set("metrics", "views");
    url.searchParams.set("dimensions", "insightTrafficSourceType");

    const data = await googleFetchWithAutoRefresh<{
      columnHeaders: Array<{ name: string }>;
      rows?: Array<Array<string | number>>;
    }>(ga, url.toString());

    const sources = data.rows
      ? parseTrafficSourceRows(data.rows)
      : {
          browse: null,
          suggested: null,
          search: null,
          external: null,
          notifications: null,
          other: null,
          total: 0,
        } satisfies TrafficSourceBreakdown;

    return { sources, ctr: buildTrafficSourceCtr(sources) };
  } catch (error) {
    console.warn("[ChannelTrafficSources] Failed:", error);
    return null;
  }
}

/**
 * Fetch end screen performance
 */
async function fetchChannelEndScreenMetrics(
  ga: GoogleAccount,
  channelId: string,
  startDate: string,
  endDate: string,
): Promise<{ clicks: number; impressions: number; ctr: number } | null> {
  try {
    const url = new URL(`${YOUTUBE_ANALYTICS_API}/reports`);
    url.searchParams.set("ids", `channel==${channelId}`);
    url.searchParams.set("startDate", startDate);
    url.searchParams.set("endDate", endDate);
    url.searchParams.set(
      "metrics",
      "annotationClicks,annotationImpressions,annotationClickThroughRate",
    );

    const data = await googleFetchWithAutoRefresh<{
      columnHeaders: Array<{ name: string }>;
      rows?: Array<Array<string | number>>;
    }>(ga, url.toString());

    if (!data.rows || data.rows.length === 0) {return null;}

    const headers = data.columnHeaders.map((h) => h.name);
    const row = data.rows[0];

    const clicks = Number(row[headers.indexOf("annotationClicks")] ?? 0);
    const impressions = Number(
      row[headers.indexOf("annotationImpressions")] ?? 0,
    );
    const ctr = Number(row[headers.indexOf("annotationClickThroughRate")] ?? 0);

    return { clicks, impressions, ctr };
  } catch (error) {
    console.warn("[ChannelEndScreen] Failed:", error);
    return null;
  }
}

// ============================================
// VIDEO-LEVEL DIMENSIONAL ANALYTICS
// ============================================

/**
 * ISO 3166-1 alpha-2 country code to name mapping (top countries)
 */
const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  IN: "India",
  BR: "Brazil",
  GB: "United Kingdom",
  MX: "Mexico",
  CA: "Canada",
  PH: "Philippines",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  IT: "Italy",
  ES: "Spain",
  AR: "Argentina",
  CO: "Colombia",
  PL: "Poland",
  NL: "Netherlands",
  ID: "Indonesia",
  TR: "Turkey",
  SA: "Saudi Arabia",
  EG: "Egypt",
  TH: "Thailand",
  VN: "Vietnam",
  MY: "Malaysia",
  PK: "Pakistan",
  NG: "Nigeria",
  BD: "Bangladesh",
  JP: "Japan",
  KR: "South Korea",
  RU: "Russia",
  UA: "Ukraine",
};

/**
 * Fetch subscriber vs non-subscriber breakdown for a video
 */
export async function fetchSubscriberBreakdown(
  ga: GoogleAccount,
  channelId: string,
  videoId: string,
  startDate: string,
  endDate: string,
): Promise<SubscriberBreakdown> {
  const noData: SubscriberBreakdown = {
    subscribers: null,
    nonSubscribers: null,
    subscriberViewPct: null,
  };

  try {
    // Fetch views and retention by subscribedStatus
    const url = new URL(`${YOUTUBE_ANALYTICS_API}/reports`);
    url.searchParams.set("ids", `channel==${channelId}`);
    url.searchParams.set("startDate", startDate);
    url.searchParams.set("endDate", endDate);
    url.searchParams.set("metrics", "views,averageViewPercentage,likes,shares");
    url.searchParams.set("dimensions", "subscribedStatus");
    url.searchParams.set("filters", `video==${videoId}`);

    const data = await googleFetchWithAutoRefresh<{
      columnHeaders: Array<{ name: string }>;
      rows?: Array<Array<string | number>>;
    }>(ga, url.toString());

    return buildSubscriberBreakdown(data);
  } catch (error: unknown) {
    if (error instanceof GoogleTokenRefreshError) {
      throw error;
    }
    console.warn("[SubscriberBreakdown] Failed:", error instanceof Error ? error.message : String(error));
    return noData;
  }
}

/**
 * Fetch geographic breakdown for a video (top countries)
 */
export async function fetchGeographicBreakdown(
  ga: GoogleAccount,
  channelId: string,
  videoId: string,
  startDate: string,
  endDate: string,
): Promise<GeographicBreakdown> {
  const noData: GeographicBreakdown = {
    topCountries: [],
    primaryMarket: null,
  };

  try {
    const url = new URL(`${YOUTUBE_ANALYTICS_API}/reports`);
    url.searchParams.set("ids", `channel==${channelId}`);
    url.searchParams.set("startDate", startDate);
    url.searchParams.set("endDate", endDate);
    url.searchParams.set("metrics", "views,averageViewPercentage");
    url.searchParams.set("dimensions", "country");
    url.searchParams.set("filters", `video==${videoId}`);
    url.searchParams.set("sort", "-views");
    url.searchParams.set("maxResults", "10");

    const data = await googleFetchWithAutoRefresh<{
      columnHeaders: Array<{ name: string }>;
      rows?: Array<Array<string | number>>;
    }>(ga, url.toString());

    if (!data.rows || data.rows.length === 0) {
      return noData;
    }

    const headers = data.columnHeaders.map((h) => h.name);
    const countryIdx = headers.indexOf("country");
    const viewsIdx = headers.indexOf("views");
    const avgViewPctIdx = headers.indexOf("averageViewPercentage");

    const totalViews = data.rows.reduce(
      (sum, row) => sum + Number(row[viewsIdx] ?? 0),
      0,
    );

    const topCountries = data.rows.map((row) => {
      const countryCode = String(row[countryIdx] ?? "");
      const views = Number(row[viewsIdx] ?? 0);
      const avgViewPct = Number(row[avgViewPctIdx] ?? 0);
      const viewsPct = totalViews > 0 ? (views / totalViews) * 100 : 0;

      return {
        country: countryCode,
        countryName: COUNTRY_NAMES[countryCode] || countryCode,
        views,
        viewsPct,
        avgViewPct: avgViewPct > 0 ? avgViewPct : null,
      };
    });

    // Determine primary market (country with >40% of views)
    const primaryMarket =
      topCountries[0]?.viewsPct > 40 ? topCountries[0].countryName : null;

    return {
      topCountries,
      primaryMarket,
    };
  } catch (error: unknown) {
    if (error instanceof GoogleTokenRefreshError) {
      throw error;
    }
    console.warn("[GeographicBreakdown] Failed:", error instanceof Error ? error.message : String(error));
    return noData;
  }
}

/**
 * Fetch detailed traffic source breakdown (search terms, suggested videos, etc.)
 *
 * The YouTube Analytics API requires insightTrafficSourceDetail as the ONLY
 * dimension, with insightTrafficSourceType as a required filter. Each traffic
 * source type must be queried separately. maxResults must be <= 25.
 * See: https://developers.google.com/youtube/analytics/v1/channel_reports
 */
export async function fetchTrafficSourceDetail(
  ga: GoogleAccount,
  channelId: string,
  videoId: string,
  startDate: string,
  endDate: string,
): Promise<TrafficSourceDetail> {
  const noData: TrafficSourceDetail = {
    searchTerms: null,
    suggestedVideos: null,
    browseFeatures: null,
  };

  try {
    type DetailRow = { detail: string; views: number };

    async function fetchForSourceType(
      sourceType: string,
    ): Promise<DetailRow[]> {
      const url = new URL(`${YOUTUBE_ANALYTICS_API}/reports`);
      url.searchParams.set("ids", `channel==${channelId}`);
      url.searchParams.set("startDate", startDate);
      url.searchParams.set("endDate", endDate);
      url.searchParams.set("metrics", "views");
      url.searchParams.set("dimensions", "insightTrafficSourceDetail");
      url.searchParams.set(
        "filters",
        `video==${videoId};insightTrafficSourceType==${sourceType}`,
      );
      url.searchParams.set("sort", "-views");
      url.searchParams.set("maxResults", "25");

      const data = await googleFetchWithAutoRefresh<{
        columnHeaders: Array<{ name: string }>;
        rows?: Array<Array<string | number>>;
      }>(ga, url.toString());

      if (!data.rows || data.rows.length === 0) {return [];}

      const headers = data.columnHeaders.map((h) => h.name);
      const detailIdx = headers.indexOf("insightTrafficSourceDetail");
      const viewsIdx = headers.indexOf("views");

      return data.rows
        .map((row) => ({
          detail: String(row[detailIdx] ?? ""),
          views: Number(row[viewsIdx] ?? 0),
        }))
        .filter((r) => r.detail && r.views > 0);
    }

    const [searchRows, relatedRows, browseRows] = await Promise.all([
      fetchForSourceType("YT_SEARCH").catch(() => []),
      fetchForSourceType("RELATED_VIDEO").catch(() => []),
      fetchForSourceType("YT_OTHER_PAGE").catch(() => []),
    ]);

    const searchTerms = searchRows
      .slice(0, 10)
      .map((r) => ({ term: r.detail, views: r.views }));

    const suggestedVideos = relatedRows
      .slice(0, 5)
      .map((r) => {
        const match = r.detail.match(/(?:v=|\/)([\w-]{11})/);
        return { videoId: match ? match[1] : r.detail, views: r.views };
      });

    const browseFeatures = browseRows
      .slice(0, 5)
      .map((r) => ({ feature: r.detail, views: r.views }));

    return {
      searchTerms: searchTerms.length > 0 ? searchTerms : null,
      suggestedVideos: suggestedVideos.length > 0 ? suggestedVideos : null,
      browseFeatures: browseFeatures.length > 0 ? browseFeatures : null,
    };
  } catch (error: unknown) {
    if (error instanceof GoogleTokenRefreshError) {
      throw error;
    }
    console.warn("[TrafficSourceDetail] Failed:", error instanceof Error ? error.message : String(error));
    return noData;
  }
}

/**
 * Fetch demographic breakdown for a video (age and gender)
 * Only call if video has sufficient views (500+)
 */
export async function fetchDemographicBreakdown(
  ga: GoogleAccount,
  channelId: string,
  videoId: string,
  startDate: string,
  endDate: string,
): Promise<DemographicBreakdown> {
  try {
    // Fetch by ageGroup and gender
    const url = new URL(`${YOUTUBE_ANALYTICS_API}/reports`);
    url.searchParams.set("ids", `channel==${channelId}`);
    url.searchParams.set("startDate", startDate);
    url.searchParams.set("endDate", endDate);
    url.searchParams.set("metrics", "views");
    url.searchParams.set("dimensions", "ageGroup,gender");
    url.searchParams.set("filters", `video==${videoId}`);

    const data = await googleFetchWithAutoRefresh<{
      columnHeaders: Array<{ name: string }>;
      rows?: Array<Array<string | number>>;
    }>(ga, url.toString());

    if (!data.rows || data.rows.length === 0) {
      return null;
    }

    const headers = data.columnHeaders.map((h) => h.name);
    const ageIdx = headers.indexOf("ageGroup");
    const genderIdx = headers.indexOf("gender");
    const viewsIdx = headers.indexOf("views");

    const totalViews = data.rows.reduce(
      (sum, row) => sum + Number(row[viewsIdx] ?? 0),
      0,
    );

    // Aggregate by age and gender separately
    const ageMap = new Map<string, number>();
    const genderMap = new Map<string, number>();

    for (const row of data.rows) {
      const age = String(row[ageIdx] ?? "");
      const gender = String(row[genderIdx] ?? "");
      const views = Number(row[viewsIdx] ?? 0);

      if (age) {
        ageMap.set(age, (ageMap.get(age) || 0) + views);
      }
      if (gender) {
        genderMap.set(gender, (genderMap.get(gender) || 0) + views);
      }
    }

    const byAge = [...ageMap.entries()]
      .map(([ageGroup, views]) => ({
        ageGroup,
        views,
        viewsPct: totalViews > 0 ? (views / totalViews) * 100 : 0,
      }))
      .sort((a, b) => b.views - a.views);

    const byGender = [...genderMap.entries()]
      .map(([gender, views]) => ({
        gender,
        views,
        viewsPct: totalViews > 0 ? (views / totalViews) * 100 : 0,
      }))
      .sort((a, b) => b.views - a.views);

    return {
      hasData: byAge.length > 0 || byGender.length > 0,
      byAge,
      byGender,
    };
  } catch (error: unknown) {
    if (error instanceof GoogleTokenRefreshError) {
      throw error;
    }
    console.warn("[DemographicBreakdown] Failed:", error instanceof Error ? error.message : String(error));
    return null;
  }
}

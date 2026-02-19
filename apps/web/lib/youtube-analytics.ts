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
      if (!result.totals) continue;
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
        `[Analytics] Permission denied - user may have declined required scopes`,
      );
      return { ok: false, reason: "permission_denied", message: err?.message };
    } else {
      console.error(
        `[Analytics] Fetch failed for metrics ${metrics.join(",")}:`,
        err?.message || err,
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
  } catch (err: any) {
    // Re-throw auth errors so they trigger the reconnect prompt
    if (err instanceof GoogleTokenRefreshError) {
      throw err;
    }

    const msg = String(err?.message ?? err ?? "");

    // Clean error message for scope/permission issues
    if (err?.isScopeError || err?.message?.includes("SCOPE_ERROR")) {
      console.warn(
        `[Comments] Permission denied - user may have declined youtube.force-ssl scope`,
      );
      return [];
    }

    // Explicit handling: comments disabled for this video (NOT a permission issue)
    // YouTube returns 403 with reason "commentsDisabled"
    if (msg.includes("commentsDisabled") || msg.includes("disabled comments")) {
      console.info(
        `[Comments] Disabled for this video (${videoId}); skipping comments fetch`,
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
            `[Comments] Disabled for this video (${videoId}); skipping comments fetch`,
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

// ============================================
// TRAFFIC SOURCE CTR (for audit)
// ============================================

export type TrafficSourceCTR = {
  browse: { views: number; ctr: number | null } | null;
  suggested: { views: number; ctr: number | null } | null;
  search: { views: number; ctr: number | null } | null;
  external: { views: number; ctr: number | null } | null;
  total: { views: number; ctr: number | null };
};

// ============================================
// VIEWER TYPE METRICS (Returning vs New)
// ============================================

export type ViewerTypeMetrics = {
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

export type DiscoveryMetrics = {
  impressions: number | null;
  impressionsCtr: number | null;
  trafficSources: TrafficSourceBreakdown | null;
  hasData: boolean;
  reason?: string;
};

export type SubscriberBreakdown = {
  subscribers: { views: number; avgViewPct: number; ctr: number | null } | null;
  nonSubscribers: {
    views: number;
    avgViewPct: number;
    ctr: number | null;
  } | null;
  subscriberViewPct: number | null; // % of views from subs
};

export type GeographicBreakdown = {
  topCountries: Array<{
    country: string;
    countryName: string;
    views: number;
    viewsPct: number;
    avgViewPct: number | null;
  }>;
  primaryMarket: string | null; // Top country if >40% of views
};

export type TrafficSourceDetail = {
  searchTerms: Array<{ term: string; views: number }> | null;
  suggestedVideos: Array<{ videoId: string; views: number }> | null;
  browseFeatures: Array<{ feature: string; views: number }> | null;
};

export type DemographicBreakdown = {
  hasData: boolean;
  byAge: Array<{ ageGroup: string; views: number; viewsPct: number }>;
  byGender: Array<{ gender: string; views: number; viewsPct: number }>;
} | null;

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
  const normalized = sourceType.toUpperCase().replace(/-/g, "_");
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

    let impressions: number | null = null;
    let impressionsCtr: number | null = null;

    // Parse official Reach metrics
    if (reachData?.rows && reachData.rows.length > 0) {
      const headers = reachData.columnHeaders.map((h) => h.name);
      const row = reachData.rows[0];

      const impIdx = headers.indexOf("videoThumbnailImpressions");
      const ctrIdx = headers.indexOf("videoThumbnailImpressionsClickRate");

      if (impIdx >= 0) {
        const rawImp = Number(row[impIdx] ?? 0);
        impressions = rawImp > 0 ? rawImp : null;
      }
      if (ctrIdx >= 0) {
        const rawCtr = Number(row[ctrIdx] ?? 0);
        // API returns CTR as a decimal (e.g., 0.05 for 5%); convert to percentage
        impressionsCtr = rawCtr > 0 ? rawCtr * 100 : null;
      }
    }

    // Parse traffic sources using lookup
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
        const sourceType = String(row[0] ?? "");
        const views = Number(row[1] ?? 0);
        sources.total = (sources.total ?? 0) + views;

        const bucket = mapTrafficSource(sourceType);
        sources[bucket] = (sources[bucket] ?? 0) + views;
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

    console.warn(
      "[Discovery] Failed to fetch discovery metrics:",
      err?.message,
    );
    return noData;
  }
}

// ============================================
// CHANNEL-LEVEL AUDIT METRICS
// ============================================

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

    // Also get previous period for trend comparison
    const daysInRange = range === "7d" ? 7 : range === "28d" ? 28 : 90;
    const prevEndDate = new Date(startDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);
    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setDate(prevStartDate.getDate() - daysInRange);

    const prevStartStr = prevStartDate.toISOString().split("T")[0];
    const prevEndStr = prevEndDate.toISOString().split("T")[0];

    // Fetch all metrics in parallel
    const [currentTotals, prevTotals, trafficData, endScreenData] =
      await Promise.all([
        // Current period totals (channel-wide, no video filter)
        fetchChannelTotals(ga, channelId, startDate, endDate),
        // Previous period totals for trend comparison
        fetchChannelTotals(ga, channelId, prevStartStr, prevEndStr),
        // Traffic source breakdown
        fetchChannelTrafficSources(ga, channelId, startDate, endDate),
        // End screen performance
        fetchChannelEndScreenMetrics(ga, channelId, startDate, endDate),
      ]);

    if (!currentTotals) return null;

    // Calculate trends (% change from previous period)
    const viewsTrend =
      prevTotals && prevTotals.views > 0
        ? ((currentTotals.views - prevTotals.views) / prevTotals.views) * 100
        : null;
    const watchTimeTrend =
      prevTotals && prevTotals.watchTimeMin > 0
        ? ((currentTotals.watchTimeMin - prevTotals.watchTimeMin) /
            prevTotals.watchTimeMin) *
          100
        : null;
    const subsTrend =
      prevTotals && prevTotals.netSubscribers !== 0
        ? ((currentTotals.netSubscribers - prevTotals.netSubscribers) /
            Math.abs(prevTotals.netSubscribers)) *
          100
        : null;

    return {
      totalViews: currentTotals.views,
      totalWatchTimeMin: currentTotals.watchTimeMin,
      avgViewPercentage: currentTotals.avgViewPercentage,
      subscribersGained: currentTotals.subscribersGained,
      subscribersLost: currentTotals.subscribersLost,
      netSubscribers: currentTotals.netSubscribers,

      estimatedImpressions:
        currentTotals.views > 0 ? Math.round(currentTotals.views / 0.05) : null,
      estimatedCtr: 5, // Default estimate; real CTR requires YouTube Studio API

      trafficSources: trafficData?.sources ?? null,
      trafficSourceCtr: trafficData?.ctr ?? null,

      viewerTypes: null, // Requires additional API calls; can be added later

      endScreenClicks: endScreenData?.clicks ?? null,
      endScreenImpressions: endScreenData?.impressions ?? null,
      endScreenCtr: endScreenData?.ctr ?? null,

      viewsTrend,
      watchTimeTrend,
      subsTrend,

      videoCount: 0, // Will be populated from DB
      videosInRange: 0,
    };
  } catch (err: any) {
    if (err instanceof GoogleTokenRefreshError) {
      throw err;
    }
    console.error(
      "[ChannelAudit] Failed to fetch audit metrics:",
      err?.message,
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
      return idx >= 0 ? Number(row[idx] ?? 0) : 0;
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
  } catch (err) {
    console.warn("[ChannelTotals] Failed:", err);
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

    const sources: TrafficSourceBreakdown = {
      browse: null,
      suggested: null,
      search: null,
      external: null,
      notifications: null,
      other: null,
      total: 0,
    };

    if (data.rows) {
      for (const row of data.rows) {
        const sourceType = String(row[0] ?? "").toUpperCase();
        const views = Number(row[1] ?? 0);
        sources.total = (sources.total ?? 0) + views;

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
    }

    // CTR by source - we estimate since real CTR requires impressions data
    const total = sources.total ?? 1;
    const ctr: TrafficSourceCTR = {
      browse: sources.browse ? { views: sources.browse, ctr: null } : null,
      suggested: sources.suggested
        ? { views: sources.suggested, ctr: null }
        : null,
      search: sources.search ? { views: sources.search, ctr: null } : null,
      external: sources.external
        ? { views: sources.external, ctr: null }
        : null,
      total: { views: total, ctr: null },
    };

    return { sources, ctr };
  } catch (err) {
    console.warn("[ChannelTrafficSources] Failed:", err);
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

    if (!data.rows || data.rows.length === 0) return null;

    const headers = data.columnHeaders.map((h) => h.name);
    const row = data.rows[0];

    const clicks = Number(row[headers.indexOf("annotationClicks")] ?? 0);
    const impressions = Number(
      row[headers.indexOf("annotationImpressions")] ?? 0,
    );
    const ctr = Number(row[headers.indexOf("annotationClickThroughRate")] ?? 0);

    return { clicks, impressions, ctr };
  } catch (err) {
    console.warn("[ChannelEndScreen] Failed:", err);
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

    if (!data.rows || data.rows.length === 0) {
      return noData;
    }

    const headers = data.columnHeaders.map((h) => h.name);
    const statusIdx = headers.indexOf("subscribedStatus");
    const viewsIdx = headers.indexOf("views");
    const avgViewPctIdx = headers.indexOf("averageViewPercentage");

    let subViews = 0;
    let subAvgViewPct: number | null = null;
    let nonSubViews = 0;
    let nonSubAvgViewPct: number | null = null;
    let totalViews = 0;

    for (const row of data.rows) {
      const status = String(row[statusIdx] ?? "");
      const views = Number(row[viewsIdx] ?? 0);
      const avgViewPct = Number(row[avgViewPctIdx] ?? 0);

      totalViews += views;

      if (status === "SUBSCRIBED") {
        subViews = views;
        subAvgViewPct = avgViewPct;
      } else if (status === "UNSUBSCRIBED") {
        nonSubViews = views;
        nonSubAvgViewPct = avgViewPct;
      }
    }

    const subscriberViewPct =
      totalViews > 0 ? (subViews / totalViews) * 100 : null;

    return {
      subscribers:
        subViews > 0
          ? { views: subViews, avgViewPct: subAvgViewPct ?? 0, ctr: null }
          : null,
      nonSubscribers:
        nonSubViews > 0
          ? { views: nonSubViews, avgViewPct: nonSubAvgViewPct ?? 0, ctr: null }
          : null,
      subscriberViewPct,
    };
  } catch (err: any) {
    if (err instanceof GoogleTokenRefreshError) {
      throw err;
    }
    console.warn("[SubscriberBreakdown] Failed:", err?.message);
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
  } catch (err: any) {
    if (err instanceof GoogleTokenRefreshError) {
      throw err;
    }
    console.warn("[GeographicBreakdown] Failed:", err?.message);
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

      if (!data.rows || data.rows.length === 0) return [];

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
  } catch (err: any) {
    if (err instanceof GoogleTokenRefreshError) {
      throw err;
    }
    console.warn("[TrafficSourceDetail] Failed:", err?.message);
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

    const byAge = Array.from(ageMap.entries())
      .map(([ageGroup, views]) => ({
        ageGroup,
        views,
        viewsPct: totalViews > 0 ? (views / totalViews) * 100 : 0,
      }))
      .sort((a, b) => b.views - a.views);

    const byGender = Array.from(genderMap.entries())
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
  } catch (err: any) {
    if (err instanceof GoogleTokenRefreshError) {
      throw err;
    }
    console.warn("[DemographicBreakdown] Failed:", err?.message);
    return null;
  }
}

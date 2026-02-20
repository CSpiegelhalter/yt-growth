/**
 * Video Tools - Sorting, filtering, and metrics computations for the Dashboard
 *
 * This module provides high-value video management tools that help creators
 * quickly sort, filter, and find what to work on next.
 */

import { daysSince } from "@/lib/youtube/utils";
import { safeGetItem, safeSetItem } from "@/lib/storage/safeLocalStorage";

// ============================================
// TYPES
// ============================================

export type DashboardVideo = {
  videoId: string;
  title: string | null;
  thumbnailUrl: string | null;
  durationSec: number | null;
  publishedAt: string | null;
  views: number;
  likes: number;
  comments: number;
  // Extended metrics (may be null if not available)
  avgViewDuration?: number | null; // seconds
  avgViewPercentage?: number | null; // 0-100
  subscribersGained?: number | null;
  subscribersLost?: number | null;
  estimatedMinutesWatched?: number | null;
  shares?: number | null;
  // Impressions/CTR (requires YouTube Analytics scope)
  impressions?: number | null;
  ctr?: number | null; // 0-100
};

export type ComputedMetrics = {
  likeRate: number; // likes / views (0-1)
  viewsPerDay: number;
  daysSincePublish: number;
  commentRate: number; // comments per 1k views
  engagementRate: number; // (likes + comments) / views
  subsPerThousandViews: number | null; // only if subscribersGained available
  retentionPercent: number | null; // avgViewPercentage
  watchTimeMinutes: number | null;
  contentType: "short" | "long" | "live" | "unknown";
};

export type VideoWithMetrics = DashboardVideo & {
  computed: ComputedMetrics;
};

// Sort options
export type SortKey =
  | "views_desc"
  | "views_asc"
  | "comments_desc"
  | "likes_desc"
  | "like_rate_desc"
  | "newest"
  | "oldest"
  | "watch_time_desc"
  | "avg_view_duration_desc"
  | "ctr_desc"
  | "retention_asc" // worst retention first (needs help)
  | "velocity_desc" // views per day
  | "sub_conversion_desc"; // subs gained per 1k views

type SortOption = {
  key: SortKey;
  label: string;
  description: string;
  requiresMetric?: keyof DashboardVideo; // hide if metric unavailable
  supportsDirection?: boolean;
};

const SORT_OPTIONS: SortOption[] = [
  {
    key: "views_desc",
    label: "Most views",
    description: "Videos with highest view count",
    supportsDirection: true,
  },
  {
    key: "views_asc",
    label: "Fewest views",
    description: "Videos with lowest view count",
  },
  {
    key: "velocity_desc",
    label: "View velocity",
    description: "Fastest growing (views/day since publish)",
  },
  {
    key: "newest",
    label: "Newest first",
    description: "Most recently published",
  },
  { key: "oldest", label: "Oldest first", description: "Oldest videos first" },
  {
    key: "likes_desc",
    label: "Most likes",
    description: "Videos with highest like count",
  },
  {
    key: "comments_desc",
    label: "Most comments",
    description: "Videos sparking most discussion",
  },
  {
    key: "like_rate_desc",
    label: "Highest like rate",
    description: "Best likes-to-views ratio",
  },
  {
    key: "watch_time_desc",
    label: "Watch time",
    description: "Most total watch time",
    requiresMetric: "estimatedMinutesWatched",
  },
  {
    key: "avg_view_duration_desc",
    label: "Avg view duration",
    description: "Highest average view duration",
    requiresMetric: "avgViewDuration",
  },
  {
    key: "ctr_desc",
    label: "Highest CTR",
    description: "Best click-through rate",
    requiresMetric: "ctr",
  },
  {
    key: "retention_asc",
    label: "Needs retention help",
    description: "Lowest avg % viewed (fix these)",
    requiresMetric: "avgViewPercentage",
  },
  {
    key: "sub_conversion_desc",
    label: "Best converters",
    description: "Highest subs gained per 1k views",
    requiresMetric: "subscribersGained",
  },
];

// Filter types
export type TimeRange = "7d" | "28d" | "90d" | "lifetime";
export type ContentType = "all" | "short" | "long" | "live";
export type VideoStatus = "all" | "public" | "unlisted" | "private";
export type Preset = "none" | "needs_attention" | "top_performers";

export type VideoFilters = {
  timeRange: TimeRange;
  contentType: ContentType;
  status: VideoStatus;
  preset: Preset;
  searchQuery: string;
};

export const DEFAULT_FILTERS: VideoFilters = {
  timeRange: "lifetime",
  contentType: "all",
  status: "all",
  preset: "none",
  searchQuery: "",
};

// Persistence
type VideoToolsState = {
  sortKey: SortKey;
  filters: VideoFilters;
};

// ============================================
// METRIC CALCULATIONS
// ============================================

/**
 * Calculate days since a video was published.
 * Delegates to the canonical daysSince in lib/youtube/utils.ts.
 */
export function daysSincePublish(publishedAt: string | null): number {
  return daysSince(publishedAt);
}

/**
 * Calculate like rate (likes / views)
 */
export function calcLikeRate(likes: number, views: number): number {
  if (views === 0) return 0;
  return likes / views;
}

/**
 * Calculate views per day since publish
 */
export function calcViewsPerDay(
  views: number,
  publishedAt: string | null
): number {
  if (!publishedAt) return 0;
  const days = daysSincePublish(publishedAt);
  return views / days;
}

/**
 * Calculate comment rate (comments per 1k views)
 */
export function calcCommentRate(comments: number, views: number): number {
  if (views === 0) return 0;
  return (comments / views) * 1000;
}

/**
 * Calculate engagement rate ((likes + comments) / views)
 */
export function calcEngagementRate(
  likes: number,
  comments: number,
  views: number
): number {
  if (views === 0) return 0;
  return (likes + comments) / views;
}

/**
 * Calculate subscriber conversion (subs per 1k views)
 */
export function calcSubsPerThousandViews(
  subsGained: number | null | undefined,
  views: number
): number | null {
  if (subsGained == null || views <= 0) return null;
  return (subsGained / views) * 1000;
}

/**
 * Determine content type from duration
 * - Shorts: <= 60 seconds
 * - Long-form: > 60 seconds
 * - Unknown: no duration data
 */
export function determineContentType(
  durationSec: number | null
): "short" | "long" | "live" | "unknown" {
  if (durationSec == null) return "unknown";
  if (durationSec <= 60) return "short";
  return "long";
}

/**
 * Compute all derived metrics for a video
 */
export function computeMetrics(video: DashboardVideo): ComputedMetrics {
  const days = daysSincePublish(video.publishedAt);

  return {
    likeRate: calcLikeRate(video.likes, video.views),
    viewsPerDay: calcViewsPerDay(video.views, video.publishedAt),
    daysSincePublish: days,
    commentRate: calcCommentRate(video.comments, video.views),
    engagementRate: calcEngagementRate(
      video.likes,
      video.comments,
      video.views
    ),
    subsPerThousandViews: calcSubsPerThousandViews(
      video.subscribersGained,
      video.views
    ),
    retentionPercent: video.avgViewPercentage ?? null,
    watchTimeMinutes: video.estimatedMinutesWatched ?? null,
    contentType: determineContentType(video.durationSec),
  };
}

/**
 * Enhance videos with computed metrics
 */
export function enhanceVideosWithMetrics(
  videos: DashboardVideo[]
): VideoWithMetrics[] {
  return videos.map((video) => ({
    ...video,
    computed: computeMetrics(video),
  }));
}

// ============================================
// CAPABILITY DETECTION
// ============================================

/**
 * Check if a specific metric is available in the video data
 */
function hasMetric(
  videos: DashboardVideo[],
  metric: keyof DashboardVideo
): boolean {
  return videos.some((v) => v[metric] != null);
}

/**
 * Get available sort options based on what metrics exist in the data
 */
export function getAvailableSortOptions(
  videos: DashboardVideo[]
): SortOption[] {
  return SORT_OPTIONS.filter((opt) => {
    if (!opt.requiresMetric) return true;
    return hasMetric(videos, opt.requiresMetric);
  });
}

// ============================================
// FILTERING
// ============================================

/**
 * Filter videos by time range (published within range)
 */
export function filterByTimeRange(
  videos: VideoWithMetrics[],
  range: TimeRange
): VideoWithMetrics[] {
  if (range === "lifetime") return videos;

  const daysMap: Record<TimeRange, number> = {
    "7d": 7,
    "28d": 28,
    "90d": 90,
    lifetime: Infinity,
  };

  const maxDays = daysMap[range];
  return videos.filter((v) => v.computed.daysSincePublish <= maxDays);
}

/**
 * Filter videos by content type
 */
export function filterByContentType(
  videos: VideoWithMetrics[],
  type: ContentType
): VideoWithMetrics[] {
  if (type === "all") return videos;
  return videos.filter((v) => v.computed.contentType === type);
}

/**
 * Filter videos by search query (title match)
 */
export function filterBySearch(
  videos: VideoWithMetrics[],
  query: string
): VideoWithMetrics[] {
  if (!query.trim()) return videos;
  const lowerQuery = query.toLowerCase().trim();
  return videos.filter((v) => v.title?.toLowerCase().includes(lowerQuery));
}

/**
 * Calculate channel baselines for presets
 */
function calcChannelBaselines(videos: VideoWithMetrics[]): {
  medianViewsPerDay: number;
  medianLikeRate: number;
  medianRetention: number | null;
  medianCtr: number | null;
} {
  if (videos.length === 0) {
    return {
      medianViewsPerDay: 0,
      medianLikeRate: 0,
      medianRetention: null,
      medianCtr: null,
    };
  }

  const sortedVelocity = [...videos].sort(
    (a, b) => a.computed.viewsPerDay - b.computed.viewsPerDay
  );
  const sortedLikeRate = [...videos].sort(
    (a, b) => a.computed.likeRate - b.computed.likeRate
  );

  const midIndex = Math.floor(videos.length / 2);

  const retentions = videos.filter((v) => v.computed.retentionPercent != null);
  const ctrs = videos.filter((v) => v.ctr != null);

  let medianRetention: number | null = null;
  if (retentions.length > 0) {
    const sortedRet = [...retentions].sort(
      (a, b) =>
        (a.computed.retentionPercent ?? 0) - (b.computed.retentionPercent ?? 0)
    );
    medianRetention =
      sortedRet[Math.floor(sortedRet.length / 2)].computed.retentionPercent;
  }

  let medianCtr: number | null = null;
  if (ctrs.length > 0) {
    const sortedCtr = [...ctrs].sort((a, b) => (a.ctr ?? 0) - (b.ctr ?? 0));
    medianCtr = sortedCtr[Math.floor(sortedCtr.length / 2)].ctr ?? null;
  }

  return {
    medianViewsPerDay: sortedVelocity[midIndex].computed.viewsPerDay,
    medianLikeRate: sortedLikeRate[midIndex].computed.likeRate,
    medianRetention,
    medianCtr,
  };
}

/**
 * Apply "Needs attention" preset
 * Low CTR OR low retention OR low engagement vs baseline
 */
function filterNeedsAttention(
  videos: VideoWithMetrics[]
): VideoWithMetrics[] {
  const baselines = calcChannelBaselines(videos);

  return videos.filter((v) => {
    // Low retention (below 70% of median)
    if (
      baselines.medianRetention != null &&
      v.computed.retentionPercent != null
    ) {
      if (v.computed.retentionPercent < baselines.medianRetention * 0.7)
        return true;
    }

    // Low CTR (below 70% of median)
    if (baselines.medianCtr != null && v.ctr != null) {
      if (v.ctr < baselines.medianCtr * 0.7) return true;
    }

    // Low engagement (below 50% of median like rate)
    if (v.computed.likeRate < baselines.medianLikeRate * 0.5) return true;

    return false;
  });
}

/**
 * Apply "Top performers" preset
 * Top 20% by total views
 */
export function filterTopPerformers(
  videos: VideoWithMetrics[]
): VideoWithMetrics[] {
  if (videos.length === 0) return [];

  // Sort by total views (most intuitive for "top performers")
  const sorted = [...videos].sort((a, b) => b.views - a.views);

  // Take top 20% (minimum 3 videos for meaningful results)
  const topCount = Math.max(3, Math.ceil(videos.length * 0.2));
  return sorted.slice(0, topCount);
}

/**
 * Apply all filters
 */
export function applyFilters(
  videos: VideoWithMetrics[],
  filters: VideoFilters
): VideoWithMetrics[] {
  let result = [...videos];

  // Time range
  result = filterByTimeRange(result, filters.timeRange);

  // Content type
  result = filterByContentType(result, filters.contentType);

  // Search
  result = filterBySearch(result, filters.searchQuery);

  // Presets (apply last)
  if (filters.preset === "needs_attention") {
    result = filterNeedsAttention(result);
  } else if (filters.preset === "top_performers") {
    result = filterTopPerformers(result);
  }

  return result;
}

// ============================================
// SORTING
// ============================================

/**
 * Sort videos by the specified key
 */
export function sortVideos(
  videos: VideoWithMetrics[],
  sortKey: SortKey
): VideoWithMetrics[] {
  const sorted = [...videos];

  switch (sortKey) {
    case "views_desc":
      return sorted.sort((a, b) => b.views - a.views);
    case "views_asc":
      return sorted.sort((a, b) => a.views - b.views);
    case "comments_desc":
      return sorted.sort((a, b) => b.comments - a.comments);
    case "likes_desc":
      return sorted.sort((a, b) => b.likes - a.likes);
    case "like_rate_desc":
      return sorted.sort((a, b) => b.computed.likeRate - a.computed.likeRate);
    case "newest":
      return sorted.sort((a, b) => {
        if (!a.publishedAt) return 1;
        if (!b.publishedAt) return -1;
        return (
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
      });
    case "oldest":
      return sorted.sort((a, b) => {
        if (!a.publishedAt) return 1;
        if (!b.publishedAt) return -1;
        return (
          new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
        );
      });
    case "watch_time_desc":
      return sorted.sort(
        (a, b) =>
          (b.computed.watchTimeMinutes ?? 0) -
          (a.computed.watchTimeMinutes ?? 0)
      );
    case "avg_view_duration_desc":
      return sorted.sort(
        (a, b) => (b.avgViewDuration ?? 0) - (a.avgViewDuration ?? 0)
      );
    case "ctr_desc":
      return sorted.sort((a, b) => (b.ctr ?? 0) - (a.ctr ?? 0));
    case "retention_asc":
      // Worst retention first (lowest % viewed)
      return sorted.sort((a, b) => {
        const aRet = a.computed.retentionPercent ?? 100;
        const bRet = b.computed.retentionPercent ?? 100;
        return aRet - bRet;
      });
    case "velocity_desc":
      return sorted.sort(
        (a, b) => b.computed.viewsPerDay - a.computed.viewsPerDay
      );
    case "sub_conversion_desc":
      return sorted.sort((a, b) => {
        const aSubs = a.computed.subsPerThousandViews ?? 0;
        const bSubs = b.computed.subsPerThousandViews ?? 0;
        return bSubs - aSubs;
      });
    default:
      return sorted;
  }
}

// ============================================
// NEXT ACTIONS / INSIGHTS
// ============================================

// ============================================
// PERSISTENCE
// ============================================

const STORAGE_KEY_PREFIX = "dashboardVideoTools:";

/**
 * Get localStorage key for a channel
 */
function getStorageKey(channelId: string): string {
  return `${STORAGE_KEY_PREFIX}${channelId}`;
}

/**
 * Load saved state from localStorage
 */
export function loadVideoToolsState(channelId: string): VideoToolsState | null {
  const stored = safeGetItem(getStorageKey(channelId));
  if (!stored) return null;
  try {
    return JSON.parse(stored) as VideoToolsState;
  } catch {
    return null;
  }
}

/**
 * Save state to localStorage
 */
export function saveVideoToolsState(
  channelId: string,
  state: VideoToolsState
): void {
  safeSetItem(getStorageKey(channelId), JSON.stringify(state));
}

// ============================================
// CSV EXPORT
// ============================================

/**
 * Export videos to CSV format
 */
export function exportToCSV(
  videos: VideoWithMetrics[],
  sortKey: SortKey
): string {
  void sortKey;
  const headers = [
    "Title",
    "Video ID",
    "Published",
    "Views",
    "Likes",
    "Comments",
    "Like Rate (%)",
    "Views/Day",
    "Type",
    "Duration (sec)",
  ];

  // Add optional columns if data exists
  if (videos.some((v) => v.avgViewPercentage != null)) {
    headers.push("Avg View %");
  }
  if (videos.some((v) => v.subscribersGained != null)) {
    headers.push("Subs Gained");
    headers.push("Subs/1k Views");
  }
  if (videos.some((v) => v.ctr != null)) {
    headers.push("CTR (%)");
  }

  const rows = videos.map((v) => {
    const row: (string | number)[] = [
      v.title?.replace(/,/g, ";") ?? "Untitled", // Escape commas
      v.videoId,
      v.publishedAt ? new Date(v.publishedAt).toISOString().split("T")[0] : "",
      v.views,
      v.likes,
      v.comments,
      (v.computed.likeRate * 100).toFixed(2),
      v.computed.viewsPerDay.toFixed(1),
      v.computed.contentType,
      v.durationSec ?? "",
    ];

    if (videos.some((x) => x.avgViewPercentage != null)) {
      row.push(v.avgViewPercentage?.toFixed(1) ?? "");
    }
    if (videos.some((x) => x.subscribersGained != null)) {
      row.push(v.subscribersGained ?? "");
      row.push(v.computed.subsPerThousandViews?.toFixed(2) ?? "");
    }
    if (videos.some((x) => x.ctr != null)) {
      row.push(v.ctr?.toFixed(2) ?? "");
    }

    return row.join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Download CSV file
 */
export function downloadCSV(
  videos: VideoWithMetrics[],
  sortKey: SortKey,
  filename?: string
): void {
  const csv = exportToCSV(videos, sortKey);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download =
    filename ??
    `videos-${sortKey}-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================
// FORMAT HELPERS
// ============================================

/**
 * Format a sort key as a human-readable label
 */
export function getSortLabel(sortKey: SortKey): string {
  const option = SORT_OPTIONS.find((o) => o.key === sortKey);
  return option?.label ?? "Sort";
}

/**
 * Format context metric value for display
 */
export function formatContextMetric(
  video: VideoWithMetrics,
  sortKey: SortKey
): string | null {
  switch (sortKey) {
    case "views_desc":
    case "views_asc":
      return null; // Already shown
    case "comments_desc":
      return `${video.comments} comments`;
    case "likes_desc":
      return `${video.likes} likes`;
    case "like_rate_desc":
      return `${(video.computed.likeRate * 100).toFixed(1)}% like rate`;
    case "velocity_desc":
      return `${video.computed.viewsPerDay.toFixed(0)} views/day`;
    case "ctr_desc":
      return video.ctr != null ? `${video.ctr.toFixed(1)}% CTR` : null;
    case "retention_asc":
      return video.computed.retentionPercent != null
        ? `${video.computed.retentionPercent.toFixed(0)}% avg viewed`
        : null;
    case "sub_conversion_desc":
      return video.computed.subsPerThousandViews != null
        ? `${video.computed.subsPerThousandViews.toFixed(1)} subs/1k views`
        : null;
    case "watch_time_desc":
      return video.computed.watchTimeMinutes != null
        ? `${(video.computed.watchTimeMinutes / 60).toFixed(0)}h watch time`
        : null;
    case "avg_view_duration_desc":
      return video.avgViewDuration != null
        ? `${Math.floor(video.avgViewDuration / 60)}:${String(
            Math.floor(video.avgViewDuration % 60)
          ).padStart(2, "0")} avg`
        : null;
    default:
      return null;
  }
}

/**
 * Return a "Short" label for YouTube Shorts (≤60s), null otherwise.
 */
export function shortFormBadge(durationSec: number | null): string | null {
  if (durationSec == null) return null;
  if (durationSec <= 60) return "Short";
  return null;
}

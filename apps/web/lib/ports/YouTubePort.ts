/**
 * YouTube Port — contract for YouTube data access.
 *
 * Ports are pure TypeScript interfaces — no runtime code, no implementations.
 * They define what features need from YouTube without specifying how.
 *
 * Imported by:
 *   - lib/features/ (to declare dependency on YouTube data)
 *   - lib/adapters/youtube/ (to implement)
 *   - app/ or lib/server/ (to wire adapter to features)
 */

// ─── Channel Types ──────────────────────────────────────────

export interface ChannelSummary {
  channelId: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
}

export interface ChannelDetails {
  channelId: string;
  title: string;
  description: string;
  customUrl?: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
}

// ─── Video Types ────────────────────────────────────────────

export type VideoDurationFilter = "short" | "medium" | "long" | "any";

export interface ChannelVideo {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  durationSec: number;
  tags: string | null;
  thumbnailUrl: string | null;
  views: number;
  likes: number;
  comments: number;
}

export interface VideoDetails {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  tags: string[];
  category: string;
  thumbnailUrl: string | null;
  durationSec: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface VideoStats {
  viewCount: number;
  likeCount?: number;
  commentCount?: number;
}

export interface RecentVideo {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string | null;
  views: number;
  viewsPerDay: number;
  durationSec?: number;
}

// ─── Search Types ───────────────────────────────────────────

export interface VideoSearchOptions {
  query: string;
  maxResults: number;
  pageToken?: string;
  durationFilter?: VideoDurationFilter;
  publishedAfterDays?: number;
}

export interface VideoSearchResult {
  videoId: string;
  channelId: string;
  channelTitle: string;
  title: string;
  thumbnailUrl: string | null;
  publishedAt: string;
}

export interface VideoSearchResponse {
  videos: VideoSearchResult[];
  nextPageToken?: string;
}

// ─── Analytics Types ────────────────────────────────────────

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface VideoMetrics {
  videoId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  subscribersGained: number;
  subscribersLost: number;
  estimatedMinutesWatched: number;
  averageViewDuration: number;
  averageViewPercentage: number;
}

export interface RetentionPoint {
  elapsedRatio: number;
  audienceWatchRatio: number;
}

export interface TrafficSourceEntry {
  source: string;
  views: number;
  estimatedMinutesWatched: number;
}

export interface DemographicEntry {
  ageGroup: string;
  gender: string;
  viewerPercentage: number;
}

// ─── Owned Video Analytics Types ─────────────────────────────

export interface DailyAnalyticsRow {
  date: string;
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
  redViews: number | null;
  cardClicks: number | null;
  cardImpressions: number | null;
  cardClickRate: number | null;
  annotationClicks: number | null;
  annotationImpressions: number | null;
  annotationClickThroughRate: number | null;
  estimatedRevenue: number | null;
  estimatedAdRevenue: number | null;
  grossRevenue: number | null;
  monetizedPlaybacks: number | null;
  playbackBasedCpm: number | null;
  adImpressions: number | null;
  cpm: number | null;
}

export interface AnalyticsTotals extends DailyAnalyticsRow {
  startDate: string;
  endDate: string;
  daysInRange: number;
}

export interface VideoMetadata {
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
}

export interface SubscriberBreakdown {
  subscribers: { views: number; avgViewPct: number; ctr: number | null } | null;
  nonSubscribers: {
    views: number;
    avgViewPct: number;
    ctr: number | null;
  } | null;
  subscriberViewPct: number | null;
}

export interface GeographicBreakdown {
  topCountries: Array<{
    country: string;
    countryName: string;
    views: number;
    viewsPct: number;
    avgViewPct: number | null;
  }>;
  primaryMarket: string | null;
}

export interface TrafficSourceDetail {
  searchTerms: Array<{ term: string; views: number }> | null;
  suggestedVideos: Array<{ videoId: string; views: number }> | null;
  browseFeatures: Array<{ feature: string; views: number }> | null;
}

export type DemographicBreakdown = {
  hasData: boolean;
  byAge: Array<{ ageGroup: string; views: number; viewsPct: number }>;
  byGender: Array<{ gender: string; views: number; viewsPct: number }>;
} | null;

// ─── Comment Types ──────────────────────────────────────────

export interface VideoComment {
  commentId: string;
  text: string;
  likeCount: number;
  authorName: string;
  authorChannelId?: string;
  publishedAt: string;
  replyCount: number;
}

export interface CommentsResult {
  comments: VideoComment[];
  commentsDisabled?: boolean;
  error?: string;
}

// ─── Port Interface ─────────────────────────────────────────

export interface YouTubePort {
  /** Search for channels matching a query. */
  searchChannels(
    query: string,
    maxResults: number,
  ): Promise<ChannelSummary[]>;

  /** Fetch detailed information about a channel. */
  getChannelDetails(channelId: string): Promise<ChannelDetails | null>;

  /** Fetch full details for a single video. */
  getVideoDetails(videoId: string): Promise<VideoDetails | null>;

  /** Fetch full details for multiple videos in batch. */
  getVideoDetailsBatch(videoIds: string[]): Promise<VideoDetails[]>;

  /** Fetch view/like/comment counts for multiple videos. */
  getVideoStatsBatch(videoIds: string[]): Promise<Map<string, VideoStats>>;

  /** List videos from a channel's uploads (most recent first). */
  listChannelVideos(
    channelId: string,
    maxResults?: number,
  ): Promise<ChannelVideo[]>;

  /** List recent videos from a channel published after a given ISO date. */
  listRecentVideos(
    channelId: string,
    publishedAfter: string,
    maxResults?: number,
  ): Promise<RecentVideo[]>;

  /** Search videos by query with optional filters. */
  searchVideos(options: VideoSearchOptions): Promise<VideoSearchResponse>;

  /** Fetch analytics metrics for videos over a date range. */
  getVideoMetrics(
    channelId: string,
    videoIds: string[],
    dateRange: DateRange,
  ): Promise<VideoMetrics[]>;

  /** Fetch audience retention curve for a video. */
  getRetentionCurve(
    channelId: string,
    videoId: string,
    startDate?: string,
  ): Promise<RetentionPoint[]>;

  /** Fetch traffic source breakdown for a video over a date range. */
  getTrafficSources(
    channelId: string,
    videoId: string,
    dateRange: DateRange,
  ): Promise<TrafficSourceEntry[]>;

  /** Fetch viewer demographic breakdown for a channel over a date range. */
  getDemographics(
    channelId: string,
    dateRange: DateRange,
  ): Promise<DemographicEntry[]>;

  /** Fetch top-level comments for a video. */
  getVideoComments(
    videoId: string,
    maxResults?: number,
  ): Promise<CommentsResult>;
}

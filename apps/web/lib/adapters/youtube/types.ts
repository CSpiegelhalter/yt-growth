/**
 * YouTube API Types
 *
 * Shared type definitions for YouTube Data API and Analytics API operations.
 */

/**
 * Minimal Google Account shape for authenticated API calls.
 * Matches the fields used from Prisma's GoogleAccount model.
 */
export type GoogleAccount = {
  id: number;
  refreshTokenEnc: string | null;
  accessTokenEnc?: string | null;
  tokenExpiresAt: Date | null;
};

/**
 * Video from channel uploads with full details.
 */
export type YouTubeVideo = {
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
};

/**
 * Detailed video information from videos.list.
 */
export type VideoDetails = {
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
};

/**
 * Video metrics from YouTube Analytics API.
 */
export type VideoMetricsData = {
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
};

/**
 * Single point on retention/audience watch curve.
 */
export type RetentionPoint = {
  elapsedRatio: number;
  audienceWatchRatio: number;
};

/**
 * Channel search result for similar channel discovery.
 */
export type SimilarChannelResult = {
  channelId: string;
  channelTitle: string;
  description: string;
  thumbnailUrl: string | null;
};

/**
 * Recent video from a channel with view metrics.
 */
export type RecentVideoResult = {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string | null;
  views: number;
  viewsPerDay: number;
  durationSec?: number;
};

/**
 * Duration filter for YouTube search.
 * - short: < 4 minutes
 * - medium: 4-20 minutes
 * - long: > 20 minutes
 * - any: no filter
 */
export type VideoDurationFilter = "short" | "medium" | "long" | "any";

/**
 * Single comment from a video.
 */
export type YouTubeComment = {
  commentId: string;
  text: string;
  likeCount: number;
  authorName: string;
  authorChannelId?: string;
  publishedAt: string;
  replyCount: number;
};

/**
 * Result from fetching video comments.
 */
export type FetchCommentsResult = {
  comments: YouTubeComment[];
  commentsDisabled?: boolean;
  error?: string;
};

/**
 * Video statistics batch result.
 */
export type VideoStats = {
  viewCount: number;
  likeCount?: number;
  commentCount?: number;
};

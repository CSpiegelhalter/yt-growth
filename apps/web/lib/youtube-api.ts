/**
 * YouTube Data API and Analytics API helpers
 *
 * This file is a thin facade that re-exports from the modular lib/youtube/ directory.
 * All logic has been moved to focused modules for better organization and testability.
 *
 * Uses stored Google OAuth tokens to make authenticated requests.
 */

// Re-export everything from the modular YouTube module
export {
  // Account lookup
  getGoogleAccount,

  // Channel videos
  fetchChannelVideos,

  // Analytics
  fetchVideoMetrics,
  fetchRetentionCurve,

  // Search
  searchSimilarChannels,
  searchNicheVideos,

  // Recent videos
  fetchRecentChannelVideos,

  // Single video (OAuth)
  fetchVideoDetails,

  // Single video snippet (API key)
  fetchVideoSnippetByApiKey,

  // Comments
  fetchVideoComments,

  // Stats batch
  fetchVideosStatsBatch,
} from "./youtube/index";

// Re-export all types
export type {
  GoogleAccount,
  YouTubeVideo,
  VideoDetails,
  VideoMetricsData,
  RetentionPoint,
  SimilarChannelResult,
  RecentVideoResult,
  VideoDurationFilter,
  YouTubeComment,
  FetchCommentsResult,
  CompetitorVideo,
} from "./youtube/types";
export type { YouTubeVideoSnippetItem } from "./youtube/data-api";

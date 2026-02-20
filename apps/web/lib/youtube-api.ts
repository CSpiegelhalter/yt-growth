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

  // Recent videos
  fetchRecentChannelVideos,

  // Single video (OAuth)
  fetchVideoDetails,

  // Comments
  fetchVideoComments,
} from "./youtube/index";

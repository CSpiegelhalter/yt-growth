/**
 * YouTube API Constants
 *
 * Centralized constants for API endpoints, cache TTLs, and batch sizes.
 */

/** YouTube Data API v3 base URL */
export const YOUTUBE_DATA_API = "https://www.googleapis.com/youtube/v3";

/** YouTube Analytics API v2 base URL */
export const YOUTUBE_ANALYTICS_API = "https://youtubeanalytics.googleapis.com/v2";

/** Default cache TTL: 24 hours */
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Max video IDs per videos.list request */
export const VIDEO_BATCH_SIZE = 50;

/** Default concurrency limit for parallel API calls */
export const DEFAULT_CONCURRENCY_LIMIT = 2;

/** Max pages to fetch from uploads playlist for recent videos */
export const MAX_PLAYLIST_PAGES = 2;

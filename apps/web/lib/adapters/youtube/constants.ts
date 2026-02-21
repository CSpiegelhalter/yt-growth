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

/** YouTube Video Category ID → human-readable name */
export const YOUTUBE_CATEGORIES: Record<string, string> = {
  "1": "Film & Animation",
  "2": "Autos & Vehicles",
  "10": "Music",
  "15": "Pets & Animals",
  "17": "Sports",
  "19": "Travel & Events",
  "20": "Gaming",
  "22": "People & Blogs",
  "23": "Comedy",
  "24": "Entertainment",
  "25": "News & Politics",
  "26": "Howto & Style",
  "27": "Education",
  "28": "Science & Technology",
  "29": "Nonprofits & Activism",
};

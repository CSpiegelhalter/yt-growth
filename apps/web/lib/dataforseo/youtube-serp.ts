/**
 * DataForSEO YouTube SERP Client
 *
 * Fetches YouTube search results for a keyword using the Live endpoint.
 * Shows which videos/channels rank for a given keyword on YouTube.
 *
 * API Docs: https://docs.dataforseo.com/v3/serp/youtube/organic/live/
 */

import "server-only";
import { logger } from "@/lib/logger";
import { validatePhrase, validateLocation, DataForSEOError } from "./utils";

// ============================================
// CONFIGURATION
// ============================================

const DEFAULT_BASE_URL = "https://api.dataforseo.com/v3";
const DEFAULT_TIMEOUT_MS = 15000; // 15 seconds for Live endpoint
const MAX_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 1000;

// ============================================
// TYPES
// ============================================

/**
 * A single YouTube video ranking result
 */
export type YouTubeRankingResult = {
  position: number;
  title: string;
  channelName: string;
  channelUrl: string;
  videoUrl: string;
  videoId: string;
  views: number | null;
  publishedDate: string | null;
  thumbnailUrl: string | null;
  duration: string | null;
  description: string | null;
};

/**
 * Full response from YouTube SERP API
 */
export type YouTubeSerpResponse = {
  keyword: string;
  location: string;
  results: YouTubeRankingResult[];
  totalResults: number;
  fetchedAt: string;
};

// DataForSEO response types
interface YouTubeSerpApiResponse {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: Array<{
    id: string;
    status_code: number;
    status_message: string;
    time: string;
    cost: number;
    result_count: number;
    path: string[];
    data: {
      api: string;
      function: string;
      se: string;
      keyword: string;
      location_code: number;
      language_code: string;
      device: string;
      os: string;
    };
    result: Array<{
      keyword: string;
      type: string;
      se_domain: string;
      location_code: number;
      language_code: string;
      check_url: string;
      datetime: string;
      spell: string | null;
      item_types: string[];
      items_count: number;
      items: Array<YouTubeOrganicItem>;
    }>;
  }>;
}

/**
 * YouTube video item from DataForSEO SERP API
 * Docs: https://docs.dataforseo.com/v3/serp/youtube/organic/live/advanced
 */
interface YouTubeOrganicItem {
  type: string; // "youtube_video", "youtube_channel", "youtube_playlist"
  rank_group: number;
  rank_absolute: number;
  block_rank: number;
  block_name: string | null;
  video_id: string;
  title: string;
  url: string;
  thumbnail_url: string | null; // Direct URL, not array
  channel_id: string;
  channel_name: string;
  channel_url: string;
  channel_logo: string | null;
  description: string | null;
  highlighted: string[] | null;
  badges: string[] | null;
  is_live: boolean;
  is_shorts: boolean;
  is_movie: boolean | null;
  views_count: number | null;
  publication_date: string | null;
  timestamp: string | null;
  duration_time: string | null; // e.g., "23:26"
  duration_time_seconds: number | null;
}

// ============================================
// HELPERS
// ============================================

function getCredentials(): { login: string; password: string } {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new DataForSEOError(
      "DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD must be configured",
      "CONFIG_ERROR",
    );
  }

  return { login, password };
}

function getBaseUrl(): string {
  return process.env.DATAFORSEO_BASE_URL || DEFAULT_BASE_URL;
}

function createAuthHeader(login: string, password: string): string {
  const credentials = Buffer.from(`${login}:${password}`).toString("base64");
  return `Basic ${credentials}`;
}

function sleepWithJitter(baseMs: number, attempt: number): Promise<void> {
  const exponentialDelay = baseMs * Math.pow(2, attempt);
  const jitter = Math.random() * exponentialDelay * 0.5;
  return new Promise((resolve) =>
    setTimeout(resolve, exponentialDelay + jitter),
  );
}

/**
 * Parse a YouTube organic item into our format
 */
function parseYouTubeItem(item: YouTubeOrganicItem): YouTubeRankingResult {
  return {
    position: item.rank_absolute,
    title: item.title || "",
    channelName: item.channel_name || "",
    channelUrl: item.channel_url || "",
    videoUrl: item.url || "",
    videoId: item.video_id || "",
    views: item.views_count,
    publishedDate: item.publication_date || item.timestamp,
    thumbnailUrl: item.thumbnail_url, // Direct URL, not array
    duration: item.duration_time, // e.g., "23:26"
    description: item.description,
  };
}

// ============================================
// MAIN API FUNCTION
// ============================================

/**
 * Fetch YouTube search results for a keyword.
 *
 * Uses DataForSEO's YouTube Organic SERP Live endpoint.
 *
 * @param options.keyword - The keyword to search for
 * @param options.location - Location code (e.g., "us", "uk")
 * @param options.limit - Max results to return (default 10)
 */
export async function fetchYouTubeSerp(options: {
  keyword: string;
  location?: string;
  limit?: number;
}): Promise<YouTubeSerpResponse> {
  const keyword = validatePhrase(options.keyword);
  const locationInfo = validateLocation(options.location ?? "us");
  const limit = Math.min(options.limit ?? 10, 20);

  const credentials = getCredentials();
  const baseUrl = getBaseUrl();
  // DataForSEO YouTube SERP Live endpoint - must use /advanced for full results
  const url = `${baseUrl}/serp/youtube/organic/live/advanced`;

  const body = [
    {
      keyword,
      location_code: locationInfo.location_code,
      language_code: locationInfo.language_code,
      device: "desktop",
      os: "windows",
      block_depth: limit, // Number of result blocks to return (default 20, max 700)
    },
  ];

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        DEFAULT_TIMEOUT_MS,
      );

      const response = await fetch(url, {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: createAuthHeader(
            credentials.login,
            credentials.password,
          ),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      clearTimeout(timeoutId);

      let data: YouTubeSerpApiResponse;
      try {
        data = await response.json();
      } catch {
        throw new DataForSEOError(
          "Invalid JSON response from API",
          "PARSE_ERROR",
        );
      }

      // Check HTTP status
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new DataForSEOError("Invalid API credentials", "AUTH_ERROR");
        }
        if (response.status === 429) {
          throw new DataForSEOError(
            "Rate limited by DataForSEO API",
            "RATE_LIMITED",
          );
        }
        if (
          response.status === 402 ||
          data.status_message?.toLowerCase().includes("balance")
        ) {
          throw new DataForSEOError(
            "DataForSEO API balance exceeded",
            "QUOTA_EXCEEDED",
          );
        }
        throw new DataForSEOError(
          `DataForSEO API error: ${response.status} - ${data.status_message || "Unknown error"}`,
          "API_ERROR",
        );
      }

      // Check API-level status
      if (data.status_code !== 20000) {
        if (data.status_code === 40001) {
          throw new DataForSEOError(
            "Invalid request parameters",
            "VALIDATION_ERROR",
          );
        }
        if (data.status_code === 40201) {
          throw new DataForSEOError("Insufficient balance", "QUOTA_EXCEEDED");
        }
        throw new DataForSEOError(
          `DataForSEO error: ${data.status_message || "Unknown error"}`,
          "API_ERROR",
        );
      }

      // Extract results
      const task = data.tasks?.[0];
      if (!task || task.status_code !== 20000) {
        throw new DataForSEOError(
          task?.status_message || "Task failed",
          "API_ERROR",
        );
      }

      const resultData = task.result?.[0];
      if (!resultData) {
        // No results found for this keyword
        logger.info("youtube_serp.no_results", {
          keyword,
          location: locationInfo.region,
        });
        return {
          keyword,
          location: locationInfo.region,
          results: [],
          totalResults: 0,
          fetchedAt: new Date().toISOString(),
        };
      }

      // Parse and filter organic video items
      const items = resultData.items || [];
      const videoItems = items
        .filter((item) => item.type === "youtube_video")
        .map(parseYouTubeItem)
        .slice(0, limit);

      logger.info("youtube_serp.success", {
        keyword,
        location: locationInfo.region,
        resultCount: videoItems.length,
        cost: data.cost,
      });

      return {
        keyword,
        location: locationInfo.region,
        results: videoItems,
        totalResults: resultData.items_count || videoItems.length,
        fetchedAt: new Date().toISOString(),
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry on auth, quota, or validation errors
      if (err instanceof DataForSEOError) {
        if (
          err.code === "VALIDATION_ERROR" ||
          err.code === "QUOTA_EXCEEDED" ||
          err.code === "CONFIG_ERROR" ||
          err.code === "AUTH_ERROR"
        ) {
          throw err;
        }
      }

      // Check for abort (timeout)
      if (err instanceof Error && err.name === "AbortError") {
        lastError = new DataForSEOError("Request timed out", "TIMEOUT");
      }

      logger.warn("youtube_serp.retry", {
        attempt: attempt + 1,
        maxRetries: MAX_RETRIES,
        error: lastError.message,
        keyword,
      });

      if (attempt < MAX_RETRIES - 1) {
        await sleepWithJitter(BASE_RETRY_DELAY_MS, attempt);
      }
    }
  }

  throw lastError || new DataForSEOError("Request failed", "NETWORK_ERROR");
}

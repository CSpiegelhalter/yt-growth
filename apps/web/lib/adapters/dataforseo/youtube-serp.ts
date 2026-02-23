/**
 * DataForSEO YouTube SERP Client
 *
 * Fetches YouTube search results for a keyword using the Live endpoint.
 * Shows which videos/channels rank for a given keyword on YouTube.
 *
 * API Docs: https://docs.dataforseo.com/v3/serp/youtube/organic/live/
 */

import "server-only";

import { logger } from "@/lib/shared/logger";

import {
  classifyApiStatusError,
  classifyHttpError,
  DataForSEOError,
  isNonRetryableError,
  validateLocation,
  validatePhrase,
} from "./utils";

// ============================================
// CONFIGURATION
// ============================================

const DEFAULT_BASE_URL = "https://api.dataforseo.com/v3";
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 1000;

// ============================================
// TYPES
// ============================================

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

export type YouTubeSerpResponse = {
  keyword: string;
  location: string;
  results: YouTubeRankingResult[];
  totalResults: number;
  fetchedAt: string;
};

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

interface YouTubeOrganicItem {
  type: string;
  rank_group: number;
  rank_absolute: number;
  block_rank: number;
  block_name: string | null;
  video_id: string;
  title: string;
  url: string;
  thumbnail_url: string | null;
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
  duration_time: string | null;
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
    thumbnailUrl: item.thumbnail_url,
    duration: item.duration_time,
    description: item.description,
  };
}

// ============================================
// MAIN API FUNCTION
// ============================================

async function executeSerpRequest(
  url: string,
  body: unknown,
  credentials: { login: string; password: string },
): Promise<YouTubeSerpApiResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  const response = await fetch(url, {
    method: "POST",
    signal: controller.signal,
    headers: {
      Authorization: createAuthHeader(credentials.login, credentials.password),
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
    throw new DataForSEOError("Invalid JSON response from API", "PARSE_ERROR");
  }

  if (!response.ok) {
    throw classifyHttpError(response.status, data.status_message);
  }

  if (data.status_code !== 20_000) {
    throw classifyApiStatusError(data.status_code, data.status_message);
  }

  return data;
}

function parseSerpTaskResult(
  data: YouTubeSerpApiResponse,
  keyword: string,
  location: string,
  limit: number,
): YouTubeSerpResponse {
  const task = data.tasks?.[0];
  if (!task || task.status_code !== 20_000) {
    throw new DataForSEOError(
      task?.status_message || "Task failed",
      "API_ERROR",
    );
  }

  const resultData = task.result?.[0];
  if (!resultData) {
    return {
      keyword,
      location,
      results: [],
      totalResults: 0,
      fetchedAt: new Date().toISOString(),
    };
  }

  const videoItems = (resultData.items || [])
    .filter((item) => item.type === "youtube_video")
    .map(parseYouTubeItem)
    .slice(0, limit);

  return {
    keyword,
    location,
    results: videoItems,
    totalResults: resultData.items_count ?? videoItems.length,
    fetchedAt: new Date().toISOString(),
  };
}

export async function fetchYouTubeSerp(options: {
  keyword: string;
  location?: string;
  limit?: number;
}): Promise<YouTubeSerpResponse> {
  const keyword = validatePhrase(options.keyword);
  const locationInfo = validateLocation(options.location ?? "us");
  const limit = Math.min(options.limit ?? 10, 20);

  const credentials = getCredentials();
  const url = `${getBaseUrl()}/serp/youtube/organic/live/advanced`;

  const body = [
    {
      keyword,
      location_code: locationInfo.location_code,
      language_code: locationInfo.language_code,
      device: "desktop",
      os: "windows",
      block_depth: limit,
    },
  ];

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const data = await executeSerpRequest(url, body, credentials);
      const result = parseSerpTaskResult(data, keyword, locationInfo.region, limit);

      logger.info("youtube_serp.success", {
        keyword,
        location: locationInfo.region,
        resultCount: result.results.length,
        cost: data.cost,
      });

      return result;
    } catch (error) {
      if (isNonRetryableError(error)) {
        throw error;
      }

      lastError = error instanceof Error ? error : new Error(String(error));
      if (error instanceof Error && error.name === "AbortError") {
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

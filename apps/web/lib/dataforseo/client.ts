/**
 * DataForSEO API Client - Standard Task-Based Workflow
 *
 * Server-side only client for DataForSEO keyword research API using
 * the Standard (task-based) method instead of Live endpoints.
 *
 * Standard method workflow:
 * 1. POST task_post → returns taskId
 * 2. GET task_get/{id} → returns results when ready
 *
 * Benefits over Live:
 * - No 12 req/min rate limit
 * - Lower cost per request
 * - Better for batch processing
 *
 * API Docs: https://docs.dataforseo.com/v3/keywords_data/google_ads/search_volume/task_post/
 */

import "server-only";
import { logger } from "@/lib/logger";
import {
  validatePhrase,
  validateLocation,
  validateKeywords,
  calculateDifficultyHeuristic,
  parseNumeric,
  parseInteger,
  parseMonthlyTrend,
  isRestrictedCategoryError,
  DataForSEOError,
} from "./utils";


// ============================================
// CONFIGURATION
// ============================================

const DEFAULT_BASE_URL = "https://api.dataforseo.com/v3";
const DEFAULT_TIMEOUT_MS = 30000;
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

// Standard task polling configuration
const TASK_POLL_MAX_WAIT_MS = 8000; // Max time to wait for task completion
const TASK_POLL_INTERVALS_MS = [500, 1000, 2000, 3000]; // Exponential backoff

// Google Trends has longer processing times - wait up to 30 seconds server-side
const TRENDS_POLL_MAX_WAIT_MS = 30000;
const TRENDS_POLL_INTERVALS_MS = [1000, 2000, 3000, 4000, 5000]; // Longer intervals

// ============================================
// TYPES
// ============================================

/**
 * Full keyword metrics returned from DataForSEO.
 * Includes all fields from the Google Ads Keywords Data API.
 */
export type KeywordMetrics = {
  keyword: string;
  searchVolume: number;
  difficultyEstimate: number; // Calculated heuristic (0-100)
  cpc: number;
  competition: number; // 0-1 normalized (from competition field)
  competitionIndex: number; // 0-100 (from competition_index field)
  competitionLevel: string | null; // HIGH/MEDIUM/LOW
  lowTopOfPageBid: number | null;
  highTopOfPageBid: number | null;
  trend: number[]; // 12 months of trend data (from monthly_searches)
  monthlySearches: Array<{ year: number; month: number; searchVolume: number }>;
  intent: string | null;
  categories: number[] | null;
  spellingCorrectedFrom: string | null; // If keyword was spell-corrected
  difficultyIsEstimate: true; // Flag indicating difficulty is a heuristic
};

export type KeywordOverviewRow = KeywordMetrics;

export type RelatedKeywordRow = KeywordMetrics & {
  relevance: number;
};

export type KeywordOverviewResponse = {
  rows: KeywordOverviewRow[];
  meta: {
    location: string;
    fetchedAt: string;
    taskId?: string;
  };
};

export type KeywordRelatedResponse = {
  rows: RelatedKeywordRow[];
  meta: {
    location: string;
    phrase: string; // Primary phrase (first in array)
    phrases?: string[]; // All phrases searched
    fetchedAt: string;
    taskId?: string;
  };
};

/**
 * Combined response with seed metrics + related keywords.
 * Fetches both in parallel for efficiency.
 */
export type KeywordCombinedResponse = {
  seedMetrics: KeywordMetrics | null;
  relatedKeywords: RelatedKeywordRow[];
  meta: {
    location: string;
    phrase: string;
    fetchedAt: string;
    seedTaskId?: string;
    relatedTaskId?: string;
  };
  pending?: {
    seed?: boolean;
    related?: boolean;
    seedTaskId?: string;
    relatedTaskId?: string;
  };
};

/**
 * Google Trends data types
 */
export type GoogleTrendsTimePoint = {
  dateFrom: string;
  dateTo: string;
  timestamp: number;
  value: number;
  missingData: boolean;
};

export type GoogleTrendsRisingQuery = {
  query: string;
  value: number; // Growth percentage or "Breakout"
};

export type GoogleTrendsRegion = {
  geoId: string;
  geoName: string;
  value: number;
};

export type GoogleTrendsResponse = {
  keyword: string;
  interestOverTime: GoogleTrendsTimePoint[];
  risingQueries: GoogleTrendsRisingQuery[];
  topQueries: Array<{ query: string; value: number }>;
  regionBreakdown: GoogleTrendsRegion[];
  averageInterest: number;
  meta: {
    location: string;
    dateFrom: string;
    dateTo: string;
    fetchedAt: string;
    taskId?: string;
  };
  pending?: boolean;
  taskId?: string;
};

/**
 * Result of a task_post request.
 */
type TaskPostResult = {
  taskId: string;
  status: "queued" | "in_queue";
};

/**
 * Result of a task_get request.
 */
type TaskGetResult<T> = {
  status: "completed" | "pending" | "error";
  data?: T;
  error?: string;
  taskId: string;
};

// DataForSEO API response types
type DataForSEOApiResponse<T> = {
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
    data: Record<string, unknown>;
    result: T[] | null;
  }>;
};

/**
 * Search Volume task_get result structure (Standard API)
 * Based on official DataForSEO schema - FLAT structure
 * Docs: https://docs.dataforseo.com/v3/keywords_data/google_ads/search_volume/task_get/
 */
type SearchVolumeResult = {
  keyword: string;
  spell: string | null; // Corrected spelling if misspelled
  location_code: number | null;
  language_code: string | null;
  search_partners: boolean;
  // Metrics are FLAT on the result, not nested
  competition: string | null; // "HIGH" | "MEDIUM" | "LOW"
  competition_index: number | null; // 0-100
  search_volume: number | null;
  low_top_of_page_bid: number | null;
  high_top_of_page_bid: number | null;
  cpc: number | null;
  monthly_searches: Array<{
    year: number;
    month: number;
    search_volume: number;
  }> | null;
};

/**
 * Keywords for Keywords task_get result structure (Standard API)
 * Based on official DataForSEO schema - FLAT structure
 * Docs: https://docs.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/task_get/
 */
type KeywordsForKeywordsResult = {
  keyword: string;
  location_code: number | null;
  language_code: string | null;
  search_partners: boolean;
  // Metrics are FLAT on the result, not nested
  competition: string | null; // "HIGH" | "MEDIUM" | "LOW"
  competition_index: number | null; // 0-100
  search_volume: number | null;
  low_top_of_page_bid: number | null;
  high_top_of_page_bid: number | null;
  cpc: number | null;
  monthly_searches: Array<{
    year: number;
    month: number;
    search_volume: number;
  }> | null;
  keyword_annotations?: {
    concepts: Array<{
      name: string;
      concept_group: {
        name: string;
        type: string;
      };
    }>;
  } | null;
};

// ============================================
// HELPERS
// ============================================

/**
 * Get API credentials from environment
 */
function getCredentials(): { login: string; password: string } {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new DataForSEOError(
      "DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD must be configured",
      "CONFIG_ERROR"
    );
  }

  return { login, password };
}

/**
 * Get base URL from environment or default
 */
function getBaseUrl(): string {
  return process.env.DATAFORSEO_BASE_URL || DEFAULT_BASE_URL;
}

/**
 * Create Basic Auth header value
 */
function createAuthHeader(login: string, password: string): string {
  const credentials = Buffer.from(`${login}:${password}`).toString("base64");
  return `Basic ${credentials}`;
}

/**
 * Sleep with jitter for retries
 */
function sleepWithJitter(baseMs: number, attempt: number): Promise<void> {
  const exponentialDelay = baseMs * Math.pow(2, attempt);
  const jitter = Math.random() * exponentialDelay * 0.5;
  const delay = exponentialDelay + jitter;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Sleep for a fixed duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse a search volume result into our KeywordMetrics format.
 * 
 * Note: The Standard search_volume/task_get endpoint returns metrics
 * DIRECTLY on the result object, not nested under keyword_info.
 * The keyword_info structure is used by other endpoints like keywords_for_keywords.
 */
function parseSearchVolumeResult(
  item: SearchVolumeResult,
  fallbackKeyword: string
): KeywordMetrics {
  // Standard search_volume endpoint returns metrics FLAT on the item
  const searchVolume = parseInteger(item.search_volume);
  const competitionIndex = parseInteger(item.competition_index);
  const cpc = parseNumeric(item.cpc);
  const lowTopOfPageBid = item.low_top_of_page_bid ?? null;
  const highTopOfPageBid = item.high_top_of_page_bid ?? null;
  
  // competition is a string "LOW" | "MEDIUM" | "HIGH"
  const competitionLevel = item.competition;
  // Derive numeric competition (0-1) from competition_index (0-100)
  const competition = competitionIndex !== null ? competitionIndex / 100 : 0;

  // Calculate difficulty estimate from available signals
  const difficultyEstimate = calculateDifficultyHeuristic({
    competitionIndex,
    competition,
    cpc,
    highTopOfPageBid,
    searchVolume,
  });

  // Parse monthly searches
  const monthlySearchesRaw = item.monthly_searches ?? [];
  const trend = parseMonthlyTrend(monthlySearchesRaw);
  const monthlySearches = monthlySearchesRaw
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    })
    .slice(-12)
    .map((m) => ({
      year: m.year,
      month: m.month,
      searchVolume: m.search_volume ?? 0,
    }));

  return {
    keyword: item.keyword || fallbackKeyword,
    searchVolume,
    difficultyEstimate,
    cpc,
    competition,
    competitionIndex,
    competitionLevel,
    lowTopOfPageBid,
    highTopOfPageBid,
    trend,
    monthlySearches,
    intent: null, // Not available in search_volume endpoint
    categories: null,
    spellingCorrectedFrom: item.spell || null,
    difficultyIsEstimate: true as const,
  };
}

/**
 * Parse a keywords-for-keywords result into our RelatedKeywordRow format.
 * Standard API returns FLAT structure with metrics directly on the item.
 */
function parseKeywordsForKeywordsResult(
  item: KeywordsForKeywordsResult,
  index: number
): RelatedKeywordRow {
  // Standard endpoint returns metrics FLAT on the item
  const searchVolume = parseInteger(item.search_volume);
  const competitionIndex = parseInteger(item.competition_index);
  const cpc = parseNumeric(item.cpc);
  const lowTopOfPageBid = item.low_top_of_page_bid ?? null;
  const highTopOfPageBid = item.high_top_of_page_bid ?? null;
  
  // competition is a string "LOW" | "MEDIUM" | "HIGH"
  const competitionLevel = item.competition;
  // Derive numeric competition (0-1) from competition_index (0-100)
  const competition = competitionIndex !== null ? competitionIndex / 100 : 0;

  // Calculate difficulty estimate
  const difficultyEstimate = calculateDifficultyHeuristic({
    competitionIndex,
    competition,
    cpc,
    highTopOfPageBid,
    searchVolume,
  });

  // Parse monthly searches
  const monthlySearchesRaw = item.monthly_searches ?? [];
  const trend = parseMonthlyTrend(monthlySearchesRaw);
  const monthlySearches = monthlySearchesRaw
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    })
    .slice(-12)
    .map((m) => ({
      year: m.year,
      month: m.month,
      searchVolume: m.search_volume ?? 0,
    }));

  // Calculate relevance based on position (first results more relevant)
  const relevance = Math.max(0, 1 - index * 0.02);

  return {
    keyword: item.keyword || "",
    searchVolume,
    difficultyEstimate,
    cpc,
    competition,
    competitionIndex,
    competitionLevel,
    lowTopOfPageBid,
    highTopOfPageBid,
    trend,
    monthlySearches,
    intent: null, // Not available in keywords_for_keywords endpoint
    categories: null,
    spellingCorrectedFrom: null,
    relevance,
    difficultyIsEstimate: true as const,
  };
}

// ============================================
// STANDARD TASK-BASED API METHODS
// ============================================

/**
 * Post a search volume task using the Standard method.
 *
 * Endpoint: POST /v3/keywords_data/google_ads/search_volume/task_post
 *
 * Returns a taskId that can be used with getSearchVolumeTask() to retrieve results.
 */
export async function postSearchVolumeTask(options: {
  keywords: string[];
  location?: string;
  searchPartners?: boolean;
  dateFrom?: string;
  dateTo?: string;
}): Promise<TaskPostResult> {
  // Validate keywords
  const { valid: validKeywords, invalid } = validateKeywords(options.keywords, 1000);

  if (validKeywords.length === 0) {
    throw new DataForSEOError(
      invalid.length > 0
        ? `All keywords invalid: ${invalid[0]?.error}`
        : "No keywords provided",
      "VALIDATION_ERROR"
    );
  }

  const locationInfo = validateLocation(options.location ?? "us");

  const endpoint = "/keywords_data/google_ads/search_volume/task_post";
  const body = [
    {
      keywords: validKeywords,
      location_code: locationInfo.location_code,
      language_code: locationInfo.language_code,
      search_partners: options.searchPartners ?? false,
      ...(options.dateFrom && { date_from: options.dateFrom }),
      ...(options.dateTo && { date_to: options.dateTo }),
    },
  ];

  const response = await fetchWithRetry<unknown>(endpoint, body);

  // Extract task ID from first task
  const task = response.tasks?.[0];
  if (!task?.id) {
    throw new DataForSEOError("No task ID returned from task_post", "API_ERROR");
  }

  logger.info("dataforseo.task_posted", {
    taskId: task.id,
    keywordCount: validKeywords.length,
    location: locationInfo.region,
  });

  return {
    taskId: task.id,
    status: "queued",
  };
}

/**
 * Get search volume task results using the Standard method.
 *
 * Endpoint: GET /v3/keywords_data/google_ads/search_volume/task_get/{id}
 *
 * Returns parsed results if task is complete, or indicates pending status.
 */
export async function getSearchVolumeTask(
  taskId: string
): Promise<TaskGetResult<KeywordMetrics[]>> {
  const endpoint = `/keywords_data/google_ads/search_volume/task_get/${taskId}`;

  try {
    const response = await fetchWithRetry<SearchVolumeResult>(endpoint, null, MAX_RETRIES, "GET");

    // Check API-level status for "Task In Queue" (40601 or message contains "queue")
    // When task isn't ready, DataForSEO returns 40601 at the API level
    if (
      response.status_code === 40601 ||
      response.status_message?.toLowerCase().includes("queue")
    ) {
      return {
        status: "pending",
        taskId,
      };
    }

    const task = response.tasks?.[0];

    // Check task status
    if (!task) {
      return {
        status: "error",
        error: "Task not found",
        taskId,
      };
    }

    // Also check task-level status code for pending (in case API returns 20000 but task is queued)
    // Check both status_code AND status_message since DataForSEO may use different codes
    if (
      task.status_code === 40601 ||
      task.status_message?.toLowerCase().includes("queue")
    ) {
      return {
        status: "pending",
        taskId,
      };
    }

    if (task.status_code !== 20000) {
      // Check for restricted category
      if (isRestrictedCategoryError(task.status_code, task.status_message)) {
        return {
          status: "error",
          error: "Some keywords can't return data due to Google Ads restrictions.",
          taskId,
        };
      }

      return {
        status: "error",
        error: task.status_message || `Task failed with code ${task.status_code}`,
        taskId,
      };
    }

    const results = task.result;
    if (!results || results.length === 0) {
      // Empty results - might be restricted keywords
      return {
        status: "completed",
        data: [],
        taskId,
      };
    }

    // Parse all results
    const parsedResults = results.map((item, index) =>
      parseSearchVolumeResult(item, `keyword_${index}`)
    );

    return {
      status: "completed",
      data: parsedResults,
      taskId,
    };
  } catch (err) {
    // Handle specific error for task not ready
    if (err instanceof DataForSEOError && err.message.includes("not ready")) {
      return {
        status: "pending",
        taskId,
      };
    }
    throw err;
  }
}

/**
 * Post a keywords-for-keywords task (related keywords).
 *
 * Endpoint: POST /v3/keywords_data/google_ads/keywords_for_keywords/task_post
 */
export async function postKeywordsForKeywordsTask(options: {
  keywords: string[];
  location?: string;
  limit?: number;
  searchPartners?: boolean;
}): Promise<TaskPostResult> {
  const { valid: validKeywords, invalid } = validateKeywords(options.keywords, 20);

  if (validKeywords.length === 0) {
    throw new DataForSEOError(
      invalid.length > 0
        ? `All keywords invalid: ${invalid[0]?.error}`
        : "No keywords provided",
      "VALIDATION_ERROR"
    );
  }

  const locationInfo = validateLocation(options.location ?? "us");
  const limit = Math.min(options.limit ?? 50, 1000);

  const endpoint = "/keywords_data/google_ads/keywords_for_keywords/task_post";
  const body = [
    {
      keywords: validKeywords,
      location_code: locationInfo.location_code,
      language_code: locationInfo.language_code,
      search_partners: options.searchPartners ?? false,
      limit,
    },
  ];

  const response = await fetchWithRetry<unknown>(endpoint, body);

  const task = response.tasks?.[0];
  if (!task?.id) {
    throw new DataForSEOError("No task ID returned from task_post", "API_ERROR");
  }

  logger.info("dataforseo.keywords_for_keywords_posted", {
    taskId: task.id,
    keywordCount: validKeywords.length,
    location: locationInfo.region,
    limit,
  });

  return {
    taskId: task.id,
    status: "queued",
  };
}

/**
 * Get keywords-for-keywords task results.
 *
 * Endpoint: GET /v3/keywords_data/google_ads/keywords_for_keywords/task_get/{id}
 */
export async function getKeywordsForKeywordsTask(
  taskId: string
): Promise<TaskGetResult<RelatedKeywordRow[]>> {
  const endpoint = `/keywords_data/google_ads/keywords_for_keywords/task_get/${taskId}`;

  try {
    const response = await fetchWithRetry<KeywordsForKeywordsResult>(
      endpoint,
      null,
      MAX_RETRIES,
      "GET"
    );

    // Check API-level status for "Task In Queue" (40601 or message contains "queue")
    if (
      response.status_code === 40601 ||
      response.status_message?.toLowerCase().includes("queue")
    ) {
      return {
        status: "pending",
        taskId,
      };
    }

    const task = response.tasks?.[0];

    if (!task) {
      return {
        status: "error",
        error: "Task not found",
        taskId,
      };
    }

    // Also check task-level status code for pending
    // Check both status_code AND status_message since DataForSEO may use different codes
    if (
      task.status_code === 40601 ||
      task.status_message?.toLowerCase().includes("queue")
    ) {
      return {
        status: "pending",
        taskId,
      };
    }

    if (task.status_code !== 20000) {
      if (isRestrictedCategoryError(task.status_code, task.status_message)) {
        return {
          status: "error",
          error: "Some keywords can't return data due to Google Ads restrictions.",
          taskId,
        };
      }

      return {
        status: "error",
        error: task.status_message || `Task failed with code ${task.status_code}`,
        taskId,
      };
    }

    const results = task.result;
    if (!results || results.length === 0) {
      return {
        status: "completed",
        data: [],
        taskId,
      };
    }

    // keywords_for_keywords returns keyword data directly in result array
    // Each item has: keyword, search_volume, competition, etc. (flat structure)
    const parsedResults = results.map((item, index) =>
      parseKeywordsForKeywordsResult(item as KeywordsForKeywordsResult, index)
    );

    return {
      status: "completed",
      data: parsedResults,
      taskId,
    };
  } catch (err) {
    if (err instanceof DataForSEOError && err.message.includes("not ready")) {
      return {
        status: "pending",
        taskId,
      };
    }
    throw err;
  }
}

// ============================================
// HIGH-LEVEL API METHODS (with sync wait)
// ============================================

/**
 * Fetch keyword overview (search volume) with synchronous wait.
 *
 * Uses Standard task-based API but attempts to wait for results
 * synchronously up to TASK_POLL_MAX_WAIT_MS. If not ready by then,
 * returns pending status with taskId for async polling.
 */
export async function fetchKeywordOverview(options: {
  phrase: string;
  location?: string;
}): Promise<KeywordOverviewResponse & { pending?: boolean; taskId?: string }> {
  const phrase = validatePhrase(options.phrase);
  const locationInfo = validateLocation(options.location ?? "us");

  // Post the task
  const postResult = await postSearchVolumeTask({
    keywords: [phrase],
    location: locationInfo.region,
  });

  const taskId = postResult.taskId;

  // Try to get results with exponential backoff
  const startTime = Date.now();
  let attemptIndex = 0;

  while (Date.now() - startTime < TASK_POLL_MAX_WAIT_MS) {
    // Wait before first attempt to give task time to process
    const waitTime = TASK_POLL_INTERVALS_MS[attemptIndex] ?? TASK_POLL_INTERVALS_MS[TASK_POLL_INTERVALS_MS.length - 1];
    await sleep(waitTime ?? 1000);

    const result = await getSearchVolumeTask(taskId);

    if (result.status === "completed") {
      logger.info("dataforseo.overview_completed", {
        taskId,
        keywordCount: result.data?.length ?? 0,
        waitTimeMs: Date.now() - startTime,
      });

      return {
        rows: result.data ?? [],
        meta: {
          location: locationInfo.region,
          fetchedAt: new Date().toISOString(),
          taskId,
        },
      };
    }

    if (result.status === "error") {
      throw new DataForSEOError(
        result.error || "Task failed",
        "API_ERROR",
        taskId
      );
    }

    attemptIndex++;
  }

  // Task not ready within timeout - return pending status
  logger.info("dataforseo.overview_pending", {
    taskId,
    waitTimeMs: Date.now() - startTime,
  });

  return {
    rows: [],
    meta: {
      location: locationInfo.region,
      fetchedAt: new Date().toISOString(),
      taskId,
    },
    pending: true,
    taskId,
  };
}

/**
 * Fetch related keywords with synchronous wait.
 *
 * Uses Standard task-based API with sync wait behavior.
 * Accepts either a single phrase or an array of phrases (up to 20).
 */
export async function fetchRelatedKeywords(options: {
  phrase?: string;
  phrases?: string[];
  location?: string;
  limit?: number;
}): Promise<KeywordRelatedResponse & { pending?: boolean; taskId?: string }> {
  // Support both single phrase and array of phrases
  const inputPhrases = options.phrases ?? (options.phrase ? [options.phrase] : []);
  if (inputPhrases.length === 0) {
    throw new DataForSEOError("No keywords provided", "VALIDATION_ERROR");
  }

  // Validate all phrases
  const validatedPhrases = inputPhrases.map(p => validatePhrase(p));
  const locationInfo = validateLocation(options.location ?? "us");
  const limit = Math.min(options.limit ?? 50, 1000);

  // Post the task with all keywords
  const postResult = await postKeywordsForKeywordsTask({
    keywords: validatedPhrases,
    location: locationInfo.region,
    limit,
  });

  const taskId = postResult.taskId;

  // Try to get results with exponential backoff
  const startTime = Date.now();
  let attemptIndex = 0;

  while (Date.now() - startTime < TASK_POLL_MAX_WAIT_MS) {
    const waitTime = TASK_POLL_INTERVALS_MS[attemptIndex] ?? TASK_POLL_INTERVALS_MS[TASK_POLL_INTERVALS_MS.length - 1];
    await sleep(waitTime ?? 1000);

    const result = await getKeywordsForKeywordsTask(taskId);

    if (result.status === "completed") {
      logger.info("dataforseo.related_completed", {
        taskId,
        keywordCount: result.data?.length ?? 0,
        waitTimeMs: Date.now() - startTime,
      });

      return {
        rows: result.data ?? [],
        meta: {
          location: locationInfo.region,
          phrases: validatedPhrases,
          phrase: validatedPhrases[0], // Keep for backward compatibility
          fetchedAt: new Date().toISOString(),
          taskId,
        },
      };
    }

    if (result.status === "error") {
      throw new DataForSEOError(
        result.error || "Task failed",
        "API_ERROR",
        taskId
      );
    }

    attemptIndex++;
  }

  // Task not ready within timeout
  logger.info("dataforseo.related_pending", {
    taskId,
    waitTimeMs: Date.now() - startTime,
  });

  return {
    rows: [],
    meta: {
      location: locationInfo.region,
      phrases: validatedPhrases,
      phrase: validatedPhrases[0], // Keep for backward compatibility
      fetchedAt: new Date().toISOString(),
      taskId,
    },
    pending: true,
    taskId,
  };
}

// ============================================
// COMBINED KEYWORD RESEARCH (OPTIMIZED)
// ============================================

/**
 * Fetch seed keyword metrics AND related keywords in parallel.
 * This is more efficient than making two sequential calls.
 */
export async function fetchCombinedKeywordData(options: {
  phrase: string;
  location?: string;
  limit?: number;
}): Promise<KeywordCombinedResponse> {
  const phrase = validatePhrase(options.phrase);
  const locationInfo = validateLocation(options.location ?? "us");
  const limit = Math.min(options.limit ?? 50, 1000);

  // Post BOTH tasks in parallel
  const [seedPostResult, relatedPostResult] = await Promise.all([
    postSearchVolumeTask({
      keywords: [phrase],
      location: locationInfo.region,
    }),
    postKeywordsForKeywordsTask({
      keywords: [phrase],
      location: locationInfo.region,
      limit,
    }),
  ]);

  const seedTaskId = seedPostResult.taskId;
  const relatedTaskId = relatedPostResult.taskId;

  logger.info("dataforseo.combined_tasks_posted", {
    seedTaskId,
    relatedTaskId,
    phrase,
    location: locationInfo.region,
  });

  // Poll both tasks in parallel with exponential backoff
  const startTime = Date.now();
  let attemptIndex = 0;
  let seedResult: TaskGetResult<KeywordMetrics[]> | undefined;
  let relatedResult: TaskGetResult<RelatedKeywordRow[]> | undefined;

  while (Date.now() - startTime < TASK_POLL_MAX_WAIT_MS) {
    const waitTime = TASK_POLL_INTERVALS_MS[attemptIndex] ?? TASK_POLL_INTERVALS_MS[TASK_POLL_INTERVALS_MS.length - 1];
    await sleep(waitTime ?? 1000);

    // Fetch both results in parallel if not yet completed
    const [newSeedResult, newRelatedResult] = await Promise.all([
      !seedResult || seedResult.status === "pending"
        ? getSearchVolumeTask(seedTaskId)
        : Promise.resolve(seedResult),
      !relatedResult || relatedResult.status === "pending"
        ? getKeywordsForKeywordsTask(relatedTaskId)
        : Promise.resolve(relatedResult),
    ]);

    seedResult = newSeedResult;
    relatedResult = newRelatedResult;

    // Check if both completed
    if (seedResult.status === "completed" && relatedResult.status === "completed") {
      logger.info("dataforseo.combined_completed", {
        seedTaskId,
        relatedTaskId,
        seedKeywordCount: seedResult.data?.length ?? 0,
        relatedKeywordCount: relatedResult.data?.length ?? 0,
        waitTimeMs: Date.now() - startTime,
      });

      return {
        seedMetrics: seedResult.data?.[0] ?? null,
        relatedKeywords: relatedResult.data ?? [],
        meta: {
          location: locationInfo.region,
          phrase,
          fetchedAt: new Date().toISOString(),
          seedTaskId,
          relatedTaskId,
        },
      };
    }

    // Check for errors
    if (seedResult.status === "error") {
      throw new DataForSEOError(
        seedResult.error || "Seed keyword task failed",
        "API_ERROR",
        seedTaskId
      );
    }
    if (relatedResult.status === "error") {
      throw new DataForSEOError(
        relatedResult.error || "Related keywords task failed",
        "API_ERROR",
        relatedTaskId
      );
    }

    attemptIndex++;
  }

  // Return partial results if timeout
  const finalSeedStatus = seedResult?.status ?? "pending";
  const finalRelatedStatus = relatedResult?.status ?? "pending";
  
  logger.info("dataforseo.combined_partial", {
    seedTaskId,
    relatedTaskId,
    seedCompleted: finalSeedStatus === "completed",
    relatedCompleted: finalRelatedStatus === "completed",
    waitTimeMs: Date.now() - startTime,
  });

  return {
    seedMetrics: finalSeedStatus === "completed" && seedResult?.data ? seedResult.data[0] ?? null : null,
    relatedKeywords: finalRelatedStatus === "completed" && relatedResult?.data ? relatedResult.data : [],
    meta: {
      location: locationInfo.region,
      phrase,
      fetchedAt: new Date().toISOString(),
      seedTaskId,
      relatedTaskId,
    },
    pending: {
      seed: finalSeedStatus !== "completed",
      related: finalRelatedStatus !== "completed",
      seedTaskId: finalSeedStatus !== "completed" ? seedTaskId : undefined,
      relatedTaskId: finalRelatedStatus !== "completed" ? relatedTaskId : undefined,
    },
  };
}

// ============================================
// GOOGLE TRENDS API
// ============================================

/**
 * Google Trends task_get result structure
 * Endpoint: /keywords_data/google_trends/explore/task_get/{id}
 */
type GoogleTrendsResult = {
  keywords: string[];
  type: string;
  location_code: number;
  language_code: string;
  check_url: string;
  datetime: string;
  items_count: number;
  items: Array<{
    position: number;
    type: "google_trends_graph" | "google_trends_map" | "google_trends_queries_list";
    title: string;
    keywords: string[];
    data?: Array<{
      date_from?: string;
      date_to?: string;
      timestamp?: number;
      missing_data?: boolean;
      values?: number[];
      // For map data
      geo_id?: string;
      geo_name?: string;
      max_value_index?: number;
    }> | {
      // For queries list
      top?: Array<{ query: string; value: number }>;
      rising?: Array<{ query: string; value: number }>;
    };
    averages?: number[];
  }>;
};

/**
 * Post a Google Trends explore task.
 * 
 * Endpoint: POST /v3/keywords_data/google_trends/explore/task_post
 */
async function postGoogleTrendsTask(options: {
  keywords: string[];
  location?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<TaskPostResult> {
  const { valid: validKeywords, invalid } = validateKeywords(options.keywords, 5);

  if (validKeywords.length === 0) {
    throw new DataForSEOError(
      invalid.length > 0
        ? `All keywords invalid: ${invalid[0]?.error}`
        : "No keywords provided",
      "VALIDATION_ERROR"
    );
  }

  const locationInfo = validateLocation(options.location ?? "us");
  
  // Default to last 12 months if not specified
  const now = new Date();
  const defaultDateFrom = new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString().split("T")[0];
  const defaultDateTo = now.toISOString().split("T")[0];

  const endpoint = "/keywords_data/google_trends/explore/task_post";
  const body = [
    {
      keywords: validKeywords,
      location_code: locationInfo.location_code,
      language_code: locationInfo.language_code,
      date_from: options.dateFrom ?? defaultDateFrom,
      date_to: options.dateTo ?? defaultDateTo,
      // Explicitly request graph and queries list (API defaults to only graph)
      // Note: google_trends_queries_list requires only 1 keyword (which we use)
      item_types: ["google_trends_graph", "google_trends_queries_list"],
    },
  ];

  const response = await fetchWithRetry<unknown>(endpoint, body);

  const task = response.tasks?.[0];
  if (!task?.id) {
    throw new DataForSEOError("No task ID returned from Google Trends task_post", "API_ERROR");
  }

  logger.info("dataforseo.google_trends_posted", {
    taskId: task.id,
    keywords: validKeywords,
    location: locationInfo.region,
  });

  return {
    taskId: task.id,
    status: "queued",
  };
}

/**
 * Get Google Trends task results.
 * 
 * Endpoint: GET /v3/keywords_data/google_trends/explore/task_get/{id}
 */
export async function getGoogleTrendsTask(
  taskId: string
): Promise<TaskGetResult<GoogleTrendsResult>> {
  const endpoint = `/keywords_data/google_trends/explore/task_get/${taskId}`;

  try {
    const response = await fetchWithRetry<GoogleTrendsResult>(
      endpoint,
      null,
      MAX_RETRIES,
      "GET"
    );

    // Check for task in queue status
    if (
      response.status_code === 40601 ||
      response.status_message?.toLowerCase().includes("queue")
    ) {
      return {
        status: "pending",
        taskId,
      };
    }

    const task = response.tasks?.[0];

    if (!task) {
      return {
        status: "error",
        error: "Task not found",
        taskId,
      };
    }

    if (
      task.status_code === 40601 ||
      task.status_message?.toLowerCase().includes("queue")
    ) {
      return {
        status: "pending",
        taskId,
      };
    }

    if (task.status_code !== 20000) {
      return {
        status: "error",
        error: task.status_message || "Unknown error",
        taskId,
      };
    }

    const result = task.result?.[0];
    if (!result) {
      return {
        status: "completed",
        data: undefined,
        taskId,
      };
    }

    return {
      status: "completed",
      data: result,
      taskId,
    };
  } catch (err) {
    if (err instanceof DataForSEOError) {
      throw err;
    }
    throw new DataForSEOError(
      `Failed to get Google Trends task: ${err instanceof Error ? err.message : "Unknown error"}`,
      "API_ERROR",
      taskId
    );
  }
}

/**
 * Parse Google Trends raw result into structured response.
 * Exported for use by task polling endpoint.
 */
export function parseGoogleTrendsResult(
  result: GoogleTrendsResult,
  keyword: string,
  location: string,
  taskId: string
): GoogleTrendsResponse {
  let interestOverTime: GoogleTrendsTimePoint[] = [];
  let risingQueries: GoogleTrendsRisingQuery[] = [];
  let topQueries: Array<{ query: string; value: number }> = [];
  let regionBreakdown: GoogleTrendsRegion[] = [];
  let averageInterest = 0;
  let dateFrom = "";
  let dateTo = "";

  for (const item of result.items || []) {
    // Interest over time graph - check type only, title may vary by language
    if (item.type === "google_trends_graph") {
      const graphData = item.data as Array<{
        date_from?: string;
        date_to?: string;
        timestamp?: number;
        missing_data?: boolean;
        values?: number[];
      }>;
      
      if (Array.isArray(graphData)) {
        // Find the keyword index (first keyword by default)
        const keywordIndex = item.keywords?.indexOf(keyword) ?? 0;
        
        interestOverTime = graphData.map((point) => ({
          dateFrom: point.date_from ?? "",
          dateTo: point.date_to ?? "",
          timestamp: point.timestamp ?? 0,
          value: point.values?.[keywordIndex] ?? 0,
          missingData: point.missing_data ?? false,
        }));

        if (graphData.length > 0) {
          dateFrom = graphData[0]?.date_from ?? "";
          dateTo = graphData[graphData.length - 1]?.date_to ?? "";
        }
      }

      // Get average from the averages array
      if (item.averages && item.averages.length > 0) {
        const keywordIndex = item.keywords?.indexOf(keyword) ?? 0;
        averageInterest = item.averages[keywordIndex] ?? 0;
      }
    }

    // Interest by region map - check type only, title may vary
    if (item.type === "google_trends_map") {
      const mapData = item.data as Array<{
        geo_id?: string;
        geo_name?: string;
        values?: number[];
        max_value_index?: number;
      }>;
      
      if (Array.isArray(mapData)) {
        const keywordIndex = item.keywords?.indexOf(keyword) ?? 0;
        
        regionBreakdown = mapData
          .filter((region) => region.values?.[keywordIndex] != null)
          .map((region) => ({
            geoId: region.geo_id ?? "",
            geoName: region.geo_name ?? "",
            value: region.values?.[keywordIndex] ?? 0,
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 20); // Top 20 regions
      }
    }

    // Related queries - check type only, title may vary
    if (item.type === "google_trends_queries_list") {
      const queriesData = item.data as {
        top?: Array<{ query: string; value: number }>;
        rising?: Array<{ query: string; value: number }>;
      };

      if (queriesData) {
        if (queriesData.top) {
          topQueries = queriesData.top.slice(0, 15);
        }
        if (queriesData.rising) {
          risingQueries = queriesData.rising.map((q) => ({
            query: q.query,
            value: q.value,
          }));
        }
      }
    }
  }

  return {
    keyword,
    interestOverTime,
    risingQueries,
    topQueries,
    regionBreakdown,
    averageInterest,
    meta: {
      location,
      dateFrom,
      dateTo,
      fetchedAt: new Date().toISOString(),
      taskId,
    },
  };
}

/**
 * Fetch Google Trends data for a keyword with synchronous wait.
 */
export async function fetchGoogleTrends(options: {
  keyword: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<GoogleTrendsResponse> {
  const phrase = validatePhrase(options.keyword);
  const locationInfo = validateLocation(options.location ?? "us");

  // Post the task
  const postResult = await postGoogleTrendsTask({
    keywords: [phrase],
    location: locationInfo.region,
    dateFrom: options.dateFrom,
    dateTo: options.dateTo,
  });

  const taskId = postResult.taskId;

  // Poll for results - Google Trends uses longer timeouts since it's slower
  const startTime = Date.now();
  let attemptIndex = 0;

  while (Date.now() - startTime < TRENDS_POLL_MAX_WAIT_MS) {
    const waitTime = TRENDS_POLL_INTERVALS_MS[attemptIndex] ?? TRENDS_POLL_INTERVALS_MS[TRENDS_POLL_INTERVALS_MS.length - 1];
    await sleep(waitTime ?? 2000);

    const result = await getGoogleTrendsTask(taskId);

    if (result.status === "completed" && result.data) {
      logger.info("dataforseo.google_trends_completed", {
        taskId,
        itemCount: result.data.items_count,
        waitTimeMs: Date.now() - startTime,
      });

      return parseGoogleTrendsResult(result.data, phrase, locationInfo.region, taskId);
    }

    if (result.status === "error") {
      throw new DataForSEOError(
        result.error || "Google Trends task failed",
        "API_ERROR",
        taskId
      );
    }

    attemptIndex++;
  }

  // Task not ready within timeout (30 seconds)
  logger.info("dataforseo.google_trends_pending", {
    taskId,
    waitTimeMs: Date.now() - startTime,
  });

  return {
    keyword: phrase,
    interestOverTime: [],
    risingQueries: [],
    topQueries: [],
    regionBreakdown: [],
    averageInterest: 0,
    meta: {
      location: locationInfo.region,
      dateFrom: "",
      dateTo: "",
      fetchedAt: new Date().toISOString(),
      taskId,
    },
    pending: true,
    taskId,
  };
}

// ============================================
// LOW-LEVEL FETCH
// ============================================

/**
 * Fetch with timeout, Basic Auth, and retries
 */
async function fetchWithRetry<T>(
  endpoint: string,
  body: unknown,
  retries: number = MAX_RETRIES,
  method: "POST" | "GET" = "POST"
): Promise<DataForSEOApiResponse<T>> {
  const credentials = getCredentials();
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

      const fetchOptions: RequestInit = {
        method,
        signal: controller.signal,
        headers: {
          Authorization: createAuthHeader(credentials.login, credentials.password),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      };

      if (method === "POST" && body !== null) {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);

      clearTimeout(timeoutId);

      // Parse response
      let data: DataForSEOApiResponse<T>;
      try {
        data = await response.json();
      } catch {
        throw new DataForSEOError("Invalid JSON response from API", "PARSE_ERROR");
      }

      // Check HTTP status
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new DataForSEOError("Invalid API credentials", "AUTH_ERROR");
        }

        if (response.status === 429) {
          throw new DataForSEOError("Rate limited by DataForSEO API", "RATE_LIMITED");
        }

        if (
          response.status === 402 ||
          data.status_message?.toLowerCase().includes("balance")
        ) {
          throw new DataForSEOError("DataForSEO API balance exceeded", "QUOTA_EXCEEDED");
        }

        throw new DataForSEOError(
          `DataForSEO API error: ${response.status} - ${data.status_message || "Unknown error"}`,
          "API_ERROR"
        );
      }

      // Check API-level status
      // Note: 40601 = "Task In Queue" - this is a valid response for task_get when task isn't ready
      // We allow it to pass through so the calling function can handle pending state
      // Also check status_message for "queue" as DataForSEO may use different codes
      const isTaskInQueue =
        data.status_code === 40601 ||
        data.status_message?.toLowerCase().includes("queue");

      if (data.status_code !== 20000 && !isTaskInQueue) {
        if (data.status_code === 40001) {
          throw new DataForSEOError("Invalid request parameters", "VALIDATION_ERROR");
        }
        if (data.status_code === 40201) {
          throw new DataForSEOError("Insufficient balance", "QUOTA_EXCEEDED");
        }

        throw new DataForSEOError(
          `DataForSEO error: ${data.status_message || "Unknown error"}`,
          "API_ERROR"
        );
      }

      // Check task-level errors (but don't fail if some tasks have errors)
      if (data.tasks_error > 0) {
        const taskError = data.tasks?.find((t) => t.status_code !== 20000);
        if (taskError) {
          logger.warn("dataforseo.task_error", {
            status_code: taskError.status_code,
            status_message: taskError.status_message,
          });
        }
      }

      return data;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry on validation, auth, or quota errors
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

      // Log and retry (never log credentials)
      logger.warn("dataforseo.fetch_retry", {
        attempt: attempt + 1,
        maxRetries: retries,
        error: lastError.message,
        endpoint,
      });

      if (attempt < retries - 1) {
        await sleepWithJitter(BASE_RETRY_DELAY_MS, attempt);
      }
    }
  }

  // All retries exhausted
  throw lastError || new DataForSEOError("Request failed", "NETWORK_ERROR");
}

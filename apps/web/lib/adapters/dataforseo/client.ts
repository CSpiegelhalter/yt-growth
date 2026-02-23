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

import { logger } from "@/lib/shared/logger";

import {
  calculateDifficultyHeuristic,
  classifyApiStatusError,
  classifyHttpError,
  DataForSEOError,
  isNonRetryableError,
  isQueuedStatus,
  isRestrictedCategoryError,
  parseInteger,
  parseMonthlyTrend,
  parseNumeric,
  validateKeywords,
  validateLocation,
  validatePhrase,
} from "./utils";


// ============================================
// CONFIGURATION
// ============================================

const DEFAULT_BASE_URL = "https://api.dataforseo.com/v3";
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

const TASK_POLL_MAX_WAIT_MS = 8000;
const TASK_POLL_INTERVALS_MS = [500, 1000, 2000, 3000];

const TRENDS_POLL_MAX_WAIT_MS = 30_000;
const TRENDS_POLL_INTERVALS_MS = [1000, 2000, 3000, 4000, 5000];

// ============================================
// TYPES
// ============================================

export type KeywordMetrics = {
  keyword: string;
  searchVolume: number;
  difficultyEstimate: number;
  cpc: number;
  competition: number;
  competitionIndex: number;
  competitionLevel: string | null;
  lowTopOfPageBid: number | null;
  highTopOfPageBid: number | null;
  trend: number[];
  monthlySearches: Array<{ year: number; month: number; searchVolume: number }>;
  intent: string | null;
  categories: number[] | null;
  spellingCorrectedFrom: string | null;
  difficultyIsEstimate: true;
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
    phrase: string;
    phrases?: string[];
    fetchedAt: string;
    taskId?: string;
  };
};

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

export type GoogleTrendsTimePoint = {
  dateFrom: string;
  dateTo: string;
  timestamp: number;
  value: number;
  missingData: boolean;
};

export type GoogleTrendsRisingQuery = {
  query: string;
  value: number;
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

type TaskPostResult = {
  taskId: string;
  status: "queued" | "in_queue";
};

type TaskGetResult<T> = {
  status: "completed" | "pending" | "error";
  data?: T;
  error?: string;
  taskId: string;
};

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

type SearchVolumeResult = {
  keyword: string;
  spell: string | null;
  location_code: number | null;
  language_code: string | null;
  search_partners: boolean;
  competition: string | null;
  competition_index: number | null;
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

type KeywordsForKeywordsResult = {
  keyword: string;
  location_code: number | null;
  language_code: string | null;
  search_partners: boolean;
  competition: string | null;
  competition_index: number | null;
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
  const delay = exponentialDelay + jitter;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseSearchVolumeResult(
  item: SearchVolumeResult,
  fallbackKeyword: string
): KeywordMetrics {
  const searchVolume = parseInteger(item.search_volume);
  const competitionIndex = parseInteger(item.competition_index);
  const cpc = parseNumeric(item.cpc);
  const lowTopOfPageBid = item.low_top_of_page_bid ?? null;
  const highTopOfPageBid = item.high_top_of_page_bid ?? null;
  
  const competitionLevel = item.competition;
  const competition = competitionIndex !== null ? competitionIndex / 100 : 0;

  const difficultyEstimate = calculateDifficultyHeuristic({
    competitionIndex,
    competition,
    cpc,
    highTopOfPageBid,
    searchVolume,
  });

  const monthlySearchesRaw = item.monthly_searches ?? [];
  const trend = parseMonthlyTrend(monthlySearchesRaw);
  const monthlySearches = monthlySearchesRaw
    .sort((a, b) => {
      if (a.year !== b.year) {return a.year - b.year;}
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
    intent: null,
    categories: null,
    spellingCorrectedFrom: item.spell || null,
    difficultyIsEstimate: true as const,
  };
}

function parseKeywordsForKeywordsResult(
  item: KeywordsForKeywordsResult,
  index: number
): RelatedKeywordRow {
  const searchVolume = parseInteger(item.search_volume);
  const competitionIndex = parseInteger(item.competition_index);
  const cpc = parseNumeric(item.cpc);
  const lowTopOfPageBid = item.low_top_of_page_bid ?? null;
  const highTopOfPageBid = item.high_top_of_page_bid ?? null;
  
  const competitionLevel = item.competition;
  const competition = competitionIndex !== null ? competitionIndex / 100 : 0;

  const difficultyEstimate = calculateDifficultyHeuristic({
    competitionIndex,
    competition,
    cpc,
    highTopOfPageBid,
    searchVolume,
  });

  const monthlySearchesRaw = item.monthly_searches ?? [];
  const trend = parseMonthlyTrend(monthlySearchesRaw);
  const monthlySearches = monthlySearchesRaw
    .sort((a, b) => {
      if (a.year !== b.year) {return a.year - b.year;}
      return a.month - b.month;
    })
    .slice(-12)
    .map((m) => ({
      year: m.year,
      month: m.month,
      searchVolume: m.search_volume ?? 0,
    }));

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
    intent: null,
    categories: null,
    spellingCorrectedFrom: null,
    relevance,
    difficultyIsEstimate: true as const,
  };
}

// ============================================
// STANDARD TASK-BASED API METHODS
// ============================================

export async function postSearchVolumeTask(options: {
  keywords: string[];
  location?: string;
  searchPartners?: boolean;
  dateFrom?: string;
  dateTo?: string;
}): Promise<TaskPostResult> {
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

export async function getSearchVolumeTask(
  taskId: string
): Promise<TaskGetResult<KeywordMetrics[]>> {
  const endpoint = `/keywords_data/google_ads/search_volume/task_get/${taskId}`;

  try {
    const response = await fetchWithRetry<SearchVolumeResult>(endpoint, null, MAX_RETRIES, "GET");

    if (isQueuedStatus(response.status_code, response.status_message)) {
      return { status: "pending", taskId };
    }

    const task = response.tasks?.[0];
    if (!task) {
      return { status: "error", error: "Task not found", taskId };
    }

    if (isQueuedStatus(task.status_code, task.status_message)) {
      return { status: "pending", taskId };
    }

    if (task.status_code !== 20_000) {
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
      return { status: "completed", data: [], taskId };
    }

    const parsedResults = results.map((item, index) =>
      parseSearchVolumeResult(item, `keyword_${index}`)
    );

    return { status: "completed", data: parsedResults, taskId };
  } catch (error) {
    if (error instanceof DataForSEOError && error.message.includes("not ready")) {
      return { status: "pending", taskId };
    }
    throw error;
  }
}

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

    if (isQueuedStatus(response.status_code, response.status_message)) {
      return { status: "pending", taskId };
    }

    const task = response.tasks?.[0];
    if (!task) {
      return { status: "error", error: "Task not found", taskId };
    }

    if (isQueuedStatus(task.status_code, task.status_message)) {
      return { status: "pending", taskId };
    }

    if (task.status_code !== 20_000) {
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
      return { status: "completed", data: [], taskId };
    }

    const parsedResults = results.map((item, index) =>
      parseKeywordsForKeywordsResult(item as KeywordsForKeywordsResult, index)
    );

    return { status: "completed", data: parsedResults, taskId };
  } catch (error) {
    if (error instanceof DataForSEOError && error.message.includes("not ready")) {
      return { status: "pending", taskId };
    }
    throw error;
  }
}

// ============================================
// HIGH-LEVEL API METHODS (with sync wait)
// ============================================

export async function fetchKeywordOverview(options: {
  phrase: string;
  location?: string;
}): Promise<KeywordOverviewResponse & { pending?: boolean; taskId?: string }> {
  const phrase = validatePhrase(options.phrase);
  const locationInfo = validateLocation(options.location ?? "us");

  const postResult = await postSearchVolumeTask({
    keywords: [phrase],
    location: locationInfo.region,
  });

  const taskId = postResult.taskId;

  const startTime = Date.now();
  let attemptIndex = 0;

  while (Date.now() - startTime < TASK_POLL_MAX_WAIT_MS) {
    const waitTime = TASK_POLL_INTERVALS_MS[attemptIndex] ?? TASK_POLL_INTERVALS_MS.at(-1);
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

export async function fetchRelatedKeywords(options: {
  phrase?: string;
  phrases?: string[];
  location?: string;
  limit?: number;
}): Promise<KeywordRelatedResponse & { pending?: boolean; taskId?: string }> {
  const inputPhrases = options.phrases ?? (options.phrase ? [options.phrase] : []);
  if (inputPhrases.length === 0) {
    throw new DataForSEOError("No keywords provided", "VALIDATION_ERROR");
  }

  const validatedPhrases = inputPhrases.map(p => validatePhrase(p));
  const locationInfo = validateLocation(options.location ?? "us");
  const limit = Math.min(options.limit ?? 50, 1000);

  const postResult = await postKeywordsForKeywordsTask({
    keywords: validatedPhrases,
    location: locationInfo.region,
    limit,
  });

  const taskId = postResult.taskId;

  const startTime = Date.now();
  let attemptIndex = 0;

  while (Date.now() - startTime < TASK_POLL_MAX_WAIT_MS) {
    const waitTime = TASK_POLL_INTERVALS_MS[attemptIndex] ?? TASK_POLL_INTERVALS_MS.at(-1);
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
          phrase: validatedPhrases[0],
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

  logger.info("dataforseo.related_pending", {
    taskId,
    waitTimeMs: Date.now() - startTime,
  });

  return {
    rows: [],
    meta: {
      location: locationInfo.region,
      phrases: validatedPhrases,
      phrase: validatedPhrases[0],
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

function throwOnTaskError<T>(
  result: TaskGetResult<T>,
  fallbackMessage: string,
  taskId: string
): void {
  if (result.status === "error") {
    throw new DataForSEOError(result.error || fallbackMessage, "API_ERROR", taskId);
  }
}

async function pollDualTasks<A, B>(
  taskA: { id: string; poll: (id: string) => Promise<TaskGetResult<A>> },
  taskB: { id: string; poll: (id: string) => Promise<TaskGetResult<B>> },
  maxWaitMs: number,
  intervals: number[]
): Promise<{ a: TaskGetResult<A>; b: TaskGetResult<B> }> {
  const startTime = Date.now();
  let attemptIndex = 0;
  let a: TaskGetResult<A> | undefined;
  let b: TaskGetResult<B> | undefined;

  while (Date.now() - startTime < maxWaitMs) {
    const waitTime = intervals[attemptIndex] ?? intervals.at(-1) ?? 1000;
    await sleep(waitTime);

    [a, b] = await Promise.all([
      !a || a.status === "pending" ? taskA.poll(taskA.id) : Promise.resolve(a),
      !b || b.status === "pending" ? taskB.poll(taskB.id) : Promise.resolve(b),
    ]);

    if (a.status !== "pending" && b.status !== "pending") {
      break;
    }
    attemptIndex++;
  }

  return {
    a: a ?? { status: "pending", taskId: taskA.id },
    b: b ?? { status: "pending", taskId: taskB.id },
  };
}

function buildCombinedResponse(
  pollResults: { a: TaskGetResult<KeywordMetrics[]>; b: TaskGetResult<RelatedKeywordRow[]> },
  ctx: { phrase: string; region: string; seedTaskId: string; relatedTaskId: string }
): KeywordCombinedResponse {
  const { a: seedResult, b: relatedResult } = pollResults;

  throwOnTaskError(seedResult, "Seed keyword task failed", ctx.seedTaskId);
  throwOnTaskError(relatedResult, "Related keywords task failed", ctx.relatedTaskId);

  const seedCompleted = seedResult.status === "completed";
  const relatedCompleted = relatedResult.status === "completed";

  const meta = {
    location: ctx.region,
    phrase: ctx.phrase,
    fetchedAt: new Date().toISOString(),
    seedTaskId: ctx.seedTaskId,
    relatedTaskId: ctx.relatedTaskId,
  };

  const seedMetrics = seedCompleted && seedResult.data ? seedResult.data[0] ?? null : null;
  const relatedKeywords = relatedCompleted && relatedResult.data ? relatedResult.data : [];

  const response: KeywordCombinedResponse = { seedMetrics, relatedKeywords, meta };

  if (!seedCompleted || !relatedCompleted) {
    response.pending = {
      seed: !seedCompleted,
      related: !relatedCompleted,
      seedTaskId: !seedCompleted ? ctx.seedTaskId : undefined,
      relatedTaskId: !relatedCompleted ? ctx.relatedTaskId : undefined,
    };
  }

  return response;
}

export async function fetchCombinedKeywordData(options: {
  phrase: string;
  location?: string;
  limit?: number;
}): Promise<KeywordCombinedResponse> {
  const phrase = validatePhrase(options.phrase);
  const locationInfo = validateLocation(options.location ?? "us");
  const limit = Math.min(options.limit ?? 50, 1000);

  const [seedPostResult, relatedPostResult] = await Promise.all([
    postSearchVolumeTask({ keywords: [phrase], location: locationInfo.region }),
    postKeywordsForKeywordsTask({ keywords: [phrase], location: locationInfo.region, limit }),
  ]);

  const seedTaskId = seedPostResult.taskId;
  const relatedTaskId = relatedPostResult.taskId;

  logger.info("dataforseo.combined_tasks_posted", {
    seedTaskId,
    relatedTaskId,
    phrase,
    location: locationInfo.region,
  });

  const startTime = Date.now();
  const pollResults = await pollDualTasks(
    { id: seedTaskId, poll: getSearchVolumeTask },
    { id: relatedTaskId, poll: getKeywordsForKeywordsTask },
    TASK_POLL_MAX_WAIT_MS,
    TASK_POLL_INTERVALS_MS
  );

  const result = buildCombinedResponse(pollResults, {
    phrase,
    region: locationInfo.region,
    seedTaskId,
    relatedTaskId,
  });

  const logEvent = result.pending
    ? "dataforseo.combined_partial"
    : "dataforseo.combined_completed";
  logger.info(logEvent, {
    seedTaskId,
    relatedTaskId,
    waitTimeMs: Date.now() - startTime,
  });

  return result;
}

// ============================================
// GOOGLE TRENDS API
// ============================================

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
      geo_id?: string;
      geo_name?: string;
      max_value_index?: number;
    }> | {
      top?: Array<{ query: string; value: number }>;
      rising?: Array<{ query: string; value: number }>;
    };
    averages?: number[];
  }>;
};

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

    if (isQueuedStatus(response.status_code, response.status_message)) {
      return { status: "pending", taskId };
    }

    const task = response.tasks?.[0];
    if (!task) {
      return { status: "error", error: "Task not found", taskId };
    }

    if (isQueuedStatus(task.status_code, task.status_message)) {
      return { status: "pending", taskId };
    }

    if (task.status_code !== 20_000) {
      return {
        status: "error",
        error: task.status_message || "Unknown error",
        taskId,
      };
    }

    const result = task.result?.[0];
    if (!result) {
      return { status: "completed", data: undefined, taskId };
    }

    return { status: "completed", data: result, taskId };
  } catch (error) {
    if (error instanceof DataForSEOError) {
      throw error;
    }
    throw new DataForSEOError(
      `Failed to get Google Trends task: ${error instanceof Error ? error.message : "Unknown error"}`,
      "API_ERROR",
      taskId
    );
  }
}

type TrendsItem = GoogleTrendsResult["items"][number];

type ParsedGraphData = {
  interestOverTime: GoogleTrendsTimePoint[];
  dateFrom: string;
  dateTo: string;
  averageInterest: number;
};

function parseTrendsGraphItem(item: TrendsItem, keyword: string): ParsedGraphData {
  const graphData = item.data as Array<{
    date_from?: string;
    date_to?: string;
    timestamp?: number;
    missing_data?: boolean;
    values?: number[];
  }>;

  if (!Array.isArray(graphData)) {
    return { interestOverTime: [], dateFrom: "", dateTo: "", averageInterest: 0 };
  }

  const keywordIndex = item.keywords?.indexOf(keyword) ?? 0;

  const interestOverTime = graphData.map((point) => ({
    dateFrom: point.date_from ?? "",
    dateTo: point.date_to ?? "",
    timestamp: point.timestamp ?? 0,
    value: point.values?.[keywordIndex] ?? 0,
    missingData: point.missing_data ?? false,
  }));

  const dateFrom = graphData[0]?.date_from ?? "";
  const dateTo = graphData.at(-1)?.date_to ?? "";

  let averageInterest = 0;
  if (item.averages && item.averages.length > 0) {
    averageInterest = item.averages[keywordIndex] ?? 0;
  }

  return { interestOverTime, dateFrom, dateTo, averageInterest };
}

function parseTrendsMapItem(item: TrendsItem, keyword: string): GoogleTrendsRegion[] {
  const mapData = item.data as Array<{
    geo_id?: string;
    geo_name?: string;
    values?: number[];
    max_value_index?: number;
  }>;

  if (!Array.isArray(mapData)) {
    return [];
  }

  const keywordIndex = item.keywords?.indexOf(keyword) ?? 0;

  return mapData
    .filter((region) => region.values?.[keywordIndex] != null)
    .map((region) => ({
      geoId: region.geo_id ?? "",
      geoName: region.geo_name ?? "",
      value: region.values?.[keywordIndex] ?? 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 20);
}

function parseTrendsQueriesItem(
  item: TrendsItem
): { topQueries: Array<{ query: string; value: number }>; risingQueries: GoogleTrendsRisingQuery[] } {
  const queriesData = item.data as {
    top?: Array<{ query: string; value: number }>;
    rising?: Array<{ query: string; value: number }>;
  };

  if (!queriesData) {
    return { topQueries: [], risingQueries: [] };
  }

  const topQueries = queriesData.top?.slice(0, 15) ?? [];
  const risingQueries = (queriesData.rising ?? []).map((q) => ({
    query: q.query,
    value: q.value,
  }));

  return { topQueries, risingQueries };
}

export function parseGoogleTrendsResult(
  result: GoogleTrendsResult,
  keyword: string,
  location: string,
  taskId: string
): GoogleTrendsResponse {
  let graphData: ParsedGraphData = { interestOverTime: [], dateFrom: "", dateTo: "", averageInterest: 0 };
  let regionBreakdown: GoogleTrendsRegion[] = [];
  let queriesData = { topQueries: [] as Array<{ query: string; value: number }>, risingQueries: [] as GoogleTrendsRisingQuery[] };

  for (const item of result.items || []) {
    if (item.type === "google_trends_graph") {
      graphData = parseTrendsGraphItem(item, keyword);
    }
    if (item.type === "google_trends_map") {
      regionBreakdown = parseTrendsMapItem(item, keyword);
    }
    if (item.type === "google_trends_queries_list") {
      queriesData = parseTrendsQueriesItem(item);
    }
  }

  return {
    keyword,
    interestOverTime: graphData.interestOverTime,
    risingQueries: queriesData.risingQueries,
    topQueries: queriesData.topQueries,
    regionBreakdown,
    averageInterest: graphData.averageInterest,
    meta: {
      location,
      dateFrom: graphData.dateFrom,
      dateTo: graphData.dateTo,
      fetchedAt: new Date().toISOString(),
      taskId,
    },
  };
}

export async function fetchGoogleTrends(options: {
  keyword: string;
  location?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<GoogleTrendsResponse> {
  const phrase = validatePhrase(options.keyword);
  const locationInfo = validateLocation(options.location ?? "us");

  const postResult = await postGoogleTrendsTask({
    keywords: [phrase],
    location: locationInfo.region,
    dateFrom: options.dateFrom,
    dateTo: options.dateTo,
  });

  const taskId = postResult.taskId;

  const startTime = Date.now();
  let attemptIndex = 0;

  while (Date.now() - startTime < TRENDS_POLL_MAX_WAIT_MS) {
    const waitTime = TRENDS_POLL_INTERVALS_MS[attemptIndex] ?? TRENDS_POLL_INTERVALS_MS.at(-1);
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

async function executeApiRequest<T>(
  url: string,
  body: unknown,
  credentials: { login: string; password: string },
  method: "POST" | "GET"
): Promise<DataForSEOApiResponse<T>> {
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

  let data: DataForSEOApiResponse<T>;
  try {
    data = await response.json();
  } catch {
    throw new DataForSEOError("Invalid JSON response from API", "PARSE_ERROR");
  }

  if (!response.ok) {
    throw classifyHttpError(response.status, data.status_message);
  }

  if (!isQueuedStatus(data.status_code, data.status_message) && data.status_code !== 20_000) {
    throw classifyApiStatusError(data.status_code, data.status_message);
  }

  return data;
}

function logTaskErrors<T>(data: DataForSEOApiResponse<T>): void {
  if (data.tasks_error > 0) {
    const taskError = data.tasks?.find((t) => t.status_code !== 20_000);
    if (taskError) {
      logger.warn("dataforseo.task_error", {
        status_code: taskError.status_code,
        status_message: taskError.status_message,
      });
    }
  }
}

async function fetchWithRetry<T>(
  endpoint: string,
  body: unknown,
  retries: number = MAX_RETRIES,
  method: "POST" | "GET" = "POST"
): Promise<DataForSEOApiResponse<T>> {
  const credentials = getCredentials();
  const url = `${getBaseUrl()}${endpoint}`;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const data = await executeApiRequest<T>(url, body, credentials, method);
      logTaskErrors(data);
      return data;
    } catch (error) {
      if (isNonRetryableError(error)) {
        throw error;
      }

      lastError = error instanceof Error ? error : new Error(String(error));
      if (error instanceof Error && error.name === "AbortError") {
        lastError = new DataForSEOError("Request timed out", "TIMEOUT");
      }

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

  throw lastError || new DataForSEOError("Request failed", "NETWORK_ERROR");
}

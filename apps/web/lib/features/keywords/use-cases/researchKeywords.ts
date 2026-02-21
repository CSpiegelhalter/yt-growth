import "server-only";

import { logger } from "@/lib/shared/logger";
import {
  fetchKeywordOverview,
  fetchRelatedKeywords,
  fetchCombinedKeywordData,
  prepareDataForSeoRequest,
  mapDataForSEOError,
  DataForSEOError,
  type KeywordOverviewResponse,
  type KeywordRelatedResponse,
  type KeywordCombinedResponse,
} from "@/lib/dataforseo";
import {
  getCachedResponse,
  setCachedResponse,
  setPendingTask,
} from "@/lib/dataforseo/cache";
import {
  mapToLegacyOverviewRow,
  mapToLegacyRelatedRow,
} from "@/lib/keywords/mappers";
import type { ResearchKeywordsInput, UsageInfo } from "../types";
import { KeywordError } from "../errors";
import { resolveQuota } from "../quota";

type SuccessResult = {
  type: "success";
  overview: Record<string, unknown> | null;
  rows: Record<string, unknown>[];
  meta: Record<string, unknown>;
  usage: UsageInfo;
};

type PendingResult = {
  type: "pending";
  body: Record<string, unknown>;
};

type QuotaExceededResult = {
  type: "quota_exceeded";
  usage: UsageInfo & { plan: string };
};

export type ResearchKeywordsResult =
  | SuccessResult
  | PendingResult
  | QuotaExceededResult;

export async function researchKeywords(
  input: ResearchKeywordsInput,
): Promise<ResearchKeywordsResult> {
  const { userId, mode, phrase, phrases, database, displayLimit, isPro } = input;

  const inputPhrases = phrases ?? (phrase ? [phrase] : []);
  if (inputPhrases.length === 0) {
    throw new KeywordError("INVALID_INPUT", "At least one keyword is required");
  }

  const { cleanPhrases, locationInfo } = prepareDataForSeoRequest({
    phrases: inputPhrases,
    location: database,
  });
  const cleanPhrase = cleanPhrases[0]!;

  // Check cache (cached responses don't consume quota)
  const cached = await getCachedResponse<
    KeywordOverviewResponse | KeywordRelatedResponse | KeywordCombinedResponse
  >(mode, cleanPhrase, locationInfo.region);

  if (cached) {
    logger.info("keywords.cache_hit", {
      userId,
      mode,
      phrase: cleanPhrase,
      location: locationInfo.region,
    });

    const quota = await resolveQuota({ userId, isPro, featureKey: "keyword_research", cached: true });
    return buildCachedResult(mode, cached.data, cleanPhrase, locationInfo.region, quota.usage);
  }

  // Check and increment usage quota
  const quota = await resolveQuota({ userId, isPro, featureKey: "keyword_research", cached: false });
  if (quota.type === "quota_exceeded") {
    return { type: "quota_exceeded", usage: { ...quota.usage, plan: quota.plan } };
  }

  const usageInfo = quota.usage;

  try {
    if (mode === "combined") {
      return await fetchCombined(userId, cleanPhrase, locationInfo.region, displayLimit, usageInfo);
    } else if (mode === "overview") {
      return await fetchOverview(userId, cleanPhrase, locationInfo.region, usageInfo);
    } else {
      return await fetchRelated(userId, cleanPhrase, cleanPhrases, locationInfo.region, displayLimit, usageInfo);
    }
  } catch (err) {
    if (err instanceof DataForSEOError) {
      logger.error("keywords.dataforseo_error", {
        userId,
        code: err.code,
        message: err.message,
        taskId: err.taskId,
      });

      if (err.code === "TASK_PENDING") {
        return {
          type: "pending",
          body: {
            pending: true,
            taskId: err.taskId,
            message: "Fetching keyword data...",
          },
        };
      }

      throw mapDataForSEOError(err);
    }

    throw err;
  }
}

// ── Internal fetch helpers ──────────────────────────────────────

function buildCachedResult(
  mode: string,
  data: KeywordOverviewResponse | KeywordRelatedResponse | KeywordCombinedResponse,
  cleanPhrase: string,
  region: string,
  usage: UsageInfo,
): SuccessResult {
  if (mode === "combined") {
    const combinedData = data as KeywordCombinedResponse;
    const overview = combinedData.seedMetrics
      ? mapToLegacyOverviewRow(combinedData.seedMetrics)
      : null;
    const rows = combinedData.relatedKeywords?.map(mapToLegacyRelatedRow) ?? [];
    return {
      type: "success",
      overview,
      rows,
      meta: {
        source: "cache",
        fetchedAt: combinedData.meta.fetchedAt,
        cached: true,
        database: region,
        phrase: cleanPhrase,
        difficultyIsEstimate: true,
      },
      usage,
    };
  } else if (mode === "overview") {
    const rows = (data as KeywordOverviewResponse).rows.map(mapToLegacyOverviewRow);
    return {
      type: "success",
      overview: rows[0] || null,
      rows,
      meta: {
        source: "cache",
        fetchedAt: (data as KeywordOverviewResponse).meta.fetchedAt,
        cached: true,
        database: region,
        difficultyIsEstimate: true,
      },
      usage,
    };
  } else {
    const rows = (data as KeywordRelatedResponse).rows.map(mapToLegacyRelatedRow);
    return {
      type: "success",
      overview: null,
      rows,
      meta: {
        source: "cache",
        fetchedAt: (data as KeywordRelatedResponse).meta.fetchedAt,
        cached: true,
        database: region,
        phrase: cleanPhrase,
        difficultyIsEstimate: true,
      },
      usage,
    };
  }
}

async function fetchCombined(
  userId: number,
  cleanPhrase: string,
  region: string,
  displayLimit: number | undefined,
  usage: UsageInfo,
): Promise<SuccessResult | PendingResult> {
  const response = await fetchCombinedKeywordData({
    phrase: cleanPhrase,
    location: region,
    limit: displayLimit,
  });

  if (response.pending?.seed || response.pending?.related) {
    logger.info("keywords.combined_pending", {
      userId,
      phrase: cleanPhrase,
      location: region,
      seedPending: response.pending.seed,
      relatedPending: response.pending.related,
    });

    return {
      type: "pending",
      body: {
        pending: true,
        seedPending: response.pending.seed,
        relatedPending: response.pending.related,
        seedTaskId: response.pending.seedTaskId,
        relatedTaskId: response.pending.relatedTaskId,
        overview: response.seedMetrics
          ? mapToLegacyOverviewRow(response.seedMetrics)
          : null,
        rows: response.relatedKeywords.map(mapToLegacyRelatedRow),
        message: "Fetching keyword data...",
        meta: {
          source: "dataforseo",
          database: region,
          phrase: cleanPhrase,
        },
        usage,
      },
    };
  }

  await setCachedResponse("combined", cleanPhrase, region, response);

  const overview = response.seedMetrics
    ? mapToLegacyOverviewRow(response.seedMetrics)
    : null;
  const rows = response.relatedKeywords.map(mapToLegacyRelatedRow);

  logger.info("keywords.combined_success", {
    userId,
    phrase: cleanPhrase,
    location: region,
    hasSeedMetrics: !!response.seedMetrics,
    relatedCount: rows.length,
  });

  return {
    type: "success",
    overview,
    rows,
    meta: {
      source: "dataforseo",
      fetchedAt: response.meta.fetchedAt,
      cached: false,
      database: region,
      phrase: cleanPhrase,
      difficultyIsEstimate: true,
    },
    usage,
  };
}

async function fetchOverview(
  userId: number,
  cleanPhrase: string,
  region: string,
  usage: UsageInfo,
): Promise<SuccessResult | PendingResult> {
  const response = await fetchKeywordOverview({
    phrase: cleanPhrase,
    location: region,
  });

  if (response.pending && response.taskId) {
    await setPendingTask("overview", cleanPhrase, region, response.taskId);

    logger.info("keywords.overview_pending", {
      userId,
      phrase: cleanPhrase,
      location: region,
      taskId: response.taskId,
    });

    return {
      type: "pending",
      body: {
        pending: true,
        taskId: response.taskId,
        message: "Fetching keyword data...",
        meta: { source: "dataforseo", database: region },
        usage,
      },
    };
  }

  await setCachedResponse("overview", cleanPhrase, region, response);

  const rows = response.rows.map(mapToLegacyOverviewRow);

  logger.info("keywords.overview_success", {
    userId,
    phrase: cleanPhrase,
    location: region,
    rowCount: rows.length,
  });

  return {
    type: "success",
    overview: rows[0] || null,
    rows,
    meta: {
      source: "dataforseo",
      fetchedAt: response.meta.fetchedAt,
      cached: false,
      database: region,
      difficultyIsEstimate: true,
    },
    usage,
  };
}

async function fetchRelated(
  userId: number,
  cleanPhrase: string,
  cleanPhrases: string[],
  region: string,
  displayLimit: number | undefined,
  usage: UsageInfo,
): Promise<SuccessResult | PendingResult> {
  const response = await fetchRelatedKeywords({
    phrases: cleanPhrases,
    location: region,
    limit: displayLimit,
  });

  if (response.pending && response.taskId) {
    await setPendingTask("related", cleanPhrase, region, response.taskId);

    logger.info("keywords.related_pending", {
      userId,
      phrases: cleanPhrases,
      location: region,
      taskId: response.taskId,
    });

    return {
      type: "pending",
      body: {
        pending: true,
        taskId: response.taskId,
        message: "Finding related keywords...",
        meta: {
          source: "dataforseo",
          database: region,
          phrase: cleanPhrase,
          phrases: cleanPhrases,
        },
        usage,
      },
    };
  }

  await setCachedResponse("related", cleanPhrase, region, response);

  const rows = response.rows.map(mapToLegacyRelatedRow);

  logger.info("keywords.related_success", {
    userId,
    phrases: cleanPhrases,
    location: region,
    rowCount: rows.length,
  });

  return {
    type: "success",
    overview: null,
    rows,
    meta: {
      source: "dataforseo",
      fetchedAt: response.meta.fetchedAt,
      cached: false,
      database: region,
      phrase: cleanPhrase,
      phrases: cleanPhrases,
      difficultyIsEstimate: true,
    },
    usage,
  };
}

import "server-only";

import { logger } from "@/lib/shared/logger";
import {
  fetchGoogleTrends,
  prepareDataForSeoRequest,
  mapDataForSEOError,
  DataForSEOError,
} from "@/lib/dataforseo";
import {
  getCachedResponse,
  setCachedResponse,
  setPendingTask,
} from "@/lib/dataforseo/cache";
import type { GoogleTrendsResponse } from "@/lib/dataforseo/client";
import type { GetKeywordTrendsInput, UsageInfo } from "../types";
import { resolveQuota } from "../quota";
import { mapTrendsBody } from "./trends-mapper";

type SuccessResult = { type: "success"; body: Record<string, unknown> };
type PendingResult = { type: "pending"; body: Record<string, unknown> };
type QuotaExceededResult = {
  type: "quota_exceeded";
  usage: UsageInfo & { plan: string };
};

export type GetKeywordTrendsResult =
  | SuccessResult
  | PendingResult
  | QuotaExceededResult;

export async function getKeywordTrends(
  input: GetKeywordTrendsInput,
): Promise<GetKeywordTrendsResult> {
  const { userId, keyword, database, dateFrom, dateTo, isPro } = input;

  const { cleanPhrases, locationInfo } = prepareDataForSeoRequest({
    phrase: keyword,
    location: database,
  });
  const cleanKeyword = cleanPhrases[0]!;

  // Check cache
  const cacheKey = `trends:${dateFrom || ""}:${dateTo || ""}`;
  const cached = await getCachedResponse<GoogleTrendsResponse>(
    cacheKey,
    cleanKeyword,
    locationInfo.region,
  );

  if (cached) {
    logger.info("keywords.trends_cache_hit", {
      userId,
      keyword: cleanKeyword,
      location: locationInfo.region,
    });

    const quota = await resolveQuota({ userId, isPro, featureKey: "keyword_research", cached: true });
    return {
      type: "success",
      body: {
        ...cached.data,
        meta: { ...cached.data.meta, cached: true },
        usage: quota.usage,
      },
    };
  }

  // Check and increment usage quota
  const quota = await resolveQuota({ userId, isPro, featureKey: "keyword_research", cached: false });
  if (quota.type === "quota_exceeded") {
    return { type: "quota_exceeded", usage: { ...quota.usage, plan: quota.plan } };
  }

  const usageInfo = quota.usage;

  try {
    const response = await fetchGoogleTrends({
      keyword: cleanKeyword,
      location: locationInfo.region,
      dateFrom,
      dateTo,
    });

    if (response.pending && response.taskId) {
      await setPendingTask(
        "trends",
        cleanKeyword,
        locationInfo.region,
        response.taskId,
      );

      logger.info("keywords.trends_pending", {
        userId,
        keyword: cleanKeyword,
        location: locationInfo.region,
        taskId: response.taskId,
      });

      return {
        type: "pending",
        body: {
          pending: true,
          taskId: response.taskId,
          message: "Fetching trends data...",
          meta: { source: "dataforseo", database: locationInfo.region },
          usage: usageInfo,
        },
      };
    }

    await setCachedResponse(
      cacheKey,
      cleanKeyword,
      locationInfo.region,
      response,
    );

    logger.info("keywords.trends_success", {
      userId,
      keyword: cleanKeyword,
      location: locationInfo.region,
      dataPoints: response.interestOverTime.length,
      risingQueries: response.risingQueries.length,
      regions: response.regionBreakdown.length,
    });

    return {
      type: "success",
      body: { ...mapTrendsBody(response), usage: usageInfo },
    };
  } catch (err) {
    if (err instanceof DataForSEOError) {
      logger.error("keywords.trends_error", {
        userId,
        code: err.code,
        message: err.message,
        taskId: err.taskId,
      });
      throw mapDataForSEOError(err);
    }

    throw err;
  }
}

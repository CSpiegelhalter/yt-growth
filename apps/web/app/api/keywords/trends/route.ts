/**
 * POST /api/keywords/trends
 *
 * Fetch Google Trends data for a keyword.
 * Returns interest over time, rising queries, and regional breakdown.
 *
 * Auth: Required
 * Rate Limited: Same as keyword research
 */

import { z } from "zod";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import { quotaExceededResponse } from "@/lib/api/quota";
import { getLimit, type Plan } from "@/lib/entitlements";
import { checkAndIncrement, checkUsage } from "@/lib/usage";
import { hasActiveSubscription } from "@/lib/user";
import { logger } from "@/lib/logger";
import {
  fetchGoogleTrends,
  prepareDataForSeoRequest,
  mapDataForSEOError,
  DataForSEOError,
  SUPPORTED_LOCATIONS,
} from "@/lib/dataforseo";
import {
  getCachedResponse,
  setCachedResponse,
  setPendingTask,
} from "@/lib/dataforseo/cache";
import type { GoogleTrendsResponse } from "@/lib/dataforseo/client";

// ============================================
// VALIDATION SCHEMA
// ============================================

const requestSchema = z.object({
  keyword: z
    .string()
    .trim()
    .min(1, "Keyword is required")
    .max(80, "Keyword too long (max 80 characters)"),
  database: z
    .string()
    .trim()
    .default("us")
    .refine((val) => SUPPORTED_LOCATIONS.includes(val.toLowerCase() as any), {
      message: "Invalid region code",
    }),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// ============================================
// ROUTE HANDLER
// ============================================

export const POST = createApiRoute(
  { route: "/api/keywords/trends" },
  withAuth(
    { mode: "required" },
    withValidation({ body: requestSchema }, async (_req, _ctx, api: ApiAuthContext, validated) => {
    const user = api.user!;
    const { keyword, database, dateFrom, dateTo } = validated.body!;

    // Validate and normalize inputs
    const { cleanPhrases, locationInfo } = prepareDataForSeoRequest({
      phrase: keyword,
      location: database,
    });
    const cleanKeyword = cleanPhrases[0]!;

    // Determine plan and limits (shares quota with keyword research)
    const isPro = hasActiveSubscription(user.subscription);
    const plan: Plan = isPro ? "PRO" : "FREE";
    const limit = getLimit(plan, "keyword_research");

    // Check cache first
    const cacheKey = `trends:${dateFrom || ""}:${dateTo || ""}`;
    const cached = await getCachedResponse<GoogleTrendsResponse>(
      cacheKey,
      cleanKeyword,
      locationInfo.region
    );

    if (cached) {
      logger.info("keywords.trends_cache_hit", {
        userId: user.id,
        keyword: cleanKeyword,
        location: locationInfo.region,
      });

      const usage = await checkUsage({
        userId: user.id,
        featureKey: "keyword_research",
        limit,
      });

      return jsonOk(
        {
          ...cached.data,
          meta: {
            ...cached.data.meta,
            cached: true,
          },
          usage: {
            used: usage.used,
            limit: usage.limit,
            remaining: usage.remaining,
            resetAt: usage.resetAt,
          },
        },
        { requestId: api.requestId }
      );
    }

    // Check and increment usage quota
    const usageResult = await checkAndIncrement({
      userId: user.id,
      featureKey: "keyword_research",
      limit,
    });

    if (!usageResult.allowed) {
      return quotaExceededResponse({
        logEvent: "keywords.trends_quota_exceeded",
        userId: user.id,
        plan,
        limit,
        used: usageResult.used,
        resetAt: usageResult.resetAt,
        requestId: api.requestId,
      });
    }

    // Fetch from Google Trends via DataForSEO
    try {
      const response = await fetchGoogleTrends({
        keyword: cleanKeyword,
        location: locationInfo.region,
        dateFrom,
        dateTo,
      });

      // Check if task is still pending
      if (response.pending && response.taskId) {
        // Store pending task for polling
        await setPendingTask("trends", cleanKeyword, locationInfo.region, response.taskId);

        logger.info("keywords.trends_pending", {
          userId: user.id,
          keyword: cleanKeyword,
          location: locationInfo.region,
          taskId: response.taskId,
        });

        return jsonOk(
          {
            pending: true,
            taskId: response.taskId,
            message: "Fetching trends data...",
            meta: {
              source: "dataforseo",
              database: locationInfo.region,
            },
            usage: {
              used: usageResult.used,
              limit: usageResult.limit,
              remaining: usageResult.remaining,
              resetAt: usageResult.resetAt,
            },
          },
          { requestId: api.requestId }
        );
      }

      // Cache the response
      await setCachedResponse(cacheKey, cleanKeyword, locationInfo.region, response);

      logger.info("keywords.trends_success", {
        userId: user.id,
        keyword: cleanKeyword,
        location: locationInfo.region,
        dataPoints: response.interestOverTime.length,
        risingQueries: response.risingQueries.length,
        regions: response.regionBreakdown.length,
      });

      return jsonOk(
        {
          keyword: response.keyword,
          interestOverTime: response.interestOverTime,
          risingQueries: response.risingQueries,
          topQueries: response.topQueries,
          regionBreakdown: response.regionBreakdown,
          averageInterest: response.averageInterest,
          meta: {
            source: "dataforseo",
            location: response.meta.location,
            dateFrom: response.meta.dateFrom,
            dateTo: response.meta.dateTo,
            fetchedAt: response.meta.fetchedAt,
            cached: false,
          },
          usage: {
            used: usageResult.used,
            limit: usageResult.limit,
            remaining: usageResult.remaining,
            resetAt: usageResult.resetAt,
          },
        },
        { requestId: api.requestId }
      );
    } catch (err) {
      if (err instanceof DataForSEOError) {
        logger.error("keywords.trends_error", {
          userId: user.id,
          code: err.code,
          message: err.message,
          taskId: err.taskId,
        });
        throw mapDataForSEOError(err);
      }

      throw err;
    }
  }))
);

export const runtime = "nodejs";

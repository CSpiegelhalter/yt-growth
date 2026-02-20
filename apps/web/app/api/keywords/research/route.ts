/**
 * POST /api/keywords/research
 *
 * Keyword research API using DataForSEO Standard task-based workflow.
 *
 * Auth: Optional (returns needsAuth if not authenticated)
 * Rate Limited:
 *   - Free users: 5/day
 *   - Pro users: 100/day
 *   - Cached responses don't consume quota
 *
 * Standard Task Workflow:
 * 1. Check cache for existing results
 * 2. If not cached, post task to DataForSEO
 * 3. Wait synchronously for up to ~8 seconds for results
 * 4. If not ready, return { pending: true, taskId } for async polling
 */

import { z } from "zod";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk, jsonError } from "@/lib/api/response";
import { quotaExceededResponse } from "@/lib/api/quota";
import { ApiError } from "@/lib/api/errors";
import { getLimit, type Plan } from "@/lib/entitlements";
import { checkAndIncrement, checkUsage } from "@/lib/usage";
import { hasActiveSubscription } from "@/lib/user";
import { logger } from "@/lib/logger";
import {
  fetchKeywordOverview,
  fetchRelatedKeywords,
  fetchCombinedKeywordData,
  prepareDataForSeoRequest,
  mapDataForSEOError,
  DataForSEOError,
  SUPPORTED_LOCATIONS,
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

// ============================================
// VALIDATION SCHEMA
// ============================================

const requestSchema = z.object({
  mode: z.enum(["overview", "related", "combined"]),
  // Support both single phrase and array of phrases
  phrase: z
    .string()
    .trim()
    .min(1, "Keyword is required")
    .max(80, "Keyword too long (max 80 characters)")
    .optional(),
  phrases: z
    .array(
      z.string().trim().min(1).max(80)
    )
    .min(1, "At least one keyword is required")
    .max(10, "Maximum 10 keywords allowed")
    .optional(),
  database: z
    .string()
    .trim()
    .default("us")
    .refine((val) => SUPPORTED_LOCATIONS.includes(val.toLowerCase() as any), {
      message: "Invalid region code",
    }),
  displayLimit: z.number().int().min(1).max(100).optional(),
}).refine(
  (data) => data.phrase || (data.phrases && data.phrases.length > 0),
  { message: "Either phrase or phrases must be provided" }
);

// ============================================
// IP RATE LIMITING (abuse prevention for unauthenticated)
// ============================================

// Simple in-memory rate limiter for unauthenticated requests
const ipRateLimiter = new Map<string, { count: number; resetAt: number }>();
const IP_RATE_LIMIT = 20; // 20 requests per minute
const IP_RATE_WINDOW_MS = 60 * 1000;

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateLimiter.get(ip);

  if (!entry || entry.resetAt < now) {
    ipRateLimiter.set(ip, { count: 1, resetAt: now + IP_RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= IP_RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

// Cleanup old entries periodically
function cleanupIpLimiter() {
  const now = Date.now();
  for (const [ip, entry] of ipRateLimiter.entries()) {
    if (entry.resetAt < now) {
      ipRateLimiter.delete(ip);
    }
  }
}

// ============================================
// ROUTE HANDLER
// ============================================

export const POST = createApiRoute(
  { route: "/api/keywords/research" },
  withAuth(
    { mode: "optional" },
    withValidation({ body: requestSchema }, async (req, _ctx, api: ApiAuthContext, validated) => {
    const user = api.user;
    const { mode, phrase, phrases, database, displayLimit } = validated.body!;

    // Get IP for rate limiting
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

    // IP rate limiting (even for unauthenticated to prevent abuse)
    cleanupIpLimiter();
    if (!checkIpRateLimit(ip)) {
      logger.warn("keywords.ip_rate_limited", { ip });
      return jsonError({
        status: 429,
        code: "RATE_LIMITED",
        message: "Too many requests. Please slow down.",
        requestId: api.requestId,
      });
    }

    // Support both single phrase and array - normalize to array
    const inputPhrases = phrases ?? (phrase ? [phrase] : []);
    if (inputPhrases.length === 0) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        status: 400,
        message: "At least one keyword is required",
      });
    }

    // Validate and normalize inputs
    const { cleanPhrases, locationInfo } = prepareDataForSeoRequest({
      phrases: inputPhrases,
      location: database,
    });
    const cleanPhrase = cleanPhrases[0]!;

    // If not authenticated, return needsAuth
    if (!user) {
      return jsonOk(
        {
          needsAuth: true,
          message: "Sign in to search keywords",
        },
        { requestId: api.requestId }
      );
    }

    // Determine plan and limits
    const isPro = hasActiveSubscription(user.subscription);
    const plan: Plan = isPro ? "PRO" : "FREE";
    const limit = getLimit(plan, "keyword_research");

    // Check cache first (cached responses don't consume quota)
    const cached = await getCachedResponse<KeywordOverviewResponse | KeywordRelatedResponse | KeywordCombinedResponse>(
      mode,
      cleanPhrase,
      locationInfo.region
    );

    if (cached) {
      logger.info("keywords.cache_hit", {
        userId: user.id,
        mode,
        phrase: cleanPhrase,
        location: locationInfo.region,
      });

      // Get current usage for display (don't increment)
      const usage = await checkUsage({
        userId: user.id,
        featureKey: "keyword_research",
        limit,
      });

      if (mode === "combined") {
        // Combined mode cache - has seedMetrics and relatedKeywords
        const combinedData = cached.data as KeywordCombinedResponse;
        const overview = combinedData.seedMetrics ? mapToLegacyOverviewRow(combinedData.seedMetrics) : null;
        const rows = combinedData.relatedKeywords?.map(mapToLegacyRelatedRow) ?? [];
        return jsonOk(
          {
            overview,
            rows,
            meta: {
              source: "cache",
              fetchedAt: combinedData.meta.fetchedAt,
              cached: true,
              database: locationInfo.region,
              phrase: cleanPhrase,
              difficultyIsEstimate: true,
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
      } else if (mode === "overview") {
        const rows = (cached.data as KeywordOverviewResponse).rows.map(mapToLegacyOverviewRow);
        return jsonOk(
          {
            overview: rows[0] || null,
            rows,
            meta: {
              source: "cache",
              fetchedAt: (cached.data as KeywordOverviewResponse).meta.fetchedAt,
              cached: true,
              database: locationInfo.region,
              difficultyIsEstimate: true,
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
      } else {
        // mode === "related"
        const rows = (cached.data as KeywordRelatedResponse).rows.map(mapToLegacyRelatedRow);
        return jsonOk(
          {
            rows,
            meta: {
              source: "cache",
              fetchedAt: (cached.data as KeywordRelatedResponse).meta.fetchedAt,
              cached: true,
              database: locationInfo.region,
              phrase: cleanPhrase,
              difficultyIsEstimate: true,
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
    }

    // Check and increment usage quota
    const usageResult = await checkAndIncrement({
      userId: user.id,
      featureKey: "keyword_research",
      limit,
    });

    if (!usageResult.allowed) {
      return quotaExceededResponse({
        logEvent: "keywords.quota_exceeded",
        userId: user.id,
        plan,
        limit,
        used: usageResult.used,
        resetAt: usageResult.resetAt,
        requestId: api.requestId,
      });
    }

    // Fetch from DataForSEO using Standard task workflow
    try {
      if (mode === "combined") {
        // Combined mode: fetch seed metrics AND related keywords in parallel
        const response = await fetchCombinedKeywordData({
          phrase: cleanPhrase,
          location: locationInfo.region,
          limit: displayLimit,
        });

        // Check if any tasks are still pending
        if (response.pending?.seed || response.pending?.related) {
          logger.info("keywords.combined_pending", {
            userId: user.id,
            phrase: cleanPhrase,
            location: locationInfo.region,
            seedPending: response.pending.seed,
            relatedPending: response.pending.related,
          });

          return jsonOk(
            {
              pending: true,
              seedPending: response.pending.seed,
              relatedPending: response.pending.related,
              seedTaskId: response.pending.seedTaskId,
              relatedTaskId: response.pending.relatedTaskId,
              // Return partial data if available
              overview: response.seedMetrics ? mapToLegacyOverviewRow(response.seedMetrics) : null,
              rows: response.relatedKeywords.map(mapToLegacyRelatedRow),
              message: "Fetching keyword data...",
              meta: {
                source: "dataforseo",
                database: locationInfo.region,
                phrase: cleanPhrase,
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

        // Cache the combined response
        await setCachedResponse(mode, cleanPhrase, locationInfo.region, response);

        const overview = response.seedMetrics ? mapToLegacyOverviewRow(response.seedMetrics) : null;
        const rows = response.relatedKeywords.map(mapToLegacyRelatedRow);

        logger.info("keywords.combined_success", {
          userId: user.id,
          phrase: cleanPhrase,
          location: locationInfo.region,
          hasSeedMetrics: !!response.seedMetrics,
          relatedCount: rows.length,
        });

        return jsonOk(
          {
            overview,
            rows,
            meta: {
              source: "dataforseo",
              fetchedAt: response.meta.fetchedAt,
              cached: false,
              database: locationInfo.region,
              phrase: cleanPhrase,
              difficultyIsEstimate: true,
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
      } else if (mode === "overview") {
        const response = await fetchKeywordOverview({
          phrase: cleanPhrase,
          location: locationInfo.region,
        });

        // Check if task is still pending
        if (response.pending && response.taskId) {
          // Store pending task reference
          await setPendingTask(mode, cleanPhrase, locationInfo.region, response.taskId);

          logger.info("keywords.overview_pending", {
            userId: user.id,
            phrase: cleanPhrase,
            location: locationInfo.region,
            taskId: response.taskId,
          });

          return jsonOk(
            {
              pending: true,
              taskId: response.taskId,
              message: "Fetching keyword data...",
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
        await setCachedResponse(mode, cleanPhrase, locationInfo.region, response);

        const rows = response.rows.map(mapToLegacyOverviewRow);

        logger.info("keywords.overview_success", {
          userId: user.id,
          phrase: cleanPhrase,
          location: locationInfo.region,
          rowCount: rows.length,
        });

        return jsonOk(
          {
            overview: rows[0] || null,
            rows,
            meta: {
              source: "dataforseo",
              fetchedAt: response.meta.fetchedAt,
              cached: false,
              database: locationInfo.region,
              difficultyIsEstimate: true,
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
      } else {
        // mode === "related"
        const response = await fetchRelatedKeywords({
          phrases: cleanPhrases,
          location: locationInfo.region,
          limit: displayLimit,
        });

        // Check if task is still pending
        if (response.pending && response.taskId) {
          await setPendingTask(mode, cleanPhrase, locationInfo.region, response.taskId);

          logger.info("keywords.related_pending", {
            userId: user.id,
            phrases: cleanPhrases,
            location: locationInfo.region,
            taskId: response.taskId,
          });

          return jsonOk(
            {
              pending: true,
              taskId: response.taskId,
              message: "Finding related keywords...",
              meta: {
                source: "dataforseo",
                database: locationInfo.region,
                phrase: cleanPhrase,
                phrases: cleanPhrases,
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
        await setCachedResponse(mode, cleanPhrase, locationInfo.region, response);

        const rows = response.rows.map(mapToLegacyRelatedRow);

        logger.info("keywords.related_success", {
          userId: user.id,
          phrases: cleanPhrases,
          location: locationInfo.region,
          rowCount: rows.length,
        });

        return jsonOk(
          {
            rows,
            meta: {
              source: "dataforseo",
              fetchedAt: response.meta.fetchedAt,
              cached: false,
              database: locationInfo.region,
              phrase: cleanPhrase,
              phrases: cleanPhrases,
              difficultyIsEstimate: true,
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
    } catch (err) {
      if (err instanceof DataForSEOError) {
        logger.error("keywords.dataforseo_error", {
          userId: user.id,
          code: err.code,
          message: err.message,
          taskId: err.taskId,
        });

        if (err.code === "TASK_PENDING") {
          return jsonOk(
            {
              pending: true,
              taskId: err.taskId,
              message: "Fetching keyword data...",
            },
            { requestId: api.requestId }
          );
        }

        throw mapDataForSEOError(err);
      }

      throw err;
    }
  }))
);

export const runtime = "nodejs";

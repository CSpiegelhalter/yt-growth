/**
 * POST /api/keywords/ideas
 *
 * Orchestrated endpoint for generating video ideas from a topic description.
 *
 * Flow:
 * 1. User provides topic description
 * 2. LLM #1 generates seed keywords
 * 3. DataForSEO K4K expands to candidates
 * 4. DataForSEO Search Volume enriches top candidates
 * 5. LLM #2 generates video ideas using enriched data
 *
 * Auth: Required (auth-on-action pattern)
 * - Returns needsAuth: true if not authenticated
 * - Returns needsUpgrade: true if over free limits
 *
 * Caching: 7-day TTL on full results
 * - Cache hits don't consume quota
 */

import { z } from "zod";
import { NextResponse } from "next/server";
import { parseBody } from "@/lib/api/withValidation";
import { logger } from "@/lib/logger";
import { checkEntitlement, entitlementErrorResponse } from "@/lib/with-entitlements";
import {
  generateVideoIdeasFromTopic,
  type AudienceLevel,
  type FormatPreference,
} from "@/lib/keywords/ideasService";
import {
  getCachedVideoIdeas,
  setCachedVideoIdeas,
  generateVideoIdeasCacheKey,
} from "@/lib/dataforseo/cache";
import { prepareDataForSeoRequest, DataForSEOError } from "@/lib/dataforseo";
import { getCurrentUserWithSubscription } from "@/lib/user";

// ============================================
// SCHEMA
// ============================================

const RequestSchema = z.object({
  topicDescription: z
    .string()
    .min(3, "Topic must be at least 3 characters")
    .max(500, "Topic must be under 500 characters"),
  locationCode: z.string().default("us"),
  languageCode: z.string().optional(),
  audienceLevel: z.enum(["beginner", "intermediate", "advanced", "all"]).default("all"),
  formatPreference: z.enum(["shorts", "longform", "mixed"]).default("mixed"),
});

// ============================================
// HELPERS
// ============================================

function jsonOk(data: unknown) {
  return NextResponse.json(data, { status: 200 });
}

function jsonError(code: string, message: string, status: number, details?: Record<string, unknown>) {
  return NextResponse.json({ error: code, message, ...details }, { status });
}

// ============================================
// HANDLER
// ============================================

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const parsed = await parseBody(request, RequestSchema);
    if (!parsed.ok) {
      if (parsed.type === "json") {
        return jsonError("INVALID_JSON", "Invalid request body", 400);
      }
      const firstError = parsed.zodError.errors[0];
      return jsonError(
        "VALIDATION_ERROR",
        parsed.firstMessage,
        400,
        { field: firstError?.path.join(".") }
      );
    }

    const { topicDescription, locationCode, audienceLevel, formatPreference } = parsed.data;

    // Validate location
    let locationInfo;
    try {
      ({ locationInfo } = prepareDataForSeoRequest({ location: locationCode }));
    } catch {
      return jsonError("INVALID_LOCATION", "Unsupported region", 400);
    }

    // Check auth (auth-on-action pattern)
    const user = await getCurrentUserWithSubscription();
    if (!user) {
      // Return needsAuth flag for client to show auth modal
      return jsonOk({ needsAuth: true });
    }

    // Generate cache key
    const cacheKey = generateVideoIdeasCacheKey({
      topicDescription,
      location: locationInfo.region,
      audienceLevel,
      formatPreference,
    });

    // Check cache first (cached responses don't consume quota)
    const cached = await getCachedVideoIdeas(cacheKey);
    if (cached) {
      logger.info("keywords.ideas.cache_hit", {
        userId: user.id,
        cacheKey: cacheKey.slice(0, 8),
      });

      return jsonOk({
        ...cached.data,
        meta: { ...cached.data.meta, cached: true },
      });
    }

    // Check entitlement and consume quota
    const entitlement = await checkEntitlement({
      featureKey: "keyword_research",
      increment: true,
      amount: 1,
    });

    if (!entitlement.ok) {
      // For limit_reached, return needsUpgrade flag
      if (entitlement.error.type === "limit_reached") {
        return jsonOk({
          needsUpgrade: true,
          ...entitlement.error.body,
        });
      }
      return entitlementErrorResponse(entitlement.error);
    }

    logger.info("keywords.ideas.generation_start", {
      userId: user.id,
      topic: topicDescription.slice(0, 50),
      location: locationInfo.region,
      audienceLevel,
      formatPreference,
    });

    // Generate video ideas (full orchestration)
    const result = await generateVideoIdeasFromTopic({
      topicDescription,
      locationCode: locationInfo.region,
      audienceLevel: audienceLevel as AudienceLevel,
      formatPreference: formatPreference as FormatPreference,
    });

    // Cache the successful result
    await setCachedVideoIdeas(cacheKey, topicDescription, locationInfo.region, result);

    const elapsed = Date.now() - startTime;
    logger.info("keywords.ideas.generation_complete", {
      userId: user.id,
      ideasCount: result.ideas.length,
      keywordsCount: result.keywords.length,
      elapsedMs: elapsed,
    });

    // Return result with usage info
    const usage = entitlement.context.usage;
    return jsonOk({
      ...result,
      usage: usage
        ? {
            used: usage.used,
            limit: usage.limit,
            remaining: usage.remaining,
            resetAt: usage.resetAt,
          }
        : undefined,
    });

  } catch (err) {
    logger.error("keywords.ideas.error", { error: String(err) });

    if (err instanceof DataForSEOError) {
      // Don't charge for DataForSEO errors
      return jsonError(
        "PROVIDER_ERROR",
        err.code === "QUOTA_EXCEEDED"
          ? "Keyword research service temporarily unavailable"
          : err.message,
        503,
        { code: err.code }
      );
    }

    return jsonError("INTERNAL_ERROR", "Failed to generate video ideas", 500);
  }
}

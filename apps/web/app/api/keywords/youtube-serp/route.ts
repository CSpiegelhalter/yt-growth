/**
 * POST /api/keywords/youtube-serp
 *
 * Fetches YouTube search results for a keyword.
 * Shows which videos/channels rank for a given keyword on YouTube.
 *
 * Auth: Required
 * Rate Limited: Uses same quota as keyword research
 * Cached: 24 hours
 */

import { z } from "zod";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { parseBody } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { logger } from "@/lib/logger";
import {
  fetchYouTubeSerp,
  prepareDataForSeoRequest,
  mapDataForSEOError,
  DataForSEOError,
  SUPPORTED_LOCATIONS,
  type YouTubeSerpResponse,
} from "@/lib/dataforseo";
import { getCachedResponse, setCachedResponse } from "@/lib/dataforseo/cache";

// ============================================
// VALIDATION SCHEMA
// ============================================

const requestSchema = z.object({
  keyword: z
    .string()
    .trim()
    .min(1, "Keyword is required")
    .max(80, "Keyword too long (max 80 characters)"),
  location: z
    .string()
    .trim()
    .default("us")
    .refine((val) => SUPPORTED_LOCATIONS.includes(val.toLowerCase() as any), {
      message: "Invalid region code",
    }),
  limit: z.number().int().min(1).max(20).optional().default(10),
});

// ============================================
// ROUTE HANDLER
// ============================================

export const POST = createApiRoute(
  { route: "/api/keywords/youtube-serp" },
  withAuth({ mode: "optional" }, async (req, _ctx, api: ApiAuthContext) => {
    const user = api.user;

    // If not authenticated, return needsAuth
    if (!user) {
      return jsonOk(
        {
          needsAuth: true,
          message: "Sign in to see YouTube rankings",
        },
        { requestId: api.requestId }
      );
    }

    // Parse and validate request body (uses parseBody to share core logic;
    // withValidation wrapper not used here because the auth check above must
    // run before body parsing to preserve the needsAuth response for
    // unauthenticated requests with invalid input)
    const parsed = await parseBody(req, requestSchema);
    if (!parsed.ok) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        status: 400,
        message: parsed.type === "json" ? "Invalid JSON body" : parsed.firstMessage,
        ...(parsed.type === "validation" ? { details: parsed.zodError.flatten() } : {}),
      });
    }

    const { keyword, location, limit } = parsed.data;

    // Validate and normalize inputs
    const { cleanPhrases, locationInfo } = prepareDataForSeoRequest({
      phrase: keyword,
      location,
    });
    const cleanKeyword = cleanPhrases[0]!;

    // Check cache first (24 hour TTL for YouTube SERP)
    const cached = await getCachedResponse<YouTubeSerpResponse>(
      "youtube_serp",
      cleanKeyword,
      locationInfo.region
    );

    if (cached) {
      logger.info("youtube_serp.cache_hit", {
        userId: user.id,
        keyword: cleanKeyword,
        location: locationInfo.region,
      });

      return jsonOk(
        {
          ...cached.data,
          cached: true,
        },
        { requestId: api.requestId }
      );
    }

    // Fetch from DataForSEO
    try {
      const response = await fetchYouTubeSerp({
        keyword: cleanKeyword,
        location: locationInfo.region,
        limit,
      });

      // Cache the response (24 hour TTL - shorter than keyword data)
      // Note: We're using the existing cache with a different mode
      await setCachedResponse("youtube_serp", cleanKeyword, locationInfo.region, response);

      logger.info("youtube_serp.success", {
        userId: user.id,
        keyword: cleanKeyword,
        location: locationInfo.region,
        resultCount: response.results.length,
      });

      return jsonOk(
        {
          ...response,
          cached: false,
        },
        { requestId: api.requestId }
      );
    } catch (err) {
      if (err instanceof DataForSEOError) {
        logger.error("youtube_serp.dataforseo_error", {
          userId: user.id,
          code: err.code,
          message: err.message,
        });
        throw mapDataForSEOError(err);
      }

      throw err;
    }
  })
);

export const runtime = "nodejs";

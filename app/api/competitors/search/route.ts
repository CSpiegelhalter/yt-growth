/**
 * Competitor Search API Route
 *
 * Streaming endpoint for competitor search with two modes:
 * - Competitor Search: Niche text and/or reference video URL
 * - Search My Niche: Uses user's channel niche
 *
 * Returns NDJSON stream of search events for progressive loading.
 *
 * POST /api/competitors/search
 * Body: { mode, nicheText?, referenceVideoUrl?, channelId?, filters }
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route";
import {
  getCurrentUserWithSubscription,
  hasActiveSubscription,
} from "@/lib/user";
import { getGoogleAccount } from "@/lib/youtube";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import { getOrGenerateNiche, type ChannelNicheData } from "@/lib/channel-niche";
import { prisma } from "@/prisma";

import {
  type CompetitorSearchFilters,
  type InferredNiche,
  type SearchEvent,
  type SearchCursor,
  DEFAULT_FILTERS,
  inferNiche,
  validateAndExtractVideoId,
  sanitizeNicheText,
  makeCacheKey,
  getCachedSearchResults,
  setCachedSearchResults,
  searchCompetitorsWithCache,
  hashNicheForLogging,
} from "@/lib/competitor-search";

// ============================================
// REQUEST VALIDATION
// ============================================

const FiltersSchema = z.object({
  contentType: z.enum(["shorts", "long", "both"]).optional(),
  dateRangePreset: z.enum(["7d", "30d", "90d", "365d", "custom"]).optional(),
  postedAfter: z.string().optional(),
  postedBefore: z.string().optional(),
  channelCreatedAfter: z.string().optional(),
  channelCreatedBefore: z.string().optional(),
  minViewsPerDay: z.number().min(0).optional(),
  maxViewsPerDay: z.number().min(0).optional(),
  minTotalViews: z.number().min(0).optional(),
  maxTotalViews: z.number().min(0).optional(),
  sortBy: z.enum(["viewsPerDay", "totalViews", "newest", "engagement"]).optional(),
  targetResultCount: z.number().min(1).max(100).optional(),
});

const CursorSchema = z.object({
  queryIndex: z.number().min(0),
  pageToken: z.string().optional(),
  seenIds: z.array(z.string()),
  scannedCount: z.number().min(0),
});

const RequestSchema = z.object({
  mode: z.enum(["competitor_search", "search_my_niche"]),
  // For competitor_search mode
  nicheText: z.string().max(500).optional(),
  referenceVideoUrl: z.string().max(200).optional(),
  // For search_my_niche mode
  channelId: z.string().optional(),
  // Filters apply to both modes
  filters: FiltersSchema.optional(),
  // Cursor for pagination (Load More)
  cursor: CursorSchema.optional(),
});

type RequestBody = z.infer<typeof RequestSchema>;

// ============================================
// STREAMING HELPERS
// ============================================

/**
 * Create a ReadableStream that yields NDJSON events.
 */
function createEventStream(
  generator: AsyncGenerator<SearchEvent, void, unknown>
): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        for await (const event of generator) {
          const json = JSON.stringify(event) + "\n";
          controller.enqueue(encoder.encode(json));
        }
        controller.close();
      } catch (err) {
        const errorEvent: SearchEvent = {
          type: "error",
          error: err instanceof Error ? err.message : "Stream error",
          code: "STREAM_ERROR",
        };
        controller.enqueue(encoder.encode(JSON.stringify(errorEvent) + "\n"));
        controller.close();
      }
    },
  });
}

// ============================================
// MAIN HANDLER
// ============================================

async function POSTHandler(req: NextRequest) {
  try {
    // Auth check
    const user = await getCurrentUserWithSubscription();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit check (reuse competitorFeed limit)
    const rlKey = rateLimitKey("competitorFeed", user.id);
    const rlResult = checkRateLimit(rlKey, RATE_LIMITS.competitorFeed);
    if (!rlResult.success) {
      return Response.json(
        {
          error: "Rate limit exceeded",
          resetAt: new Date(rlResult.resetAt).toISOString(),
        },
        { status: 429 }
      );
    }

    // Subscription check (paid feature)
    if (!hasActiveSubscription(user.subscription)) {
      return Response.json(
        { error: "Subscription required", code: "SUBSCRIPTION_REQUIRED" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    let body: RequestBody;
    try {
      const raw = await req.json();
      body = RequestSchema.parse(raw);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return Response.json(
          { error: "Invalid request", details: err.errors },
          { status: 400 }
        );
      }
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { mode, nicheText, referenceVideoUrl, channelId, filters, cursor } = body;
    const effectiveFilters: CompetitorSearchFilters = {
      ...DEFAULT_FILTERS,
      ...filters,
    };
    
    // Convert cursor from request to SearchCursor type if provided
    const searchCursor: SearchCursor | undefined = cursor ? {
      queryIndex: cursor.queryIndex,
      pageToken: cursor.pageToken,
      seenIds: cursor.seenIds,
      scannedCount: cursor.scannedCount,
    } : undefined;

    // Get inferred niche based on mode
    let inferredNiche: InferredNiche;
    let gaForSearch: Awaited<ReturnType<typeof getGoogleAccount>>;

    if (mode === "search_my_niche") {
      // Validate channelId is provided
      if (!channelId) {
        return Response.json(
          { error: "channelId is required for search_my_niche mode" },
          { status: 400 }
        );
      }

      // Get channel and verify ownership
      const channel = await prisma.channel.findFirst({
        where: {
          youtubeChannelId: channelId,
          userId: user.id,
        },
      });

      if (!channel) {
        return Response.json({ error: "Channel not found" }, { status: 404 });
      }

      // Get Google account for API calls
      gaForSearch = await getGoogleAccount(user.id, channelId);
      if (!gaForSearch) {
        return Response.json(
          { error: "Google account not connected" },
          { status: 400 }
        );
      }

      // Get niche from channel profile/videos
      const channelNiche: ChannelNicheData | null = await getOrGenerateNiche(
        channel.id
      );
      if (!channelNiche || channelNiche.queries.length === 0) {
        return Response.json(
          {
            error: "Could not determine niche",
            message:
              "Please add more videos to your channel or set up your channel profile.",
          },
          { status: 400 }
        );
      }

      inferredNiche = {
        niche: channelNiche.niche,
        queryTerms: channelNiche.queries,
        source: "channel_profile",
        inferredAt: new Date().toISOString(),
      };
    } else {
      // Competitor search mode
      // Need at least nicheText or referenceVideoUrl
      if (!nicheText && !referenceVideoUrl) {
        return Response.json(
          {
            error: "Either nicheText or referenceVideoUrl is required",
          },
          { status: 400 }
        );
      }

      // Get any connected Google account for API calls
      // For competitor_search mode, we need a valid Google account
      // Try to find one from user's channels
      const userChannel = await prisma.channel.findFirst({
        where: { userId: user.id },
        select: { youtubeChannelId: true },
      });

      if (!userChannel) {
        return Response.json(
          {
            error: "Please connect a YouTube channel first",
          },
          { status: 400 }
        );
      }

      gaForSearch = await getGoogleAccount(user.id, userChannel.youtubeChannelId);
      if (!gaForSearch) {
        return Response.json(
          { error: "Google account not connected" },
          { status: 400 }
        );
      }

      // Validate video URL if provided
      let videoId: string | undefined;
      if (referenceVideoUrl) {
        videoId = validateAndExtractVideoId(referenceVideoUrl) ?? undefined;
        if (!videoId) {
          return Response.json(
            {
              error: "Invalid YouTube URL",
              message:
                "Please provide a valid youtube.com or youtu.be URL.",
            },
            { status: 400 }
          );
        }
      }

      // Infer niche from inputs
      try {
        inferredNiche = await inferNiche(
          {
            nicheText: nicheText ? sanitizeNicheText(nicheText) : undefined,
            referenceVideoUrl,
          },
          gaForSearch
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Niche inference failed";
        return Response.json(
          { error: message },
          { status: 400 }
        );
      }
    }

    // Log search (truncated for privacy)
    console.log(
      `[CompetitorSearch] Mode: ${mode}, Niche: ${hashNicheForLogging(inferredNiche)}, Queries: ${inferredNiche.queryTerms.length}`
    );

    // Create cache key
    const cacheKey = makeCacheKey(
      mode,
      inferredNiche.niche,
      inferredNiche.queryTerms,
      effectiveFilters
    );

    // Create the search generator with caching
    const searchGenerator = searchCompetitorsWithCache(
      gaForSearch,
      inferredNiche,
      effectiveFilters,
      cacheKey,
      async () => {
        const cached = await getCachedSearchResults(cacheKey);
        if (cached) {
          return {
            results: cached.results,
            scannedCount: cached.scannedCount,
            exhausted: cached.exhausted,
          };
        }
        return null;
      },
      async (results, scannedCount, exhausted) => {
        await setCachedSearchResults(
          cacheKey,
          results,
          inferredNiche,
          scannedCount,
          exhausted
        );
      },
      undefined, // Use default config
      req.signal, // Abort signal
      searchCursor // Pagination cursor
    );

    // Return streaming response
    const stream = createEventStream(searchGenerator);

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[CompetitorSearch] Error:", err);
    return Response.json(
      { error: "Search failed", detail: message },
      { status: 500 }
    );
  }
}

export const POST = createApiRoute(
  { route: "/api/competitors/search" },
  POSTHandler
);

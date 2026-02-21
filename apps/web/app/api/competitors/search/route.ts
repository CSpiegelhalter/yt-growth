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

import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { withValidation } from "@/lib/api/withValidation";
import { getGoogleAccount } from "@/lib/youtube";
import {
  SearchBodySchema,
  searchCompetitors,
  type SearchEvent,
} from "@/lib/features/competitors";

function createEventStream(
  generator: AsyncGenerator<SearchEvent, void, unknown>,
): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const event of generator) {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
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

export const POST = createApiRoute(
  { route: "/api/competitors/search" },
  withAuth(
    { mode: "required" },
    withRateLimit(
      { operation: "competitorFeed", identifier: (api) => api.userId },
      withValidation({ body: SearchBodySchema }, async (req, _ctx, _api, { body }) => {
        const generator = searchCompetitors(
          { userId: _api.userId!, ...body! },
          { getGoogleAccount },
          req.signal,
        );

        return new Response(createEventStream(generator), {
          headers: {
            "Content-Type": "application/x-ndjson",
            "Cache-Control": "no-cache",
            "Transfer-Encoding": "chunked",
          },
        });
      }),
    ),
  ),
);

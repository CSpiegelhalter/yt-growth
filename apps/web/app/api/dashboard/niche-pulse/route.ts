/**
 * GET /api/dashboard/niche-pulse?niche=<label>
 *
 * Computes a 1-line niche pulse from the per-niche keyword pool that the
 * brief endpoint also uses. Returns null when the niche is unknown or the
 * upstream pool is empty so the client silently omits the pulse line
 * rather than fabricating stats.
 */
import { z } from "zod";

import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { getNicheKeywords } from "@/lib/features/trending/niche-keywords";
import type { BriefAnchor } from "@/lib/llm";

const QuerySchema = z.object({
  niche: z.string().min(1).max(50),
});

type Pulse = {
  gapCount: number;
  outlierVideoCount: number;
  medianSearchVolume: number;
  topMomentum: BriefAnchor["trendMomentum"];
};

function median(xs: number[]): number {
  if (xs.length === 0) {return 0;}
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

function pickTopMomentum(anchors: BriefAnchor[]): Pulse["topMomentum"] {
  const counts: Record<Pulse["topMomentum"], number> = { hot: 0, rising: 0, steady: 0 };
  for (const a of anchors) {
    counts[a.trendMomentum] = (counts[a.trendMomentum] ?? 0) + 1;
  }
  if (counts.hot >= counts.rising && counts.hot >= counts.steady) {return "hot";}
  if (counts.rising >= counts.steady) {return "rising";}
  return "steady";
}

function buildPulse(anchors: BriefAnchor[]): Pulse | null {
  if (anchors.length === 0) {return null;}
  return {
    gapCount: anchors.length,
    // We don't have competitor-overlap data on the per-niche keyword pool
    // (those keywords come from DataForSEO related-keywords, not the
    // gap-enrichment pipeline). 0 here is honest, not a fake metric — the
    // client can simply hide that segment when it's 0.
    outlierVideoCount: 0,
    medianSearchVolume: median(anchors.map((a) => a.searchVolume)),
    topMomentum: pickTopMomentum(anchors),
  };
}

export const GET = createApiRoute(
  { route: "/api/dashboard/niche-pulse" },
  withAuth(
    { mode: "optional" },
    withValidation(
      { query: QuerySchema },
      async (_req, _ctx, api, { query }) => {
        const anchors = await getNicheKeywords(query!.niche);
        const pulse = buildPulse(anchors);
        return jsonOk(
          { pulse },
          {
            requestId: api.requestId,
            headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
          },
        );
      },
    ),
  ),
);

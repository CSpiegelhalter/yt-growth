/**
 * POST /api/analyze/keyword-volume
 *
 * Looks up SEO metrics (search volume, competition, CPC) for the
 * provided keywords (typically a video's tags) using DataForSEO.
 * Single bulk task per request keeps cost predictable.
 *
 * Auth: Required
 * Entitlements: keyword_research
 */
import { z } from "zod";

import type {
  KeywordVolumeResponse,
  KeywordVolumeRow,
} from "@/app/(app)/analyze/_components/keyword-volume.types";
import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { withValidation } from "@/lib/api/withValidation";
import { fetchBulkKeywordVolume, type KeywordMetrics } from "@/lib/dataforseo";
import {
  checkEntitlement,
  entitlementErrorResponse,
} from "@/lib/with-entitlements";

const MAX_KEYWORDS = 10;

const KeywordVolumeSchema = z.object({
  keywords: z
    .array(z.string().trim().min(1).max(120))
    .min(1)
    .max(MAX_KEYWORDS),
});

function toRow(metric: KeywordMetrics): KeywordVolumeRow {
  return {
    keyword: metric.keyword,
    searchVolume: metric.searchVolume,
    competition: metric.competition,
    competitionLevel: metric.competitionLevel,
    cpc: metric.cpc,
  };
}

export const POST = createApiRoute(
  { route: "/api/analyze/keyword-volume" },
  withAuth(
    { mode: "required" },
    withRateLimit(
      { operation: "competitorDetail", identifier: (api) => api.userId },
      withValidation(
        { body: KeywordVolumeSchema },
        async (_req, _ctx, api, { body }) => {
          const ent = await checkEntitlement({
            featureKey: "keyword_research",
            increment: true,
          });
          if (!ent.ok) {
            return entitlementErrorResponse(ent.error);
          }

          const keywords = body!.keywords
            .map((k) => k.trim())
            .filter(Boolean)
            .slice(0, MAX_KEYWORDS);

          const metrics = await fetchBulkKeywordVolume(keywords);
          const rows = metrics
            .map(toRow)
            .sort((a, b) => b.searchVolume - a.searchVolume);

          const payload: KeywordVolumeResponse = {
            rows,
            meta: { fetchedAt: new Date().toISOString() },
          };
          return jsonOk(payload, { requestId: api.requestId });
        },
      ),
    ),
  ),
);

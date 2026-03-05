/**
 * Re-export barrel — business logic moved to lib/features/video-insights/
 *
 * This wrapper maintains backward compatibility for callers that use the
 * old (no-port) function signature. It wires the DataForSEO adapter
 * functions into the port interface expected by the use-case.
 */

import "server-only";

import type { GoogleTrendsResponse } from "@/lib/adapters/dataforseo/client";
import { fetchGoogleTrends } from "@/lib/adapters/dataforseo/client";
import type { YouTubeSerpResponse } from "@/lib/adapters/dataforseo/youtube-serp";
import { fetchYouTubeSerp } from "@/lib/adapters/dataforseo/youtube-serp";
import {
  getCachedResponse,
  setCachedResponse,
} from "@/lib/dataforseo/cache";
import type {
  CompetitiveContextInput,
  CompetitiveContextResult,
} from "@/lib/features/video-insights";
import { fetchCompetitiveContext as fetchCompetitiveContextUseCase } from "@/lib/features/video-insights";
import { logger } from "@/lib/shared/logger";

export type { CompetitiveContextResult as CompetitiveContext } from "@/lib/features/video-insights";

/**
 * @deprecated Import from `@/lib/features/video-insights` instead.
 */
export async function fetchCompetitiveContext(
  options: CompetitiveContextInput,
): Promise<CompetitiveContextResult> {
  return fetchCompetitiveContextUseCase(options, {
    getYouTubeSerp: async (input) => {
      const keyword = input.keyword;
      const region = input.region ?? "us";

      const cached = await getCachedResponse<YouTubeSerpResponse>(
        "youtube_serp",
        keyword,
        region,
      );
      if (cached) {
        logger.info("[CompetitiveContext] SERP cache hit", { keyword });
        return { ...cached.data, region: cached.data.location };
      }

      const r = await fetchYouTubeSerp({
        keyword: input.keyword,
        location: region,
        limit: input.limit,
      });

      setCachedResponse("youtube_serp", keyword, region, r).catch(() => {});

      return { ...r, region: r.location };
    },
    getTrends: async (input) => {
      const keyword = input.keyword;
      const region = input.region ?? "us";
      const cacheKey = `trends:${input.dateFrom ?? ""}:${input.dateTo ?? ""}`;

      const cached = await getCachedResponse<GoogleTrendsResponse>(
        cacheKey,
        keyword,
        region,
      );
      if (cached) {
        logger.info("[CompetitiveContext] Trends cache hit", { keyword });
        return {
          ...cached.data,
          meta: { ...cached.data.meta, region: cached.data.meta.location },
        };
      }

      const r = await fetchGoogleTrends({
        keyword: input.keyword,
        location: region,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
      });

      setCachedResponse(cacheKey, keyword, region, r).catch(() => {});

      return {
        ...r,
        meta: { ...r.meta, region: r.meta.location },
      };
    },
  });
}

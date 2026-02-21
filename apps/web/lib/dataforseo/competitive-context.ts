/**
 * Re-export barrel — business logic moved to lib/features/video-insights/
 *
 * This wrapper maintains backward compatibility for callers that use the
 * old (no-port) function signature. It wires the DataForSEO adapter
 * functions into the port interface expected by the use-case.
 */

import "server-only";
import type {
  CompetitiveContextInput,
  CompetitiveContextResult,
} from "@/lib/features/video-insights";
import { fetchCompetitiveContext as fetchCompetitiveContextUseCase } from "@/lib/features/video-insights";
import { fetchYouTubeSerp } from "@/lib/adapters/dataforseo/youtube-serp";
import { fetchGoogleTrends } from "@/lib/adapters/dataforseo/client";

export type { CompetitiveContextResult as CompetitiveContext } from "@/lib/features/video-insights";

/**
 * @deprecated Import from `@/lib/features/video-insights` instead.
 */
export async function fetchCompetitiveContext(
  options: CompetitiveContextInput,
): Promise<CompetitiveContextResult> {
  return fetchCompetitiveContextUseCase(options, {
    getYouTubeSerp: async (input) => {
      const r = await fetchYouTubeSerp({
        keyword: input.keyword,
        location: input.region,
        limit: input.limit,
      });
      return { ...r, region: r.location };
    },
    getTrends: async (input) => {
      const r = await fetchGoogleTrends({
        keyword: input.keyword,
        location: input.region,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
      });
      return {
        ...r,
        meta: { ...r.meta, region: r.meta.location },
      };
    },
  });
}

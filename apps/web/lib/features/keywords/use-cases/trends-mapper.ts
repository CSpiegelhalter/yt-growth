import "server-only";

import type { GoogleTrendsResponse } from "@/lib/dataforseo/client";

/**
 * Map a GoogleTrendsResponse to the standard trends body shape
 * shared between getKeywordTrends and pollKeywordTask.
 */
export function mapTrendsBody(response: GoogleTrendsResponse) {
  return {
    keyword: response.keyword,
    interestOverTime: response.interestOverTime,
    risingQueries: response.risingQueries,
    topQueries: response.topQueries,
    regionBreakdown: response.regionBreakdown,
    averageInterest: response.averageInterest,
    meta: {
      source: "dataforseo" as const,
      location: response.meta.location,
      dateFrom: response.meta.dateFrom,
      dateTo: response.meta.dateTo,
      fetchedAt: response.meta.fetchedAt,
      cached: false,
    },
  };
}

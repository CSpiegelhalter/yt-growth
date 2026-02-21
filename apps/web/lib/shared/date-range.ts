/**
 * Date range utility for analytics queries.
 *
 * Produces YYYY-MM-DD start/end strings for common rolling windows.
 * Used by features (video-insights) and adapters (youtube/owned-analytics).
 */

export type AnalyticsRange = "7d" | "28d" | "90d";

const RANGE_DAYS: Record<AnalyticsRange, number> = {
  "7d": 7,
  "28d": 28,
  "90d": 90,
};

export function getDateRange(range: AnalyticsRange): {
  startDate: string;
  endDate: string;
} {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - RANGE_DAYS[range]);

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
}

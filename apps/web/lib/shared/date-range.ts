/**
 * Date range utility for analytics queries.
 *
 * Produces YYYY-MM-DD start/end strings for common rolling windows.
 * Used by features (video-insights) and adapters (youtube/owned-analytics).
 */

export type AnalyticsRange = "7d" | "28d" | "30d" | "90d";

const RANGE_DAYS: Record<AnalyticsRange, number> = {
  "7d": 7,
  "28d": 28,
  "30d": 30,
  "90d": 90,
};

/** Format a Date as YYYY-MM-DD using local timezone (avoids UTC offset bugs). */
export function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getDateRange(range: AnalyticsRange): {
  startDate: string;
  endDate: string;
} {
  const endDate = new Date();
  // YouTube Analytics data has a ~2-day processing delay;
  // requesting recent dates causes Google API 500 errors.
  endDate.setDate(endDate.getDate() - 2);

  // Derive startDate from endDate (NOT from `new Date()`) so day-arithmetic
  // stays within the same month context. The previous version used
  // `new Date(); startDate.setDate(endDate.getDate() - N)` — when today was
  // the 1st or 2nd of a month, endDate.getDate() came from the previous
  // month while startDate was still in the current month, producing a
  // 1-day window instead of the requested N-day window.
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - RANGE_DAYS[range]);

  return {
    startDate: toLocalDateStr(startDate),
    endDate: toLocalDateStr(endDate),
  };
}

/**
 * Types for Competitor Search
 */

// ============================================
// SEARCH FILTER STATE
// ============================================

export type ContentType = "shorts" | "long" | "both";
export type DateRange = "7d" | "30d" | "90d" | "365d";
export type SortBy = "viewsPerDay" | "totalViews" | "newest" | "engagement";

export type FilterState = {
  contentType: ContentType;
  dateRange: DateRange;
  minViewsPerDay: number;
  sortBy: SortBy;
};

export const DEFAULT_FILTER_STATE: FilterState = {
  contentType: "both",
  dateRange: "90d",
  minViewsPerDay: 10,
  sortBy: "viewsPerDay",
};

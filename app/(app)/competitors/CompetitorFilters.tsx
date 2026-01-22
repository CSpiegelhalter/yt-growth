"use client";

import { useCallback, type ChangeEvent } from "react";
import s from "./style.module.css";

export type ContentType = "shorts" | "long" | "both";
export type DateRange = "7d" | "30d" | "90d" | "365d";
export type SortBy = "viewsPerDay" | "totalViews" | "newest" | "engagement";

export type FilterState = {
  contentType: ContentType;
  dateRange: DateRange;
  minViewsPerDay: number;
  sortBy: SortBy;
};

type Props = {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  disabled?: boolean;
};

/**
 * CompetitorFilters - Collapsible filters panel
 *
 * Provides:
 * - Content type: Shorts only / Long-form only / Both
 * - Posted date range
 * - Min views per day
 * - Sort by
 */
export default function CompetitorFilters({
  filters,
  onChange,
  isCollapsed,
  onToggleCollapse,
  disabled = false,
}: Props) {
  const handleContentTypeChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      onChange({ ...filters, contentType: e.target.value as ContentType });
    },
    [filters, onChange]
  );

  const handleDateRangeChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      onChange({ ...filters, dateRange: e.target.value as DateRange });
    },
    [filters, onChange]
  );

  const handleMinViewsChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      onChange({ ...filters, minViewsPerDay: parseInt(e.target.value, 10) });
    },
    [filters, onChange]
  );

  const handleSortChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      onChange({ ...filters, sortBy: e.target.value as SortBy });
    },
    [filters, onChange]
  );

  // Count active filters (non-default)
  const activeFilterCount = [
    filters.contentType !== "both",
    filters.dateRange !== "90d",
    filters.minViewsPerDay !== 10,
  ].filter(Boolean).length;

  return (
    <div className={s.filtersContainer}>
      {/* Collapse toggle - mobile */}
      <button
        type="button"
        className={s.filtersToggle}
        onClick={onToggleCollapse}
        aria-expanded={!isCollapsed}
        aria-controls="filters-panel"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        Filters
        {activeFilterCount > 0 && (
          <span className={s.filtersBadge}>{activeFilterCount}</span>
        )}
        <svg
          className={`${s.filtersChevron} ${isCollapsed ? "" : s.filtersChevronOpen}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Filters panel */}
      <div
        id="filters-panel"
        className={`${s.filtersPanel} ${isCollapsed ? s.filtersPanelCollapsed : ""}`}
        aria-hidden={isCollapsed}
      >
        {/* Sort */}
        <div className={s.filterGroup}>
          <label className={s.filterLabel}>Sort By</label>
          <select
            className={s.select}
            value={filters.sortBy}
            onChange={handleSortChange}
            disabled={disabled}
          >
            <option value="viewsPerDay">Views/Day (Trending)</option>
            <option value="totalViews">Total Views</option>
            <option value="newest">Recently Posted</option>
            <option value="engagement">High Engagement</option>
          </select>
        </div>

        {/* Content Type */}
        <div className={s.filterGroup}>
          <label className={s.filterLabel}>Content Type</label>
          <select
            className={s.select}
            value={filters.contentType}
            onChange={handleContentTypeChange}
            disabled={disabled}
          >
            <option value="both">All Videos</option>
            <option value="shorts">Shorts Only</option>
            <option value="long">Long-form Only</option>
          </select>
        </div>

        {/* Date Range */}
        <div className={s.filterGroup}>
          <label className={s.filterLabel}>Posted Within</label>
          <select
            className={s.select}
            value={filters.dateRange}
            onChange={handleDateRangeChange}
            disabled={disabled}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="365d">Last year</option>
          </select>
        </div>

        {/* Min Views/Day */}
        <div className={s.filterGroup}>
          <label className={s.filterLabel}>Min Views/Day</label>
          <select
            className={s.select}
            value={filters.minViewsPerDay}
            onChange={handleMinViewsChange}
            disabled={disabled}
          >
            <option value="0">No minimum</option>
            <option value="10">10+ views/day</option>
            <option value="50">50+ views/day</option>
            <option value="100">100+ views/day</option>
            <option value="500">500+ views/day</option>
            <option value="1000">1K+ views/day</option>
          </select>
        </div>
      </div>
    </div>
  );
}

/**
 * Default filter values
 */
export const DEFAULT_FILTER_STATE: FilterState = {
  contentType: "both",
  dateRange: "90d",
  minViewsPerDay: 10,
  sortBy: "viewsPerDay",
};

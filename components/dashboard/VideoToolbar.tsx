"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import s from "./VideoToolbar.module.css";
import {
  SortKey,
  SortOption,
  VideoFilters,
  TimeRange,
  ContentType,
  Preset,
  DEFAULT_FILTERS,
  SORT_OPTIONS,
  getAvailableSortOptions,
  getSortLabel,
  downloadCSV,
  VideoWithMetrics,
  DashboardVideo,
} from "@/lib/video-tools";

type Props = {
  videos: DashboardVideo[];
  filteredVideos: VideoWithMetrics[];
  sortKey: SortKey;
  filters: VideoFilters;
  onSortChange: (key: SortKey) => void;
  onFiltersChange: (filters: VideoFilters) => void;
  onReset: () => void;
  pageSize: number;
  pageSizeOptions: readonly number[];
  onPageSizeChange: (size: number) => void;
};

export default function VideoToolbar({
  videos,
  filteredVideos,
  sortKey,
  filters,
  onSortChange,
  onFiltersChange,
  onReset,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
}: Props) {
  const [sortOpen, setSortOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const sortRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const pageSizeRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get available sort options based on data
  const availableSortOptions = getAvailableSortOptions(videos);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
      if (actionsRef.current && !actionsRef.current.contains(e.target as Node)) {
        setActionsOpen(false);
      }
      if (pageSizeRef.current && !pageSizeRef.current.contains(e.target as Node)) {
        setPageSizeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Debounced search
  const handleSearchChange = useCallback(
    (value: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        onFiltersChange({ ...filters, searchQuery: value });
      }, 300);
    },
    [filters, onFiltersChange]
  );

  // Handle sort selection
  const handleSortSelect = (key: SortKey) => {
    onSortChange(key);
    setSortOpen(false);
  };

  // Handle page size selection
  const handlePageSizeSelect = (size: number) => {
    onPageSizeChange(size);
    setPageSizeOpen(false);
  };

  // Handle time range change
  const handleTimeRangeChange = (range: TimeRange) => {
    onFiltersChange({ ...filters, timeRange: range, preset: "none" });
  };

  // Handle content type change
  const handleContentTypeChange = (type: ContentType) => {
    onFiltersChange({ ...filters, contentType: type, preset: "none" });
  };

  // Handle preset change
  const handlePresetChange = (preset: Preset) => {
    const newPreset = filters.preset === preset ? "none" : preset;
    onFiltersChange({ ...filters, preset: newPreset });
  };

  // Check if filters are modified from defaults
  const hasActiveFilters =
    filters.timeRange !== DEFAULT_FILTERS.timeRange ||
    filters.contentType !== DEFAULT_FILTERS.contentType ||
    filters.preset !== DEFAULT_FILTERS.preset ||
    filters.searchQuery !== DEFAULT_FILTERS.searchQuery;

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredVideos.length === 0) {
      setToast("No videos to export");
      return;
    }
    downloadCSV(filteredVideos, sortKey);
    setToast(`Exported ${filteredVideos.length} videos to CSV`);
    setActionsOpen(false);
  };

  // Copy summary to clipboard
  const handleCopySummary = async () => {
    const top5 = filteredVideos.slice(0, 5);
    const sortLabel = getSortLabel(sortKey);
    const summary = [
      `Top 5 videos by ${sortLabel}:`,
      ...top5.map((v, i) => `${i + 1}. ${v.title ?? "Untitled"} (${v.views.toLocaleString()} views)`),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summary);
      setToast("Summary copied to clipboard!");
    } catch {
      setToast("Failed to copy");
    }
    setActionsOpen(false);
  };

  return (
    <div className={s.toolbar}>
      <div className={s.toolbarInner}>
        {/* Primary row: Sort + Search + Actions */}
        <div className={s.primaryRow}>
          {/* Sort dropdown */}
          <div className={s.sortWrap} ref={sortRef}>
            <button
              className={s.sortButton}
              onClick={() => setSortOpen(!sortOpen)}
              aria-expanded={sortOpen}
              aria-haspopup="listbox"
              aria-label={`Sort by ${getSortLabel(sortKey)}`}
            >
              <span>{getSortLabel(sortKey)}</span>
              <svg
                className={s.sortButtonIcon}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {sortOpen && (
              <div className={s.sortDropdown} role="listbox" aria-label="Sort options">
                {availableSortOptions.map((option) => (
                  <button
                    key={option.key}
                    className={s.sortOption}
                    role="option"
                    aria-selected={sortKey === option.key}
                    onClick={() => handleSortSelect(option.key)}
                  >
                    <span className={s.sortOptionLabel}>{option.label}</span>
                    <span className={s.sortOptionDesc}>{option.description}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <div className={s.searchWrap}>
            <svg
              className={s.searchIcon}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              className={s.searchInput}
              placeholder="Search videos..."
              defaultValue={filters.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              aria-label="Search videos by title"
            />
            {filters.searchQuery && (
              <button
                className={s.searchClear}
                onClick={() => onFiltersChange({ ...filters, searchQuery: "" })}
                aria-label="Clear search"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Page size dropdown */}
          <div className={s.pageSizeWrap} ref={pageSizeRef}>
            <button
              className={s.pageSizeButton}
              onClick={() => setPageSizeOpen(!pageSizeOpen)}
              aria-expanded={pageSizeOpen}
              aria-haspopup="listbox"
              aria-label={`Show ${pageSize} videos per page`}
            >
              <span className={s.pageSizeLabel}>Show</span>
              <span className={s.pageSizeValue}>{pageSize}</span>
              <svg
                className={s.pageSizeIcon}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {pageSizeOpen && (
              <div className={s.pageSizeDropdown} role="listbox" aria-label="Videos per page">
                {pageSizeOptions.map((size) => (
                  <button
                    key={size}
                    className={s.pageSizeOption}
                    role="option"
                    aria-selected={pageSize === size}
                    onClick={() => handlePageSizeSelect(size)}
                  >
                    {size} videos
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions dropdown */}
          <div className={s.actionsWrap} ref={actionsRef}>
            <button
              className={s.actionsButton}
              onClick={() => setActionsOpen(!actionsOpen)}
              aria-expanded={actionsOpen}
              aria-haspopup="menu"
              aria-label="Actions menu"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
              <span className={s.actionsButtonText}>Actions</span>
            </button>
            {actionsOpen && (
              <div className={s.actionsDropdown} role="menu">
                <button className={s.actionItem} role="menuitem" onClick={handleExportCSV}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export as CSV
                </button>
                <button className={s.actionItem} role="menuitem" onClick={handleCopySummary}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  Copy top 5 summary
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Secondary row: Filters */}
        <div className={s.secondaryRow}>
          {/* Time range */}
          <div className={s.filterGroup}>
            <span className={s.filterLabel}>Time</span>
            <div className={s.filterChips} role="group" aria-label="Filter by time range">
              {(["7d", "28d", "90d", "lifetime"] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  className={s.filterChip}
                  aria-pressed={filters.timeRange === range}
                  onClick={() => handleTimeRangeChange(range)}
                >
                  {range === "lifetime" ? "All time" : range}
                </button>
              ))}
            </div>
          </div>

          {/* Content type */}
          <div className={s.filterGroup}>
            <span className={s.filterLabel}>Type</span>
            <div className={s.filterChips} role="group" aria-label="Filter by content type">
              {(["all", "long", "short"] as ContentType[]).map((type) => (
                <button
                  key={type}
                  className={s.filterChip}
                  aria-pressed={filters.contentType === type}
                  onClick={() => handleContentTypeChange(type)}
                >
                  {type === "all" ? "All" : type === "long" ? "Long-form" : "Shorts"}
                </button>
              ))}
            </div>
          </div>

          {/* Presets */}
          <div className={s.filterGroup}>
            <span className={s.filterLabel}>Quick</span>
            <div className={s.filterChips} role="group" aria-label="Quick filter presets">
              <button
                className={`${s.filterChip} ${s.presetChip}`}
                aria-pressed={filters.preset === "needs_attention"}
                onClick={() => handlePresetChange("needs_attention")}
              >
                ⚠️ Needs attention
              </button>
              <button
                className={`${s.filterChip} ${s.presetChip}`}
                aria-pressed={filters.preset === "top_performers"}
                onClick={() => handlePresetChange("top_performers")}
              >
                🏆 Top performers
              </button>
            </div>
          </div>

          {/* Reset & count */}
          {hasActiveFilters && (
            <button className={s.resetButton} onClick={onReset} aria-label="Reset all filters">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Reset
            </button>
          )}

          <div className={s.videoCount}>
            <span className={s.videoCountNum}>{filteredVideos.length}</span>{" "}
            {filteredVideos.length === 1 ? "video" : "videos"}
            {filteredVideos.length !== videos.length && (
              <span> of {videos.length}</span>
            )}
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className={`${s.toast} ${s.toastSuccess}`} role="status" aria-live="polite">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}

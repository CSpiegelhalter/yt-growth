"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import s from "./VideoToolbar.module.css";
import {
  SortKey,
  VideoFilters,
  DEFAULT_FILTERS,
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
  totalVideoCount: number;
};

export default function VideoToolbar({
  videos,
  filteredVideos,
  sortKey,
  filters,
  onSortChange,
  onFiltersChange,
  onReset,
  totalVideoCount,
}: Props) {
  const [sortOpen, setSortOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const sortRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get available sort options based on data
  const availableSortOptions = getAvailableSortOptions(videos);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
      if (
        actionsRef.current &&
        !actionsRef.current.contains(e.target as Node)
      ) {
        setActionsOpen(false);
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
    [filters, onFiltersChange],
  );

  // Handle sort selection
  const handleSortSelect = (key: SortKey) => {
    onSortChange(key);
    setSortOpen(false);
  };

  // Check if filters are modified from defaults
  const hasActiveFilters =
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
      ...top5.map(
        (v, i) =>
          `${i + 1}. ${v.title ?? "Untitled"} (${v.views.toLocaleString()} views)`,
      ),
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
              <div
                className={s.sortDropdown}
                role="listbox"
                aria-label="Sort options"
              >
                {availableSortOptions.map((option) => (
                  <button
                    key={option.key}
                    className={s.sortOption}
                    role="option"
                    aria-selected={sortKey === option.key}
                    onClick={() => handleSortSelect(option.key)}
                  >
                    <span className={s.sortOptionLabel}>{option.label}</span>
                    <span className={s.sortOptionDesc}>
                      {option.description}
                    </span>
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
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
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
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
              <span className={s.actionsButtonText}>Actions</span>
            </button>
            {actionsOpen && (
              <div className={s.actionsDropdown} role="menu">
                <button
                  className={s.actionItem}
                  role="menuitem"
                  onClick={handleExportCSV}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Export as CSV
                </button>
                <button
                  className={s.actionItem}
                  role="menuitem"
                  onClick={handleCopySummary}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
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
          {/* Reset & count */}
          {hasActiveFilters && (
            <button
              className={s.resetButton}
              onClick={onReset}
              aria-label="Reset all filters"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Reset
            </button>
          )}

          <div className={s.videoCount}>
            <span className={s.videoCountNum}>{filteredVideos.length}</span>{" "}
            {filteredVideos.length === 1 ? "video" : "videos"}
            {filteredVideos.length !== totalVideoCount && (
              <span className={s.videoCountTotal}>
                {" "}
                of {totalVideoCount.toLocaleString()} total
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`${s.toast} ${s.toastSuccess}`}
          role="status"
          aria-live="polite"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {toast}
        </div>
      )}
    </div>
  );
}

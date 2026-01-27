"use client";

import { useState, useMemo, useCallback } from "react";
import Image from "next/image";
import s from "../keywords.module.css";
import type { RelatedKeyword, YouTubeRanking, GoogleTrendsData } from "../KeywordResearchClient";

// ============================================
// TYPES
// ============================================

type SortField = "keyword" | "searchVolume" | "keywordDifficulty" | "competition";
type SortDirection = "asc" | "desc";
type DifficultyFilter = "all" | "easy" | "medium" | "hard";

// Pagination config
const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;

/**
 * Sort preset definitions for quick multi-sort selection.
 * Each preset defines primary and optional secondary sort.
 */
type SortPreset = {
  id: string;
  label: string;
  primary: { field: SortField; direction: SortDirection };
  secondary?: { field: SortField; direction: SortDirection };
};

const SORT_PRESETS: SortPreset[] = [
  {
    id: "best-opportunities",
    label: "Best Opportunities",
    primary: { field: "searchVolume", direction: "desc" },
    secondary: { field: "keywordDifficulty", direction: "asc" },
  },
  {
    id: "easiest-wins",
    label: "Easiest Wins",
    primary: { field: "keywordDifficulty", direction: "asc" },
    secondary: { field: "searchVolume", direction: "desc" },
  },
  {
    id: "highest-demand",
    label: "Highest Demand",
    primary: { field: "searchVolume", direction: "desc" },
  },
  {
    id: "lowest-competition",
    label: "Lowest Competition",
    primary: { field: "keywordDifficulty", direction: "asc" },
  },
  {
    id: "alphabetical",
    label: "A-Z",
    primary: { field: "keyword", direction: "asc" },
  },
];

interface Props {
  keyword: string;
  relatedKeywords: RelatedKeyword[];
  rankings: YouTubeRanking[];
  trends: GoogleTrendsData | null;
  loadingKeywords: boolean;
  loadingRankings: boolean;
  loadingTrends: boolean;
  onKeywordClick: (keyword: string) => void;
  onSignInClick?: () => void;
}

// ============================================
// HELPERS
// ============================================

function formatNumber(num: number | null | undefined): string {
  if (num == null) return "—";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
}

function formatViews(views: number | null): string {
  if (views === null) return "—";
  if (views >= 1000000) return (views / 1000000).toFixed(1) + "M";
  if (views >= 1000) return (views / 1000).toFixed(1) + "K";
  return views.toString();
}

function formatCompetition(competition: number | null | undefined, level: string | null | undefined): string {
  if (competition == null && !level) return "—";
  if (level) return level.charAt(0) + level.slice(1).toLowerCase(); // "HIGH" -> "High"
  if (competition != null) return `${Math.round(competition * 100)}%`;
  return "—";
}

function getKdClass(kd: number): string {
  if (kd <= 30) return s.kdEasy;
  if (kd <= 60) return s.kdMedium;
  return s.kdHard;
}

function getKdLabel(kd: number): string {
  if (kd <= 30) return "Easy";
  if (kd <= 60) return "Medium";
  return "Hard";
}

function getDifficultyCategory(kd: number): DifficultyFilter {
  if (kd <= 30) return "easy";
  if (kd <= 60) return "medium";
  return "hard";
}

/**
 * Calculate trend direction and percentage from monthly data.
 * Compares recent 3 months average vs earlier 3 months average.
 */
function calculateTrendChange(data: number[] | undefined): { direction: "up" | "down" | "stable"; percentage: number } {
  if (!data || data.length < 6) {
    return { direction: "stable", percentage: 0 };
  }

  // Compare recent 3 months to earlier 3 months
  const recentMonths = data.slice(-3);
  const earlierMonths = data.slice(-6, -3);
  
  const recentAvg = recentMonths.reduce((a, b) => a + b, 0) / recentMonths.length;
  const earlierAvg = earlierMonths.reduce((a, b) => a + b, 0) / earlierMonths.length;
  
  if (earlierAvg === 0) {
    return { direction: recentAvg > 0 ? "up" : "stable", percentage: 0 };
  }
  
  const percentChange = ((recentAvg - earlierAvg) / earlierAvg) * 100;
  
  // Use 10% threshold for meaningful change
  if (percentChange > 10) {
    return { direction: "up", percentage: Math.round(percentChange) };
  } else if (percentChange < -10) {
    return { direction: "down", percentage: Math.abs(Math.round(percentChange)) };
  }
  return { direction: "stable", percentage: Math.abs(Math.round(percentChange)) };
}

/**
 * Get month labels for the last 12 months
 */
function getMonthLabels(): string[] {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const labels: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(months[d.getMonth()]);
  }
  return labels;
}

/**
 * Stable multi-field sort comparator.
 * Supports primary and optional secondary sort fields.
 */
function createMultiSortComparator(
  primary: { field: SortField; direction: SortDirection },
  secondary?: { field: SortField; direction: SortDirection }
) {
  return (a: RelatedKeyword, b: RelatedKeyword): number => {
    // Primary comparison
    let comparison = compareByField(a, b, primary.field);
    if (comparison !== 0) {
      return primary.direction === "asc" ? comparison : -comparison;
    }

    // Secondary comparison if tied
    if (secondary) {
      comparison = compareByField(a, b, secondary.field);
      return secondary.direction === "asc" ? comparison : -comparison;
    }

    // Final tiebreaker: keyword name for stability
    return a.keyword.localeCompare(b.keyword);
  };
}

function compareByField(a: RelatedKeyword, b: RelatedKeyword, field: SortField): number {
  switch (field) {
    case "keyword":
      return a.keyword.localeCompare(b.keyword);
    case "searchVolume":
      return (a.searchVolume ?? 0) - (b.searchVolume ?? 0);
    case "keywordDifficulty":
      return (a.keywordDifficulty ?? 0) - (b.keywordDifficulty ?? 0);
    case "competition":
      return ((a as any).competition ?? 0) - ((b as any).competition ?? 0);
    default:
      return 0;
  }
}

// ============================================
// COMPONENT
// ============================================

export function ResearchTab({
  keyword,
  relatedKeywords,
  rankings,
  trends,
  loadingKeywords,
  loadingRankings,
  loadingTrends,
  onKeywordClick,
  onSignInClick,
}: Props) {
  // Table state - multi-sort with presets
  const [activePreset, setActivePreset] = useState<string>("best-opportunities");
  const [primarySort, setPrimarySort] = useState<{ field: SortField; direction: SortDirection }>({
    field: "searchVolume",
    direction: "desc",
  });
  const [secondarySort, setSecondarySort] = useState<{ field: SortField; direction: SortDirection } | undefined>({
    field: "keywordDifficulty",
    direction: "asc",
  });
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  
  // Copy state
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);

  // Sort and filter related keywords
  const { filteredKeywords, paginatedKeywords, totalPages, totalFiltered } = useMemo(() => {
    let filtered = [...relatedKeywords];

    // Apply difficulty filter
    if (difficultyFilter !== "all") {
      filtered = filtered.filter(
        (kw) => getDifficultyCategory(kw.keywordDifficulty) === difficultyFilter
      );
    }

    // Apply multi-sort
    const comparator = createMultiSortComparator(primarySort, secondarySort);
    filtered.sort(comparator);

    // Calculate pagination
    const total = filtered.length;
    const pages = Math.ceil(total / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);

    return {
      filteredKeywords: filtered,
      paginatedKeywords: paginated,
      totalPages: pages,
      totalFiltered: total,
    };
  }, [relatedKeywords, primarySort, secondarySort, difficultyFilter, currentPage, pageSize]);

  // Reset to page 1 when filters change
  const handlePresetChange = useCallback((presetId: string) => {
    setActivePreset(presetId);
    const preset = SORT_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setPrimarySort(preset.primary);
      setSecondarySort(preset.secondary);
    }
    setCurrentPage(1);
  }, []);

  const handleDifficultyChange = useCallback((filter: DifficultyFilter) => {
    setDifficultyFilter(filter);
    setCurrentPage(1);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  // Handle column header click for sorting
  const handleSort = useCallback((field: SortField) => {
    setActivePreset("custom");
    setCurrentPage(1);
    
    if (primarySort.field === field) {
      // Toggle direction
      setPrimarySort({
        field,
        direction: primarySort.direction === "asc" ? "desc" : "asc",
      });
    } else {
      // New primary sort, old primary becomes secondary
      setSecondarySort(primarySort);
      setPrimarySort({ field, direction: "desc" });
    }
  }, [primarySort]);

  // Copy keyword to clipboard
  const handleCopyKeyword = useCallback(async (kw: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row/keyword click
    try {
      await navigator.clipboard.writeText(kw);
      setCopiedKeyword(kw);
      setTimeout(() => setCopiedKeyword(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = kw;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedKeyword(kw);
      setTimeout(() => setCopiedKeyword(null), 2000);
    }
  }, []);

  // Handle keyword text click (not full row)
  const handleKeywordTextClick = useCallback((kw: string, e: React.MouseEvent) => {
    e.preventDefault();
    onKeywordClick(kw);
  }, [onKeywordClick]);

  // Export to CSV with all available fields
  const handleExportCSV = useCallback(() => {
    const headers = ["Keyword", "Volume", "Difficulty", "Difficulty Level", "Competition"];
    const rows = filteredKeywords.map((kw: any) => [
      // Escape keywords that might contain commas
      `"${kw.keyword.replace(/"/g, '""')}"`,
      kw.searchVolume?.toString() ?? "",
      kw.keywordDifficulty?.toString() ?? "",
      getKdLabel(kw.keywordDifficulty ?? 0),
      kw.competitionLevel ?? (kw.competition != null ? Math.round(kw.competition * 100) + "%" : ""),
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `keywords-${keyword}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredKeywords, keyword]);

  // Get sort indicator for column header
  const getSortIndicator = useCallback((field: SortField) => {
    if (primarySort.field === field) {
      return primarySort.direction === "asc" ? "↑" : "↓";
    }
    if (secondarySort?.field === field) {
      return secondarySort.direction === "asc" ? "↑₂" : "↓₂";
    }
    return null;
  }, [primarySort, secondarySort]);

  // Trend bars for the table with color coding and tooltip
  const TrendBarsWithChange = ({ data }: { data: number[] | undefined }) => {
    if (!data || data.length === 0) return <span>—</span>;

    const max = Math.max(...data, 1);
    const avg = data.reduce((a, b) => a + b, 0) / data.length;
    const normalized = data.map((v) => Math.round((v / max) * 24));
    const monthLabels = getMonthLabels();
    const { direction, percentage } = calculateTrendChange(data);
    
    // Create tooltip text showing recent vs earlier
    const recentAvg = data.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const tooltipText = `${formatNumber(Math.round(recentAvg))}/mo avg (last 3 months)`;
    
    const changeClass = direction === "up" ? s.trendChangeUp : direction === "down" ? s.trendChangeDown : s.trendChangeStable;
    const changeSymbol = direction === "up" ? "+" : direction === "down" ? "-" : "";

    return (
      <div className={s.trendContainer}>
        <div 
          className={`${s.trendBars} ${s.trendTooltip}`} 
          data-tooltip={tooltipText}
          title={data.map((v, i) => `${monthLabels[i]}: ${formatNumber(v)}`).join(" | ")}
        >
          {normalized.map((h, i) => {
            // Color bars: green if above avg, gray if below
            const val = data[i];
            const barClass = val > avg * 1.2 ? s.trendBarHigh : val < avg * 0.8 ? s.trendBarLow : s.trendBarMed;
            return (
              <div 
                key={i} 
                className={`${s.trendBar} ${barClass}`} 
                style={{ height: `${Math.max(h, 3)}px` }} 
              />
            );
          })}
        </div>
        {percentage > 0 && (
          <span className={`${s.trendChange} ${changeClass}`}>
            {changeSymbol}{percentage}%
          </span>
        )}
      </div>
    );
  };

  // Tab state
  const [activeTab, setActiveTab] = useState<"keywords" | "insights">("keywords");

  return (
    <div className={s.researchTab}>
      {/* Tab Navigation */}
      <div className={s.tabNav}>
        <button
          type="button"
          className={`${s.tabButton} ${activeTab === "keywords" ? s.tabButtonActive : ""}`}
          onClick={() => setActiveTab("keywords")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h10" />
          </svg>
          Keywords
          {relatedKeywords.length > 0 && (
            <span className={s.tabBadge}>{relatedKeywords.length}</span>
          )}
        </button>
        <button
          type="button"
          className={`${s.tabButton} ${activeTab === "insights" ? s.tabButtonActive : ""}`}
          onClick={() => setActiveTab("insights")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 20V10M12 20V4M6 20v-6" />
          </svg>
          Insights
          {(loadingTrends || loadingRankings) && (
            <span className={s.tabSpinner} />
          )}
        </button>
      </div>

      {/* Keywords Tab Content */}
      {activeTab === "keywords" && (
        <section className={s.relatedSection}>
          <div className={s.sectionHeader}>
          <div className={s.sectionHeaderTitle}>
            <h3 className={s.sectionTitle}>Related Keywords</h3>
            <p className={s.sectionSubtitle}>
              Click a keyword to explore similar terms
            </p>
          </div>
          <div className={s.tableControls}>
            {/* First row: Sort and Filter dropdowns */}
            <div className={s.tableControlsRow}>
              <select
                value={activePreset}
                onChange={(e) => handlePresetChange(e.target.value)}
                className={s.filterSelect}
                aria-label="Sort by"
              >
                {SORT_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
                {activePreset === "custom" && (
                  <option value="custom">Custom Sort</option>
                )}
              </select>
              <select
                value={difficultyFilter}
                onChange={(e) => handleDifficultyChange(e.target.value as DifficultyFilter)}
                className={s.filterSelect}
                aria-label="Filter by difficulty"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy (0-30)</option>
                <option value="medium">Medium (31-60)</option>
                <option value="hard">Hard (61+)</option>
              </select>
            </div>
            {/* Export Button */}
            <button 
              onClick={handleExportCSV} 
              className={s.exportButton} 
              disabled={filteredKeywords.length === 0}
              aria-label="Export to CSV"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        {loadingKeywords ? (
          <div className={s.tableContainer}>
            <div className={s.tableSkeleton}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={s.tableRowSkeleton} />
              ))}
            </div>
          </div>
        ) : paginatedKeywords.length > 0 ? (
          <>
            <div className={s.tableScrollWrapper}>
              <table className={s.keywordsTable}>
                <colgroup>
                  <col className={s.colKeyword} />
                  <col className={s.colVolume} />
                  <col className={s.colDifficulty} />
                  <col className={s.colCompetition} />
                  <col className={s.colTrend} />
                </colgroup>
                <thead>
                  <tr>
                    <th
                      onClick={() => handleSort("keyword")}
                      className={`${s.sortableHeader} ${primarySort.field === "keyword" ? s.sortActive : ""}`}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && handleSort("keyword")}
                      aria-sort={primarySort.field === "keyword" ? (primarySort.direction === "asc" ? "ascending" : "descending") : undefined}
                    >
                      Keyword
                      {getSortIndicator("keyword") && (
                        <span className={`${s.sortIcon} ${s.sortIconActive}`}>{getSortIndicator("keyword")}</span>
                      )}
                    </th>
                    <th
                      onClick={() => handleSort("searchVolume")}
                      className={`${s.sortableHeader} ${primarySort.field === "searchVolume" ? s.sortActive : ""}`}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && handleSort("searchVolume")}
                      aria-sort={primarySort.field === "searchVolume" ? (primarySort.direction === "asc" ? "ascending" : "descending") : undefined}
                    >
                      Volume
                      {getSortIndicator("searchVolume") && (
                        <span className={`${s.sortIcon} ${s.sortIconActive}`}>{getSortIndicator("searchVolume")}</span>
                      )}
                    </th>
                    <th
                      onClick={() => handleSort("keywordDifficulty")}
                      className={`${s.sortableHeader} ${primarySort.field === "keywordDifficulty" ? s.sortActive : ""}`}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && handleSort("keywordDifficulty")}
                      aria-sort={primarySort.field === "keywordDifficulty" ? (primarySort.direction === "asc" ? "ascending" : "descending") : undefined}
                    >
                      KD
                      {getSortIndicator("keywordDifficulty") && (
                        <span className={`${s.sortIcon} ${s.sortIconActive}`}>{getSortIndicator("keywordDifficulty")}</span>
                      )}
                    </th>
                    <th
                      onClick={() => handleSort("competition")}
                      className={`${s.sortableHeader} ${primarySort.field === "competition" ? s.sortActive : ""}`}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && handleSort("competition")}
                      title="Competition level for ads"
                      aria-sort={primarySort.field === "competition" ? (primarySort.direction === "asc" ? "ascending" : "descending") : undefined}
                    >
                      Comp
                      {getSortIndicator("competition") && (
                        <span className={`${s.sortIcon} ${s.sortIconActive}`}>{getSortIndicator("competition")}</span>
                      )}
                    </th>
                    <th>12-Month Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedKeywords.map((kw: any) => {
                    // Check if this keyword is in rising queries
                    const risingQuery = trends?.risingQueries.find(
                      (q) => q.query.toLowerCase() === kw.keyword.toLowerCase()
                    );
                    
                    return (
                    <tr key={kw.keyword} className={s.tableRow}>
                      <td className={s.keywordCell}>
                        <span className={s.keywordText}>
                          <button
                            type="button"
                            onClick={(e) => handleKeywordTextClick(kw.keyword, e)}
                            className={s.keywordTextContent}
                            title={`Explore similar keywords for "${kw.keyword}"`}
                            aria-label={`Explore similar keywords for ${kw.keyword}`}
                          >
                            {kw.keyword}
                          </button>
                          {risingQuery && (
                            <span className={s.risingBadge} title={`Rising +${risingQuery.value >= 1000 ? "Breakout" : risingQuery.value + "%"}`}>
                              <svg className={s.risingBadgeIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M7 17l5-5 5 5M7 7l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              Rising
                            </span>
                          )}
                          <button
                            type="button"
                            className={s.copyButton}
                            onClick={(e) => handleCopyKeyword(kw.keyword, e)}
                            data-copied={copiedKeyword === kw.keyword}
                            title={copiedKeyword === kw.keyword ? "Copied!" : "Copy keyword"}
                            aria-label={`Copy ${kw.keyword} to clipboard`}
                          >
                            {copiedKeyword === kw.keyword ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                              </svg>
                            )}
                          </button>
                        </span>
                      </td>
                      <td>{formatNumber(kw.searchVolume)}</td>
                      <td>
                        <span className={`${s.kdBadge} ${getKdClass(kw.keywordDifficulty)}`}>
                          {kw.keywordDifficulty}
                        </span>
                      </td>
                      <td>{formatCompetition(kw.competition, kw.competitionLevel)}</td>
                      <td>
                        <TrendBarsWithChange data={kw.trend} />
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className={s.paginationContainer}>
                <div className={s.paginationInfo}>
                  Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, totalFiltered)} of {totalFiltered} keywords
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className={s.pageSizeSelect}
                    aria-label="Results per page"
                  >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size} per page
                      </option>
                    ))}
                  </select>
                </div>
                <div className={s.paginationControls}>
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className={s.paginationButton}
                    aria-label="First page"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={s.paginationButton}
                    aria-label="Previous page"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`${s.paginationButton} ${currentPage === pageNum ? s.paginationButtonActive : ""}`}
                        aria-label={`Page ${pageNum}`}
                        aria-current={currentPage === pageNum ? "page" : undefined}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={s.paginationButton}
                    aria-label="Next page"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className={s.paginationButton}
                    aria-label="Last page"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 17l5-5-5-5M6 17l5-5-5-5" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        ) : relatedKeywords.length > 0 ? (
          <p className={s.noData}>No keywords match the selected filter.</p>
        ) : (
          <p className={s.noData}>No related keywords found.</p>
        )}
        </section>
      )}

      {/* Insights Tab Content */}
      {activeTab === "insights" && (
        <div className={s.insightsTab}>
          {/* Search Interest Section */}
          <section className={s.insightCard}>
            <div className={s.insightCardHeader}>
              <h3 className={s.insightCardTitle}>Search Interest</h3>
              <p className={s.insightCardSubtitle}>Google Trends data for &quot;{keyword}&quot; over the last 12 months</p>
            </div>

            {loadingTrends ? (
              <div className={s.insightCardBody}>
                <div className={`${s.skeleton}`} style={{ height: "180px", borderRadius: "8px" }} />
              </div>
            ) : trends && trends.interestOverTime.length > 0 ? (
              <div className={s.insightCardBody}>
                <div className={s.searchInterestChart}>
                  {/* Y-axis */}
                  <div className={s.chartYAxis}>
                    <span>100</span>
                    <span>50</span>
                    <span>0</span>
                  </div>
                  {/* Chart area */}
                  <div className={s.chartArea}>
                    <div className={s.chartBars}>
                      {trends.interestOverTime.map((point, i) => {
                        const maxValue = Math.max(...trends.interestOverTime.map(p => p.value), 1);
                        const height = (point.value / maxValue) * 100;
                        const isHigh = point.value >= maxValue * 0.8;
                        const dateLabel = point.dateFrom ? new Date(point.dateFrom).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : '';
                        return (
                          <div
                            key={i}
                            className={`${s.chartBar} ${isHigh ? s.chartBarHigh : ""}`}
                            style={{ height: `${Math.max(height, 4)}%` }}
                            title={`${dateLabel}: ${point.value}/100 interest`}
                          />
                        );
                      })}
                    </div>
                    {/* X-axis */}
                    <div className={s.chartXAxis}>
                      <span>{trends.interestOverTime[0]?.dateFrom ? new Date(trends.interestOverTime[0].dateFrom).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : ''}</span>
                      <span>{trends.interestOverTime[trends.interestOverTime.length - 1]?.dateFrom ? new Date(trends.interestOverTime[trends.interestOverTime.length - 1].dateFrom).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : ''}</span>
                    </div>
                  </div>
                  {/* Stats */}
                  <div className={s.chartStats}>
                    {trends.averageInterest > 0 && (
                      <div className={s.chartStat}>
                        <span className={s.chartStatValue}>{trends.averageInterest}</span>
                        <span className={s.chartStatLabel}>Avg Interest</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className={s.chartCaption}>
                  Values represent relative search interest on a 0-100 scale
                </p>
              </div>
            ) : (
              <div className={s.insightCardBody}>
                <div className={s.noInsightData}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 20V10M12 20V4M6 20v-6" />
                  </svg>
                  <p>No search interest data available</p>
                </div>
              </div>
            )}
          </section>

          {/* YouTube Rankings Section */}
          <section className={s.insightCard}>
            <div className={s.insightCardHeader}>
              <h3 className={s.insightCardTitle}>YouTube Rankings</h3>
              <p className={s.insightCardSubtitle}>Top videos currently ranking for &quot;{keyword}&quot;</p>
            </div>

            {loadingRankings ? (
              <div className={s.insightCardBody}>
                <div className={s.rankingsList}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`${s.rankingItem} ${s.skeleton}`} style={{ height: "72px" }} />
                  ))}
                </div>
              </div>
            ) : rankings.length > 0 ? (
              <div className={s.insightCardBody}>
                <div className={s.rankingsList}>
                  {rankings.slice(0, 5).map((video) => (
                    <a
                      key={video.videoId}
                      href={video.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={s.rankingItem}
                    >
                      <span className={s.rankingPosition}>#{video.position}</span>
                      {video.thumbnailUrl && (
                        <Image
                          src={video.thumbnailUrl}
                          alt=""
                          width={80}
                          height={45}
                          className={s.rankingThumbnail}
                          unoptimized
                        />
                      )}
                      <div className={s.rankingInfo}>
                        <span className={s.rankingTitle}>{video.title}</span>
                        <span className={s.rankingChannel}>{video.channelName}</span>
                      </div>
                      <span className={s.rankingViews}>{formatViews(video.views)} views</span>
                    </a>
                  ))}
                </div>
              </div>
            ) : onSignInClick ? (
              <div className={s.insightCardBody}>
                <div className={s.signInPrompt}>
                  <p>Sign in to see YouTube rankings for this keyword.</p>
                  <button onClick={onSignInClick} className={s.signInButton}>
                    Sign in
                  </button>
                </div>
              </div>
            ) : (
              <div className={s.insightCardBody}>
                <div className={s.noInsightData}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                  </svg>
                  <p>No YouTube rankings found</p>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

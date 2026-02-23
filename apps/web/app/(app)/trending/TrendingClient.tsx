"use client";

import { useSearchParams } from "next/navigation";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { ProfileTip } from "@/components/dashboard/ProfileTip";
import { LockedFeatureGate } from "@/components/features/LockedFeatureGate";
import FilterDrawer from "@/components/FilterDrawer/FilterDrawer";
import { AlertCircleIcon, CompassIcon, SearchIcon } from "@/components/icons";
import { safeGetItem, safeSetItem } from "@/lib/client/safeLocalStorage";
import { useSyncActiveChannelIdToLocalStorage } from "@/lib/use-sync-active-channel";
import type { Me } from "@/types/api";

import {
  clearAllDiscoveryState,
  getActiveAdvancedFilterKeys,
  getActiveDiscoveryFilterCount,
  type QuickChipId,
  toggleQuickChip,
} from "./discovery-utils";
import NicheDiscoveryCard from "./NicheDiscoveryCard";
import s from "./style.module.css";
import type {
  ChannelAge,
  ChannelSize,
  ContentCategory,
  DiscoveredNiche,
  DiscoveryFilters,
  DiscoveryListType,
  DiscoveryResponse,
  DiscoverySort,
} from "./types";
import {
  CATEGORY_OPTIONS,
  CHANNEL_AGE_LABELS,
  CHANNEL_SIZE_LABELS,
  DEFAULT_DISCOVERY_FILTERS,
  DEFAULT_LIST_TYPE,
  LIST_TYPE_OPTIONS,
  SORT_OPTIONS,
} from "./types";

function getFilterPillLabel(
  key: string,
  filters: DiscoveryFilters,
  queryText: string,
): string {
  const labels: Record<string, string> = {
    queryText: `Query: ${queryText.trim()}`,
    minViewsPerDay: `Min ${filters.minViewsPerDay}/day`,
    timeWindow: `Window: ${filters.timeWindow}`,
    category: `Category: ${CATEGORY_OPTIONS[filters.category].label}`,
    channelSize: `Size: ${CHANNEL_SIZE_LABELS[filters.channelSize].label}`,
    channelAge: `Age: ${CHANNEL_AGE_LABELS[filters.channelAge].label}`,
    contentType: `Type: ${filters.contentType}`,
    sortBy: `Sort: ${SORT_OPTIONS[filters.sortBy].label}`,
  };
  return labels[key] ?? key;
}

type Props = {
  initialMe: Me;
  initialActiveChannelId: string | null;
};

/**
 * TrendingClient - Trending search experience
 *
 * Allows users to discover trending niches across multiple dimensions:
 * - Channel size (micro, small, medium, large)
 * - Channel age (new, growing, established)
 * - Content type (shorts, long-form)
 * - Content category (how-to, entertainment, tech, etc.)
 * - Sorting (velocity, breakout, engagement, opportunity)
 */
export default function TrendingClient({
  initialMe,
  initialActiveChannelId,
}: Props) {
  const searchParams = useSearchParams();
  const urlChannelId = searchParams.get("channelId");

  // Active channel
  const activeChannelId = urlChannelId ?? initialActiveChannelId ?? null;

  // Subscription check
  const isSubscribed = initialMe.subscription?.isActive ?? false;

  useSyncActiveChannelIdToLocalStorage(activeChannelId);

  const [listType, setListType] =
    useState<DiscoveryListType>(DEFAULT_LIST_TYPE);
  const [filters, setFilters] = useState<DiscoveryFilters>(
    DEFAULT_DISCOVERY_FILTERS,
  );
  const [queryText, setQueryText] = useState("");
  const [niches, setNiches] = useState<DiscoveredNiche[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [totalFound, setTotalFound] = useState(0);
  const [savedNiches, setSavedNiches] = useState<Set<string>>(new Set());
  const [dismissedNiches, setDismissedNiches] = useState<Set<string>>(
    new Set(),
  );
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // Draft state for advanced filters (only applies on "Apply")
  const [draftFilters, setDraftFilters] = useState<DiscoveryFilters>(filters);
  const [draftQueryText, setDraftQueryText] = useState(queryText);

  // Load saved/dismissed from localStorage
  useEffect(() => {
    try {
      const saved = safeGetItem("discovery-saved-niches");
      if (saved) {setSavedNiches(new Set(JSON.parse(saved)));}
      const dismissed = safeGetItem("discovery-dismissed-niches");
      if (dismissed) {setDismissedNiches(new Set(JSON.parse(dismissed)));}
    } catch {
      // Ignore parse errors
    }
  }, []);

  const fetchNiches = useCallback(
    async (
      currentListType: DiscoveryListType,
      currentFilters: DiscoveryFilters,
      currentQueryText: string,
      append = false,
    ) => {
      if (abortRef.current) {abortRef.current.abort();}

      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const response = await fetch("/api/competitors/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listType: currentListType,
            filters: currentFilters,
            queryText: currentQueryText.trim() || undefined,
            cursor: append ? nextCursor : null,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${response.status}`);
        }

        const data: DiscoveryResponse = await response.json();

        // Filter out dismissed niches
        const filtered = data.niches.filter((n) => !dismissedNiches.has(n.id));

        if (append) {
          setNiches((prev) => [...prev, ...filtered]);
        } else {
          setNiches(filtered);
        }
        setHasMore(data.hasMore);
        setTotalFound(data.totalFound);
        setNextCursor(data.nextCursor ?? null);
      } catch (error_) {
        if ((error_ as Error).name === "AbortError") {return;}
        setError(
          error_ instanceof Error ? error_.message : "Failed to discover niches",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [dismissedNiches, nextCursor],
  );

  const handleDiscover = useCallback(() => {
    setNextCursor(null);
    void fetchNiches(listType, filters, queryText, false);
  }, [listType, filters, queryText, fetchNiches]);

  const handleLoadMore = useCallback(() => {
    void fetchNiches(listType, filters, queryText, true);
  }, [listType, filters, queryText, fetchNiches]);

  const handleListTypeChange = useCallback(
    (newListType: DiscoveryListType) => {
      setListType(newListType);
      setNextCursor(null);
      void fetchNiches(newListType, filters, queryText, false);
    },
    [filters, queryText, fetchNiches],
  );

  const handleSave = useCallback((niche: DiscoveredNiche) => {
    setSavedNiches((prev) => {
      const next = new Set(prev);
      if (next.has(niche.id)) {
        next.delete(niche.id);
      } else {
        next.add(niche.id);
      }
      safeSetItem(
        "discovery-saved-niches",
        JSON.stringify([...next]),
      );
      return next;
    });
  }, []);

  const handleDismiss = useCallback((niche: DiscoveredNiche) => {
    setDismissedNiches((prev) => {
      const next = new Set(prev);
      next.add(niche.id);
      safeSetItem(
        "discovery-dismissed-niches",
        JSON.stringify([...next]),
      );
      return next;
    });
    setNiches((prev) => prev.filter((n) => n.id !== niche.id));
  }, []);

  // Navigate to competitors page with niche pre-filled
  const handleSearchNiche = useCallback(
    (niche: DiscoveredNiche) => {
      // Build URL with niche as query param for competitor search
      const params = new URLSearchParams();
      if (activeChannelId) {params.set("channelId", activeChannelId);}
      params.set("niche", niche.nicheLabel);
      window.location.href = `/competitors?${params.toString()}`;
    },
    [activeChannelId],
  );

  const activeFilterCount = getActiveDiscoveryFilterCount(
    filters,
    DEFAULT_DISCOVERY_FILTERS,
    queryText,
  );
  const activeAdvancedKeys = getActiveAdvancedFilterKeys(
    filters,
    DEFAULT_DISCOVERY_FILTERS,
    queryText,
  );
  const showActiveFiltersRow = activeAdvancedKeys.length > 0;

  const visibleNiches = niches.filter((n) => !dismissedNiches.has(n.id));

  // Advanced filters (opened via drawer)
  const advancedFilterControls = (
    <>
      {/* Channel Size */}
      <div className={s.filterGroup}>
        <label className={s.filterLabel} htmlFor="discovery-size">
          Channel Size
        </label>
        <select
          id="discovery-size"
          className={s.select}
          value={draftFilters.channelSize}
          onChange={(e) =>
            setDraftFilters((prev) => ({
              ...prev,
              channelSize: e.target.value as ChannelSize,
            }))
          }
        >
          {(Object.keys(CHANNEL_SIZE_LABELS) as ChannelSize[]).map((key) => (
            <option key={key} value={key}>
              {CHANNEL_SIZE_LABELS[key].label} ({CHANNEL_SIZE_LABELS[key].range}
              )
            </option>
          ))}
        </select>
      </div>

      {/* Channel Age */}
      <div className={s.filterGroup}>
        <label className={s.filterLabel} htmlFor="discovery-age">
          Channel Age
        </label>
        <select
          id="discovery-age"
          className={s.select}
          value={draftFilters.channelAge}
          onChange={(e) =>
            setDraftFilters((prev) => ({
              ...prev,
              channelAge: e.target.value as ChannelAge,
            }))
          }
        >
          {(Object.keys(CHANNEL_AGE_LABELS) as ChannelAge[]).map((key) => (
            <option key={key} value={key}>
              {CHANNEL_AGE_LABELS[key].label}
            </option>
          ))}
        </select>
      </div>

      {/* Min Views/Day */}
      <div className={s.filterGroup}>
        <label className={s.filterLabel} htmlFor="discovery-minvpd">
          Min Views/Day
        </label>
        <select
          id="discovery-minvpd"
          className={s.select}
          value={draftFilters.minViewsPerDay}
          onChange={(e) =>
            setDraftFilters((prev) => ({
              ...prev,
              minViewsPerDay: Number.parseInt(e.target.value, 10),
            }))
          }
        >
          <option value="0">No minimum</option>
          <option value="50">50+ views/day</option>
          <option value="100">100+ views/day</option>
          <option value="500">500+ views/day</option>
          <option value="1000">1K+ views/day</option>
          <option value="5000">5K+ views/day</option>
        </select>
      </div>
    </>
  );

  const openAllFilters = useCallback(() => {
    // Initialize draft from current applied state
    setDraftFilters(filters);
    setDraftQueryText(queryText);
    setIsFilterDrawerOpen(true);
  }, [filters, queryText]);

  const applyAllFilters = useCallback(() => {
    setIsFilterDrawerOpen(false);
    setFilters(draftFilters);
    setQueryText(draftQueryText);
    // Trigger new discovery immediately
    setNextCursor(null);
    void fetchNiches(listType, draftFilters, draftQueryText, false);
  }, [listType, draftFilters, draftQueryText, fetchNiches]);

  const resetAllInDrawer = useCallback(() => {
    setDraftFilters(DEFAULT_DISCOVERY_FILTERS);
    setDraftQueryText("");
  }, []);

  const clearAll = useCallback(() => {
    const cleared = clearAllDiscoveryState(DEFAULT_DISCOVERY_FILTERS);
    setFilters(cleared.filters);
    setQueryText(cleared.queryText);
    setNextCursor(null);
  }, []);

  const handleQuickChip = useCallback(
    (chipId: QuickChipId) => {
      setFilters((prev) =>
        toggleQuickChip(prev, DEFAULT_DISCOVERY_FILTERS, chipId),
      );
      // If drawer is open, keep draft in sync so UI reflects chip changes.
      if (isFilterDrawerOpen) {
        setDraftFilters((prev) =>
          toggleQuickChip(prev, DEFAULT_DISCOVERY_FILTERS, chipId),
        );
      }
    },
    [isFilterDrawerOpen],
  );

  const handleSearchSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      handleDiscover();
    },
    [handleDiscover],
  );

  const removeActiveFilter = useCallback(
    (key: (typeof activeAdvancedKeys)[number]) => {
      if (key === "queryText") {
        setQueryText("");
        return;
      }
      const filterKey = key as keyof DiscoveryFilters;
      setFilters((p) => ({ ...p, [filterKey]: DEFAULT_DISCOVERY_FILTERS[filterKey] }));
    },
    [setFilters],
  );

  if (!isSubscribed) {
    return (
      <LockedFeatureGate
        pageTitle="Trending Search"
        pageSubtitle="Discover trending niches and rising videos"
        icon={<CompassIcon size={48} strokeWidth={1.5} />}
        unlockTitle="Unlock Trending Search"
        unlockDesc="Discover rising niches, breakout videos, and emerging opportunities. Filter by channel size, content type, and more to find your next hit."
        styles={s}
      />
    );
  }

  return (
    <main className={s.page}>
      {/* Header */}
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Trending Search</h1>
          <p className={s.subtitle}>
            Discover trending niches and rising videos that match your goals
          </p>
        </div>
      </div>

      {/* Profile Tip */}
      <ProfileTip channelId={activeChannelId} />

      {/* Intro text */}
      <div className={s.discoveryHeader}>
        <div className={s.discoveryHeaderText}>
          <p className={s.discoveryIntroText}>
            Discover trending niches and rising videos. Filter by channel size,
            age, category, and more to find opportunities that match your goals.
          </p>
        </div>
      </div>

      {/* List Type Tabs */}
      <div
        className={s.listTypeTabs}
        role="tablist"
        aria-label="Discovery type"
      >
        {(Object.keys(LIST_TYPE_OPTIONS) as DiscoveryListType[]).map((type) => (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={listType === type}
            className={`${s.listTypeTab} ${listType === type ? s.listTypeTabActive : ""}`}
            onClick={() => handleListTypeChange(type)}
          >
            <span className={s.listTypeTabIcon}>
              {type === "fastest_growing" && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              )}
              {type === "breakouts" && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              )}
              {type === "emerging_niches" && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              )}
              {type === "low_competition" && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              )}
            </span>
            <span className={s.listTypeTabLabel}>
              {LIST_TYPE_OPTIONS[type].label}
            </span>
          </button>
        ))}
      </div>

      {/* Search bar row: input + primary CTA + All filters */}
      <form className={s.discoverySearchRow} onSubmit={handleSearchSubmit}>
        <div className={s.discoveryQueryGroup}>
          <label className={s.discoveryQueryLabel} htmlFor="discovery-query">
            Search
          </label>
          <input
            id="discovery-query"
            className={s.discoveryQueryInput}
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder={
              'Optional: search around a niche (e.g., "budget travel", "espresso", "react")'
            }
            autoComplete="off"
          />
        </div>

        <button type="submit" className={s.discoverBtn} disabled={isLoading}>
          {isLoading ? (
            <>
              <span className={s.spinnerSmall} />
              Loading...
            </>
          ) : (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
              Discover
            </>
          )}
        </button>

        <button
          type="button"
          className={s.allFiltersBtn}
          onClick={openAllFilters}
          aria-label="All filters"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          All filters
          {activeFilterCount > 0 && (
            <span className={s.filtersBadge}>{activeFilterCount}</span>
          )}
        </button>
      </form>

      {/* Quick chips row */}
      <div className={s.quickFilters} role="group" aria-label="Quick filters">
        <button
          type="button"
          className={`${s.quickFilterPill} ${filters.sortBy === "velocity" ? s.quickFilterPillActive : ""}`}
          onClick={() => handleQuickChip("fastGrowing")}
        >
          Fast Growing
        </button>
        <button
          type="button"
          className={`${s.quickFilterPill} ${filters.sortBy === "breakout" ? s.quickFilterPillActive : ""}`}
          onClick={() => handleQuickChip("breakout")}
        >
          Breakout
        </button>
        <button
          type="button"
          className={`${s.quickFilterPill} ${filters.channelSize === "small" ? s.quickFilterPillActive : ""}`}
          onClick={() => handleQuickChip("smallChannels")}
        >
          Small Channels
        </button>
        <button
          type="button"
          className={`${s.quickFilterPill} ${filters.channelAge === "new" ? s.quickFilterPillActive : ""}`}
          onClick={() => handleQuickChip("newChannels")}
        >
          New Channels
        </button>
        <button
          type="button"
          className={`${s.quickFilterPill} ${filters.contentType === "shorts" ? s.quickFilterPillActive : ""}`}
          onClick={() => handleQuickChip("shorts")}
        >
          Shorts
        </button>
      </div>

      {/* Active filters row (only when advanced filters are active) */}
      {showActiveFiltersRow && (
        <div className={s.activeFiltersRow} aria-label="Active filters">
          <div className={s.activeFilterPills}>
            {activeAdvancedKeys.map((key) => (
              <button
                key={key}
                type="button"
                className={s.activeFilterPill}
                onClick={() => removeActiveFilter(key)}
                aria-label={`Remove ${key}`}
                title="Remove"
              >
                <span className={s.activeFilterPillLabel}>
                  {getFilterPillLabel(key, filters, queryText)}
                </span>
                <span className={s.activeFilterPillX} aria-hidden="true">
                  ×
                </span>
              </button>
            ))}
          </div>
          <button type="button" className={s.clearAllBtn} onClick={clearAll}>
            Clear all
          </button>
        </div>
      )}

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Discovery Filters"
        actionLabel="Apply"
        onAction={applyAllFilters}
        secondaryActionLabel="Reset"
        onSecondaryAction={resetAllInDrawer}
      >
        <div className={s.filterDrawerFilters}>
          {/* Draft query (applies on Apply) */}
          <div className={s.searchInputGroup}>
            <label className={s.searchLabel} htmlFor="discovery-query-draft">
              Search (optional)
            </label>
            <input
              id="discovery-query-draft"
              type="text"
              className={s.searchInput}
              value={draftQueryText}
              onChange={(e) => setDraftQueryText(e.target.value)}
              placeholder="Search around a niche"
              autoComplete="off"
            />
          </div>

          {/* Core (draft) */}
          <div className={s.filterGroup}>
            <label className={s.filterLabel} htmlFor="discovery-sort-draft">
              Sort By
            </label>
            <select
              id="discovery-sort-draft"
              className={s.select}
              value={draftFilters.sortBy}
              onChange={(e) =>
                setDraftFilters((p) => ({
                  ...p,
                  sortBy: e.target.value as DiscoverySort,
                }))
              }
            >
              {(Object.keys(SORT_OPTIONS) as DiscoverySort[]).map((key) => (
                <option key={key} value={key}>
                  {SORT_OPTIONS[key].label}
                </option>
              ))}
            </select>
          </div>

          <div className={s.filterGroup}>
            <label className={s.filterLabel} htmlFor="discovery-category-draft">
              Category
            </label>
            <select
              id="discovery-category-draft"
              className={s.select}
              value={draftFilters.category}
              onChange={(e) =>
                setDraftFilters((p) => ({
                  ...p,
                  category: e.target.value as ContentCategory,
                }))
              }
            >
              {(Object.keys(CATEGORY_OPTIONS) as ContentCategory[]).map(
                (key) => (
                  <option key={key} value={key}>
                    {CATEGORY_OPTIONS[key].label}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className={s.filterGroup}>
            <label className={s.filterLabel} htmlFor="discovery-content-draft">
              Content Type
            </label>
            <select
              id="discovery-content-draft"
              className={s.select}
              value={draftFilters.contentType}
              onChange={(e) =>
                setDraftFilters((p) => ({
                  ...p,
                  contentType: e.target.value as "both" | "shorts" | "long",
                }))
              }
            >
              <option value="both">All Videos</option>
              <option value="shorts">Shorts Only</option>
              <option value="long">Long-form Only</option>
            </select>
          </div>

          <div className={s.filterGroup}>
            <label className={s.filterLabel} htmlFor="discovery-time-draft">
              Posted Within
            </label>
            <select
              id="discovery-time-draft"
              className={s.select}
              value={draftFilters.timeWindow}
              onChange={(e) =>
                setDraftFilters((p) => ({
                  ...p,
                  timeWindow: e.target.value as "24h" | "7d" | "30d" | "90d",
                }))
              }
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>

          <div className={s.discoveryDrawerDivider} />
          {advancedFilterControls}
        </div>
      </FilterDrawer>

      <DiscoveryResults
        error={error}
        isLoading={isLoading}
        hasSearched={hasSearched}
        visibleNiches={visibleNiches}
        totalFound={totalFound}
        hasMore={hasMore}
        savedNiches={savedNiches}
        onRetry={handleDiscover}
        onSearchNiche={handleSearchNiche}
        onSave={handleSave}
        onDismiss={handleDismiss}
        onLoadMore={handleLoadMore}
        onClearAll={clearAll}
      />
    </main>
  );
}

/* ---------- Extracted Results Section ---------- */

function DiscoveryResults({
  error,
  isLoading,
  hasSearched,
  visibleNiches,
  totalFound,
  hasMore,
  savedNiches,
  onRetry,
  onSearchNiche,
  onSave,
  onDismiss,
  onLoadMore,
  onClearAll,
}: {
  error: string | null;
  isLoading: boolean;
  hasSearched: boolean;
  visibleNiches: DiscoveredNiche[];
  totalFound: number;
  hasMore: boolean;
  savedNiches: Set<string>;
  onRetry: () => void;
  onSearchNiche: (niche: DiscoveredNiche) => void;
  onSave: (niche: DiscoveredNiche) => void;
  onDismiss: (niche: DiscoveredNiche) => void;
  onLoadMore: () => void;
  onClearAll: () => void;
}) {
  if (error) {
    return (
      <div className={s.discoveryError}>
        <AlertCircleIcon size={20} />
        <p>{error}</p>
        <button type="button" onClick={onRetry} className={s.retryBtn}>
          Retry
        </button>
      </div>
    );
  }

  if (isLoading && visibleNiches.length === 0) {
    return (
      <div className={s.discoveryLoading}>
        <span className={s.spinner} />
        <p>Finding niches...</p>
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div className={s.discoveryEmpty}>
        <div className={s.discoveryEmptyIcon}>
          <CompassIcon size={48} strokeWidth={1.5} />
        </div>
        <h3 className={s.discoveryEmptyTitle}>Discover Rising Niches</h3>
        <p className={s.discoveryEmptyDesc}>
          Use the filters to discover niches that match your channel goals.
          When you find something interesting, click "Search this niche" to
          explore competitors.
        </p>
      </div>
    );
  }

  if (visibleNiches.length === 0) {
    return (
      <div className={s.discoveryEmpty}>
        <div className={s.discoveryEmptyIcon}>
          <SearchIcon size={48} strokeWidth={1.5} />
        </div>
        <h3 className={s.discoveryEmptyTitle}>No Niches Found</h3>
        <p className={s.discoveryEmptyDesc}>
          Try broadening your filters — increase the time window, lower the
          minimum views/day, or select "Any Size" for channels.
        </p>
        <button type="button" className={s.resetFiltersBtnLarge} onClick={onClearAll}>
          Clear all
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={s.discoveryResultsHeader}>
        <p className={s.discoveryResultsCount}>
          Found <strong>{totalFound}</strong> niches
          {totalFound > visibleNiches.length && ` (showing ${visibleNiches.length})`}
        </p>
      </div>

      <div className={s.nicheCardsGrid}>
        {visibleNiches.map((niche) => (
          <NicheDiscoveryCard
            key={niche.id}
            niche={niche}
            onSearchThisNiche={onSearchNiche}
            onSave={onSave}
            onDismiss={onDismiss}
            isSaved={savedNiches.has(niche.id)}
          />
        ))}
      </div>

      {hasMore && (
        <div className={s.discoveryLoadMore}>
          <button
            type="button"
            className={s.loadMoreButton}
            onClick={onLoadMore}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load More Niches"}
          </button>
        </div>
      )}

      {isLoading && (
        <div className={s.discoveryLoadingMore}>
          <span className={s.spinnerSmall} />
          <p>Finding more niches...</p>
        </div>
      )}
    </>
  );
}

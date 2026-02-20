"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type FormEvent,
} from "react";
import { useSearchParams } from "next/navigation";
import NicheDiscoveryCard from "./NicheDiscoveryCard";
import FilterDrawer from "./FilterDrawer";
import type {
  DiscoveredNiche,
  DiscoveryFilters,
  DiscoveryResponse,
  ChannelSize,
  ChannelAge,
  DiscoverySort,
  ContentCategory,
  DiscoveryListType,
} from "./types";
import {
  DEFAULT_DISCOVERY_FILTERS,
  CHANNEL_SIZE_LABELS,
  CHANNEL_AGE_LABELS,
  SORT_OPTIONS,
  CATEGORY_OPTIONS,
  LIST_TYPE_OPTIONS,
  DEFAULT_LIST_TYPE,
} from "./types";
import {
  clearAllDiscoveryState,
  getActiveAdvancedFilterKeys,
  getActiveDiscoveryFilterCount,
  toggleQuickChip,
  type QuickChipId,
} from "./discovery-utils";
import s from "./style.module.css";
import { safeGetItem, safeSetItem } from "@/lib/storage/safeLocalStorage";
import { useSyncActiveChannelIdToLocalStorage } from "@/lib/use-sync-active-channel";
import type { Me } from "@/types/api";
import { SUBSCRIPTION, formatUsd } from "@/lib/product";
import { ProfileTip } from "@/components/dashboard/ProfileTip";

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
      if (saved) setSavedNiches(new Set(JSON.parse(saved)));
      const dismissed = safeGetItem("discovery-dismissed-niches");
      if (dismissed) setDismissedNiches(new Set(JSON.parse(dismissed)));
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
      if (abortRef.current) abortRef.current.abort();

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
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(
          err instanceof Error ? err.message : "Failed to discover niches",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [dismissedNiches, nextCursor],
  );

  const handleDiscover = useCallback(() => {
    setNextCursor(null);
    fetchNiches(listType, filters, queryText, false);
  }, [listType, filters, queryText, fetchNiches]);

  const handleLoadMore = useCallback(() => {
    fetchNiches(listType, filters, queryText, true);
  }, [listType, filters, queryText, fetchNiches]);

  const handleListTypeChange = useCallback(
    (newListType: DiscoveryListType) => {
      setListType(newListType);
      setNextCursor(null);
      fetchNiches(newListType, filters, queryText, false);
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
      if (activeChannelId) params.set("channelId", activeChannelId);
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
              minViewsPerDay: parseInt(e.target.value, 10),
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
    fetchNiches(listType, draftFilters, draftQueryText, false);
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
      switch (key) {
        case "queryText":
          setQueryText("");
          return;
        case "category":
          setFilters((p) => ({
            ...p,
            category: DEFAULT_DISCOVERY_FILTERS.category,
          }));
          return;
        case "timeWindow":
          setFilters((p) => ({
            ...p,
            timeWindow: DEFAULT_DISCOVERY_FILTERS.timeWindow,
          }));
          return;
        case "minViewsPerDay":
          setFilters((p) => ({
            ...p,
            minViewsPerDay: DEFAULT_DISCOVERY_FILTERS.minViewsPerDay,
          }));
          return;
        case "channelSize":
          setFilters((p) => ({
            ...p,
            channelSize: DEFAULT_DISCOVERY_FILTERS.channelSize,
          }));
          return;
        case "channelAge":
          setFilters((p) => ({
            ...p,
            channelAge: DEFAULT_DISCOVERY_FILTERS.channelAge,
          }));
          return;
        case "contentType":
          setFilters((p) => ({
            ...p,
            contentType: DEFAULT_DISCOVERY_FILTERS.contentType,
          }));
          return;
        case "sortBy":
          setFilters((p) => ({
            ...p,
            sortBy: DEFAULT_DISCOVERY_FILTERS.sortBy,
          }));
          return;
      }
    },
    [setFilters],
  );

  // Show locked state if subscription is required
  if (!isSubscribed) {
    return (
      <main className={s.page}>
        <div className={s.header}>
          <div>
            <h1 className={s.title}>Trending Search</h1>
            <p className={s.subtitle}>
              Discover trending niches and rising videos
            </p>
          </div>
        </div>
        <div className={s.lockedState}>
          <div className={s.lockedIcon}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
          </div>
          <h2 className={s.lockedTitle}>Unlock Trending Search</h2>
          <p className={s.lockedDesc}>
            Discover rising niches, breakout videos, and emerging opportunities.
            Filter by channel size, content type, and more to find your next
            hit.
          </p>
          <a href="/api/integrations/stripe/checkout" className={s.lockedBtn}>
            Subscribe to Pro — {formatUsd(SUBSCRIPTION.PRO_MONTHLY_PRICE_USD)}/
            {SUBSCRIPTION.PRO_INTERVAL}
          </a>
        </div>
      </main>
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
                  {key === "queryText"
                    ? `Query: ${queryText.trim()}`
                    : key === "minViewsPerDay"
                      ? `Min ${filters.minViewsPerDay}/day`
                      : key === "timeWindow"
                        ? `Window: ${filters.timeWindow}`
                        : key === "category"
                          ? `Category: ${CATEGORY_OPTIONS[filters.category].label}`
                          : key === "channelSize"
                            ? `Size: ${CHANNEL_SIZE_LABELS[filters.channelSize].label}`
                            : key === "channelAge"
                              ? `Age: ${CHANNEL_AGE_LABELS[filters.channelAge].label}`
                              : key === "contentType"
                                ? `Type: ${filters.contentType}`
                                : `Sort: ${SORT_OPTIONS[filters.sortBy].label}`}
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

      {/* Error State */}
      {error && (
        <div className={s.discoveryError}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <p>{error}</p>
          <button type="button" onClick={handleDiscover} className={s.retryBtn}>
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && visibleNiches.length === 0 && (
        <div className={s.discoveryLoading}>
          <span className={s.spinner} />
          <p>Finding niches...</p>
        </div>
      )}

      {/* Empty State (no search yet) */}
      {!isLoading && !error && !hasSearched && (
        <div className={s.discoveryEmpty}>
          <div className={s.discoveryEmptyIcon}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
          </div>
          <h3 className={s.discoveryEmptyTitle}>Discover Rising Niches</h3>
          <p className={s.discoveryEmptyDesc}>
            Use the filters to discover niches that match your channel goals.
            When you find something interesting, click "Search this niche" to
            explore competitors.
          </p>
        </div>
      )}

      {/* No Results State */}
      {!isLoading && !error && hasSearched && visibleNiches.length === 0 && (
        <div className={s.discoveryEmpty}>
          <div className={s.discoveryEmptyIcon}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <h3 className={s.discoveryEmptyTitle}>No Niches Found</h3>
          <p className={s.discoveryEmptyDesc}>
            Try broadening your filters — increase the time window, lower the
            minimum views/day, or select "Any Size" for channels.
          </p>
          <button
            type="button"
            className={s.resetFiltersBtnLarge}
            onClick={clearAll}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Results Header */}
      {visibleNiches.length > 0 && (
        <div className={s.discoveryResultsHeader}>
          <p className={s.discoveryResultsCount}>
            Found <strong>{totalFound}</strong> niches
            {totalFound > visibleNiches.length &&
              ` (showing ${visibleNiches.length})`}
          </p>
        </div>
      )}

      {/* Niche Cards Grid */}
      {visibleNiches.length > 0 && (
        <div className={s.nicheCardsGrid}>
          {visibleNiches.map((niche) => (
            <NicheDiscoveryCard
              key={niche.id}
              niche={niche}
              onSearchThisNiche={handleSearchNiche}
              onSave={handleSave}
              onDismiss={handleDismiss}
              isSaved={savedNiches.has(niche.id)}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && visibleNiches.length > 0 && (
        <div className={s.discoveryLoadMore}>
          <button
            type="button"
            className={s.loadMoreButton}
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load More Niches"}
          </button>
        </div>
      )}

      {/* Streaming indicator when loading more */}
      {isLoading && visibleNiches.length > 0 && (
        <div className={s.discoveryLoadingMore}>
          <span className={s.spinnerSmall} />
          <p>Finding more niches...</p>
        </div>
      )}
    </main>
  );
}

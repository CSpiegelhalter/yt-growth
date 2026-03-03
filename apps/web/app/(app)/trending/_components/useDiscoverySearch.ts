"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import type { DiscoveryFilters, DiscoveryListType } from "../types";
import { DEFAULT_DISCOVERY_FILTERS, DEFAULT_LIST_TYPE } from "../types";
import {
  clearAllDiscoveryState,
  getActiveAdvancedFilterKeys,
  getActiveDiscoveryFilterCount,
  type QuickChipId,
  toggleQuickChip,
} from "./discovery-utils";
import { useDiscoveryFetch } from "./useDiscoveryFetch";

export function useDiscoverySearch(dismissedNiches: Set<string>) {
  const [listType, setListType] =
    useState<DiscoveryListType>(DEFAULT_LIST_TYPE);
  const [filters, setFilters] = useState<DiscoveryFilters>(
    DEFAULT_DISCOVERY_FILTERS,
  );
  const [queryText, setQueryText] = useState("");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [draftFilters, setDraftFilters] =
    useState<DiscoveryFilters>(DEFAULT_DISCOVERY_FILTERS);
  const [draftQueryText, setDraftQueryText] = useState("");

  const fetch_ = useDiscoveryFetch(dismissedNiches);

  const doFetch = (
    lt: DiscoveryListType,
    f: DiscoveryFilters,
    q: string,
    append: boolean,
  ) => {
    fetch_.fetchNiches({
      listType: lt,
      filters: f,
      queryText: q,
      append,
      cursor: append ? fetch_.nextCursor : null,
    });
  };

  const handleDiscover = () => {
    fetch_.setNextCursor(null);
    doFetch(listType, filters, queryText, false);
  };
  const handleLoadMore = () => doFetch(listType, filters, queryText, true);
  const handleListTypeChange = (newListType: DiscoveryListType) => {
    setListType(newListType);
    fetch_.setNextCursor(null);
    doFetch(newListType, filters, queryText, false);
  };
  const handleQuickChip = (chipId: QuickChipId) => {
    setFilters((prev) =>
      toggleQuickChip(prev, DEFAULT_DISCOVERY_FILTERS, chipId),
    );
    if (isFilterDrawerOpen) {
      setDraftFilters((prev) =>
        toggleQuickChip(prev, DEFAULT_DISCOVERY_FILTERS, chipId),
      );
    }
  };

  const handleSearchSubmit = (e: FormEvent) => { e.preventDefault(); handleDiscover(); };
  const removeActiveFilter = (key: string) => {
    if (key === "queryText") {
      setQueryText("");
      return;
    }
    const filterKey = key as keyof DiscoveryFilters;
    setFilters((p) => ({
      ...p,
      [filterKey]: DEFAULT_DISCOVERY_FILTERS[filterKey],
    }));
  };

  const openAllFilters = () => {
    setDraftFilters(filters); setDraftQueryText(queryText); setIsFilterDrawerOpen(true);
  };
  const applyAllFilters = () => {
    setIsFilterDrawerOpen(false);
    setFilters(draftFilters);
    setQueryText(draftQueryText);
    fetch_.setNextCursor(null);
    doFetch(listType, draftFilters, draftQueryText, false);
  };

  const resetAllInDrawer = () => { setDraftFilters(DEFAULT_DISCOVERY_FILTERS); setDraftQueryText(""); };
  const clearAll = () => {
    const cleared = clearAllDiscoveryState(DEFAULT_DISCOVERY_FILTERS);
    setFilters(cleared.filters);
    setQueryText(cleared.queryText);
    fetch_.setNextCursor(null);
  };

  const defaults = DEFAULT_DISCOVERY_FILTERS;
  const activeFilterCount = getActiveDiscoveryFilterCount(filters, defaults, queryText);
  const activeAdvancedKeys = getActiveAdvancedFilterKeys(filters, defaults, queryText);
  const visibleNiches = fetch_.niches.filter((n) => !dismissedNiches.has(n.id));

  return {
    listType,
    filters,
    queryText,
    setQueryText,
    niches: fetch_.niches,
    setNiches: fetch_.setNiches,
    isLoading: fetch_.isLoading,
    error: fetch_.error,
    hasMore: fetch_.hasMore,
    totalFound: fetch_.totalFound,
    hasSearched: fetch_.hasSearched,
    isFilterDrawerOpen,
    setIsFilterDrawerOpen,
    draftFilters,
    setDraftFilters,
    draftQueryText,
    setDraftQueryText,
    activeFilterCount,
    activeAdvancedKeys,
    showActiveFiltersRow: activeAdvancedKeys.length > 0,
    visibleNiches,
    handleDiscover,
    handleLoadMore,
    handleListTypeChange,
    handleQuickChip,
    handleSearchSubmit,
    removeActiveFilter,
    openAllFilters,
    applyAllFilters,
    resetAllInDrawer,
    clearAll,
  };
}

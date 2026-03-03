"use client";

import type { FormEvent } from "react";

import FilterDrawer from "@/components/FilterDrawer/FilterDrawer";

import s from "../style.module.css";
import type {
  DiscoveryFilters as DiscoveryFiltersType,
  DiscoveryListType,
} from "../types";
import type { QuickChipId } from "./discovery-utils";
import { DiscoveryFilterDrawerContent } from "./DiscoveryFilterDrawerContent";
import {
  ActiveFilterPills,
  DiscoverButton,
  FilterIcon,
  QuickChips,
} from "./DiscoveryFilterParts";
import { ListTypeTabs } from "./ListTypeTabs";

type Props = {
  listType: DiscoveryListType;
  filters: DiscoveryFiltersType;
  queryText: string;
  setQueryText: (text: string) => void;
  isLoading: boolean;
  activeFilterCount: number;
  activeAdvancedKeys: string[];
  showActiveFiltersRow: boolean;
  isFilterDrawerOpen: boolean;
  setIsFilterDrawerOpen: (open: boolean) => void;
  draftFilters: DiscoveryFiltersType;
  setDraftFilters: React.Dispatch<React.SetStateAction<DiscoveryFiltersType>>;
  draftQueryText: string;
  setDraftQueryText: (text: string) => void;
  onListTypeChange: (type: DiscoveryListType) => void;
  onQuickChip: (chipId: QuickChipId) => void;
  onSearchSubmit: (e: FormEvent) => void;
  onRemoveActiveFilter: (key: string) => void;
  onOpenAllFilters: () => void;
  onApplyAllFilters: () => void;
  onResetAllInDrawer: () => void;
  onClearAll: () => void;
};

export function DiscoveryFilters({
  listType,
  filters,
  queryText,
  setQueryText,
  isLoading,
  activeFilterCount,
  activeAdvancedKeys,
  showActiveFiltersRow,
  isFilterDrawerOpen,
  setIsFilterDrawerOpen,
  draftFilters,
  setDraftFilters,
  draftQueryText,
  setDraftQueryText,
  onListTypeChange,
  onQuickChip,
  onSearchSubmit,
  onRemoveActiveFilter,
  onOpenAllFilters,
  onApplyAllFilters,
  onResetAllInDrawer,
  onClearAll,
}: Props) {
  return (
    <>
      <ListTypeTabs listType={listType} onListTypeChange={onListTypeChange} />

      <form className={s.discoverySearchRow} onSubmit={onSearchSubmit}>
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
            placeholder='Optional: search around a niche (e.g., "budget travel", "espresso", "react")'
            autoComplete="off"
          />
        </div>

        <DiscoverButton isLoading={isLoading} />

        <button
          type="button"
          className={s.allFiltersBtn}
          onClick={onOpenAllFilters}
          aria-label="All filters"
        >
          <FilterIcon />
          All filters
          {activeFilterCount > 0 && (
            <span className={s.filtersBadge}>{activeFilterCount}</span>
          )}
        </button>
      </form>

      <QuickChips filters={filters} onQuickChip={onQuickChip} />

      {showActiveFiltersRow && (
        <ActiveFilterPills
          activeAdvancedKeys={activeAdvancedKeys}
          filters={filters}
          queryText={queryText}
          onRemove={onRemoveActiveFilter}
          onClearAll={onClearAll}
        />
      )}

      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        title="Discovery Filters"
        actionLabel="Apply"
        onAction={onApplyAllFilters}
        secondaryActionLabel="Reset"
        onSecondaryAction={onResetAllInDrawer}
      >
        <DiscoveryFilterDrawerContent
          draftFilters={draftFilters}
          setDraftFilters={setDraftFilters}
          draftQueryText={draftQueryText}
          setDraftQueryText={setDraftQueryText}
        />
      </FilterDrawer>
    </>
  );
}

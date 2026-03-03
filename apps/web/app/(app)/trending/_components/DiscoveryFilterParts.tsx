"use client";

import s from "../style.module.css";
import type { DiscoveryFilters } from "../types";
import {
  CATEGORY_OPTIONS,
  CHANNEL_AGE_LABELS,
  CHANNEL_SIZE_LABELS,
  SORT_OPTIONS,
} from "../types";
import type { QuickChipId } from "./discovery-utils";

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

export function DiscoverButton({ isLoading }: { isLoading: boolean }) {
  return (
    <button type="submit" className={s.discoverBtn} disabled={isLoading}>
      {isLoading ? (
        <>
          <span className={s.spinnerSmall} />
          Loading...
        </>
      ) : (
        <>
          <CompassButtonIcon />
          Discover
        </>
      )}
    </button>
  );
}

const svgProps = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, "aria-hidden": true as const };

function CompassButtonIcon() {
  return (
    <svg {...svgProps}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

export function FilterIcon() {
  return (
    <svg {...svgProps}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

const QUICK_CHIPS: { id: QuickChipId; label: string; isActive: (f: DiscoveryFilters) => boolean }[] = [
  { id: "fastGrowing", label: "Fast Growing", isActive: (f) => f.sortBy === "velocity" },
  { id: "breakout", label: "Breakout", isActive: (f) => f.sortBy === "breakout" },
  { id: "smallChannels", label: "Small Channels", isActive: (f) => f.channelSize === "small" },
  { id: "newChannels", label: "New Channels", isActive: (f) => f.channelAge === "new" },
  { id: "shorts", label: "Shorts", isActive: (f) => f.contentType === "shorts" },
];

export function QuickChips({
  filters,
  onQuickChip,
}: {
  filters: DiscoveryFilters;
  onQuickChip: (chipId: QuickChipId) => void;
}) {
  return (
    <div className={s.quickFilters} role="group" aria-label="Quick filters">
      {QUICK_CHIPS.map((chip) => (
        <button
          key={chip.id}
          type="button"
          className={`${s.quickFilterPill} ${chip.isActive(filters) ? s.quickFilterPillActive : ""}`}
          onClick={() => onQuickChip(chip.id)}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

export function ActiveFilterPills({
  activeAdvancedKeys,
  filters,
  queryText,
  onRemove,
  onClearAll,
}: {
  activeAdvancedKeys: string[];
  filters: DiscoveryFilters;
  queryText: string;
  onRemove: (key: string) => void;
  onClearAll: () => void;
}) {
  return (
    <div className={s.activeFiltersRow} aria-label="Active filters">
      <div className={s.activeFilterPills}>
        {activeAdvancedKeys.map((key) => (
          <button
            key={key}
            type="button"
            className={s.activeFilterPill}
            onClick={() => onRemove(key)}
            aria-label={`Remove ${key}`}
            title="Remove"
          >
            <span className={s.activeFilterPillLabel}>
              {getFilterPillLabel(key, filters, queryText)}
            </span>
            <span className={s.activeFilterPillX} aria-hidden="true">
              x
            </span>
          </button>
        ))}
      </div>
      <button type="button" className={s.clearAllBtn} onClick={onClearAll}>
        Clear all
      </button>
    </div>
  );
}

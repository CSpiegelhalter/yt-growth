import type { DiscoveryFilters } from "./types";

export type QuickChipId =
  | "fastGrowing"
  | "breakout"
  | "smallChannels"
  | "newChannels"
  | "shorts";

export function getActiveDiscoveryFilterCount(
  filters: DiscoveryFilters,
  defaults: DiscoveryFilters,
  queryText: string
): number {
  const diffs = [
    filters.channelSize !== defaults.channelSize,
    filters.channelAge !== defaults.channelAge,
    filters.contentType !== defaults.contentType,
    filters.timeWindow !== defaults.timeWindow,
    filters.minViewsPerDay !== defaults.minViewsPerDay,
    filters.category !== defaults.category,
    filters.sortBy !== defaults.sortBy,
    queryText.trim().length > 0,
  ];
  return diffs.filter(Boolean).length;
}

export function getActiveAdvancedFilterKeys(
  filters: DiscoveryFilters,
  defaults: DiscoveryFilters,
  queryText: string
): Array<
  | "queryText"
  | "category"
  | "timeWindow"
  | "minViewsPerDay"
  | "channelSize"
  | "channelAge"
  | "contentType"
  | "sortBy"
> {
  const keys: Array<
    | "queryText"
    | "category"
    | "timeWindow"
    | "minViewsPerDay"
    | "channelSize"
    | "channelAge"
    | "contentType"
    | "sortBy"
  > = [];

  // Only show pills for non-defaults (keeps summary compact)
  if (queryText.trim().length > 0) keys.push("queryText");
  if (filters.category !== defaults.category) keys.push("category");
  if (filters.timeWindow !== defaults.timeWindow) keys.push("timeWindow");
  if (filters.minViewsPerDay !== defaults.minViewsPerDay) keys.push("minViewsPerDay");
  if (filters.channelSize !== defaults.channelSize) keys.push("channelSize");
  if (filters.channelAge !== defaults.channelAge) keys.push("channelAge");
  if (filters.contentType !== defaults.contentType) keys.push("contentType");
  if (filters.sortBy !== defaults.sortBy) keys.push("sortBy");

  return keys;
}

export function toggleQuickChip(
  filters: DiscoveryFilters,
  defaults: DiscoveryFilters,
  chipId: QuickChipId
): DiscoveryFilters {
  switch (chipId) {
    case "fastGrowing":
      return { ...filters, sortBy: "velocity" };
    case "breakout":
      return {
        ...filters,
        sortBy: filters.sortBy === "breakout" ? defaults.sortBy : "breakout",
      };
    case "smallChannels":
      return {
        ...filters,
        channelSize: filters.channelSize === "small" ? defaults.channelSize : "small",
      };
    case "newChannels":
      return {
        ...filters,
        channelAge: filters.channelAge === "new" ? defaults.channelAge : "new",
      };
    case "shorts":
      return {
        ...filters,
        contentType: filters.contentType === "shorts" ? defaults.contentType : "shorts",
      };
  }
}

export function clearAllDiscoveryState(defaults: DiscoveryFilters) {
  return {
    filters: defaults,
    queryText: "",
  };
}

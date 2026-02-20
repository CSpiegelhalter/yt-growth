/**
 * Server-side navigation configuration helpers.
 *
 * This file contains async functions that filter nav items based on
 * feature flags. Import this only in server components or API routes.
 */

import "server-only";

import { getFeatureFlags, type FeatureFlagKey } from "./feature-flags";
import {
  primaryNavItems,
  secondaryNavItems,
  type NavItem,
} from "./nav-config";

/**
 * Serializable nav item for passing to client components.
 * Strips out the `match` function since functions can't be serialized.
 */
export type SerializableNavItem = Omit<NavItem, "match" | "featureFlag"> & {
  /** If item has a custom match pattern, encode it as a string identifier */
  matchPattern?: "dashboard" | "competitors" | "trending" | "tags" | "keywords";
};

/**
 * Get nav items filtered by feature flags.
 *
 * This is an async server-only function that:
 * 1. Fetches all relevant feature flags
 * 2. Filters out nav items whose feature flag is disabled
 * 3. Returns serializable nav items (without functions)
 *
 * @returns Object with filtered primary and secondary nav items
 */
export async function getFilteredNavItems(): Promise<{
  primary: SerializableNavItem[];
  secondary: SerializableNavItem[];
}> {
  // Collect all feature flags used by nav items
  const flagKeys = new Set<FeatureFlagKey>();
  for (const item of [...primaryNavItems, ...secondaryNavItems]) {
    if (item.featureFlag) {
      flagKeys.add(item.featureFlag);
    }
  }

  // Fetch flags in batch
  const flags =
    flagKeys.size > 0
      ? await getFeatureFlags([...flagKeys])
      : ({} as Record<FeatureFlagKey, boolean>);

  // Filter and serialize nav items
  const filterAndSerialize = (items: NavItem[]): SerializableNavItem[] =>
    items
      .filter((item) => {
        // If no feature flag, always include
        if (!item.featureFlag) return true;
        // Include only if flag is enabled
        return flags[item.featureFlag] === true;
      })
      .map((item) => {
        // Convert to serializable format
        const serializable: SerializableNavItem = {
          id: item.id,
          label: item.label,
          href: item.href,
          icon: item.icon,
          channelScoped: item.channelScoped,
        };

        // Encode match patterns as identifiers
        if (item.id === "dashboard") {
          serializable.matchPattern = "dashboard";
        } else if (item.id === "competitors") {
          serializable.matchPattern = "competitors";
        } else if (item.id === "trending") {
          serializable.matchPattern = "trending";
        } else if (item.id === "tags") {
          serializable.matchPattern = "tags";
        } else if (item.id === "keywords") {
          serializable.matchPattern = "keywords";
        }

        return serializable;
      });

  return {
    primary: filterAndSerialize(primaryNavItems),
    secondary: filterAndSerialize(secondaryNavItems),
  };
}


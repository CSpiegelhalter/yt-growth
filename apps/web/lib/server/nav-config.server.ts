/**
 * Server-side navigation configuration helpers.
 *
 * This file contains functions that serialize nav items for client components.
 * Import this only in server components or API routes.
 */

import "server-only";

import {
  type NavItem,
  primaryNavItems,
  secondaryNavItems,
} from "@/lib/shared/nav-config";

/**
 * Serializable nav item for passing to client components.
 * Strips out the `match` function since functions can't be serialized.
 */
export type SerializableNavItem = Omit<NavItem, "match"> & {
  /** If item has a custom match pattern, encode it as a string identifier */
  matchPattern?: "videos" | "tags" | "keywords";
};

/**
 * Get nav items serialized for client components.
 *
 * @returns Object with primary and secondary nav items
 */
export async function getFilteredNavItems(): Promise<{
  primary: SerializableNavItem[];
  secondary: SerializableNavItem[];
}> {
  const serialize = (items: NavItem[]): SerializableNavItem[] =>
    items.map((item) => {
      const serializable: SerializableNavItem = {
        id: item.id,
        label: item.label,
        href: item.href,
        icon: item.icon,
        channelScoped: item.channelScoped,
      };

      switch (item.id) {
      case "videos": {
        serializable.matchPattern = "videos";
        break;
      }
      case "tags": {
        serializable.matchPattern = "tags";
        break;
      }
      case "keywords": {
        serializable.matchPattern = "keywords";
        break;
      }
      // No default
      }

      return serializable;
    });

  return {
    primary: serialize(primaryNavItems),
    secondary: serialize(secondaryNavItems),
  };
}

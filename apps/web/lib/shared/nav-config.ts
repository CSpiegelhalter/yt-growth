/**
 * Centralized navigation configuration for the app shell.
 * All nav items, their routes, icons, and matching logic are defined here.
 *
 * Some nav items are gated behind feature flags. Use the async
 * `getFilteredNavItems()` function to get nav items with feature-gated
 * items filtered out.
 */

import type { FeatureFlagKey } from "@/lib/shared/feature-flags";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: NavIconType;
  /** If true, this item requires channel context (channelId query param) */
  channelScoped?: boolean;
  /** Custom match function for highlighting active state */
  match?: (pathname: string) => boolean;
  /** Feature flag that must be enabled for this item to appear */
  featureFlag?: FeatureFlagKey;
};

export type NavIconType =
  | "video"
  | "lightbulb"
  | "target"
  | "trending"
  | "trophy"
  | "tag"
  | "bookmark"
  | "book"
  | "user"
  | "settings"
  | "mail"
  | "logout"
  | "home"
  | "channel"
  | "image"
  | "search";

/**
 * Primary navigation items - shown prominently in sidebar/top nav
 *
 * Note: Items with a `featureFlag` property will be filtered out
 * when that flag is disabled. Use `getFilteredNavItems()` for the
 * filtered list.
 */
export const primaryNavItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Videos",
    href: "/dashboard",
    icon: "video",
    channelScoped: true,
    match: (pathname) =>
      pathname === "/dashboard" || pathname.startsWith("/video/"),
  },
  {
    id: "ideas",
    label: "Ideas",
    href: "/ideas",
    icon: "lightbulb",
    channelScoped: true,
  },
  {
    id: "goals",
    label: "Goals",
    href: "/goals",
    icon: "target",
    channelScoped: true,
  },
  {
    id: "competitors",
    label: "Competitors",
    href: "/competitors",
    icon: "trophy",
    channelScoped: true,
    match: (pathname) =>
      pathname === "/competitors" || pathname.startsWith("/competitors/"),
  },
  {
    id: "trending",
    label: "Trending",
    href: "/trending",
    icon: "trending",
    channelScoped: true,
    featureFlag: "trending_search", // Gated behind feature flag
  },
  {
    id: "thumbnails",
    label: "Thumbnails",
    href: "/thumbnails",
    icon: "image",
    channelScoped: false,
    featureFlag: "thumbnail_generation", // Gated behind feature flag
  },
  {
    id: "tags",
    label: "Tags",
    href: "/tags",
    icon: "tag",
    channelScoped: false,
    match: (pathname) => pathname === "/tags" || pathname.startsWith("/tags/"),
  },
  {
    id: "keywords",
    label: "Keywords",
    href: "/keywords",
    icon: "search",
    channelScoped: false,
    match: (pathname) =>
      pathname === "/keywords" || pathname.startsWith("/keywords/"),
  },
];

/**
 * Secondary navigation items - shown in a separate section (tools/resources)
 */
export const secondaryNavItems: NavItem[] = [
  {
    id: "channel-profile",
    label: "Channel Profile",
    href: "/channel-profile",
    icon: "channel",
    channelScoped: true,
  },
  {
    id: "saved-ideas",
    label: "Saved Ideas",
    href: "/saved-ideas",
    icon: "bookmark",
    channelScoped: false,
  },
  {
    id: "learn",
    label: "Learn",
    href: "/learn",
    icon: "book",
    channelScoped: false,
  },
];

/**
 * Account/user menu items - shown in user dropdown
 */
export const accountNavItems: NavItem[] = [
  {
    id: "profile",
    label: "Profile & Billing",
    href: "/profile",
    icon: "user",
    channelScoped: false,
  },
  {
    id: "contact",
    label: "Contact Support",
    href: "/contact",
    icon: "mail",
    channelScoped: false,
  },
];

/**
 * Check if a given pathname matches a nav item
 */
function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.match) {
    return item.match(pathname);
  }
  return pathname === item.href;
}

/**
 * Get the href with optional channelId query param
 */
export function getNavHref(
  item: NavItem,
  activeChannelId: string | null,
): string {
  if (!item.channelScoped || !activeChannelId) {
    return item.href;
  }
  return `${item.href}?channelId=${activeChannelId}`;
}

/**
 * Get page title from current pathname
 */
export function getPageTitle(pathname: string): string {
  const allItems = [
    ...primaryNavItems,
    ...secondaryNavItems,
    ...accountNavItems,
  ];

  // Check for exact or custom match
  for (const item of allItems) {
    if (isNavItemActive(item, pathname)) {
      return item.label;
    }
  }

  // Fallback titles for nested routes
  if (pathname.startsWith("/video/")) {
    return "Video Insights";
  }
  if (pathname.startsWith("/competitors/video/")) {
    return "Competitor Video";
  }
  if (pathname.startsWith("/learn/")) {
    return "Learn";
  }
  if (pathname.startsWith("/admin/")) {
    return "Admin";
  }
  if (pathname === "/tags/generator") {
    return "Tag Generator";
  }
  if (pathname === "/tags/extractor") {
    return "Tag Finder";
  }
  if (pathname.startsWith("/tags")) {
    return "Tags";
  }
  if (pathname === "/keywords/overview") {
    return "Keyword Overview";
  }
  if (pathname === "/keywords/ideas") {
    return "Keyword Ideas";
  }
  if (pathname.startsWith("/keywords")) {
    return "Keywords";
  }

  return "Dashboard";
}

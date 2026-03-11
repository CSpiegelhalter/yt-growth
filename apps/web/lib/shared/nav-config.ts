/**
 * Centralized navigation configuration for the app shell.
 * All nav items, their routes, icons, and matching logic are defined here.
 *
 * Some nav items are gated behind feature flags. Use the async
 * `getFilteredNavItems()` function to get nav items with feature-gated
 * items filtered out.
 */

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: NavIconType;
  /** If true, this item requires channel context (channelId query param) */
  channelScoped?: boolean;
  /** Custom match function for highlighting active state */
  match?: (pathname: string) => boolean;
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
 */
export const primaryNavItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: "home",
    channelScoped: true,
  },
  {
    id: "videos",
    label: "Videos",
    href: "/videos",
    icon: "video",
    channelScoped: true,
    match: (pathname) =>
      pathname === "/videos" || pathname.startsWith("/video/"),
  },
  {
    id: "analyzer",
    label: "Analyzer",
    href: "/analyze",
    icon: "search",
    channelScoped: false,
    match: (pathname) => pathname === "/analyze",
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
  {
    id: "profile",
    label: "Channel Profile",
    href: "/channel-profile",
    icon: "user",
    channelScoped: true,
  },
];

/**
 * Secondary navigation items - shown in a separate section (tools/resources)
 */
export const secondaryNavItems: NavItem[] = [];

/**
 * Account/user menu items - shown in user dropdown
 */
export const accountNavItems: NavItem[] = [
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
  if (pathname.startsWith("/learn/")) {
    return "Learn";
  }
  if (pathname.startsWith("/admin/")) {
    return "Admin";
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

  return "Videos";
}

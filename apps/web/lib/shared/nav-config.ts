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
 * Sidebar bottom items - shown at the bottom of the sidebar, visually
 * separated from the primary navigation.
 */
export const sidebarBottomItems: NavItem[] = [
  {
    id: "sidebar-account",
    label: "Account",
    href: "/account",
    icon: "user",
    channelScoped: false,
  },
];

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


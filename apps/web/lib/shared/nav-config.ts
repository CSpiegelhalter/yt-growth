/**
 * Centralized navigation configuration for the app shell.
 * All nav items, their routes, icons, and matching logic are defined here.
 *
 * Guest-accessible items are shown to unauthenticated users in the
 * guest sidebar variant. All other items require authentication.
 */

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: NavIconType;
  /** If true, this item requires channel context (channelId query param) */
  channelScoped?: boolean;
  /** If true, this item is accessible to unauthenticated guests */
  guestAccessible?: boolean;
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
    guestAccessible: true,
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
    guestAccessible: true,
    match: (pathname) =>
      pathname === "/analyze" || pathname.startsWith("/analyze/"),
  },
  {
    id: "trending",
    label: "Trending",
    href: "/trending",
    icon: "trending",
    channelScoped: false,
    guestAccessible: true,
    match: (pathname) =>
      pathname === "/trending" || pathname.startsWith("/trending/"),
  },
  {
    id: "keywords",
    label: "Keywords",
    href: "/keywords",
    icon: "tag",
    channelScoped: false,
    guestAccessible: true,
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

/**
 * Centralized navigation configuration for the app shell.
 * All nav items, their routes, icons, and matching logic are defined here.
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
  | "image";

/**
 * Primary navigation items - shown prominently in sidebar/top nav
 */
export const primaryNavItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Videos",
    href: "/dashboard",
    icon: "video",
    channelScoped: true,
    match: (pathname) => pathname === "/dashboard" || pathname.startsWith("/video/"),
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
    id: "subscriber-insights",
    label: "Subscribers",
    href: "/subscriber-insights",
    icon: "trending",
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
  // TODO: Add thumbnails back in when we have a way to generate them
  // {
  //   id: "thumbnails",
  //   label: "Thumbnails",
  //   href: "/thumbnails",
  //   icon: "image",
  //   channelScoped: false,
  // },
  {
    id: "tag-generator",
    label: "Tags",
    href: "/tag-generator",
    icon: "tag",
    channelScoped: false,
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
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (item.match) {
    return item.match(pathname);
  }
  return pathname === item.href;
}

/**
 * Get the href with optional channelId query param
 */
export function getNavHref(item: NavItem, activeChannelId: string | null): string {
  if (!item.channelScoped || !activeChannelId) {
    return item.href;
  }
  return `${item.href}?channelId=${activeChannelId}`;
}

/**
 * Get page title from current pathname
 */
export function getPageTitle(pathname: string): string {
  const allItems = [...primaryNavItems, ...secondaryNavItems, ...accountNavItems];
  
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
  
  return "Dashboard";
}

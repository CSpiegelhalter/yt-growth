import type { SerializableNavItem } from "@/lib/server/nav-config.server";

const SIDEBAR_ICON_MAP: Record<string, string> = {
  dashboard: "/sidebar/dashboard.svg",
  videos: "/sidebar/videos.svg",
  analyzer: "/sidebar/analyze.svg",
  trending: "/sidebar/trending.svg",
  keywords: "/sidebar/keywords.svg",
  "sidebar-account": "/sidebar/settings.svg",
};

export function getNavIconSrc(itemId: string): string | null {
  return SIDEBAR_ICON_MAP[itemId] ?? null;
}

export function isNavItemActive(
  item: SerializableNavItem,
  pathname: string,
): boolean {
  switch (item.matchPattern) {
    case "videos": {
      return pathname === "/videos" || pathname.startsWith("/video/");
    }
    case "trending": {
      return pathname === "/trending" || pathname.startsWith("/trending/");
    }
    case "analyzer": {
      return pathname === "/analyze" || pathname.startsWith("/analyze/");
    }
    case "keywords": {
      return pathname === "/keywords" || pathname.startsWith("/keywords/");
    }
    default: {
      return pathname === item.href;
    }
  }
}

import type { SerializableNavItem } from "@/lib/server/nav-config.server";

const SIDEBAR_ICON_MAP: Record<string, string> = {
  dashboard: "/sidebar/dashboard.svg",
  videos: "/sidebar/videos.svg",
  analyzer: "/sidebar/analyze.svg",
  tags: "/sidebar/tags.svg",
  keywords: "/sidebar/keywords.svg",
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
    case "tags": {
      return pathname === "/tags" || pathname.startsWith("/tags/");
    }
    case "keywords": {
      return pathname === "/keywords" || pathname.startsWith("/keywords/");
    }
    default: {
      return pathname === item.href;
    }
  }
}

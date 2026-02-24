import type { SerializableNavItem } from "@/lib/server/nav-config.server";

const SIDEBAR_ICON_MAP: Record<string, string> = {
  videos: "/sidebar/videos.svg",
  ideas: "/sidebar/ideas.svg",
  goals: "/sidebar/goals.svg",
  competitors: "/sidebar/competitors.svg",
  tags: "/sidebar/tags.svg",
  keywords: "/sidebar/keywords.svg",
  "channel-profile": "/sidebar/channel_profile.svg",
  "saved-ideas": "/sidebar/saved_ideas.svg",
  learn: "/sidebar/learn.svg",
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
    case "competitors": {
      return (
        pathname === "/competitors" || pathname.startsWith("/competitors/")
      );
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

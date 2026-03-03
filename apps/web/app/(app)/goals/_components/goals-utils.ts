import type {
  BadgeCategory,
  BadgeRarity,
  BadgeSortKey,
  BadgeWithProgress,
  GoalWithProgress,
} from "@/lib/features/badges";
import {
  sortBadgesByClosest,
  sortBadgesByRarity,
  sortBadgesByRecent,
} from "@/lib/features/badges";

export function filterAndSortBadges(
  badges: BadgeWithProgress[],
  categoryFilter: BadgeCategory | "all",
  rarityFilter: BadgeRarity | "all",
  searchQuery: string,
  sortKey: BadgeSortKey,
): BadgeWithProgress[] {
  if (badges.length === 0) {
    return [];
  }

  let filtered = [...badges];

  if (categoryFilter !== "all") {
    filtered = filtered.filter((b) => b.category === categoryFilter);
  }

  if (rarityFilter !== "all") {
    filtered = filtered.filter((b) => b.rarity === rarityFilter);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q),
    );
  }

  switch (sortKey) {
    case "closest": {
      return sortBadgesByClosest(filtered);
    }
    case "recent": {
      return sortBadgesByRecent(filtered);
    }
    case "rarity": {
      return sortBadgesByRarity(filtered);
    }
    case "alphabetical": {
      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    default: {
      return filtered;
    }
  }
}

export function groupGoalsByCategory(
  goals: GoalWithProgress[],
): Record<string, GoalWithProgress[]> {
  if (goals.length === 0) {
    return {};
  }
  const grouped: Record<string, GoalWithProgress[]> = {};
  for (const goal of goals) {
    if (!grouped[goal.category]) {
      grouped[goal.category] = [];
    }
    grouped[goal.category].push(goal);
  }
  return grouped;
}

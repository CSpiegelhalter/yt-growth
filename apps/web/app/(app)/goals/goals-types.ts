import type {
  BadgeCategory,
  BadgeRarity,
  BadgesApiResponse,
  BadgeSortKey,
  BadgeWithProgress,
  GoalWithProgress,
} from "@/lib/features/badges";
import type { Channel } from "@/types/api";

export type GoalsClientProps = {
  initialChannels: Channel[];
  initialActiveChannelId: string | null;
};

export type GoalsDataContentProps = {
  data: BadgesApiResponse;
  filteredBadges: BadgeWithProgress[];
  goalsByCategory: Record<string, GoalWithProgress[]>;
  newBadgeCount: number;
  categoryFilter: BadgeCategory | "all";
  rarityFilter: BadgeRarity | "all";
  sortKey: BadgeSortKey;
  searchQuery: string;
  onCategoryFilter: (v: BadgeCategory | "all") => void;
  onRarityFilter: (v: BadgeRarity | "all") => void;
  onSortKey: (v: BadgeSortKey) => void;
  onSearchQuery: (v: string) => void;
  onBadgeClick: (badge: BadgeWithProgress) => void;
};

export type BadgesSummaryProps = {
  data: BadgesApiResponse;
  onBadgeClick: (badge: BadgeWithProgress) => void;
};

export type BadgeGalleryProps = {
  filteredBadges: BadgeWithProgress[];
  newBadgeCount: number;
  categoryFilter: BadgeCategory | "all";
  rarityFilter: BadgeRarity | "all";
  sortKey: BadgeSortKey;
  searchQuery: string;
  onCategoryFilter: (v: BadgeCategory | "all") => void;
  onRarityFilter: (v: BadgeRarity | "all") => void;
  onSortKey: (v: BadgeSortKey) => void;
  onSearchQuery: (v: string) => void;
  onBadgeClick: (badge: BadgeWithProgress) => void;
};

export type BadgeCardProps = {
  badge: BadgeWithProgress;
  onBadgeClick: (badge: BadgeWithProgress) => void;
};

export type GoalCardProps = {
  goal: GoalWithProgress;
  badges: BadgeWithProgress[];
};

export type GoalsSectionProps = {
  goalsByCategory: Record<string, GoalWithProgress[]>;
  badges: BadgeWithProgress[];
};

export type RecentUnlocksSectionProps = {
  data: BadgesApiResponse;
  onBadgeClick: (badge: BadgeWithProgress) => void;
};

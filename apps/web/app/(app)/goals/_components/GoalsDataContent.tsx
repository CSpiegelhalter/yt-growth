import type { GoalsDataContentProps } from "../goals-types";
import { BadgeGallery } from "./BadgeGallery";
import { BadgesSummary } from "./BadgesSummary";
import { GoalsSection } from "./GoalsSection";
import { RecentUnlocksSection } from "./RecentUnlocksSection";

export function GoalsDataContent({
  data,
  filteredBadges,
  goalsByCategory,
  newBadgeCount,
  categoryFilter,
  rarityFilter,
  sortKey,
  searchQuery,
  onCategoryFilter,
  onRarityFilter,
  onSortKey,
  onSearchQuery,
  onBadgeClick,
}: GoalsDataContentProps) {
  return (
    <>
      <BadgesSummary data={data} onBadgeClick={onBadgeClick} />

      <BadgeGallery
        filteredBadges={filteredBadges}
        newBadgeCount={newBadgeCount}
        categoryFilter={categoryFilter}
        rarityFilter={rarityFilter}
        sortKey={sortKey}
        searchQuery={searchQuery}
        onCategoryFilter={onCategoryFilter}
        onRarityFilter={onRarityFilter}
        onSortKey={onSortKey}
        onSearchQuery={onSearchQuery}
        onBadgeClick={onBadgeClick}
      />

      <GoalsSection goalsByCategory={goalsByCategory} badges={data.badges} />

      <RecentUnlocksSection data={data} onBadgeClick={onBadgeClick} />
    </>
  );
}

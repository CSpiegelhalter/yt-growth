import type { BadgeCategory, BadgeRarity, BadgeSortKey } from "@/lib/features/badges";
import {
  BADGE_CATEGORIES,
  BADGE_RARITIES,
} from "@/lib/features/badges";

import type { BadgeGalleryProps } from "../goals-types";
import s from "../style.module.css";
import { BadgeCard } from "./BadgeCard";

export function BadgeGallery({
  filteredBadges,
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
}: BadgeGalleryProps) {
  return (
    <section className={s.gallerySection}>
      <div className={s.galleryHeader}>
        <h2 className={s.sectionTitle}>
          Badge Gallery
          {newBadgeCount > 0 && (
            <span className={s.newCount}>{newBadgeCount} new</span>
          )}
        </h2>
      </div>

      <div className={s.filtersRow}>
        <div className={s.filterGroup}>
          <label className={s.filterLabel} htmlFor="filter-category">Category</label>
          <select
            id="filter-category"
            className={s.filterSelect}
            value={categoryFilter}
            onChange={(e) => onCategoryFilter(e.target.value as BadgeCategory | "all")}
          >
            {BADGE_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>
        <div className={s.filterGroup}>
          <label className={s.filterLabel} htmlFor="filter-rarity">Rarity</label>
          <select
            id="filter-rarity"
            className={s.filterSelect}
            value={rarityFilter}
            onChange={(e) => onRarityFilter(e.target.value as BadgeRarity | "all")}
          >
            {BADGE_RARITIES.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>
        <div className={s.filterGroup}>
          <label className={s.filterLabel} htmlFor="filter-sort">Sort</label>
          <select
            id="filter-sort"
            className={s.filterSelect}
            value={sortKey}
            onChange={(e) => onSortKey(e.target.value as BadgeSortKey)}
          >
            <option value="closest">Closest to Unlock</option>
            <option value="recent">Recently Unlocked</option>
            <option value="rarity">By Rarity</option>
            <option value="alphabetical">A-Z</option>
          </select>
        </div>
        <div className={`${s.filterGroup} ${s.searchGroup}`}>
          <label className={s.filterLabel} htmlFor="filter-search">Search</label>
          <input
            id="filter-search"
            type="text"
            className={s.searchInput}
            placeholder="Search badges..."
            value={searchQuery}
            onChange={(e) => onSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={s.badgeGrid} role="list">
        {filteredBadges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} onBadgeClick={onBadgeClick} />
        ))}
      </div>

      {filteredBadges.length === 0 && (
        <div className={s.noResults}>
          <p>No badges match your filters</p>
          <button
            className={s.resetBtn}
            onClick={() => {
              onCategoryFilter("all");
              onRarityFilter("all");
              onSearchQuery("");
            }}
          >
            Reset filters
          </button>
        </div>
      )}
    </section>
  );
}

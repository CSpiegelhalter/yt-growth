"use client";

import { useSearchParams } from "next/navigation";

import { ProfileTip } from "@/components/dashboard/ProfileTip";
import { LockedFeatureGate } from "@/components/features/LockedFeatureGate";
import { CompassIcon } from "@/components/icons";
import { PageContainer, PageHeader } from "@/components/ui";
import { useSyncActiveChannelIdToLocalStorage } from "@/lib/use-sync-active-channel";
import type { Me } from "@/types/api";

import { DiscoveryFilters } from "./_components/DiscoveryFilters";
import { DiscoveryResults } from "./_components/DiscoveryResults";
import { useDiscoverySearch } from "./_components/useDiscoverySearch";
import { useSavedNiches } from "./_components/useSavedNiches";
import s from "./style.module.css";
import type { DiscoveredNiche } from "./types";

type Props = {
  initialMe: Me;
  initialActiveChannelId: string | null;
};

/**
 * TrendingClient - Trending search experience
 *
 * Allows users to discover trending niches across multiple dimensions:
 * - Channel size, age, content type, category, and sorting
 */
export default function TrendingClient({
  initialMe,
  initialActiveChannelId,
}: Props) {
  const searchParams = useSearchParams();
  const urlChannelId = searchParams.get("channelId");
  const activeChannelId = urlChannelId ?? initialActiveChannelId ?? null;
  const isSubscribed = initialMe.subscription?.isActive ?? false;

  useSyncActiveChannelIdToLocalStorage(activeChannelId);

  const { savedNiches, dismissedNiches, handleSave, handleDismiss } =
    useSavedNiches();

  const search = useDiscoverySearch(dismissedNiches);

  const handleSearchNiche = (niche: DiscoveredNiche) => {
    const params = new URLSearchParams();
    if (activeChannelId) {
      params.set("channelId", activeChannelId);
    }
    params.set("niche", niche.nicheLabel);
    window.location.href = `/competitors?${params.toString()}`;
  };

  const handleDismissAndRemove = (niche: DiscoveredNiche) => {
    handleDismiss(niche);
    search.setNiches((prev) => prev.filter((n) => n.id !== niche.id));
  };

  if (!isSubscribed) {
    return (
      <LockedFeatureGate
        pageTitle="Trending Search"
        pageSubtitle="Discover trending niches and rising videos"
        icon={<CompassIcon size={48} strokeWidth={1.5} />}
        unlockTitle="Unlock Trending Search"
        unlockDesc="Discover rising niches, breakout videos, and emerging opportunities. Filter by channel size, content type, and more to find your next hit."
        styles={s}
      />
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Trending Search"
        subtitle="Discover trending niches and rising videos that match your goals"
      />

      <ProfileTip channelId={activeChannelId} />

      <div className={s.discoveryHeader}>
        <div className={s.discoveryHeaderText}>
          <p className={s.discoveryIntroText}>
            Discover trending niches and rising videos. Filter by channel size,
            age, category, and more to find opportunities that match your goals.
          </p>
        </div>
      </div>

      <DiscoveryFilters
        listType={search.listType}
        filters={search.filters}
        queryText={search.queryText}
        setQueryText={search.setQueryText}
        isLoading={search.isLoading}
        activeFilterCount={search.activeFilterCount}
        activeAdvancedKeys={search.activeAdvancedKeys}
        showActiveFiltersRow={search.showActiveFiltersRow}
        isFilterDrawerOpen={search.isFilterDrawerOpen}
        setIsFilterDrawerOpen={search.setIsFilterDrawerOpen}
        draftFilters={search.draftFilters}
        setDraftFilters={search.setDraftFilters}
        draftQueryText={search.draftQueryText}
        setDraftQueryText={search.setDraftQueryText}
        onListTypeChange={search.handleListTypeChange}
        onQuickChip={search.handleQuickChip}
        onSearchSubmit={search.handleSearchSubmit}
        onRemoveActiveFilter={search.removeActiveFilter}
        onOpenAllFilters={search.openAllFilters}
        onApplyAllFilters={search.applyAllFilters}
        onResetAllInDrawer={search.resetAllInDrawer}
        onClearAll={search.clearAll}
      />

      <DiscoveryResults
        error={search.error}
        isLoading={search.isLoading}
        hasSearched={search.hasSearched}
        visibleNiches={search.visibleNiches}
        totalFound={search.totalFound}
        hasMore={search.hasMore}
        savedNiches={savedNiches}
        onRetry={search.handleDiscover}
        onSearchNiche={handleSearchNiche}
        onSave={handleSave}
        onDismiss={handleDismissAndRemove}
        onLoadMore={search.handleLoadMore}
        onClearAll={search.clearAll}
      />
    </PageContainer>
  );
}

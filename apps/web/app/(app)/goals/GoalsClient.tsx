"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { ErrorBanner, PageContainer, PageHeader } from "@/components/ui";
import type {
  BadgeCategory,
  BadgeRarity,
  BadgesApiResponse,
  BadgeSortKey,
} from "@/lib/features/badges";
import { useAsync } from "@/lib/hooks/use-async";
import { useSyncActiveChannelIdToLocalStorage } from "@/lib/use-sync-active-channel";

import BadgeDetailModal from "./_components/BadgeDetailModal";
import { filterAndSortBadges, groupGoalsByCategory } from "./_components/goals-utils";
import { GoalsDataContent } from "./_components/GoalsDataContent";
import { NoChannelState } from "./_components/NoChannelState";
import { useBadgeActions } from "./_components/use-badge-actions";
import type { GoalsClientProps } from "./goals-types";
import s from "./style.module.css";

export function GoalsClient({
  initialChannels,
  initialActiveChannelId,
}: GoalsClientProps) {
  const searchParams = useSearchParams();
  const urlChannelId = searchParams.get("channelId");
  const [activeChannelId] = useState<string | null>(urlChannelId ?? initialActiveChannelId);

  useSyncActiveChannelIdToLocalStorage(activeChannelId);

  // Local badge data state for optimistic mutations (mark-as-seen)
  const [badgeData, setBadgeData] = useState<BadgesApiResponse | null>(null);

  const { loading, error, clearError } = useAsync<BadgesApiResponse>(
    async () => {
      if (!activeChannelId) {
        throw new Error("No channel selected");
      }
      const res = await fetch(`/api/me/badges?channelId=${activeChannelId}`);
      if (!res.ok) {
        throw new Error("Failed to load badges");
      }
      return res.json();
    },
    {
      immediate: Boolean(activeChannelId),
      onSuccess: (result) => setBadgeData(result),
    },
  );

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<BadgeCategory | "all">("all");
  const [rarityFilter, setRarityFilter] = useState<BadgeRarity | "all">("all");
  const [sortKey, setSortKey] = useState<BadgeSortKey>("closest");
  const [searchQuery, setSearchQuery] = useState("");

  const { selectedBadge, handleBadgeClick, closeModal } = useBadgeActions(
    activeChannelId,
    setBadgeData,
  );

  const activeChannel = initialChannels.find((c) => c.channel_id === activeChannelId);

  const filteredBadges = filterAndSortBadges(
    badgeData?.badges ?? [],
    categoryFilter,
    rarityFilter,
    searchQuery,
    sortKey,
  );

  const goalsByCategory = groupGoalsByCategory(badgeData?.goals ?? []);

  const newBadgeCount = badgeData?.badges
    ? badgeData.badges.filter((b) => b.unlocked && !b.seen).length
    : 0;

  if (!activeChannelId || !activeChannel) {
    return <NoChannelState />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Badge Collection"
        subtitle={
          activeChannel ? (
            <>Collecting badges for <strong>{activeChannel.title}</strong></>
          ) : (
            "Collect badges as you grow your channel."
          )
        }
      />

      {error && (
        <ErrorBanner message={error} dismissible onDismiss={clearError} />
      )}

      {loading && <div className={s.loading}>Loading badges...</div>}

      {!loading && badgeData && (
        <GoalsDataContent
          data={badgeData}
          filteredBadges={filteredBadges}
          goalsByCategory={goalsByCategory}
          newBadgeCount={newBadgeCount}
          categoryFilter={categoryFilter}
          rarityFilter={rarityFilter}
          sortKey={sortKey}
          searchQuery={searchQuery}
          onCategoryFilter={setCategoryFilter}
          onRarityFilter={setRarityFilter}
          onSortKey={setSortKey}
          onSearchQuery={setSearchQuery}
          onBadgeClick={handleBadgeClick}
        />
      )}

      <BadgeDetailModal badge={selectedBadge} onClose={closeModal} />
    </PageContainer>
  );
}

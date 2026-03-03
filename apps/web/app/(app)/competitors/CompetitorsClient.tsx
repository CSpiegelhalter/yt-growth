"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { ProfileTip } from "@/components/dashboard/ProfileTip";
import { LockedFeatureGate } from "@/components/features/LockedFeatureGate";
import { SearchIcon } from "@/components/icons";
import { ErrorBanner, PageContainer, PageHeader } from "@/components/ui";
import { useSyncActiveChannelIdToLocalStorage } from "@/lib/use-sync-active-channel";
import type { Channel, Me } from "@/types/api";

import CompetitorFilters from "./_components/CompetitorFilters";
import CompetitorResultsStream from "./_components/CompetitorResultsStream";
import CompetitorSearchPanel from "./_components/CompetitorSearchPanel";
import { useCompetitorSearchState } from "./_components/use-competitor-search-state";
import s from "./style.module.css";

type Props = {
  initialMe: Me;
  initialChannels: Channel[];
  initialActiveChannelId: string | null;
};

/**
 * CompetitorsClient - Competitor search experience.
 * State is preserved in sessionStorage so back button works properly.
 */
export default function CompetitorsClient({
  initialMe,
  initialChannels,
  initialActiveChannelId,
}: Props) {
  const searchParams = useSearchParams();
  const urlChannelId = searchParams.get("channelId");
  const urlNiche = searchParams.get("niche");

  const [channels] = useState<Channel[]>(initialChannels);
  const activeChannelId = urlChannelId ?? initialActiveChannelId ?? null;
  const activeChannel =
    channels.find((c) => c.channel_id === activeChannelId) ?? null;
  const isSubscribed = initialMe.subscription?.isActive ?? false;

  useSyncActiveChannelIdToLocalStorage(activeChannelId);

  const {
    nicheText, referenceVideoUrl, filters, hasSearched,
    searchKey, isSearching, error, searchMode,
    cachedVideos, cachedNextCursor, scrollToVideoId,
    handleSearch, handleSearchMyNiche, handleFiltersChange,
    handleSearchComplete, handleResultsUpdate, handleCursorUpdate,
    handleVideoClick, handleError, dismissError,
  } = useCompetitorSearchState({ urlNiche });

  if (!isSubscribed) {
    return (
      <LockedFeatureGate
        pageTitle="Competitor Search"
        pageSubtitle="Find winning videos in any niche"
        icon={<SearchIcon size={48} strokeWidth={1.5} />}
        unlockTitle="Unlock Competitor Search"
        unlockDesc="Discover winning videos in any niche. Search by topic, analyze competitors' best content, and find proven ideas to remix."
        styles={s}
      />
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Competitor Search"
        subtitle="Find winning videos in any niche"
      />

      <ProfileTip channelId={activeChannelId} />

      <CompetitorSearchPanel
        mode="search"
        onSearch={handleSearch}
        onSearchMyNiche={handleSearchMyNiche}
        isSearching={isSearching}
        hasChannel={!!activeChannel}
        initialNicheText={nicheText}
        initialReferenceUrl={referenceVideoUrl}
      />

      {hasSearched && (
        <CompetitorFilters
          filters={filters}
          onChange={handleFiltersChange}
          disabled={isSearching}
        />
      )}

      {error && (
        <ErrorBanner message={error} dismissible onDismiss={dismissError} />
      )}

      {(searchKey || hasSearched) && (
        <CompetitorResultsStream
          searchKey={searchKey}
          mode={searchMode}
          nicheText={nicheText}
          referenceVideoUrl={referenceVideoUrl}
          channelId={activeChannelId}
          filters={filters}
          onSearchComplete={handleSearchComplete}
          onResultsUpdate={handleResultsUpdate}
          onCursorUpdate={handleCursorUpdate}
          onVideoClick={handleVideoClick}
          onError={handleError}
          initialVideos={cachedVideos}
          initialNextCursor={cachedNextCursor}
          scrollToVideoId={scrollToVideoId}
        />
      )}

      {!hasSearched && (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>
            <SearchIcon size={48} strokeWidth={1.5} />
          </div>
          <h2 className={s.emptyTitle}>Search Any Niche</h2>
          <p className={s.emptyDesc}>
            Describe a niche or paste a reference video URL to find competitors
            and winning content ideas.
          </p>
        </div>
      )}
    </PageContainer>
  );
}

"use client";

import { useSession } from "next-auth/react";

import { PageContainer, PageHeader } from "@/components/ui";

import { GuestCta } from "./_components/GuestCta";
import { OpportunityGapsHero } from "./_components/OpportunityGapsHero";
import { TrendingTicker } from "./_components/TrendingTicker";
import { useOpportunityGaps } from "./_components/useOpportunityGaps";
import { useYouTubeRising } from "./_components/useYouTubeRising";
import { YouTubeRising } from "./_components/YouTubeRising";

export default function TrendingCommandCenter() {
  const { data: session } = useSession();
  const isGuest = !session?.user;

  const gaps = useOpportunityGaps();
  const rising = useYouTubeRising();

  return (
    <PageContainer>
      <PageHeader
        title="Trending"
        subtitle="Discover trending topics, opportunity gaps, and rising videos to grow your channel"
      />

      {/* Zone 1: Trending Now Ticker */}
      <TrendingTicker />

      {/* Zone 2: YouTube Rising Videos */}
      <YouTubeRising videos={rising.videos} isLoading={rising.isLoading} />

      {/* Zone 3: Opportunity Gaps */}
      <OpportunityGapsHero
        opportunities={gaps.opportunities}
        teasers={gaps.teasers}
        newCount={gaps.newCount}
        onDismissNew={gaps.dismissNewBadge}
        isLoading={gaps.isLoading}
        isLoadingMore={gaps.isLoadingMore}
        hasMore={gaps.hasMore}
        cappedBy={gaps.cappedBy}
        tier={gaps.meta?.tier}
        updatedAt={gaps.meta?.updatedAt}
        loadMore={gaps.loadMore}
      />

      {/* Guest CTA */}
      {isGuest && <GuestCta />}
    </PageContainer>
  );
}

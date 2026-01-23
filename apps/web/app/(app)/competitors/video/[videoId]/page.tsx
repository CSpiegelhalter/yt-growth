import type { Metadata } from "next";
import { Suspense } from "react";
import { getAppBootstrap } from "@/lib/server/bootstrap";
import { BRAND } from "@/lib/brand";
import {
  ErrorState,
  VideoDetailShell,
  MoreFromChannel,
  fetchCompetitorVideoAnalysis,
} from "./_components";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ videoId: string }>;
  searchParams: Promise<{ channelId?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { videoId } = await params;
  return {
    title: `Competitor Video Analysis | ${BRAND.name}`,
    description: `Deep analysis of competitor video ${videoId} with actionable insights.`,
    robots: { index: false, follow: false },
  };
}

/**
 * CompetitorVideoDetailPage - Server component
 *
 * Fetches analysis server-side to eliminate client-side critical-path fetch.
 * Renders the shell with pre-loaded data for instant HTML delivery.
 */
export default async function CompetitorVideoDetailPage({
  params,
  searchParams,
}: Props) {
  const [{ videoId }, searchParamsResolved] = await Promise.all([
    params,
    searchParams,
  ]);

  const bootstrap = await getAppBootstrap({
    channelId: searchParamsResolved.channelId,
  });

  const activeChannelId = bootstrap.activeChannelId;

  // If no active channel, show error state (no fallback)
  if (!activeChannelId) {
    return (
      <ErrorState
        title="No channel selected"
        description="Please select a channel to analyze competitor videos."
      />
    );
  }

  // Fetch analysis server-side
  const result = await fetchCompetitorVideoAnalysis(videoId, activeChannelId);

  // If fetch failed, show error state
  if (!result.ok) {
    return (
      <ErrorState
        title={result.error}
        description="We couldn't analyze this competitor video."
        activeChannelId={activeChannelId}
      />
    );
  }

  const analysis = result.data;

  // Render the shell with pre-fetched data
  // MoreFromChannel is streamed via Suspense (non-blocking)
  return (
    <VideoDetailShell
      analysis={analysis}
      activeChannelId={activeChannelId}
      moreFromChannelSlot={
        <Suspense fallback={null}>
          <MoreFromChannel
            videoId={videoId}
            channelId={activeChannelId}
            channelTitle={analysis.video.channelTitle}
          />
        </Suspense>
      }
    />
  );
}

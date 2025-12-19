import type { Metadata } from "next";
import { getAppBootstrap } from "@/lib/server/bootstrap";
import VideoDetailClient from "./VideoDetailClient";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ videoId: string }>;
  searchParams: Promise<{ channelId?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { videoId } = await params;
  return {
    title: `Competitor Video Analysis | YT Growth`,
    description: `Deep analysis of competitor video ${videoId} with actionable insights.`,
    robots: { index: false, follow: false },
  };
}

/**
 * CompetitorVideoDetailPage - Server component
 * Fetches bootstrap data and passes to client.
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

  return (
    <VideoDetailClient
      videoId={videoId}
      channelId={bootstrap.activeChannelId ?? undefined}
      isSubscribed={bootstrap.me.subscription?.isActive ?? false}
    />
  );
}

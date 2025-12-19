import type { Metadata } from "next";
import VideoDetailClient from "./VideoDetailClient";

type Props = {
  params: { videoId: string };
  searchParams: { channelId?: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Competitor Video Analysis | YT Growth`,
    description: `Deep analysis of competitor video ${params.videoId} with actionable insights.`,
    robots: { index: false, follow: false },
  };
}

/**
 * CompetitorVideoDetailPage - Server component wrapper
 * Shows deep analysis for a specific competitor video.
 */
export default function CompetitorVideoDetailPage({
  params,
  searchParams,
}: Props) {
  return (
    <VideoDetailClient
      videoId={params.videoId}
      channelId={searchParams.channelId}
    />
  );
}


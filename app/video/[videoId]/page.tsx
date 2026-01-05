import type { Metadata } from "next";
import { getAppBootstrap } from "@/lib/server/bootstrap";
import { BRAND } from "@/lib/brand";
import VideoInsightsClientNoSSR from "./VideoInsightsClientNoSSR";

export const metadata: Metadata = {
  title: `Video Insights | ${BRAND.name}`,
  description:
    "Deep dive into your video's retention, subscriber conversion, and improvement suggestions",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ videoId: string }>;
  searchParams: Promise<{ channelId?: string; range?: string; from?: string }>;
};

/**
 * Video Insights Page - Server component
 * 
 * Renders immediately with skeleton, data is fetched client-side progressively:
 * - Phase 1: Analytics (fast, ~1-2s)
 * - Phase 2: AI Summary (single LLM, ~2-3s)
 * - Phase 3: Deep dives (lazy, on-demand)
 */
export default async function VideoPage({ params, searchParams }: Props) {
  const [{ videoId }, search] = await Promise.all([params, searchParams]);
  const range = (
    ["7d", "28d", "90d"].includes(search.range ?? "") ? search.range : "28d"
  ) as "7d" | "28d" | "90d";

  // Get bootstrap data (user, channels, active channel) - fast DB lookup only
  const bootstrap = await getAppBootstrap({ channelId: search.channelId });

  // Client handles all data fetching progressively
  return (
    <VideoInsightsClientNoSSR
      key={videoId}
      videoId={videoId}
      channelId={bootstrap.activeChannelId ?? undefined}
      initialRange={range}
      from={search.from}
    />
  );
}

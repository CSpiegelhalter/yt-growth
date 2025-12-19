import type { Metadata } from "next";
import { getAppBootstrap } from "@/lib/server/bootstrap";
import VideoInsightsClient from "./VideoInsightsClient";

export const metadata: Metadata = {
  title: "Video Insights | YT Growth",
  description:
    "Deep dive into your video's retention, subscriber conversion, and improvement suggestions",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ videoId: string }>;
  searchParams: Promise<{ channelId?: string; range?: string }>;
};

/**
 * Video Insights Page - Server component
 * Fetches bootstrap data and initial insights server-side
 */
export default async function VideoPage({ params, searchParams }: Props) {
  const [{ videoId }, search] = await Promise.all([params, searchParams]);
  const range = (["7d", "28d", "90d"].includes(search.range ?? "") ? search.range : "28d") as
    | "7d"
    | "28d"
    | "90d";

  // Get bootstrap data (user, channels, active channel)
  const bootstrap = await getAppBootstrap({ channelId: search.channelId });

  // Fetch initial insights server-side
  let initialInsights = null;
  if (bootstrap.activeChannelId) {
    try {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const res = await fetch(
        `${baseUrl}/api/me/channels/${bootstrap.activeChannelId}/videos/${videoId}/insights?range=${range}`,
        {
          headers: {
            Cookie: "", // Server-side doesn't have cookies, but we're making internal call
          },
          cache: "no-store",
        }
      );
      if (res.ok) {
        initialInsights = await res.json();
      }
    } catch (err) {
      console.error("Failed to fetch initial insights:", err);
    }
  }

  return (
    <VideoInsightsClient
      videoId={videoId}
      channelId={bootstrap.activeChannelId ?? undefined}
      initialInsights={initialInsights}
      initialRange={range}
    />
  );
}

import type { Metadata } from "next";
import { getAppBootstrap } from "@/lib/server/bootstrap";
import { BRAND } from "@/lib/brand";
import nextDynamic from "next/dynamic";
import { cookies } from "next/headers";

const VideoInsightsClient = nextDynamic(() => import("./VideoInsightsClient"), {
  ssr: false,
});

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
 * Fetches bootstrap data and initial insights server-side
 */
export default async function VideoPage({ params, searchParams }: Props) {
  const [{ videoId }, search] = await Promise.all([params, searchParams]);
  const range = (
    ["7d", "28d", "90d"].includes(search.range ?? "") ? search.range : "28d"
  ) as "7d" | "28d" | "90d";

  // Get bootstrap data (user, channels, active channel)
  const bootstrap = await getAppBootstrap({ channelId: search.channelId });

  // Fetch initial insights server-side
  let initialInsights = null;
  if (bootstrap.activeChannelId) {
    try {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const cookieStore = await cookies();
      const cookieHeader = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");
      const res = await fetch(
        `${baseUrl}/api/me/channels/${bootstrap.activeChannelId}/videos/${videoId}/insights?range=${range}`,
        {
          headers: {
            // Forward auth cookies so the route runs as the current user.
            ...(cookieHeader ? { Cookie: cookieHeader } : {}),
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
      key={videoId}
      videoId={videoId}
      channelId={bootstrap.activeChannelId ?? undefined}
      initialInsights={initialInsights}
      initialRange={range}
      from={search.from}
    />
  );
}

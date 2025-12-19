import type { Metadata } from "next";
import { getAppBootstrap } from "@/lib/server/bootstrap";
import TrendingClient from "./TrendingClient";

export const metadata: Metadata = {
  title: "Trending | YT Growth",
  description: "Discover what's taking off in your niche right now",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ channelId?: string }>;
};

/**
 * Trending Page - Server component
 * Fetches bootstrap data and passes to client.
 */
export default async function TrendingPage({ searchParams }: Props) {
  const params = await searchParams;
  const bootstrap = await getAppBootstrap({ channelId: params.channelId });

  return (
    <TrendingClient
      initialMe={bootstrap.me}
      initialChannels={bootstrap.channels}
      initialActiveChannelId={bootstrap.activeChannelId}
    />
  );
}

import type { Metadata } from "next";
import { getAppBootstrap } from "@/lib/server/bootstrap";
import IdeasClient from "./IdeasClient";

export const metadata: Metadata = {
  title: "Idea Engine | YT Growth",
  description: "AI-powered video ideas based on what's working in your niche",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ channelId?: string }>;
};

/**
 * Ideas Page - Server component
 * Fetches bootstrap data and passes to client.
 */
export default async function IdeasPage({ searchParams }: Props) {
  const params = await searchParams;
  const bootstrap = await getAppBootstrap({ channelId: params.channelId });

  return (
    <IdeasClient
      initialMe={bootstrap.me}
      initialChannels={bootstrap.channels}
      initialActiveChannelId={bootstrap.activeChannelId}
    />
  );
}

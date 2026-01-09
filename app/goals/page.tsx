import type { Metadata } from "next";
import { getAppBootstrap } from "@/lib/server/bootstrap";
import { BRAND } from "@/lib/brand";
import GoalsClient from "./GoalsClient";

export const metadata: Metadata = {
  title: `Goals & Achievements | ${BRAND.name}`,
  description: "Track habits that grow your channel with goals, streaks, and achievements",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ channelId?: string }>;
};

/**
 * Goals & Achievements Page - Server component
 * Fetches bootstrap data and passes to client.
 */
export default async function GoalsPage({ searchParams }: Props) {
  const params = await searchParams;
  const bootstrap = await getAppBootstrap({ channelId: params.channelId });

  return (
    <GoalsClient
      initialChannels={bootstrap.channels}
      initialActiveChannelId={bootstrap.activeChannelId}
    />
  );
}

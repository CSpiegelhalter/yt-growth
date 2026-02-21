import type { Metadata } from "next";
import { getAppBootstrap } from "@/lib/server/bootstrap";
import { BRAND } from "@/lib/shared/brand";
import CompetitorsClient from "./CompetitorsClient";

export const metadata: Metadata = {
  title: `Competitor Analysis | ${BRAND.name}`,
  description:
    "See what's working for competitors in your niche right now. Get actionable insights to grow your channel.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ channelId?: string }>;
};

/**
 * CompetitorsPage - Server component
 * Fetches bootstrap data and passes to client.
 */
export default async function CompetitorsPage({ searchParams }: Props) {
  const params = await searchParams;
  const bootstrap = await getAppBootstrap({ channelId: params.channelId });

  return (
    <CompetitorsClient
      initialMe={bootstrap.me}
      initialChannels={bootstrap.channels}
      initialActiveChannelId={bootstrap.activeChannelId}
    />
  );
}

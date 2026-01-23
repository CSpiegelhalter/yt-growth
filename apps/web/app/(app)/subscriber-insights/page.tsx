import type { Metadata } from "next";
import { getAppBootstrap } from "@/lib/server/bootstrap";
import { BRAND } from "@/lib/brand";
import SubscriberInsightsClient from "./SubscriberInsightsClient";

export const metadata: Metadata = {
  title: `Subscriber Insights | ${BRAND.name}`,
  description:
    "See which videos turn viewers into subscribers and what to replicate",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ channelId?: string }>;
};

export default async function SubscriberInsightsPage({ searchParams }: Props) {
  const params = await searchParams;
  const bootstrap = await getAppBootstrap({ channelId: params.channelId });

  return (
    <SubscriberInsightsClient
      initialMe={bootstrap.me}
      initialChannels={bootstrap.channels}
      initialActiveChannelId={bootstrap.activeChannelId}
    />
  );
}

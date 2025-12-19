import type { Metadata } from "next";
import { getAppBootstrap } from "@/lib/server/bootstrap";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard | YT Growth",
  description: "Your YouTube growth insights at a glance",
  robots: { index: false, follow: false },
};

// Force dynamic to always fetch fresh user/channel data
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ channelId?: string; checkout?: string }>;
};

/**
 * Dashboard Page - Server component that fetches bootstrap data
 * and passes it to the client component.
 */
export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;
  const bootstrap = await getAppBootstrap({ channelId: params.channelId });

  return (
    <DashboardClient
      initialMe={bootstrap.me}
      initialChannels={bootstrap.channels}
      initialActiveChannelId={bootstrap.activeChannelId}
      checkoutStatus={params.checkout}
    />
  );
}

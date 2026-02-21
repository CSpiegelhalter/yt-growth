/**
 * Trending Search Page
 *
 * Server component that renders the trending niche discovery experience.
 * Protected by the "trending_search" feature flag.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFeatureFlag } from "@/lib/shared/feature-flags";
import { getAppBootstrap } from "@/lib/server/bootstrap";
import { BRAND } from "@/lib/shared/brand";
import TrendingClient from "./TrendingClient";

export const metadata: Metadata = {
  title: `Trending Search | ${BRAND.name}`,
  description:
    "Discover trending niches and rising videos. Find opportunities that match your channel goals.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ channelId?: string }>;
};

/**
 * TrendingPage - Server component
 *
 * Guards access behind the trending_search feature flag.
 * Returns 404 if flag is disabled.
 */
export default async function TrendingPage({ searchParams }: Props) {
  // Check feature flag first - return 404 if disabled
  const isEnabled = await getFeatureFlag("trending_search");
  if (!isEnabled) {
    notFound();
  }

  const params = await searchParams;
  const bootstrap = await getAppBootstrap({ channelId: params.channelId });

  return (
    <TrendingClient
      initialMe={bootstrap.me}
      initialActiveChannelId={bootstrap.activeChannelId}
    />
  );
}

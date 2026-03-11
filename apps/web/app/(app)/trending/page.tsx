/**
 * Trending Search Page
 *
 * Server component that renders the trending niche discovery experience.
 * Protected by the "trending_search" feature flag.
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";

import { AccessGate } from "@/components/auth/AccessGate";
import { getAppBootstrapOptional } from "@/lib/server/bootstrap";
import { BRAND } from "@/lib/shared/brand";
import { getFeatureFlag } from "@/lib/shared/feature-flags";

import TrendingClient from "./TrendingClient";

export const metadata: Metadata = {
  title: `Trending Search | ${BRAND.name}`,
  description:
    "Discover trending niches and rising videos. Find opportunities that match your channel goals.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const searchParamsSchema = z.object({
  channelId: z.string().optional(),
});

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * TrendingPage - Server component
 *
 * Guards access behind the trending_search feature flag.
 * Returns 404 if flag is disabled.
 */
export default async function TrendingPage({ searchParams }: Props) {
  const isEnabled = await getFeatureFlag("trending_search");
  if (!isEnabled) {
    notFound();
  }

  const params = searchParamsSchema.parse(await searchParams);
  const bootstrap = await getAppBootstrapOptional({ channelId: params.channelId });

  return (
    <AccessGate bootstrap={bootstrap} requireChannel={false}>
      {(data) => (
        <Suspense>
          <TrendingClient
            initialMe={data.me}
            initialActiveChannelId={data.activeChannelId}
          />
        </Suspense>
      )}
    </AccessGate>
  );
}

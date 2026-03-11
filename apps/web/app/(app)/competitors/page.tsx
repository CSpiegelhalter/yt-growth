import type { Metadata } from "next";
import { Suspense } from "react";
import { z } from "zod";

import { AccessGate } from "@/components/auth/AccessGate";
import { getAppBootstrapOptional } from "@/lib/server/bootstrap";
import { BRAND } from "@/lib/shared/brand";

import CompetitorsClient from "./CompetitorsClient";

export const metadata: Metadata = {
  title: `Competitor Analysis | ${BRAND.name}`,
  description:
    "See what's working for competitors in your niche right now. Get actionable insights to grow your channel.",
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
 * CompetitorsPage - Server component
 * Fetches bootstrap data and passes to client.
 */
export default async function CompetitorsPage({ searchParams }: Props) {
  const params = searchParamsSchema.parse(await searchParams);
  const bootstrap = await getAppBootstrapOptional({ channelId: params.channelId });

  return (
    <AccessGate bootstrap={bootstrap}>
      {(data) => (
        <Suspense>
          <CompetitorsClient
            initialMe={data.me}
            initialChannels={data.channels}
            initialActiveChannelId={data.activeChannelId}
          />
        </Suspense>
      )}
    </AccessGate>
  );
}

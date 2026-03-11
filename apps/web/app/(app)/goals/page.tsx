import type { Metadata } from "next";
import { Suspense } from "react";
import { z } from "zod";

import { AccessGate } from "@/components/auth/AccessGate";
import { getAppBootstrapOptional } from "@/lib/server/bootstrap";
import { BRAND } from "@/lib/shared/brand";

import { GoalsClient } from "./GoalsClient";

export const metadata: Metadata = {
  title: `Goals & Achievements | ${BRAND.name}`,
  description: "Track habits that grow your channel with goals, streaks, and achievements",
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
 * Goals & Achievements Page - Server component
 * Fetches bootstrap data and passes to client.
 */
export default async function GoalsPage({ searchParams }: Props) {
  const params = searchParamsSchema.parse(await searchParams);
  const bootstrap = await getAppBootstrapOptional({ channelId: params.channelId });

  return (
    <AccessGate bootstrap={bootstrap}>
      {(data) => (
        <Suspense>
          <GoalsClient
            initialChannels={data.channels}
            initialActiveChannelId={data.activeChannelId}
          />
        </Suspense>
      )}
    </AccessGate>
  );
}

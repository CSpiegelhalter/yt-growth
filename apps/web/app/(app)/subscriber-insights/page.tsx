import type { Metadata } from "next";
import { z } from "zod";

import { AccessGate } from "@/components/auth/AccessGate";
import { getAppBootstrapOptional } from "@/lib/server/bootstrap";
import { BRAND } from "@/lib/shared/brand";

import SubscriberInsightsClient from "./SubscriberInsightsClient";

export const metadata: Metadata = {
  title: `Subscriber Insights | ${BRAND.name}`,
  description:
    "See which videos turn viewers into subscribers and what to replicate",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const searchParamsSchema = z.object({
  channelId: z.string().optional(),
});

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SubscriberInsightsPage({ searchParams }: Props) {
  const params = searchParamsSchema.parse(await searchParams);
  const bootstrap = await getAppBootstrapOptional({ channelId: params.channelId });

  return (
    <AccessGate bootstrap={bootstrap}>
      {(data) => (
        <SubscriberInsightsClient
          initialMe={data.me}
          initialChannels={data.channels}
          initialActiveChannelId={data.activeChannelId}
        />
      )}
    </AccessGate>
  );
}

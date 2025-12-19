import type { Metadata } from "next";
import { getAppBootstrap } from "@/lib/server/bootstrap";
import ConvertersClient from "./ConvertersClient";

export const metadata: Metadata = {
  title: "Subscriber Drivers | YT Growth",
  description:
    "See which videos turn viewers into subscribers and what to replicate",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ channelId?: string; range?: string }>;
};

/**
 * Subscriber Drivers Page - Server component
 * Fetches bootstrap data and passes to client
 */
export default async function ConvertersPage({ searchParams }: Props) {
  const params = await searchParams;
  const bootstrap = await getAppBootstrap({ channelId: params.channelId });
  const range = (["28d", "90d"].includes(params.range ?? "") ? params.range : "28d") as
    | "28d"
    | "90d";

  return (
    <ConvertersClient
      initialMe={bootstrap.me}
      initialChannels={bootstrap.channels}
      initialActiveChannelId={bootstrap.activeChannelId}
      initialRange={range}
    />
  );
}

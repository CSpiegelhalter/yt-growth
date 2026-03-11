import type { Metadata } from "next";

import { AccessGate } from "@/components/auth/AccessGate";
import { getAppBootstrapOptional } from "@/lib/server/bootstrap";

import ChannelProfileClient from "./ChannelProfileClient";

export const metadata: Metadata = {
  title: "Channel Profile | ChannelBoost",
  description:
    "Define your channel's niche, audience, and style to get better recommendations",
  robots: { index: false, follow: false },
};

export default async function ChannelProfilePage() {
  const bootstrap = await getAppBootstrapOptional();

  return (
    <AccessGate bootstrap={bootstrap}>
      <ChannelProfileClient />
    </AccessGate>
  );
}

import type { Metadata } from "next";

import { AccessGate } from "@/components/auth/AccessGate";
import { getAppBootstrapOptional } from "@/lib/server/bootstrap";
import { BRAND } from "@/lib/shared/brand";

import { AnalyzeClient } from "./AnalyzeClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Analyzer | ${BRAND.name}`,
  description: "Analyze any YouTube video and get actionable insights for your channel.",
  robots: { index: false, follow: false },
};

export default async function AnalyzePage() {
  const bootstrap = await getAppBootstrapOptional();

  return (
    <AccessGate bootstrap={bootstrap}>
      <AnalyzeClient activeChannelId={bootstrap?.activeChannelId ?? null} />
    </AccessGate>
  );
}

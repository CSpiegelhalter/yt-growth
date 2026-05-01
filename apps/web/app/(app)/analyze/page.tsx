import type { Metadata } from "next";

import { AnalyzePublicClient } from "@/components/analyze/AnalyzePublicClient";
import { getAppBootstrapOptional } from "@/lib/server/bootstrap";
import { BRAND } from "@/lib/shared/brand";

import { AnalyzeClient } from "./AnalyzeClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Video Analyzer | ${BRAND.name}`,
  description:
    "Paste any YouTube URL and get a full strategic analysis — title scoring, remix ideas, competition difficulty, and more.",
};

export default async function AnalyzePage() {
  const bootstrap = await getAppBootstrapOptional();

  // Authenticated users with a connected channel: full dashboard experience
  if (bootstrap?.activeChannelId) {
    return <AnalyzeClient activeChannelId={bootstrap.activeChannelId} />;
  }

  // Anonymous or authenticated without channel: public analyzer experience
  return <AnalyzePublicClient />;
}

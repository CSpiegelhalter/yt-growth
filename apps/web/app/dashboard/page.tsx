import type { Metadata } from "next";
import { Suspense } from "react";

import { AccessGate } from "@/components/auth/AccessGate";
import { getAppBootstrapOptional } from "@/lib/server/bootstrap";
import { BRAND, CANONICAL_ORIGIN } from "@/lib/shared/brand";

import { DashboardClient } from "./components/dashboard-client";

export const metadata: Metadata = {
  title: `Dashboard | ${BRAND.name}`,
  description:
    "Your YouTube growth dashboard. View channel performance, get AI-powered video suggestions, and discover content ideas to grow your channel.",
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${CANONICAL_ORIGIN}/dashboard`,
  },
  openGraph: {
    title: `Dashboard | ${BRAND.name}`,
    description:
      "YouTube growth dashboard with channel analytics, AI video suggestions, and content strategy tools.",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const bootstrap = await getAppBootstrapOptional();

  return (
    <AccessGate bootstrap={bootstrap}>
      {(data) => (
        <Suspense>
          <DashboardClient
            initialChannels={data.channels}
            initialActiveChannelId={data.activeChannelId}
          />
        </Suspense>
      )}
    </AccessGate>
  );
}

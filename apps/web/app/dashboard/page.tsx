import type { Metadata } from "next";
import { getAppBootstrapOptional } from "@/lib/server/bootstrap";
import { BRAND, CANONICAL_ORIGIN } from "@/lib/shared/brand";
import { LoggedOutDashboardPreview } from "@/components/dashboard/LoggedOutDashboardPreview";
import DashboardClient from "./DashboardClient";

/**
 * Dashboard Page - Server component that handles both authenticated and
 * unauthenticated users.
 *
 * SEO Strategy:
 * - Returns 200 OK for all users (no redirects)
 * - noindex to prevent search engine indexing of dashboard
 * - canonical to homepage to consolidate any accidental link equity
 *
 * Authenticated: Renders the full dashboard with user data
 * Unauthenticated: Renders a preview page with clear CTAs
 */

export const metadata: Metadata = {
  title: `Dashboard Preview | ${BRAND.name}`,
  description:
    "Access your YouTube analytics dashboard. Get channel insights, video performance metrics, and content ideas to grow your channel.",
  robots: { index: false, follow: true },
  alternates: {
    canonical: CANONICAL_ORIGIN,
  },
  openGraph: {
    title: `Dashboard | ${BRAND.name}`,
    description:
      "Your YouTube growth dashboard with channel analytics, video insights, and AI-powered content ideas.",
    type: "website",
  },
};

// Force dynamic to always check auth state
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ channelId?: string; checkout?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;

  // Authenticated: fetch bootstrap once and render dashboard.
  // Unauthenticated: show logged-out preview (200 OK, no redirect).
  const bootstrap = await getAppBootstrapOptional({
    channelId: params.channelId,
  });

  if (!bootstrap) {
    return <LoggedOutDashboardPreview />;
  }

  return (
    <DashboardClient
      initialMe={bootstrap.me}
      initialChannels={bootstrap.channels}
      initialActiveChannelId={bootstrap.activeChannelId}
      checkoutStatus={params.checkout}
    />
  );
}

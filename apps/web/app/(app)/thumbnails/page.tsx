/**
 * Thumbnail Generator Page
 *
 * Server component that bootstraps data for ThumbnailsClient.
 * Protected by the "thumbnail_generation" feature flag.
 */

import { redirect, notFound } from "next/navigation";
import { getCurrentUserWithSubscription } from "@/lib/server/auth";
import { getFeatureFlag } from "@/lib/shared/feature-flags";
import ThumbnailsClient from "./ThumbnailsClient";

export const metadata = {
  title: "Thumbnail Generator | ChannelBoost",
  description: "Generate eye-catching YouTube thumbnails with AI",
  robots: { index: false, follow: false },
};

export default async function ThumbnailsPage() {
  // Check feature flag first (returns 404 if disabled)
  const isEnabled = await getFeatureFlag("thumbnail_generation");
  if (!isEnabled) {
    notFound();
  }

  const user = await getCurrentUserWithSubscription();

  if (!user) {
    redirect("/auth/login?redirect=/thumbnails");
  }

  return (
    <ThumbnailsClient
      initialUser={{
        id: user.id,
        email: user.email,
        name: user.name,
        subscription: user.subscription
          ? {
              isActive:
                user.subscription.status === "active" ||
                user.subscription.status === "past_due",
              plan: user.subscription.plan,
            }
          : undefined,
      }}
    />
  );
}

/**
 * Thumbnail Generator Page
 *
 * Server component that bootstraps data for ThumbnailsClient.
 * Protected by the "thumbnail_generation" feature flag.
 */

import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AccessGate } from "@/components/auth/AccessGate";
import { getAppBootstrapOptional } from "@/lib/server/bootstrap";
import { getFeatureFlag } from "@/lib/shared/feature-flags";

import { ThumbnailsClient } from "./ThumbnailsClient";

export const metadata = {
  title: "Thumbnail Generator | ChannelBoost",
  description: "Generate eye-catching YouTube thumbnails with AI",
  robots: { index: false, follow: false },
};

export default async function ThumbnailsPage() {
  const isEnabled = await getFeatureFlag("thumbnail_generation");
  if (!isEnabled) {
    notFound();
  }

  const bootstrap = await getAppBootstrapOptional();

  return (
    <AccessGate bootstrap={bootstrap} requireChannel={false}>
      {(data) => (
        <Suspense>
          <ThumbnailsClient
            initialUser={{
              id: data.me.id,
              email: data.me.email,
              name: data.me.name,
              subscription: data.me.subscription
                ? {
                    isActive: data.me.subscription.isActive,
                    plan: data.me.plan,
                  }
                : undefined,
            }}
          />
        </Suspense>
      )}
    </AccessGate>
  );
}

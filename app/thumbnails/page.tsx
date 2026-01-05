/**
 * Thumbnail Generator Page
 *
 * Server component that bootstraps data for ThumbnailsClient.
 */

import { redirect } from "next/navigation";
import { getCurrentUserWithSubscription } from "@/lib/user";
import ThumbnailsClient from "./ThumbnailsClient";

export const metadata = {
  title: "Thumbnail Generator | ChannelBoost",
  description: "Generate eye-catching YouTube thumbnails with AI",
  robots: { index: false, follow: false },
};

export default async function ThumbnailsPage() {
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

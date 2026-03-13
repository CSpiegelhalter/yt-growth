import type { Metadata } from "next";

import { AccessGate } from "@/components/auth/AccessGate";
import { getAppBootstrapOptional } from "@/lib/server/bootstrap";
import { BRAND } from "@/lib/shared/brand";

import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
  title: `Account | ${BRAND.name}`,
  description: "Manage your account and subscription",
  robots: { index: false, follow: false },
};

/**
 * Profile Page - Server component with noindex metadata
 * Auth required, not crawlable
 */
export default async function ProfilePage() {
  const bootstrap = await getAppBootstrapOptional();

  return (
    <AccessGate bootstrap={bootstrap} requireChannel={false}>
      {(data) => (
        <ProfileClient initialMe={data.me} initialChannels={data.channels} />
      )}
    </AccessGate>
  );
}

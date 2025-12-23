import type { Metadata } from "next";
import { getAppBootstrap } from "@/lib/server/bootstrap";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
  title: "Profile | YT Growth",
  description: "Manage your account and subscription",
  robots: { index: false, follow: false },
};

/**
 * Profile Page - Server component with noindex metadata
 * Auth required, not crawlable
 */
export default async function ProfilePage() {
  const bootstrap = await getAppBootstrap();
  return (
    <ProfileClient initialMe={bootstrap.me} initialChannels={bootstrap.channels} />
  );
}

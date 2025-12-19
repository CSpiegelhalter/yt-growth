import type { Metadata } from "next";
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
export default function ProfilePage() {
  return <ProfileClient />;
}

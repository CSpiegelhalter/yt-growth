import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import { BRAND } from "@/lib/brand";
import TagGeneratorClient from "./TagGeneratorClient";

export const metadata: Metadata = {
  title: `YouTube Tag Generator | ${BRAND.name}`,
  description:
    "Generate optimized YouTube tags to improve your video discoverability. AI-powered tag suggestions based on your video title and description.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * TagGeneratorPage - Server component
 * Checks authentication and renders the tag generator tool.
 */
export default async function TagGeneratorPage() {
  const user = await getCurrentUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect("/auth/login?callbackUrl=/tag-generator");
  }

  return <TagGeneratorClient />;
}

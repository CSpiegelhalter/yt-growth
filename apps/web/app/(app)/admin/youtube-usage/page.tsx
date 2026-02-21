import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdminYoutubeUsageClient from "./AdminYoutubeUsageClient";
import { getCurrentUser } from "@/lib/server/auth";
import { isAdminUser } from "@/lib/server/auth";

export const metadata: Metadata = {
  title: "Admin · YouTube API Usage",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminYoutubeUsagePage() {
  const user = await getCurrentUser();
  if (!isAdminUser(user)) notFound();
  return <AdminYoutubeUsageClient />;
}



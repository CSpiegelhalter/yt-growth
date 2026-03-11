import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AccessGate } from "@/components/auth/AccessGate";
import { isAdminUser } from "@/lib/server/auth";
import { getAppBootstrapOptional } from "@/lib/server/bootstrap";

import AdminYoutubeUsageClient from "./AdminYoutubeUsageClient";

export const metadata: Metadata = {
  title: "Admin · YouTube API Usage",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminYoutubeUsagePage() {
  const bootstrap = await getAppBootstrapOptional();

  if (bootstrap && !isAdminUser({ id: bootstrap.me.id, email: bootstrap.me.email, name: bootstrap.me.name })) {
    notFound();
  }

  return (
    <AccessGate bootstrap={bootstrap} requireChannel={false}>
      <AdminYoutubeUsageClient />
    </AccessGate>
  );
}

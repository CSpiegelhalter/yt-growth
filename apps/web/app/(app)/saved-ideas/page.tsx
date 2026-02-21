import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/auth";
import { BRAND } from "@/lib/shared/brand";
import SavedIdeasClient from "./SavedIdeasClient";

export const metadata: Metadata = {
  title: `Saved Ideas | ${BRAND.name}`,
  description: "Your saved video ideas collection",
  robots: { index: false, follow: false },
};

export default async function SavedIdeasPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login?callbackUrl=/saved-ideas");
  }

  return <SavedIdeasClient />;
}

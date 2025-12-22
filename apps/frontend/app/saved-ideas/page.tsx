import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/user";
import SavedIdeasClient from "./SavedIdeasClient";

export const metadata = {
  title: "Saved Ideas | YT Growth",
  description: "Your saved video ideas collection",
};

export default async function SavedIdeasPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin?callbackUrl=/saved-ideas");
  }

  return <SavedIdeasClient />;
}


import type { Metadata } from "next";
import DropOffsClient from "./DropOffsClient";

export const metadata: Metadata = {
  title: "Drop-off Analysis | YT Growth",
  description: "See where viewers leave your videos and get actionable fixes",
  robots: { index: false, follow: false },
};

/**
 * Drop-offs Page - Server component with noindex metadata
 * Auth required, not crawlable
 */
export default function DropOffsPage() {
  return <DropOffsClient />;
}

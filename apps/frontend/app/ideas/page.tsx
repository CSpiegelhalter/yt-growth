import type { Metadata } from "next";
import IdeasClient from "./IdeasClient";

export const metadata: Metadata = {
  title: "Idea Engine | YT Growth",
  description: "AI-powered video ideas based on what's working in your niche",
  robots: { index: false, follow: false },
};

/**
 * Ideas Page - Server component with noindex metadata
 * Auth required, not crawlable
 */
export default function IdeasPage() {
  return <IdeasClient />;
}

import type { Metadata } from "next";
import CompetitorsClient from "./CompetitorsClient";

export const metadata: Metadata = {
  title: "Competitor Winners | YT Growth",
  description: "See what's working for competitors in your niche right now. Get actionable insights to grow your channel.",
  robots: { index: false, follow: false },
};

/**
 * CompetitorsPage - Server component wrapper
 * Shows competitor videos working right now in the user's niche.
 */
export default function CompetitorsPage() {
  return <CompetitorsClient />;
}


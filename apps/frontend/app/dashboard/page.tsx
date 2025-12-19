import type { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard | YT Growth",
  description: "Your YouTube growth insights at a glance",
  robots: { index: false, follow: false },
};

/**
 * Dashboard Page - Server component with noindex metadata
 * Auth required, not crawlable
 */
export default function DashboardPage() {
  return <DashboardClient />;
}

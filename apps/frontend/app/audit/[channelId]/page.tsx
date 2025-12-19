import type { Metadata } from "next";
import AuditClient from "./AuditClient";

export const metadata: Metadata = {
  title: "Channel Audit | YT Growth",
  description: "Deep dive into your channel's retention, subscriber conversion, and content performance",
  robots: { index: false, follow: false },
};

/**
 * Audit Page - Server component with noindex metadata
 * Auth required, not crawlable
 */
export default function AuditPage() {
  return <AuditClient />;
}

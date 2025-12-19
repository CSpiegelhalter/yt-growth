import type { Metadata } from "next";
import ConvertersClient from "./ConvertersClient";

export const metadata: Metadata = {
  title: "Subscriber Drivers | YT Growth",
  description: "Find your best-converting videos and patterns that turn viewers into subscribers",
  robots: { index: false, follow: false },
};

/**
 * Converters Page - Server component with noindex metadata
 * Auth required, not crawlable
 */
export default function ConvertersPage() {
  return <ConvertersClient />;
}

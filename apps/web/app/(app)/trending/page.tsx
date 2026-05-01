/**
 * Trending Page — Command Center
 *
 * 4-zone discovery experience:
 * Zone 1: Trending Now ticker (Google Trends)
 * Zone 2: Opportunity Gaps hero (high volume + low competition)
 * Zone 3: YouTube Rising Videos
 * Zone 4: Deep Keyword Research (collapsible)
 *
 * Accessible to guests, free, and pro users with progressive depth.
 */

import type { Metadata } from "next";

import { BRAND } from "@/lib/shared/brand";

import TrendingCommandCenter from "./TrendingCommandCenter";

export const metadata: Metadata = {
  title: `Trending | ${BRAND.name}`,
  description:
    "Discover trending topics, opportunity gaps, and rising YouTube videos. Find high-volume, low-competition keywords to grow your channel.",
  robots: { index: true, follow: true },
};

export default function TrendingPage() {
  return <TrendingCommandCenter />;
}

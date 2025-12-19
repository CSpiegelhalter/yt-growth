import type { Metadata } from "next";
import TrendingClient from "./TrendingClient";

export const metadata: Metadata = {
  title: "Trending | YT Growth",
  description: "Discover what's taking off in your niche right now",
  robots: { index: false, follow: false },
};

export default function TrendingPage() {
  return <TrendingClient />;
}


import type { Metadata } from "next";
import { BRAND, CANONICAL_ORIGIN } from "@/lib/brand";
import { TagGeneratorClient } from "./TagGeneratorClient";

export const metadata: Metadata = {
  title: `YouTube Tag Generator — Generate Tags for Any Niche | ${BRAND.name}`,
  description:
    "Generate optimized YouTube tags to improve your video discoverability. AI-powered tag suggestions based on your video title and description. Free tool for creators.",
  alternates: {
    canonical: `${CANONICAL_ORIGIN}/tags/generator`,
  },
  openGraph: {
    title: `YouTube Tag Generator — Generate Tags for Any Niche | ${BRAND.name}`,
    description:
      "Generate optimized YouTube tags to improve your video discoverability. AI-powered tag suggestions.",
    url: `${CANONICAL_ORIGIN}/tags/generator`,
  },
};

/**
 * Tag Generator page.
 * Generates optimized tags based on video title, description, and optional reference video.
 */
export default function TagGeneratorPage() {
  return <TagGeneratorClient />;
}

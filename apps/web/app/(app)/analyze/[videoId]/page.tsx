import type { Metadata } from "next";

import { BRAND } from "@/lib/shared/brand";

import { AnalyzeShareClient } from "./AnalyzeShareClient";

type Props = {
  params: Promise<{ videoId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { videoId } = await params;
  const title = `Video Analysis: ${videoId} | ${BRAND.name}`;
  const description = `See what's working in this YouTube video — tags, comments, title patterns, and remix ideas. Analyze any video free on ${BRAND.name}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BRAND.url}/analyze/${videoId}`,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/**
 * Shareable analysis page for a specific video.
 *
 * Renders the AnalyzeShareClient which auto-triggers analysis for the videoId.
 * The OG image is generated in the sibling opengraph-image.tsx route.
 */
export default async function AnalyzeVideoPage({ params }: Props) {
  const { videoId } = await params;

  return (
    <div style={{ padding: "0 16px", maxWidth: 960, margin: "0 auto" }}>
      <AnalyzeShareClient videoId={videoId} />
    </div>
  );
}

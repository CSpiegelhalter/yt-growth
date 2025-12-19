import type { Metadata } from "next";
import TrendingDetailClient from "./TrendingDetailClient";

type Props = {
  params: { videoId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Trending Video Analysis | YT Growth`,
    description: `Deep insights for trending video ${params.videoId}`,
    robots: { index: false, follow: false },
  };
}

export default function TrendingDetailPage({ params }: Props) {
  return <TrendingDetailClient videoId={params.videoId} />;
}


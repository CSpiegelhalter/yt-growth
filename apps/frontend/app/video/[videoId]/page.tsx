import type { Metadata } from "next";
import VideoClient from "./VideoClient";

export const metadata: Metadata = {
  title: "Video Insights | YT Growth",
  description: "Deep dive into your video's retention, subscriber conversion, and improvement suggestions",
  robots: { index: false, follow: false },
};

/**
 * Video Details Page - Server component with noindex metadata
 * Shows comprehensive insights for a single video
 */
export default function VideoPage() {
  return <VideoClient />;
}


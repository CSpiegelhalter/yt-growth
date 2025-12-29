"use client";

import dynamic from "next/dynamic";
import type { VideoInsightsResponse } from "@/types/api";

type Props = {
  videoId: string;
  channelId?: string;
  initialInsights: VideoInsightsResponse | null;
  initialRange: "7d" | "28d" | "90d";
  from?: string;
};

const VideoInsightsClient = dynamic(() => import("./VideoInsightsClient"), {
  ssr: false,
});

export default function VideoInsightsClientNoSSR(props: Props) {
  return <VideoInsightsClient {...props} />;
}

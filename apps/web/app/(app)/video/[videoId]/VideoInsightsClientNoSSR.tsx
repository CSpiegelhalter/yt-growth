"use client";

import dynamic from "next/dynamic";

type Props = {
  videoId: string;
  channelId?: string;
  initialRange: "7d" | "28d" | "90d";
  from?: string;
};

// Use the new V2 client with progressive loading
const VideoInsightsClientV2 = dynamic(() => import("./VideoInsightsClientV2"), {
  ssr: false,
});

export default function VideoInsightsClientNoSSR(props: Props) {
  return <VideoInsightsClientV2 {...props} />;
}

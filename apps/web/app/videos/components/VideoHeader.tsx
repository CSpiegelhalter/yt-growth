"use client";

import type { ReactNode } from "react";

import { VideoHeaderSimple } from "@/components/video/VideoHeaderSimple";
import type { VideoWithMetrics } from "@/lib/video-tools";

type VideoHeaderProps = {
  video: VideoWithMetrics;
  action?: ReactNode;
};

export function VideoHeader({ video, action }: VideoHeaderProps) {
  return (
    <VideoHeaderSimple
      thumbnailUrl={video.thumbnailUrl}
      title={video.title ?? "Untitled"}
      publishedAt={video.publishedAt}
      views={video.views}
      likes={video.likes}
      comments={video.comments}
      action={action}
    />
  );
}

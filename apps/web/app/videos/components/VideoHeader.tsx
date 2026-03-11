"use client";

import { VideoHeaderSimple } from "@/components/video/VideoHeaderSimple";
import type { VideoWithMetrics } from "@/lib/video-tools";

type VideoHeaderProps = {
  video: VideoWithMetrics;
};

export function VideoHeader({ video }: VideoHeaderProps) {
  return (
    <VideoHeaderSimple
      thumbnailUrl={video.thumbnailUrl}
      title={video.title ?? "Untitled"}
      publishedAt={video.publishedAt}
      views={video.views}
      likes={video.likes}
      comments={video.comments}
    />
  );
}

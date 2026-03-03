"use client";

import type { InsightVideoInput, VideoPublishMarker } from "@/lib/features/channel-audit";
import type { VideoWithMetrics } from "@/lib/video-tools";

import s from "../style.module.css";
import { OverviewPanel } from "./OverviewPanel";
import { VideoDetailPanel } from "./VideoDetailPanel";
import { VideoList } from "./VideoList";

type SplitPanelProps = {
  activeChannelId: string;
  videosWithMetrics: VideoWithMetrics[];
  insightVideos: InsightVideoInput[];
  videoMarkers: VideoPublishMarker[];
  selectedVideoId: string | null;
  selectedVideo: VideoWithMetrics | null;
  videosLoading: boolean;
  showDetail: boolean;
  onSelect: (id: string | null) => void;
  onBack: () => void;
};

export function SplitPanel({
  activeChannelId,
  videosWithMetrics,
  insightVideos,
  videoMarkers,
  selectedVideoId,
  selectedVideo,
  videosLoading,
  showDetail,
  onSelect,
  onBack,
}: SplitPanelProps) {
  return (
    <div className={s.splitPanel}>
      {/* Left: Video list */}
      <div
        className={`${s.leftPanel} ${showDetail ? s.leftPanelHiddenMobile : ""}`}
      >
        <VideoList
          videos={videosWithMetrics}
          selectedId={selectedVideoId}
          onSelect={onSelect}
          loading={videosLoading}
        />
      </div>

      {/* Right: Dynamic detail panel */}
      <div
        className={`${s.rightPanel} ${showDetail ? s.rightPanelVisibleMobile : ""}`}
      >
        {/* Mobile back button */}
        <button
          type="button"
          className={s.backBtn}
          onClick={onBack}
          aria-label="Back to video list"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {selectedVideoId === null ? (
          <OverviewPanel
            channelId={activeChannelId}
            videos={insightVideos}
            videoMarkers={videoMarkers}
          />
        ) : (
          <VideoDetailPanel
            video={selectedVideo}
            channelId={activeChannelId}
          />
        )}
      </div>
    </div>
  );
}

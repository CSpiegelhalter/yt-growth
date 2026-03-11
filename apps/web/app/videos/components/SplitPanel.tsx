"use client";

import type { VideoWithMetrics } from "@/lib/video-tools";

import s from "../style.module.css";
import type { VideoTab } from "./TabToggle";
import { TabToggle } from "./TabToggle";
import { VideoDetailPanel } from "./VideoDetailPanel";
import { VideoList } from "./VideoList";

type SplitPanelProps = {
  activeChannelId: string;
  tab: VideoTab;
  onTabChange: (tab: VideoTab) => void;
  videosWithMetrics: VideoWithMetrics[];
  selectedVideoId: string | null;
  selectedVideo: VideoWithMetrics | null;
  videosLoading: boolean;
  showDetail: boolean;
  onSelect: (id: string) => void;
  onBack: () => void;
  plannedLeftContent?: React.ReactNode;
  plannedRightContent?: React.ReactNode;
};

export function SplitPanel({
  activeChannelId,
  tab,
  onTabChange,
  videosWithMetrics,
  selectedVideoId,
  selectedVideo,
  videosLoading,
  showDetail,
  onSelect,
  onBack,
  plannedLeftContent,
  plannedRightContent,
}: SplitPanelProps) {
  const isPublished = tab === "published";

  return (
    <div className={s.splitPanel}>
      {/* Left panel */}
      <div
        className={`${s.leftPanel} ${showDetail ? s.leftPanelHiddenMobile : ""}`}
      >
        <div className={s.tabContainer}>
          <TabToggle activeTab={tab} onTabChange={onTabChange} />
        </div>

        {isPublished ? (
          <VideoList
            videos={videosWithMetrics}
            selectedId={selectedVideoId}
            onSelect={onSelect}
            loading={videosLoading}
          />
        ) : (
          plannedLeftContent
        )}
      </div>

      {/* Right panel */}
      <div
        className={`${s.rightPanel} ${showDetail ? s.rightPanelVisibleMobile : ""}`}
      >
        <button
          type="button"
          className={s.backBtn}
          onClick={onBack}
          aria-label="Back to list"
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

        {isPublished ? (
          <VideoDetailPanel
            video={selectedVideo}
            channelId={activeChannelId}
          />
        ) : (
          plannedRightContent
        )}
      </div>
    </div>
  );
}

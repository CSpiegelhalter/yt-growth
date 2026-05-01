"use client";

import { useCallback, useMemo, useState } from "react";

import type { PillMetric } from "@/components/overview";
import { MetricPills, rankVideoMetrics } from "@/components/overview";
import { PricingModal } from "@/components/pricing/PricingModal";
import type { VideoWithMetrics } from "@/lib/video-tools";

import { useFullReport } from "./full-report";
import { useVideoInsights } from "./useVideoInsights";
import s from "./video-detail-panel.module.css";
import { VideoHeader } from "./VideoHeader";
import { VideoInsightArea } from "./VideoInsightArea";

type VideoDetailPanelProps = {
  video: VideoWithMetrics | null;
  channelId: string;
  isSubscribed: boolean;
};

export function VideoDetailPanel({ video, channelId, isSubscribed }: VideoDetailPanelProps) {
  if (!video) {
    return (
      <div className={s.panel}>
        <div className={s.emptyState}>
          <p>Select a video to see its analysis.</p>
        </div>
      </div>
    );
  }

  return <VideoDetailContent video={video} channelId={channelId} isSubscribed={isSubscribed} />;
}

function VideoDetailContent({
  video,
  channelId,
  isSubscribed,
}: {
  video: VideoWithMetrics;
  channelId: string;
  isSubscribed: boolean;
}) {
  const { summary, loading, summaryLoading, error, retry } = useVideoInsights(
    channelId,
    video.videoId,
  );
  const {
    report,
    phase,
    hasAnySection,
    generate: generateReport,
    retry: retryReport,
    retrySection,
  } = useFullReport(channelId, video.videoId);

  const [showFullReport, setShowFullReport] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);

  const reportLoading = phase !== "idle" && phase !== "done" && phase !== "error";
  const reportReady = phase === "done" || hasAnySection;

  const ranked = useMemo(() => rankVideoMetrics(video), [video]);

  const needsWork = useMemo(() => {
    const items = [...ranked.needsWork];
    if (summary && summary.length > 0) {
      const top = summary[0];
      items.push({
        key: "ai-insight",
        label: top.title,
        displayValue: "",
        direction: "down",
        score: 0,
        issue: top.explanation,
        fix: top.fix,
      } satisfies PillMetric);
    }
    return items;
  }, [ranked.needsWork, summary]);

  const hasContent =
    ranked.goingWell.length > 0 || needsWork.length > 0;

  const handleOpenFullReport = useCallback(() => {
    if (!isSubscribed) {
      setPricingOpen(true);
      return;
    }
    setShowFullReport(true);
    if (phase === "idle") {
      generateReport();
    }
  }, [isSubscribed, phase, generateReport]);

  const handleBack = useCallback(() => {
    setShowFullReport(false);
  }, []);

  const handleClosePricing = useCallback(() => {
    setPricingOpen(false);
  }, []);

  const headerAction = showFullReport ? (
    <BackButton onClick={handleBack} />
  ) : (
    <FullReportButton
      isSubscribed={isSubscribed}
      reportLoading={reportLoading}
      reportReady={reportReady}
      onClick={handleOpenFullReport}
    />
  );

  return (
    <div className={s.panel}>
      <VideoHeader video={video} action={headerAction} />

      {showFullReport ? (
        <VideoInsightArea
          report={report}
          phase={phase}
          hasAnySection={hasAnySection}
          retryReport={retryReport}
          retrySection={retrySection}
          summary={null}
          hasContent={false}
        />
      ) : (
        <div className={s.contentArea}>
          {loading && (
            <div className={s.loadingState}>
              <div className={s.spinner} />
              <span>Analyzing this video...</span>
            </div>
          )}

          {error && !loading && (
            <div className={s.errorState}>
              <p>{error}</p>
              <button type="button" onClick={retry} className={s.retryBtn}>
                Try again
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              <MetricPills goingWell={ranked.goingWell} needsWork={needsWork} />
              {summaryLoading && (
                <div className={s.loadingState}>
                  <div className={s.spinner} />
                  <span>Generating insights...</span>
                </div>
              )}
              <VideoInsightArea
                report={report}
                phase={"idle"}
                hasAnySection={false}
                retryReport={retryReport}
                retrySection={retrySection}
                summary={summary}
                hasContent={hasContent}
              />
            </>
          )}
        </div>
      )}

      <PricingModal isOpen={pricingOpen} onClose={handleClosePricing} />
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className={s.backBtn}
      onClick={onClick}
      aria-label="Back to summary"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
      Back to summary
    </button>
  );
}

type FullReportButtonProps = {
  isSubscribed: boolean;
  reportLoading: boolean;
  reportReady: boolean;
  onClick: () => void;
};

function fullReportButtonLabel(
  reportLoading: boolean,
  reportReady: boolean,
  isSubscribed: boolean,
): string {
  if (reportLoading) {return "Generating report...";}
  if (reportReady) {return "View Full Report";}
  return isSubscribed ? "Full Report" : "Full Report · Pro";
}

function FullReportButton({
  isSubscribed,
  reportLoading,
  reportReady,
  onClick,
}: FullReportButtonProps) {
  const label = fullReportButtonLabel(reportLoading, reportReady, isSubscribed);
  const ariaLabel = isSubscribed
    ? "Open full report"
    : "Full Report — requires subscription, click to upgrade";
  return (
    <button
      type="button"
      className={s.transcriptBtn}
      onClick={onClick}
      disabled={reportLoading}
      aria-label={ariaLabel}
    >
      {!isSubscribed && (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      )}
      {label}
    </button>
  );
}

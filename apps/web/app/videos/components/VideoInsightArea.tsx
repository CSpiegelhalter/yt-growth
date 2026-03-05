import type { ReportSectionKey } from "@/lib/features/full-report";
import type { CoreAnalysis } from "@/lib/features/video-insights/types";

import { FullReportError, FullReportLoading, VideoFullReport } from "./full-report";
import type { PartialFullReport, StreamPhase } from "./full-report/full-report-types";
import s from "./video-detail-panel.module.css";
import { VideoInsightCards } from "./VideoInsightCards";

type VideoInsightAreaProps = {
  report: PartialFullReport;
  phase: StreamPhase;
  hasAnySection: boolean;
  retryReport: () => void;
  retrySection?: (key: ReportSectionKey) => void;
  summary: CoreAnalysis | null;
  hasContent: boolean;
};

export function VideoInsightArea({
  report,
  phase,
  hasAnySection,
  retryReport,
  retrySection,
  summary,
  hasContent,
}: VideoInsightAreaProps) {
  // Streaming in progress or complete with sections
  if (phase === "gathering" || phase === "synthesizing") {
    if (hasAnySection) {
      return <VideoFullReport report={report} onRetrySection={retrySection} />;
    }
    return <FullReportLoading />;
  }

  if (phase === "error") {
    if (hasAnySection) {
      return <VideoFullReport report={report} onRetrySection={retrySection} />;
    }
    return <FullReportError message="Failed to generate report." onRetry={retryReport} />;
  }

  if (phase === "done") {
    return <VideoFullReport report={report} onRetrySection={retrySection} />;
  }

  // phase === "idle" — show insight cards or empty state
  if (summary && summary.length > 0) {
    return <VideoInsightCards insights={summary} />;
  }

  if (!hasContent) {
    return (
      <div className={s.emptyState}>
        <p>
          Not enough data to generate insights yet. Check back once this video
          has more views.
        </p>
      </div>
    );
  }

  return null;
}

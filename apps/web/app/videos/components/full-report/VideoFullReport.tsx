import type { ReactNode } from "react";

import type { ReportSectionKey } from "@/lib/features/full-report";

import { DiscoverabilityAccordion } from "./components/discoverability/DiscoverabilityAccordion";
import hookStyles from "./components/hook-analysis/hook-analysis.module.css";
import { HookAnalysisSection } from "./components/hook-analysis/HookAnalysisSection";
import { PromotionSection } from "./components/reach/PromotionSection";
import { RetentionTimeline } from "./components/retention/RetentionTimeline";
import { VideoAuditBar } from "./components/video-audit/VideoAuditBar";
import s from "./full-report.module.css";
import type { PartialFullReport, SectionState } from "./full-report-types";
import { SectionError } from "./SectionError";
import { SectionSkeleton } from "./SectionSkeleton";
import { InfoTooltip } from "./ui/InfoTooltip";
import { ReportAccordion } from "./ui/ReportAccordion";

type VideoFullReportProps = {
  report: PartialFullReport;
};

const SCORE_CLASS: Record<string, string> = {
  Strong: "hookStrong",
  "Needs Work": "hookNeedsWork",
  Weak: "hookWeak",
};

function renderSection<T>(
  section: SectionState<T>,
  sectionKey: ReportSectionKey,
  renderDone: (data: T) => ReactNode,
): ReactNode {
  if (section.status === "done" && section.data) {
    return renderDone(section.data);
  }
  if (section.status === "error") {
    return <SectionError message={section.error ?? "Section failed"} />;
  }
  return <SectionSkeleton variant={sectionKey} />;
}

export function VideoFullReport({ report }: VideoFullReportProps) {
  const hookData = report.hookAnalysis;
  const hookScore = hookData.status === "done" && hookData.data
    ? hookData.data.score
    : null;

  const scoreClass = hookScore
    ? (hookStyles[SCORE_CLASS[hookScore] ?? "hookNeedsWork"] ?? "")
    : "";

  const hookBadge = hookScore
    ? (
        <span className={`${hookStyles.hookScoreBadge} ${scoreClass}`}>
          {hookScore}
        </span>
      )
    : null;

  return (
    <div className={s.reportStack}>
      {renderSection(report.videoAudit, "videoAudit", (data) => (
        <VideoAuditBar audit={data} />
      ))}

      <ReportAccordion title="Discoverability" variant="section">
        {renderSection(report.discoverability, "discoverability", (data) => (
          <DiscoverabilityAccordion discoverability={data} />
        ))}
      </ReportAccordion>

      <ReportAccordion
        title="SEO & Social Reach"
        variant="section"
        badge={<InfoTooltip text="Recommendations for search optimization, social sharing, and community promotion" />}
      >
        {renderSection(report.promotionPlaybook, "promotionPlaybook", (data) => (
          <PromotionSection actions={data} />
        ))}
      </ReportAccordion>

      <ReportAccordion title="Why Viewers Leave" variant="section">
        {renderSection(report.retention, "retention", (data) => (
          <RetentionTimeline retention={data} />
        ))}
      </ReportAccordion>

      <ReportAccordion title="Opening Strategy" variant="section" badge={hookBadge}>
        {renderSection(report.hookAnalysis, "hookAnalysis", (data) => (
          <HookAnalysisSection hookAnalysis={data} />
        ))}
      </ReportAccordion>
    </div>
  );
}

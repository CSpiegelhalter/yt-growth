import type { ReactNode } from "react";

import type { ReportSectionKey } from "@/lib/features/full-report";

import { DiscoverabilityAccordion } from "./components/discoverability/DiscoverabilityAccordion";
import { PrioritiesList } from "./components/priorities/PrioritiesList";
import { PromotionSection } from "./components/reach/PromotionSection";
import { RetentionCurveChart } from "./components/retention/RetentionCurveChart";
import { ScoreStrip } from "./components/score-strip/ScoreStrip";
import { SignalsPanel } from "./components/signals/SignalsPanel";
import { VerdictBand } from "./components/verdict/VerdictBand";
import { VideoAuditBar } from "./components/video-audit/VideoAuditBar";
import { WinsBand } from "./components/wins/WinsBand";
import s from "./full-report.module.css";
import type { PartialFullReport, SectionState } from "./full-report-types";
import { SectionError } from "./SectionError";
import { SectionSkeleton } from "./SectionSkeleton";
import { InfoTooltip } from "./ui/InfoTooltip";
import { ReportAccordion } from "./ui/ReportAccordion";

type VideoFullReportProps = {
  report: PartialFullReport;
  onRetrySection?: (key: ReportSectionKey) => void;
};

function renderSection<T>(
  section: SectionState<T>,
  sectionKey: ReportSectionKey,
  renderDone: (data: T) => ReactNode,
  onRetry?: (key: ReportSectionKey) => void,
): ReactNode {
  if (section.status === "done" && section.data) {
    return renderDone(section.data);
  }
  if (section.status === "error") {
    return (
      <SectionError
        message={section.error ?? "Section failed"}
        retryable={section.retryable}
        onRetry={onRetry ? () => onRetry(sectionKey) : undefined}
      />
    );
  }
  return <SectionSkeleton variant={sectionKey} />;
}

export function VideoFullReport({ report, onRetrySection }: VideoFullReportProps) {
  const auditDone =
    report.videoAudit.status === "done" ? report.videoAudit.data : null;
  const scoreStripDone =
    report.scoreStrip.status === "done" ? report.scoreStrip.data : null;

  return (
    <div className={s.reportStack}>
      {/* ── Verdict band ── */}
      {renderSection(
        report.verdict,
        "verdict",
        (data) => <VerdictBand verdict={data} />,
        onRetrySection,
      )}

      {/* ── Score strip ── */}
      {renderSection(
        report.scoreStrip,
        "scoreStrip",
        (data) => <ScoreStrip data={data} />,
        onRetrySection,
      )}

      {/* ── Top 3 priorities ── */}
      {renderSection(
        report.priorities,
        "priorities",
        (data) => <PrioritiesList priorities={data} />,
        onRetrySection,
      )}

      {/* ── Patterns we noticed (deterministic cross-source signals) ── */}
      {renderSection(
        report.signals,
        "signals",
        (data) => <SignalsPanel data={data} />,
        onRetrySection,
      )}

      {/* ── Retention curve (chart + annotated drop-offs) ── */}
      {renderSection(
        report.retentionCurve,
        "retentionCurve",
        (data) => <RetentionCurveChart data={data} />,
        onRetrySection,
      )}

      {/* ── What's working (always visible) ── */}
      <WinsBand audit={auditDone} scoreStrip={scoreStripDone} />

      {/* ── Progressive disclosure ── */}
      <ReportAccordion title="Title alternatives, description, tags" variant="section">
        {renderSection(report.discoverability, "discoverability", (data) => (
          <DiscoverabilityAccordion discoverability={data} />
        ), onRetrySection)}
      </ReportAccordion>

      <ReportAccordion
        title="Promotion drafts"
        variant="section"
        badge={<InfoTooltip text="Pre-written share copy for social, community, collaboration, and SEO promotion." />}
      >
        {renderSection(report.promotionPlaybook, "promotionPlaybook", (data) => (
          <PromotionSection actions={data} />
        ), onRetrySection)}
      </ReportAccordion>

      <ReportAccordion title="Full audit checklist" variant="section">
        {renderSection(report.videoAudit, "videoAudit", (data) => (
          <VideoAuditBar audit={data} />
        ), onRetrySection)}
      </ReportAccordion>
    </div>
  );
}

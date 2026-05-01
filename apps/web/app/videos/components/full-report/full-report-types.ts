import type {
  Discoverability,
  HookAnalysis,
  PrioritiesList,
  PromotionAction,
  RetentionAnalysis,
  RetentionCurveData,
  ScoreStripData,
  SignalsData,
  Verdict,
  VideoAudit,
} from "@/lib/features/full-report";

export type SectionStatus = "pending" | "loading" | "done" | "error";

export type SectionState<T> = {
  status: SectionStatus;
  data: T | null;
  error: string | null;
  retryable?: boolean;
};

export type PartialFullReport = {
  videoAudit: SectionState<VideoAudit>;
  discoverability: SectionState<Discoverability>;
  promotionPlaybook: SectionState<PromotionAction[]>;
  retention: SectionState<RetentionAnalysis>;
  hookAnalysis: SectionState<HookAnalysis>;
  scoreStrip: SectionState<ScoreStripData>;
  retentionCurve: SectionState<RetentionCurveData>;
  verdict: SectionState<Verdict>;
  priorities: SectionState<PrioritiesList>;
  signals: SectionState<SignalsData>;
};

export type StreamPhase = "idle" | "gathering" | "synthesizing" | "done" | "error";

function pending<T>(): SectionState<T> {
  return { status: "pending", data: null, error: null };
}

export function createInitialReport(): PartialFullReport {
  return {
    videoAudit: pending(),
    discoverability: pending(),
    promotionPlaybook: pending(),
    retention: pending(),
    hookAnalysis: pending(),
    scoreStrip: pending(),
    retentionCurve: pending(),
    verdict: pending(),
    priorities: pending(),
    signals: pending(),
  };
}

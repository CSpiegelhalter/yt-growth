import type {
  Discoverability,
  HookAnalysis,
  PromotionAction,
  RetentionAnalysis,
  VideoAudit,
} from "@/lib/features/full-report";

export type SectionStatus = "pending" | "loading" | "done" | "error";

export type SectionState<T> = {
  status: SectionStatus;
  data: T | null;
  error: string | null;
};

export type PartialFullReport = {
  videoAudit: SectionState<VideoAudit>;
  discoverability: SectionState<Discoverability>;
  promotionPlaybook: SectionState<PromotionAction[]>;
  retention: SectionState<RetentionAnalysis>;
  hookAnalysis: SectionState<HookAnalysis>;
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
  };
}

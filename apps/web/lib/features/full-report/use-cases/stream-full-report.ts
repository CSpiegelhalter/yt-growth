import { createLogger } from "@/lib/shared/logger";

import type { FullReportDeps, InsightContext, ReportStreamEvent } from "../types";
import { computeDeterministicAudits } from "./compute-audit";
import { gatherReportData } from "./gather-report-data";
import {
  synthesizeDiscoverability,
  synthesizeHookAnalysis,
  synthesizePromotion,
  synthesizeRetention,
} from "./synthesize-sections";

const log = createLogger({ subsystem: "full-report" });

type StreamInput = {
  userId: number;
  channelId: string;
  videoId: string;
  range: string;
};

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function* streamFullReport(
  input: StreamInput,
  insightContext: InsightContext,
  deps: FullReportDeps,
): AsyncGenerator<ReportStreamEvent> {
  log.info("Streaming full report", { videoId: input.videoId });

  yield { type: "status", phase: "gathering" };
  const gathered = await gatherReportData(input, insightContext, deps);

  // Deterministic audit — available immediately after gathering
  const auditItems = computeDeterministicAudits(gathered.videoSignals);
  yield { type: "section", key: "videoAudit", data: { items: auditItems } };

  yield { type: "status", phase: "synthesizing" };

  // 4 parallel LLM calls
  const { callLlm } = deps;
  const results = await Promise.allSettled([
    synthesizeDiscoverability(gathered, callLlm),
    synthesizePromotion(gathered, callLlm),
    synthesizeRetention(gathered, callLlm),
    synthesizeHookAnalysis(gathered, callLlm),
  ]);

  const keys = ["discoverability", "promotionPlaybook", "retention", "hookAnalysis"] as const;

  for (const [i, result] of results.entries()) {
    const key = keys[i];
    const event: ReportStreamEvent = result.status === "fulfilled"
      ? { type: "section", key, data: result.value } as ReportStreamEvent
      : { type: "error", key, error: toErrorMessage(result.reason) };
    yield event;
  }

  yield { type: "done" };
}

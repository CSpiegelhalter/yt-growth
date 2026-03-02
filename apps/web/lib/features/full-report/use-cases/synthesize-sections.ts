import type { LlmCallFn } from "@/lib/features/video-insights/types";
import { createLogger } from "@/lib/shared/logger";

import { FullReportError } from "../errors";
import type {
  Discoverability,
  GatheredData,
  HookAnalysis,
  PromotionAction,
  RetentionAnalysis,
} from "../types";
import {
  sanitizeDiscoverability,
  sanitizeHookAnalysis,
  sanitizePromotionAction,
  sanitizeRetention,
} from "./sanitize-full-report";
import {
  buildDiscoverabilityPrompt,
  buildHookAnalysisPrompt,
  buildPromotionPrompt,
  buildRetentionPrompt,
} from "./synthesis-prompt";

const log = createLogger({ subsystem: "full-report" });

function callSection(
  name: string,
  prompt: { system: string; user: string },
  callLlm: LlmCallFn,
  maxTokens: number,
): Promise<unknown> {
  return callLlm(
    [
      { role: "system", content: prompt.system },
      { role: "user", content: prompt.user },
    ],
    { maxTokens, temperature: 0.3, responseFormat: "json_object" },
  ).then((r) => {
    const parsed: unknown = JSON.parse(r.content);
    log.info(`${name} synthesis complete`);
    return parsed;
  });
}

export async function synthesizeDiscoverability(
  data: GatheredData,
  callLlm: LlmCallFn,
): Promise<Discoverability> {
  try {
    const raw = await callSection("discoverability", buildDiscoverabilityPrompt(data), callLlm, 1500);
    return sanitizeDiscoverability(raw);
  } catch (error) {
    log.error("Discoverability synthesis failed", { error });
    throw new FullReportError("SECTION_FAILURE", "Discoverability synthesis failed", error);
  }
}

export async function synthesizePromotion(
  data: GatheredData,
  callLlm: LlmCallFn,
): Promise<PromotionAction[]> {
  try {
    const raw = await callSection("promotion", buildPromotionPrompt(data), callLlm, 800);
    const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const list = Array.isArray(obj.promotionPlaybook) ? obj.promotionPlaybook : [];
    return list
      .map((p) => sanitizePromotionAction(p))
      .filter((p): p is PromotionAction => p !== null)
      .slice(0, 8);
  } catch (error) {
    log.error("Promotion synthesis failed", { error });
    throw new FullReportError("SECTION_FAILURE", "Promotion synthesis failed", error);
  }
}

export async function synthesizeRetention(
  data: GatheredData,
  callLlm: LlmCallFn,
): Promise<RetentionAnalysis> {
  try {
    const raw = await callSection("retention", buildRetentionPrompt(data), callLlm, 600);
    return sanitizeRetention(raw);
  } catch (error) {
    log.error("Retention synthesis failed", { error });
    throw new FullReportError("SECTION_FAILURE", "Retention synthesis failed", error);
  }
}

export async function synthesizeHookAnalysis(
  data: GatheredData,
  callLlm: LlmCallFn,
): Promise<HookAnalysis> {
  try {
    const raw = await callSection("hookAnalysis", buildHookAnalysisPrompt(data), callLlm, 600);
    return sanitizeHookAnalysis(raw);
  } catch (error) {
    log.error("Hook analysis synthesis failed", { error });
    throw new FullReportError("SECTION_FAILURE", "Hook analysis synthesis failed", error);
  }
}

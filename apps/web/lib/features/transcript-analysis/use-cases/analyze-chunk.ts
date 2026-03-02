import type { LlmCallFn } from "@/lib/features/video-insights/types";

import type {
  ChunkAnalysisResult,
  ChunkCta,
  CtaType,
  PacingDensity,
  TranscriptChunk,
} from "../types";
import { buildChunkSystemPrompt, buildChunkUserPrompt } from "./chunk-prompts";

const VALID_CTA_TYPES = new Set<CtaType>([
  "subscribe",
  "like",
  "comment",
  "link",
  "other",
]);

const VALID_PACING = new Set<PacingDensity>(["low", "medium", "high"]);

function sanitizeCtas(raw: unknown[]): ChunkCta[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .filter(
      (c): c is { timeSec: number; type: string; quote: string } =>
        typeof c === "object" &&
        c !== null &&
        typeof (c as Record<string, unknown>).timeSec === "number" &&
        typeof (c as Record<string, unknown>).type === "string" &&
        typeof (c as Record<string, unknown>).quote === "string",
    )
    .map((c) => ({
      timeSec: c.timeSec,
      type: VALID_CTA_TYPES.has(c.type as CtaType)
        ? (c.type as CtaType)
        : "other",
      quote: c.quote,
    }));
}

function sanitizeFrictionPoints(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .filter((f): f is string => typeof f === "string")
    .filter((f) => f.length > 0);
}

function sanitizeValueDensity(raw: unknown): number {
  if (typeof raw === "number" && raw >= 1 && raw <= 10) {
    return Math.round(raw);
  }
  return 5;
}

export async function analyzeChunk(
  chunk: TranscriptChunk,
  videoTitle: string,
  callLlm: LlmCallFn,
  totalChunks: number,
): Promise<ChunkAnalysisResult> {
  const isFirstChunk = chunk.index === 0;
  const isLastChunk = chunk.index === totalChunks - 1;
  const durationSec = chunk.endTimeSec - chunk.startTimeSec;
  const wordsPerMinute =
    durationSec > 0 ? Math.round((chunk.wordCount / durationSec) * 60) : 0;

  const result = await callLlm(
    [
      { role: "system", content: buildChunkSystemPrompt(isFirstChunk) },
      { role: "user", content: buildChunkUserPrompt(chunk, videoTitle, isLastChunk) },
    ],
    { maxTokens: 800, temperature: 0.2, responseFormat: "json_object" },
  );

  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(result.content) as Record<string, unknown>;
  } catch {
    // Fall through to defaults
  }

  const keywords = Array.isArray(parsed.keywords)
    ? (parsed.keywords as unknown[])
        .filter((k): k is string => typeof k === "string")
        .slice(0, 8)
    : [];

  const pacingDensity = VALID_PACING.has(parsed.pacingDensity as PacingDensity)
    ? (parsed.pacingDensity as PacingDensity)
    : "medium";

  const dropOffHypothesis =
    typeof parsed.dropOffHypothesis === "string"
      ? parsed.dropOffHypothesis
      : null;

  const topicSummary =
    typeof parsed.topicSummary === "string" ? parsed.topicSummary : "";

  const verbatimOpening =
    isFirstChunk && typeof parsed.verbatimOpening === "string"
      ? parsed.verbatimOpening
      : null;

  return {
    chunkIndex: chunk.index,
    startTimeSec: chunk.startTimeSec,
    endTimeSec: chunk.endTimeSec,
    ctas: sanitizeCtas(parsed.ctas as unknown[]),
    keywords,
    topicSummary,
    wordsPerMinute,
    pacingDensity,
    dropOffHypothesis,
    frictionPoints: sanitizeFrictionPoints(parsed.frictionPoints),
    valueDensity: sanitizeValueDensity(parsed.valueDensity),
    verbatimOpening,
  };
}

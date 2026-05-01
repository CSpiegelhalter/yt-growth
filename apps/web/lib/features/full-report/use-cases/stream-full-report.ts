import type { Prisma } from "@prisma/client";

import { buildRetentionCurveData, buildScoreStripData } from "@/lib/owned-video-baseline";
import { hashVideoContent } from "@/lib/shared/content-hash";
import { createLogger } from "@/lib/shared/logger";
import { prisma } from "@/prisma";

import type {
  Discoverability,
  FullReportDeps,
  HookAnalysis,
  InsightContext,
  PromotionAction,
  ReportSectionKey,
  ReportStreamEvent,
  RetentionAnalysis,
  RetentionCurveData,
  ScoreStripData,
  SignalsData,
  VideoAudit,
} from "../types";
import { computeDeterministicAudits } from "./compute-audit";
import { computeSignals } from "./compute-signals";
import { gatherReportData } from "./gather-report-data";
import {
  synthesizeDiscoverability,
  synthesizeHookAnalysis,
  synthesizePromotion,
  synthesizeRetention,
} from "./synthesize-sections";
import { classifyVideoAge, synthesizeVerdict } from "./synthesize-verdict";

const log = createLogger({ subsystem: "full-report" });
const SECTION_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const LOCK_TTL_MS = 5 * 60 * 1000;

async function acquireGenerationLock(videoId: string): Promise<boolean> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + LOCK_TTL_MS);

  try {
    await prisma.reportGenerationLock.create({
      data: { videoId, startedAt: now, expiresAt },
    });
    return true;
  } catch {
    // Unique constraint violation — check if stale
    const existing = await prisma.reportGenerationLock.findUnique({
      where: { videoId },
    });
    if (existing && existing.expiresAt < now) {
      // Stale lock — overwrite
      await prisma.reportGenerationLock.update({
        where: { videoId },
        data: { startedAt: now, expiresAt },
      });
      return true;
    }
    return false;
  }
}

async function releaseGenerationLock(videoId: string): Promise<void> {
  await prisma.reportGenerationLock
    .delete({ where: { videoId } })
    .catch(() => {});
}

const ALL_SECTION_KEYS: ReportSectionKey[] = [
  "videoAudit",
  "discoverability",
  "promotionPlaybook",
  "retention",
  "hookAnalysis",
  "scoreStrip",
  "retentionCurve",
  "signals",
  "verdict",
  "priorities",
];

/** Sections produced by the four parallel LLM synthesizers. */
const LLM_SECTION_KEYS = new Set<ReportSectionKey>([
  "discoverability",
  "promotionPlaybook",
  "retention",
  "hookAnalysis",
]);

type StreamInput = {
  userId: number;
  channelId: string;
  videoId: string;
  range: string;
  sections?: ReportSectionKey[];
};

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function computeContentHash(derivedData: InsightContext["derivedData"]): string {
  return hashVideoContent({
    title: derivedData.video.title,
    description: derivedData.video.description,
    tags: derivedData.video.tags,
    durationSec: derivedData.video.durationSec,
    categoryId: derivedData.video.categoryId,
  });
}

function writeSectionCache(
  videoId: string,
  sectionKey: string,
  contentHash: string,
  sectionData: unknown,
): void {
  const cachedUntil = new Date(Date.now() + SECTION_CACHE_TTL_MS);
  prisma.fullReportSectionCache
    .upsert({
      where: { videoId_sectionKey: { videoId, sectionKey } },
      create: {
        videoId,
        sectionKey,
        contentHash,
        sectionData: sectionData as Prisma.InputJsonValue,
        cachedUntil,
      },
      update: {
        contentHash,
        sectionData: sectionData as Prisma.InputJsonValue,
        cachedUntil,
      },
    })
    .catch((error) => {
      log.warn("Failed to cache report section", { videoId, sectionKey, error });
    });
}

type SectionResults = {
  videoAudit: VideoAudit | null;
  discoverability: Discoverability | null;
  promotionPlaybook: PromotionAction[] | null;
  retention: RetentionAnalysis | null;
  hookAnalysis: HookAnalysis | null;
};

function hydrateResultsFromCache(cachedMap: Map<ReportSectionKey, unknown>): SectionResults {
  return {
    videoAudit: (cachedMap.get("videoAudit") as VideoAudit | undefined) ?? null,
    discoverability: (cachedMap.get("discoverability") as Discoverability | undefined) ?? null,
    promotionPlaybook: (cachedMap.get("promotionPlaybook") as PromotionAction[] | undefined) ?? null,
    retention: (cachedMap.get("retention") as RetentionAnalysis | undefined) ?? null,
    hookAnalysis: (cachedMap.get("hookAnalysis") as HookAnalysis | undefined) ?? null,
  };
}

function captureLlmResult(results: SectionResults, key: ReportSectionKey, value: unknown): void {
  switch (key) {
    case "discoverability": {
      results.discoverability = value as Discoverability;
      break;
    }
    case "promotionPlaybook": {
      results.promotionPlaybook = value as PromotionAction[];
      break;
    }
    case "retention": {
      results.retention = value as RetentionAnalysis;
      break;
    }
    case "hookAnalysis": {
      results.hookAnalysis = value as HookAnalysis;
      break;
    }
    default: {
      // Other section keys are not produced by the LLM synthesizers.
      break;
    }
  }
}

function buildSynthMap(
  gathered: Awaited<ReturnType<typeof gatherReportData>>,
  callLlm: FullReportDeps["callLlm"],
): Record<string, () => Promise<unknown>> {
  return {
    discoverability: () => synthesizeDiscoverability(gathered, callLlm),
    promotionPlaybook: () => synthesizePromotion(gathered, callLlm),
    retention: () => synthesizeRetention(gathered, callLlm),
    hookAnalysis: () => synthesizeHookAnalysis(gathered, callLlm),
  };
}

function readScoreStrip(
  cachedMap: Map<ReportSectionKey, unknown>,
  insightContext: InsightContext,
): ScoreStripData {
  if (cachedMap.has("scoreStrip")) {
    return cachedMap.get("scoreStrip") as ScoreStripData;
  }
  return buildScoreStripData(insightContext.derivedData.derived, insightContext.baseline);
}

async function loadCachedMap(
  videoId: string,
  contentHash: string,
  forcedSections: ReportSectionKey[] | undefined,
): Promise<Map<ReportSectionKey, unknown>> {
  const now = new Date();
  const cachedSections = await prisma.fullReportSectionCache.findMany({
    where: {
      videoId,
      cachedUntil: { gt: now },
      contentHash,
    },
  });
  const map = new Map<ReportSectionKey, unknown>(
    cachedSections.map((s) => [s.sectionKey as ReportSectionKey, s.sectionData]),
  );

  if (forcedSections) {
    for (const key of forcedSections) {
      map.delete(key);
    }
    if (forcedSections.some((k) => LLM_SECTION_KEYS.has(k))) {
      map.delete("verdict");
      map.delete("priorities");
      // Signals depend on retention LLM output; invalidate if any LLM section regenerates.
      map.delete("signals");
    }
  }
  return map;
}

async function* emitCachedSections(
  cachedMap: Map<ReportSectionKey, unknown>,
  videoId: string,
): AsyncGenerator<ReportStreamEvent> {
  for (const [key, data] of cachedMap) {
    log.info("Serving cached section", { videoId, key });
    yield { type: "section", key, data } as ReportStreamEvent;
  }
}

async function* runDeterministicStage(
  input: StreamInput,
  insightContext: InsightContext,
  contentHash: string,
  uncachedKeys: ReportSectionKey[],
  gathered: Awaited<ReturnType<typeof gatherReportData>>,
  results: SectionResults,
): AsyncGenerator<ReportStreamEvent> {
  if (uncachedKeys.includes("scoreStrip")) {
    const scoreStrip = buildScoreStripData(
      insightContext.derivedData.derived,
      insightContext.baseline,
    );
    yield { type: "section", key: "scoreStrip", data: scoreStrip };
    writeSectionCache(input.videoId, "scoreStrip", contentHash, scoreStrip);
  }

  if (uncachedKeys.includes("videoAudit")) {
    const auditData = { items: computeDeterministicAudits(gathered.videoSignals) };
    results.videoAudit = auditData;
    yield { type: "section", key: "videoAudit", data: auditData };
    writeSectionCache(input.videoId, "videoAudit", contentHash, auditData);
  }
}

async function* runLlmStage(
  input: StreamInput,
  contentHash: string,
  uncachedKeys: ReportSectionKey[],
  gathered: Awaited<ReturnType<typeof gatherReportData>>,
  callLlm: FullReportDeps["callLlm"],
  results: SectionResults,
): AsyncGenerator<ReportStreamEvent> {
  const llmSections = uncachedKeys.filter((k) => LLM_SECTION_KEYS.has(k));
  if (llmSections.length === 0) {return;}

  yield { type: "status", phase: "synthesizing" };
  const synthMap = buildSynthMap(gathered, callLlm);
  const settled = await Promise.allSettled(
    llmSections.map((key) => synthMap[key]!()),
  );

  for (const [i, result] of settled.entries()) {
    const key = llmSections[i]!;
    if (result.status === "fulfilled") {
      yield { type: "section", key, data: result.value } as ReportStreamEvent;
      writeSectionCache(input.videoId, key, contentHash, result.value);
      captureLlmResult(results, key, result.value);
    } else {
      yield { type: "error", key, error: toErrorMessage(result.reason), retryable: true };
    }
  }
}

async function* runRetentionCurveStage(
  input: StreamInput,
  insightContext: InsightContext,
  contentHash: string,
  uncachedKeys: ReportSectionKey[],
  gathered: Awaited<ReturnType<typeof gatherReportData>>,
  cachedMap: Map<ReportSectionKey, unknown>,
  results: SectionResults,
): AsyncGenerator<ReportStreamEvent> {
  if (!uncachedKeys.includes("retentionCurve")) {return;}
  const curveData = buildRetentionCurveData(
    gathered.retentionCurveRaw,
    insightContext.derivedData.video.durationSec,
    results.retention,
    input.videoId,
    gathered.transcriptReport
      ? {
          contentStructure: gathered.transcriptReport.contentStructure,
          chunkAnalyses: gathered.transcriptReport.chunkAnalyses,
        }
      : null,
  );
  yield { type: "section", key: "retentionCurve", data: curveData };
  writeSectionCache(input.videoId, "retentionCurve", contentHash, curveData);
  // Signals consume the curve samples; cache them in the map for the next stage.
  cachedMap.set("retentionCurve", curveData);
}

async function* runSignalsStage(
  input: StreamInput,
  insightContext: InsightContext,
  contentHash: string,
  uncachedKeys: ReportSectionKey[],
  gathered: Awaited<ReturnType<typeof gatherReportData>>,
  cachedMap: Map<ReportSectionKey, unknown>,
): AsyncGenerator<ReportStreamEvent> {
  if (!uncachedKeys.includes("signals")) {return;}
  const curve = (cachedMap.get("retentionCurve") as RetentionCurveData | undefined)?.samples ?? [];
  const signals: SignalsData = computeSignals(
    gathered,
    curve,
    insightContext.derivedData.video.durationSec,
  );
  yield { type: "section", key: "signals", data: signals };
  writeSectionCache(input.videoId, "signals", contentHash, signals);
}

async function* runVerdictStage(
  input: StreamInput,
  insightContext: InsightContext,
  contentHash: string,
  uncachedKeys: ReportSectionKey[],
  cachedMap: Map<ReportSectionKey, unknown>,
  callLlm: FullReportDeps["callLlm"],
  results: SectionResults,
): AsyncGenerator<ReportStreamEvent> {
  const wantsVerdict = uncachedKeys.includes("verdict");
  const wantsPriorities = uncachedKeys.includes("priorities");
  if (!wantsVerdict && !wantsPriorities) {return;}

  try {
    const scoreStrip = readScoreStrip(cachedMap, insightContext);
    const verdictResult = await synthesizeVerdict(
      {
        videoTitle: insightContext.derivedData.video.title,
        videoAge: classifyVideoAge(insightContext.videoPublishedAt),
        scoreStrip,
        audit: results.videoAudit,
        retention: results.retention,
        hookAnalysis: results.hookAnalysis,
        discoverability: results.discoverability,
        promotion: results.promotionPlaybook,
      },
      callLlm,
    );

    if (wantsVerdict) {
      yield { type: "section", key: "verdict", data: verdictResult.verdict };
      writeSectionCache(input.videoId, "verdict", contentHash, verdictResult.verdict);
    }
    if (wantsPriorities) {
      yield { type: "section", key: "priorities", data: verdictResult.priorities };
      writeSectionCache(input.videoId, "priorities", contentHash, verdictResult.priorities);
    }
  } catch (error) {
    const message = toErrorMessage(error);
    if (wantsVerdict) {
      yield { type: "error", key: "verdict", error: message, retryable: true };
    }
    if (wantsPriorities) {
      yield { type: "error", key: "priorities", error: message, retryable: true };
    }
  }
}

async function* runGenerationStages(
  input: StreamInput,
  insightContext: InsightContext,
  deps: FullReportDeps,
  contentHash: string,
  cachedMap: Map<ReportSectionKey, unknown>,
  uncachedKeys: ReportSectionKey[],
  results: SectionResults,
): AsyncGenerator<ReportStreamEvent> {
  yield { type: "status", phase: "gathering" };
  const gathered = await gatherReportData(input, insightContext, deps);

  yield* runDeterministicStage(input, insightContext, contentHash, uncachedKeys, gathered, results);
  yield* runLlmStage(input, contentHash, uncachedKeys, gathered, deps.callLlm, results);
  yield* runRetentionCurveStage(input, insightContext, contentHash, uncachedKeys, gathered, cachedMap, results);
  yield* runSignalsStage(input, insightContext, contentHash, uncachedKeys, gathered, cachedMap);
  yield* runVerdictStage(input, insightContext, contentHash, uncachedKeys, cachedMap, deps.callLlm, results);
}

async function* emitFullCacheHit(
  cachedMap: Map<ReportSectionKey, unknown>,
): AsyncGenerator<ReportStreamEvent> {
  for (const key of ALL_SECTION_KEYS) {
    if (cachedMap.has(key)) {
      yield { type: "section", key, data: cachedMap.get(key) } as ReportStreamEvent;
    }
  }
}

export async function* streamFullReport(
  input: StreamInput,
  insightContext: InsightContext,
  deps: FullReportDeps,
): AsyncGenerator<ReportStreamEvent> {
  log.info("Streaming full report", { videoId: input.videoId });

  const contentHash = computeContentHash(insightContext.derivedData);
  const cachedMap = await loadCachedMap(input.videoId, contentHash, input.sections);
  const targetKeys = input.sections ?? ALL_SECTION_KEYS;
  const uncachedKeys = targetKeys.filter((k) => !cachedMap.has(k));

  if (uncachedKeys.length === 0) {
    log.info("Full cache hit, serving all sections from cache", { videoId: input.videoId });
    yield* emitFullCacheHit(cachedMap);
    yield { type: "done" };
    return;
  }

  yield* emitCachedSections(cachedMap, input.videoId);

  const lockAcquired = await acquireGenerationLock(input.videoId);
  if (!lockAcquired) {
    log.warn("Generation lock held by another process", { videoId: input.videoId });
    yield {
      type: "error",
      key: "videoAudit",
      error: "Report generation already in progress",
    };
    yield { type: "done" };
    return;
  }

  const results = hydrateResultsFromCache(cachedMap);

  try {
    yield* runGenerationStages(
      input,
      insightContext,
      deps,
      contentHash,
      cachedMap,
      uncachedKeys,
      results,
    );
  } finally {
    await releaseGenerationLock(input.videoId);
  }

  yield { type: "done" };
}

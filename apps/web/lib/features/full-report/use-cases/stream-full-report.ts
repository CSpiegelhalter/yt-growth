import type { Prisma } from "@prisma/client";

import { hashVideoContent } from "@/lib/shared/content-hash";
import { createLogger } from "@/lib/shared/logger";
import { prisma } from "@/prisma";

import type {
  FullReportDeps,
  InsightContext,
  ReportSectionKey,
  ReportStreamEvent,
} from "../types";
import { computeDeterministicAudits } from "./compute-audit";
import { gatherReportData } from "./gather-report-data";
import {
  synthesizeDiscoverability,
  synthesizeHookAnalysis,
  synthesizePromotion,
  synthesizeRetention,
} from "./synthesize-sections";

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
];

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

export async function* streamFullReport(
  input: StreamInput,
  insightContext: InsightContext,
  deps: FullReportDeps,
): AsyncGenerator<ReportStreamEvent> {
  log.info("Streaming full report", { videoId: input.videoId });

  const contentHash = computeContentHash(insightContext.derivedData);

  // T015: Check section cache
  const now = new Date();
  const cachedSections = await prisma.fullReportSectionCache.findMany({
    where: {
      videoId: input.videoId,
      cachedUntil: { gt: now },
      contentHash,
    },
  });

  const cachedMap = new Map(
    cachedSections.map((s) => [s.sectionKey as ReportSectionKey, s.sectionData]),
  );

  // When specific sections are requested (retry), force-regenerate those sections
  const forcedSections = input.sections;
  if (forcedSections) {
    for (const key of forcedSections) {
      cachedMap.delete(key);
    }
  }

  const targetKeys = forcedSections ?? ALL_SECTION_KEYS;
  const uncachedKeys = targetKeys.filter((k) => !cachedMap.has(k));

  // T016: Full cache hit — emit all cached sections immediately
  if (uncachedKeys.length === 0) {
    log.info("Full cache hit, serving all sections from cache", {
      videoId: input.videoId,
    });
    for (const key of ALL_SECTION_KEYS) {
      yield { type: "section", key, data: cachedMap.get(key) } as ReportStreamEvent;
    }
    yield { type: "done" };
    return;
  }

  // Partial cache hit — emit cached sections immediately
  for (const [key, data] of cachedMap) {
    log.info("Serving cached section", { videoId: input.videoId, key });
    yield { type: "section", key, data } as ReportStreamEvent;
  }

  // T019: Acquire generation lock before doing LLM work
  const lockAcquired = await acquireGenerationLock(input.videoId);
  if (!lockAcquired) {
    log.warn("Generation lock held by another process", {
      videoId: input.videoId,
    });
    yield {
      type: "error",
      key: "videoAudit",
      error: "Report generation already in progress",
    };
    yield { type: "done" };
    return;
  }

  try {
    // Gather data and synthesize only uncached sections
    yield { type: "status", phase: "gathering" };
    const gathered = await gatherReportData(input, insightContext, deps);

    // Video audit — deterministic, available immediately after gathering
    if (uncachedKeys.includes("videoAudit")) {
      const auditItems = computeDeterministicAudits(gathered.videoSignals);
      const auditData = { items: auditItems };
      yield { type: "section", key: "videoAudit", data: auditData };
      writeSectionCache(input.videoId, "videoAudit", contentHash, auditData);
    }

    // Synthesize only uncached LLM sections
    const llmSections = uncachedKeys.filter((k) => k !== "videoAudit");
    if (llmSections.length > 0) {
      yield { type: "status", phase: "synthesizing" };

      const { callLlm } = deps;
      const synthMap: Record<string, () => Promise<unknown>> = {
        discoverability: () => synthesizeDiscoverability(gathered, callLlm),
        promotionPlaybook: () => synthesizePromotion(gathered, callLlm),
        retention: () => synthesizeRetention(gathered, callLlm),
        hookAnalysis: () => synthesizeHookAnalysis(gathered, callLlm),
      };

      const results = await Promise.allSettled(
        llmSections.map((key) => synthMap[key]!()),
      );

      for (const [i, result] of results.entries()) {
        const key = llmSections[i]!;
        if (result.status === "fulfilled") {
          yield { type: "section", key, data: result.value } as ReportStreamEvent;
          writeSectionCache(input.videoId, key, contentHash, result.value);
        } else {
          yield { type: "error", key, error: toErrorMessage(result.reason), retryable: true };
        }
      }
    }
  } finally {
    await releaseGenerationLock(input.videoId);
  }

  yield { type: "done" };
}

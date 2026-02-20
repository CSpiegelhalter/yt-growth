/**
 * Competitor Video Detail - Cache Operations
 *
 * Database read/write helpers for caching video and comments data.
 * Uses Prisma $transaction for parallel reads where possible.
 */

import { prisma } from "@/prisma";
import { createLogger } from "@/lib/logger";
import type {
  CachedCompetitorVideo,
  CachedComments,
  RequestContext,
} from "./types";
import { CACHE_CONFIG as CONFIG } from "./types";
import type { Prisma } from "@prisma/client";

const logger = createLogger({ module: "video-detail.cache" });

// ============================================
// PARALLEL CACHE READS
// ============================================

/**
 * Result of parallel cache reads.
 */
type CacheReadResult = {
  cachedVideo: CachedCompetitorVideo | null;
  cachedComments: CachedComments | null;
  channelOwnership: { id: number; title: string | null } | null;
};

/**
 * Read all cached data in parallel using Prisma transaction.
 * This reduces DB round-trips from 3 sequential to 1 parallel batch.
 */
export async function readCachesParallel(
  videoId: string,
  youtubeChannelId: string,
  userId: number,
  ctx: RequestContext
): Promise<CacheReadResult> {
  const startTime = Date.now();

  const [cachedVideo, cachedComments, channel] = await prisma.$transaction([
    // Get cached video with snapshots
    prisma.competitorVideo.findUnique({
      where: { videoId },
      include: {
        Snapshots: {
          orderBy: { capturedAt: "desc" },
          take: 5,
        },
      },
    }),
    // Get cached comments
    prisma.competitorVideoComments.findUnique({
      where: { videoId },
    }),
    // Verify channel ownership
    prisma.channel.findFirst({
      where: {
        youtubeChannelId,
        userId,
      },
      select: {
        id: true,
        title: true,
      },
    }),
  ]);

  ctx.timings.push({
    stage: "db.cacheReads",
    durationMs: Date.now() - startTime,
  });

  logger.info("Cache reads complete", {
    videoId,
    hasCachedVideo: !!cachedVideo,
    hasCachedComments: !!cachedComments,
    hasChannel: !!channel,
    snapshotCount: cachedVideo?.Snapshots?.length ?? 0,
    durationMs: Date.now() - startTime,
  });

  return {
    cachedVideo: cachedVideo as CachedCompetitorVideo | null,
    cachedComments: cachedComments as CachedComments | null,
    channelOwnership: channel,
  };
}

// ============================================
// CACHE FRESHNESS CHECKS
// ============================================

/**
 * Check if cached comments analysis is fresh.
 */
export function isCommentsCacheFresh(
  cachedComments: CachedComments | null
): boolean {
  if (!cachedComments) return false;

  const now = Date.now();
  const capturedAt = cachedComments.capturedAt.getTime();
  const freshnessMs = CONFIG.COMMENTS_FRESHNESS_DAYS * 24 * 60 * 60 * 1000;

  return now - capturedAt < freshnessMs;
}

/**
 * Check if cached main analysis is fresh.
 * Considers both time window and content hash match.
 */
export function isAnalysisCacheFresh(
  cachedVideo: CachedCompetitorVideo | null,
  currentContentHash: string
): boolean {
  if (!cachedVideo?.analysisJson || !cachedVideo.analysisCapturedAt) {
    return false;
  }

  const now = Date.now();
  const capturedAt = cachedVideo.analysisCapturedAt.getTime();
  const freshnessMs = CONFIG.ANALYSIS_FRESHNESS_DAYS * 24 * 60 * 60 * 1000;

  const isWithinTimeWindow = now - capturedAt < freshnessMs;
  const contentHashMatches =
    cachedVideo.analysisContentHash === currentContentHash ||
    !cachedVideo.analysisContentHash;

  return isWithinTimeWindow && contentHashMatches;
}

// ============================================
// VIDEO UPSERT
// ============================================

/**
 * Upsert competitor video metadata.
 * Updates if exists, creates if not.
 */
export async function upsertCompetitorVideo(
  videoId: string,
  data: {
    channelId: string;
    channelTitle: string;
    title: string;
    description: string | null;
    publishedAt: Date;
    durationSec: number | null;
    thumbnailUrl: string | null;
    tags: string[];
    categoryId: string | null;
  }
): Promise<void> {
  const now = new Date();

  const fields = {
    channelId: data.channelId,
    channelTitle: data.channelTitle,
    title: data.title,
    description: data.description ?? undefined,
    publishedAt: data.publishedAt,
    durationSec: data.durationSec ?? undefined,
    thumbnailUrl: data.thumbnailUrl ?? undefined,
    tags: data.tags,
    categoryId: data.categoryId ?? undefined,
    lastFetchedAt: now,
  };

  await prisma.competitorVideo.upsert({
    where: { videoId },
    create: { videoId, ...fields },
    update: fields,
  });
}

// ============================================
// ANALYSIS CACHE WRITES
// ============================================

/**
 * Save main analysis to cache.
 * Non-blocking - logs errors but doesn't throw.
 */
export async function saveAnalysisCache(
  videoId: string,
  analysisJson: object,
  contentHash: string
): Promise<void> {
  const now = new Date();

  try {
    await prisma.competitorVideo.update({
      where: { videoId },
      data: {
        analysisJson,
        analysisContentHash: contentHash,
        analysisCapturedAt: now,
      },
    });

    logger.info("Analysis cache saved", { videoId, contentHash });
  } catch (err) {
    logger.warn("Failed to save analysis cache", {
      videoId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Backfill beat checklist to existing cached analysis.
 * Used when analysis was cached without beat checklist.
 */
export async function backfillBeatChecklist(
  videoId: string,
  existingAnalysis: object,
  beatThisVideo: Array<{ action: string; difficulty: string; impact: string }>
): Promise<void> {
  try {
    await prisma.competitorVideo.update({
      where: { videoId },
      data: {
        analysisJson: {
          ...existingAnalysis,
          beatThisVideo,
        } as Prisma.InputJsonValue,
      },
    });

    logger.info("Beat checklist backfilled", { videoId });
  } catch (err) {
    logger.warn("Failed to backfill beat checklist", {
      videoId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// ============================================
// COMMENTS CACHE WRITES
// ============================================

/**
 * Save comments analysis to cache.
 * Non-blocking - logs errors but doesn't throw.
 */
export async function saveCommentsCache(
  videoId: string,
  data: {
    topCommentsJson: Array<{ text: string; likeCount: number; authorName: string }>;
    contentHash: string;
    analysisJson: object;
    sentiment: { positive: number; neutral: number; negative: number };
    themes: Array<{ theme: string; count: number; examples: string[] }>;
  }
): Promise<void> {
  const now = new Date();

  try {
    await prisma.competitorVideoComments.upsert({
      where: { videoId },
      create: {
        videoId,
        capturedAt: now,
        topCommentsJson: data.topCommentsJson as Prisma.InputJsonValue,
        contentHash: data.contentHash,
        analysisJson: data.analysisJson as Prisma.InputJsonValue,
        sentimentPos: data.sentiment.positive,
        sentimentNeu: data.sentiment.neutral,
        sentimentNeg: data.sentiment.negative,
        themesJson: data.themes as Prisma.InputJsonValue,
      },
      update: {
        capturedAt: now,
        topCommentsJson: data.topCommentsJson as Prisma.InputJsonValue,
        contentHash: data.contentHash,
        analysisJson: data.analysisJson as Prisma.InputJsonValue,
        sentimentPos: data.sentiment.positive,
        sentimentNeu: data.sentiment.neutral,
        sentimentNeg: data.sentiment.negative,
        themesJson: data.themes as Prisma.InputJsonValue,
      },
    });

    logger.info("Comments cache saved", { videoId, contentHash: data.contentHash });
  } catch (err) {
    logger.warn("Failed to save comments cache", {
      videoId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

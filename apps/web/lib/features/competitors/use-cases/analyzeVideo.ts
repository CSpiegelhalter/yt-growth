import "server-only";

import {
  backfillBeatChecklist,
  buildMoreFromChannel,
  buildResponse,
  buildVideoObject,
  cacheCommentsInBackground,
  fetchCommentsWithTimeout,
  fetchRecentChannelVideosWithTimeout,
  fetchVideoDetailsWithTimeout,
  getGoogleAccountOrThrow,
  isAnalysisCacheFresh,
  isCommentsCacheFresh,
  normalizeAnalysis,
  normalizeBeatChecklist,
  readCachesParallel,
  type RequestContext,
  runParallelAnalysis,
  saveAnalysisCache,
  upsertCompetitorVideo,
  VideoDetailError,
} from "@/lib/competitors/video-detail";
import { hashCommentsContent,hashVideoContent } from "@/lib/shared/content-hash";
import { createLogger } from "@/lib/shared/logger";
import { checkRateLimit, RATE_LIMITS,rateLimitKey } from "@/lib/shared/rate-limit";
import type {
  CompetitorCommentsAnalysis,
  CompetitorVideoAnalysis,
} from "@/types/api";

import { CompetitorError } from "../errors";
import type { AnalyzeVideoInput } from "../types";

const logger = createLogger({ module: "features.competitors.analyzeVideo" });

const VIDEO_DETAIL_CODE_MAP: Record<string, string> = {
  VALIDATION_ERROR: "INVALID_INPUT",
  AUTH_ERROR: "UNAUTHORIZED",
  RATE_LIMIT: "RATE_LIMITED",
  VIDEO_NOT_FOUND: "NOT_FOUND",
  CHANNEL_NOT_FOUND: "NOT_FOUND",
  GOOGLE_ACCOUNT_MISSING: "INVALID_INPUT",
  LLM_TIMEOUT: "TIMEOUT",
  LLM_ERROR: "EXTERNAL_FAILURE",
  YOUTUBE_ERROR: "EXTERNAL_FAILURE",
  INTERNAL_ERROR: "EXTERNAL_FAILURE",
};

function toCompetitorError(err: VideoDetailError): CompetitorError {
  return new CompetitorError(
    VIDEO_DETAIL_CODE_MAP[err.code] ?? "EXTERNAL_FAILURE",
    err.message,
    err,
  );
}

/**
 * Run a deep analysis on a single competitor video.
 *
 * Orchestrates: cache lookup -> YouTube fetch -> comments fetch ->
 * LLM analysis -> strategic insights -> response assembly.
 */
export async function analyzeVideo(
  input: AnalyzeVideoInput,
): Promise<CompetitorVideoAnalysis> {
  const { userId, channelId, videoId, includeMoreFromChannel = true } = input;
  const startTime = Date.now();

  const ctx: RequestContext = {
    route: "/api/competitors/video/[videoId]",
    requestId: crypto.randomUUID().slice(0, 8),
    userId,
    channelId,
    videoId,
    startTime,
    timings: [],
  };

  try {
    const { cachedVideo, cachedComments, channelOwnership } =
      await readCachesParallel(videoId, channelId, userId, ctx);

    if (!channelOwnership) {
      throw new VideoDetailError(
        "Channel not found",
        "CHANNEL_NOT_FOUND",
        404,
        { channelId },
      );
    }

    const ga = await getGoogleAccountOrThrow(userId, channelId);
    const videoDetails = await fetchVideoDetailsWithTimeout(ga, videoId, ctx);

    await upsertCompetitorVideo(videoId, {
      channelId: videoDetails.channelId,
      channelTitle: videoDetails.channelTitle,
      title: videoDetails.title,
      description: videoDetails.description,
      publishedAt: new Date(videoDetails.publishedAt),
      durationSec: videoDetails.durationSec,
      thumbnailUrl: videoDetails.thumbnailUrl,
      tags: videoDetails.tags ?? [],
      categoryId: videoDetails.category,
    });

    const now = new Date();
    const video = buildVideoObject(
      videoDetails,
      cachedVideo?.Snapshots ?? [],
      now,
    );

    // Decide whether to fetch fresh comments (respect per-user rate limit)
    const commentsRlKey = rateLimitKey("competitorComments", userId);
    const commentsRlResult = await checkRateLimit(
      commentsRlKey,
      RATE_LIMITS.competitorComments,
    );
    const isCacheFresh = isCommentsCacheFresh(cachedComments);
    const shouldFetchComments =
      !isCacheFresh && !cachedComments?.analysisJson && commentsRlResult.success;

    const [commentsResult, channelVideosResult] = await Promise.all([
      shouldFetchComments
        ? fetchCommentsWithTimeout(ga, videoId, 50, ctx)
        : Promise.resolve(null),
      includeMoreFromChannel
        ? fetchRecentChannelVideosWithTimeout(ga, videoDetails.channelId, ctx)
        : Promise.resolve([]),
    ]);

    const moreFromChannel = buildMoreFromChannel(
      channelVideosResult,
      videoId,
      videoDetails.channelId,
      videoDetails.channelTitle,
    );

    const { commentsAnalysis, needsCommentsLLM, commentsForLLM, commentsContentHash } =
      processComments(cachedComments, commentsResult, isCacheFresh, videoId);

    const { analysis, beatChecklist, llmFailed, llmFailureReason } =
      await runAnalysisStage({
        video,
        videoDetails,
        cachedVideo,
        channelOwnership,
        commentsAnalysis,
        needsCommentsLLM,
        commentsForLLM,
        commentsContentHash,
        ctx,
      });

    const response = buildResponse({
      video,
      videoDetails,
      analysis,
      beatChecklist,
      commentsAnalysis: commentsAnalysis.current,
      moreFromChannel,
      llmFailed,
      llmFailureReason,
      ctx,
    });

    logger.info("Analysis complete", {
      videoId,
      userId,
      channelId,
      totalDurationMs: Date.now() - startTime,
      timings: ctx.timings,
    });

    return response;
  } catch (error: unknown) {
    if (error instanceof VideoDetailError) {
      throw toCompetitorError(error);
    }
    if (error instanceof CompetitorError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Unexpected error in analyzeVideo", {
      videoId,
      error: message,
      totalDurationMs: Date.now() - startTime,
      timings: ctx.timings,
    });
    throw new CompetitorError(
      "EXTERNAL_FAILURE",
      `Failed to analyze competitor video: ${message}`,
      error,
    );
  }
}

// ── Comments processing ─────────────────────────────────────────

type CommentsState = {
  commentsAnalysis: { current: CompetitorCommentsAnalysis | undefined };
  needsCommentsLLM: boolean;
  commentsForLLM: Array<{ text: string; likeCount: number; authorName: string }> | null;
  commentsContentHash: string | null;
};

function processComments(
  cachedComments: Awaited<ReturnType<typeof readCachesParallel>>["cachedComments"],
  commentsResult: Awaited<ReturnType<typeof fetchCommentsWithTimeout>>,
  isCacheFresh: boolean,
  videoId: string,
): CommentsState {
  let commentsAnalysis: CompetitorCommentsAnalysis | undefined;
  let needsCommentsLLM = false;
  let commentsForLLM: CommentsState["commentsForLLM"] = null;
  let commentsContentHash: string | null = null;

  if (isCacheFresh && cachedComments?.analysisJson) {
    logger.info("Using cached comments analysis", { videoId });
    commentsAnalysis =
      cachedComments.analysisJson as unknown as CompetitorCommentsAnalysis;
  } else if (commentsResult) {
    if (commentsResult.commentsDisabled) {
      commentsAnalysis = {
        topComments: [],
        sentiment: { positive: 0, neutral: 0, negative: 0 },
        themes: [],
        viewerLoved: [],
        viewerAskedFor: [],
        hookInspiration: [],
        commentsDisabled: true,
      };
    } else if (commentsResult.error) {
      commentsAnalysis = {
        topComments: [],
        sentiment: { positive: 0, neutral: 0, negative: 0 },
        themes: [],
        viewerLoved: [],
        viewerAskedFor: [],
        hookInspiration: [],
        error: commentsResult.error,
      };
    } else if (commentsResult.comments.length > 0) {
      commentsContentHash = hashCommentsContent(commentsResult.comments);
      const cachedHash = cachedComments?.contentHash;
      const unchanged = cachedHash && cachedHash === commentsContentHash;
      const cachedHasRealAnalysis =
        cachedComments?.analysisJson &&
        (cachedComments.analysisJson as { themes?: unknown[] }).themes &&
        (cachedComments.analysisJson as { themes?: unknown[] }).themes!.length > 0;

      if (unchanged && cachedHasRealAnalysis) {
        logger.info("Reusing cached comments LLM (hash match)", {
          videoId,
          contentHash: commentsContentHash,
        });
        commentsAnalysis =
          cachedComments.analysisJson as unknown as CompetitorCommentsAnalysis;
        commentsAnalysis.topComments = commentsResult.comments
          .slice(0, 10)
          .map((c) => ({
            text: c.text,
            likeCount: c.likeCount,
            authorName: c.authorName,
            publishedAt: c.publishedAt,
          }));
      } else {
        needsCommentsLLM = true;
        commentsForLLM = commentsResult.comments.slice(0, 30);
        commentsAnalysis = {
          topComments: commentsResult.comments.slice(0, 10).map((c) => ({
            text: c.text,
            likeCount: c.likeCount,
            authorName: c.authorName,
            publishedAt: c.publishedAt,
          })),
          sentiment: { positive: 0, neutral: 0, negative: 0 },
          themes: [],
          viewerLoved: [],
          viewerAskedFor: [],
          hookInspiration: [],
        };
      }
    }
  }

  return {
    commentsAnalysis: { current: commentsAnalysis },
    needsCommentsLLM,
    commentsForLLM,
    commentsContentHash,
  };
}

// ── LLM analysis stage ──────────────────────────────────────────

type AnalysisStageInput = {
  video: ReturnType<typeof buildVideoObject>;
  videoDetails: Awaited<ReturnType<typeof fetchVideoDetailsWithTimeout>>;
  cachedVideo: Awaited<ReturnType<typeof readCachesParallel>>["cachedVideo"];
  channelOwnership: { id: number; title: string | null };
  commentsAnalysis: { current: CompetitorCommentsAnalysis | undefined };
  needsCommentsLLM: boolean;
  commentsForLLM: Array<{ text: string; likeCount: number; authorName: string }> | null;
  commentsContentHash: string | null;
  ctx: RequestContext;
};

type BeatChecklistItem = {
  action: string;
  difficulty: "Easy" | "Medium" | "Hard";
  impact: "Low" | "Medium" | "High";
};

type AnalysisStageResult = {
  analysis: CompetitorVideoAnalysis["analysis"];
  beatChecklist: BeatChecklistItem[] | undefined;
  llmFailed: boolean;
  llmFailureReason: string | null;
};

function restoreCachedAnalysis(
  input: AnalysisStageInput,
): { analysis: CompetitorVideoAnalysis["analysis"]; beatChecklist: BeatChecklistItem[] | undefined } {
  const cached = input.cachedVideo!.analysisJson as Record<string, unknown>;
  const analysis = cached as CompetitorVideoAnalysis["analysis"];
  const beatChecklist = normalizeBeatChecklist(cached?.beatThisVideo);

  if (input.needsCommentsLLM && input.commentsForLLM && input.commentsContentHash) {
    fireBackgroundCommentsAnalysis(input);
  }

  return { analysis, beatChecklist };
}

function fireBackgroundCommentsAnalysis(input: AnalysisStageInput): void {
  const { commentsForLLM, commentsContentHash, commentsAnalysis, video, ctx } = input;
  void (async () => {
    try {
      const { runCommentsAnalysis, cacheCommentsInBackground: cacheBg } =
        await import("@/lib/competitors/video-detail/analysis");
      const result = await runCommentsAnalysis(commentsForLLM!, video.title, ctx);
      if (result && commentsAnalysis.current) {
        cacheBg(ctx.videoId, commentsForLLM!, commentsContentHash!, commentsAnalysis.current, result);
      }
    } catch {
      // Background analysis failure is non-critical
    }
  })();
}

async function generateFreshAnalysis(
  input: AnalysisStageInput,
): Promise<{ analysis: CompetitorVideoAnalysis["analysis"]; beatChecklist: BeatChecklistItem[] | undefined }> {
  const { video, videoDetails, channelOwnership, commentsAnalysis, needsCommentsLLM, commentsForLLM, commentsContentHash, ctx } = input;

  const result = await runParallelAnalysis(
    video, videoDetails, channelOwnership.title ?? "Your Channel",
    needsCommentsLLM ? commentsForLLM : null, commentsAnalysis.current, ctx,
  );

  if (result.commentsAnalysis) {
    commentsAnalysis.current = result.commentsAnalysis;
  }

  if (needsCommentsLLM && commentsForLLM && commentsContentHash && commentsAnalysis.current && result.commentsLLMResult) {
    cacheCommentsInBackground(ctx.videoId, commentsForLLM, commentsContentHash, commentsAnalysis.current, result.commentsLLMResult);
  }

  return { analysis: result.analysis, beatChecklist: result.beatChecklist };
}

function persistAnalysisCache(
  analysisIsCacheFresh: boolean,
  input: AnalysisStageInput,
  analysis: CompetitorVideoAnalysis["analysis"],
  beatChecklist: BeatChecklistItem[] | undefined,
  currentContentHash: string,
): void {
  if (!analysisIsCacheFresh) {
    saveAnalysisCache(input.ctx.videoId, { ...analysis, beatThisVideo: beatChecklist }, currentContentHash).catch(() => {});
    return;
  }

  const cachedJson = input.cachedVideo?.analysisJson as Record<string, unknown> | undefined;
  if (cachedJson && beatChecklist && !Array.isArray(cachedJson?.beatThisVideo)) {
    backfillBeatChecklist(input.ctx.videoId, cachedJson as object, beatChecklist).catch(() => {});
  }
}

async function runAnalysisStage(input: AnalysisStageInput): Promise<AnalysisStageResult> {
  const currentContentHash = hashVideoContent({
    title: input.video.title,
    description: input.videoDetails.description,
    tags: input.videoDetails.tags,
    durationSec: input.video.durationSec,
    categoryId: input.videoDetails.category,
  });

  const analysisIsCacheFresh = isAnalysisCacheFresh(input.cachedVideo, currentContentHash);

  let result: { analysis: CompetitorVideoAnalysis["analysis"]; beatChecklist: BeatChecklistItem[] | undefined };

  if (analysisIsCacheFresh && input.cachedVideo?.analysisJson) {
    logger.info("Using cached analysis", { videoId: input.ctx.videoId, contentHash: currentContentHash });
    result = restoreCachedAnalysis(input);
  } else {
    logger.info("Generating new analysis", {
      videoId: input.ctx.videoId,
      contentHashOld: input.cachedVideo?.analysisContentHash,
      contentHashNew: currentContentHash,
    });
    result = await generateFreshAnalysis(input);
  }

  result.analysis = normalizeAnalysis(result.analysis, input.videoDetails);
  persistAnalysisCache(analysisIsCacheFresh, input, result.analysis, result.beatChecklist, currentContentHash);

  return { ...result, llmFailed: false, llmFailureReason: null };
}

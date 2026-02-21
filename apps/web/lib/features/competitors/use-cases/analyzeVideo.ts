import "server-only";

import type {
  CompetitorVideoAnalysis,
  CompetitorCommentsAnalysis,
} from "@/types/api";
import { createLogger } from "@/lib/shared/logger";
import { hashVideoContent, hashCommentsContent } from "@/lib/shared/content-hash";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/shared/rate-limit";
import type { AnalyzeVideoInput } from "../types";
import { CompetitorError } from "../errors";
import {
  VideoDetailError,
  type RequestContext,
  getGoogleAccountOrThrow,
  fetchVideoDetailsWithTimeout,
  fetchCommentsWithTimeout,
  fetchRecentChannelVideosWithTimeout,
  readCachesParallel,
  isCommentsCacheFresh,
  isAnalysisCacheFresh,
  upsertCompetitorVideo,
  saveAnalysisCache,
  backfillBeatChecklist,
  normalizeBeatChecklist,
  normalizeAnalysis,
  runParallelAnalysis,
  cacheCommentsInBackground,
  buildVideoObject,
  buildMoreFromChannel,
  buildResponse,
} from "@/lib/competitors/video-detail";

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
    const commentsRlResult = checkRateLimit(
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
  } catch (err: unknown) {
    if (err instanceof VideoDetailError) {
      throw toCompetitorError(err);
    }
    if (err instanceof CompetitorError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Unexpected error in analyzeVideo", {
      videoId,
      error: message,
      totalDurationMs: Date.now() - startTime,
      timings: ctx.timings,
    });
    throw new CompetitorError(
      "EXTERNAL_FAILURE",
      `Failed to analyze competitor video: ${message}`,
      err,
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

async function runAnalysisStage(input: AnalysisStageInput): Promise<{
  analysis: CompetitorVideoAnalysis["analysis"];
  beatChecklist: Array<{
    action: string;
    difficulty: "Easy" | "Medium" | "Hard";
    impact: "Low" | "Medium" | "High";
  }> | undefined;
  llmFailed: boolean;
  llmFailureReason: string | null;
}> {
  const {
    video,
    videoDetails,
    cachedVideo,
    channelOwnership,
    commentsAnalysis,
    needsCommentsLLM,
    commentsForLLM,
    commentsContentHash,
    ctx,
  } = input;

  const currentContentHash = hashVideoContent({
    title: video.title,
    description: videoDetails.description,
    tags: videoDetails.tags,
    durationSec: video.durationSec,
    categoryId: videoDetails.category,
  });

  const analysisIsCacheFresh = isAnalysisCacheFresh(
    cachedVideo,
    currentContentHash,
  );

  let analysis: CompetitorVideoAnalysis["analysis"];
  let beatChecklist: Array<{
    action: string;
    difficulty: "Easy" | "Medium" | "Hard";
    impact: "Low" | "Medium" | "High";
  }> | undefined;
  const llmFailed = false;
  const llmFailureReason: string | null = null;

  if (analysisIsCacheFresh && cachedVideo?.analysisJson) {
    logger.info("Using cached analysis", {
      videoId: ctx.videoId,
      contentHash: currentContentHash,
    });
    const cached = cachedVideo.analysisJson as Record<string, unknown>;
    analysis = cached as CompetitorVideoAnalysis["analysis"];
    beatChecklist = normalizeBeatChecklist(cached?.beatThisVideo);

    // Fire background comments analysis (non-blocking)
    if (needsCommentsLLM && commentsForLLM && commentsContentHash) {
      import("@/lib/competitors/video-detail/analysis").then(
        ({ runCommentsAnalysis, cacheCommentsInBackground: cacheBg }) => {
          runCommentsAnalysis(commentsForLLM!, video.title, ctx)
            .then((result) => {
              if (result && commentsAnalysis.current) {
                cacheBg(
                  ctx.videoId,
                  commentsForLLM!,
                  commentsContentHash!,
                  commentsAnalysis.current,
                  result,
                );
              }
            })
            .catch(() => {});
        },
      );
    }
  } else {
    logger.info("Generating new analysis", {
      videoId: ctx.videoId,
      contentHashOld: cachedVideo?.analysisContentHash,
      contentHashNew: currentContentHash,
    });

    const result = await runParallelAnalysis(
      video,
      videoDetails,
      channelOwnership.title ?? "Your Channel",
      needsCommentsLLM ? commentsForLLM : null,
      commentsAnalysis.current,
      ctx,
    );

    analysis = result.analysis;
    beatChecklist = result.beatChecklist;

    if (result.commentsAnalysis) {
      commentsAnalysis.current = result.commentsAnalysis;
    }

    if (
      needsCommentsLLM &&
      commentsForLLM &&
      commentsContentHash &&
      commentsAnalysis.current &&
      result.commentsLLMResult
    ) {
      cacheCommentsInBackground(
        ctx.videoId,
        commentsForLLM,
        commentsContentHash,
        commentsAnalysis.current,
        result.commentsLLMResult,
      );
    }
  }

  analysis = normalizeAnalysis(analysis, videoDetails);

  // Persist analysis to cache
  if (!analysisIsCacheFresh) {
    saveAnalysisCache(
      ctx.videoId,
      { ...analysis, beatThisVideo: beatChecklist },
      currentContentHash,
    ).catch(() => {});
  } else if (
    cachedVideo?.analysisJson &&
    beatChecklist &&
    !Array.isArray(
      (cachedVideo.analysisJson as Record<string, unknown>)?.beatThisVideo,
    )
  ) {
    backfillBeatChecklist(
      ctx.videoId,
      cachedVideo.analysisJson as object,
      beatChecklist,
    ).catch(() => {});
  }

  return { analysis, beatChecklist, llmFailed, llmFailureReason };
}

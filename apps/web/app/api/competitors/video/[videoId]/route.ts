/**
 * GET /api/competitors/video/[videoId]
 *
 * Get deep analysis of a specific competitor video including:
 * - Public stats and derived velocity metrics
 * - Top comments analysis (sentiment, themes, hook inspiration)
 * - LLM-generated insights for remixing
 *
 * IMPORTANT: Only shows publicly available metrics.
 * Subscriber gain, watch time, AVD are NOT available for competitors.
 *
 * Auth: Required
 * Entitlements: competitor_video_analysis (5/day FREE, 100/day PRO)
 * Caching: 7-30 days per videoId
 *
 * Query params:
 * - channelId: string (the user's active channel for context)
 */
import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { createLogger } from "@/lib/logger";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import { hashVideoContent, hashCommentsContent } from "@/lib/content-hash";
import {
  checkEntitlement,
  entitlementErrorResponse,
} from "@/lib/with-entitlements";
import type {
  CompetitorVideoAnalysis,
  CompetitorCommentsAnalysis,
} from "@/types/api";

// Import from refactored modules
import {
  // Types
  VideoDetailError,
  type RequestContext,
  // Validation
  parseParams,
  parseQuery,
  // YouTube
  getGoogleAccountOrThrow,
  fetchVideoDetailsWithTimeout,
  fetchCommentsWithTimeout,
  fetchRecentChannelVideosWithTimeout,
  // Cache
  readCachesParallel,
  isCommentsCacheFresh,
  isAnalysisCacheFresh,
  upsertCompetitorVideo,
  saveAnalysisCache,
  backfillBeatChecklist,
  // Analysis
  normalizeBeatChecklist,
  normalizeAnalysis,
  runParallelAnalysis,
  cacheCommentsInBackground,
  // Response
  buildVideoObject,
  buildMoreFromChannel,
  buildResponse,
  buildLLMErrorResponse,
} from "@/lib/competitors/video-detail";

const logger = createLogger({ module: "api.competitors.video" });

// ============================================
// MAIN ROUTE HANDLER
// ============================================

async function GETHandler(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const routeStartTime = Date.now();
  const paramsObj = await params;

  // Initialize request context for logging
  const ctx: RequestContext = {
    route: "/api/competitors/video/[videoId]",
    requestId: crypto.randomUUID().slice(0, 8),
    userId: 0,
    channelId: "",
    videoId: "",
    startTime: routeStartTime,
    timings: [],
  };

  try {
    // ==========================================
    // STAGE 1: GATEKEEPING (Auth, Rate Limit, Validation)
    // ==========================================
    const gatekeepStart = Date.now();

    // Entitlement check
    const entitlementResult = await checkEntitlement({
      featureKey: "competitor_video_analysis",
      increment: true,
    });
    if (!entitlementResult.ok) {
      return entitlementErrorResponse(entitlementResult.error);
    }
    const user = entitlementResult.context.user;
    ctx.userId = user.id;

    // Rate limit check
    const rlKey = rateLimitKey("competitorDetail", user.id);
    const rlResult = checkRateLimit(rlKey, RATE_LIMITS.competitorDetail);
    if (!rlResult.success) {
      return Response.json(
        {
          error: "Rate limit exceeded",
          resetAt: new Date(rlResult.resetAt).toISOString(),
        },
        { status: 429 }
      );
    }

    // Validate params and query
    const { videoId } = parseParams(paramsObj);
    ctx.videoId = videoId;

    const url = new URL(req.url);
    const { channelId, includeMoreFromChannel } = parseQuery(url);
    ctx.channelId = channelId;
    const shouldIncludeMoreFromChannel = includeMoreFromChannel !== "0";

    ctx.timings.push({
      stage: "gatekeeping",
      durationMs: Date.now() - gatekeepStart,
    });

    // ==========================================
    // STAGE 2: PARALLEL DB READS
    // ==========================================
    const { cachedVideo, cachedComments, channelOwnership } =
      await readCachesParallel(videoId, channelId, user.id, ctx);

    if (!channelOwnership) {
      throw new VideoDetailError(
        "Channel not found",
        "CHANNEL_NOT_FOUND",
        404,
        { channelId }
      );
    }

    // ==========================================
    // STAGE 3: YOUTUBE API FETCH
    // ==========================================
    const ga = await getGoogleAccountOrThrow(user.id, channelId);

    const videoDetails = await fetchVideoDetailsWithTimeout(ga, videoId, ctx);

    // Upsert video metadata (enables caching even if not tracked before)
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

    // Build video object
    const now = new Date();
    const video = buildVideoObject(
      videoDetails,
      cachedVideo?.Snapshots ?? [],
      now
    );

    // ==========================================
    // STAGE 4: PARALLEL FETCH (Comments + More Videos)
    // ==========================================
    const commentsRlKey = rateLimitKey("competitorComments", user.id);
    const commentsRlResult = checkRateLimit(
      commentsRlKey,
      RATE_LIMITS.competitorComments
    );

    const isCacheFresh = isCommentsCacheFresh(cachedComments);
    const shouldFetchComments =
      !isCacheFresh && !cachedComments?.analysisJson && commentsRlResult.success;

    const [commentsResult, channelVideosResult] = await Promise.all([
      shouldFetchComments
        ? fetchCommentsWithTimeout(ga, videoId, 50, ctx)
        : Promise.resolve(null),
      shouldIncludeMoreFromChannel
        ? fetchRecentChannelVideosWithTimeout(ga, videoDetails.channelId, ctx)
        : Promise.resolve([]),
    ]);

    // Build more from channel
    const moreFromChannel = buildMoreFromChannel(
      channelVideosResult,
      videoId,
      videoDetails.channelId,
      videoDetails.channelTitle
    );

    // ==========================================
    // STAGE 5: PROCESS COMMENTS
    // ==========================================
    let commentsAnalysis: CompetitorCommentsAnalysis | undefined;
    let needsCommentsLLM = false;
    let commentsForLLM: Array<{
      text: string;
      likeCount: number;
      authorName: string;
    }> | null = null;
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
        const cachedCommentsHash = cachedComments?.contentHash;
        const commentsUnchanged =
          cachedCommentsHash && cachedCommentsHash === commentsContentHash;
        const cachedHasRealAnalysis =
          cachedComments?.analysisJson &&
          (cachedComments.analysisJson as { themes?: unknown[] }).themes &&
          (cachedComments.analysisJson as { themes?: unknown[] }).themes!
            .length > 0;

        if (commentsUnchanged && cachedHasRealAnalysis) {
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
          // Mark for parallel LLM processing
          needsCommentsLLM = true;
          commentsForLLM = commentsResult.comments.slice(0, 30);
          // Set up basic structure with top comments
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

    // ==========================================
    // STAGE 6: LLM ANALYSIS
    // ==========================================
    const currentContentHash = hashVideoContent({
      title: video.title,
      description: videoDetails.description,
      tags: videoDetails.tags,
      durationSec: video.durationSec,
      categoryId: videoDetails.category,
    });

    const analysisIsCacheFresh = isAnalysisCacheFresh(
      cachedVideo,
      currentContentHash
    );

    let analysis: CompetitorVideoAnalysis["analysis"];
    let beatChecklist:
      | Array<{
          action: string;
          difficulty: "Easy" | "Medium" | "Hard";
          impact: "Low" | "Medium" | "High";
        }>
      | undefined;
    let llmFailed = false;
    let llmFailureReason: string | null = null;
    let commentsLLMResult: Awaited<
      ReturnType<typeof runParallelAnalysis>
    >["commentsLLMResult"] = null;

    if (analysisIsCacheFresh && cachedVideo?.analysisJson) {
      // Use cached analysis
      logger.info("Using cached analysis", {
        videoId,
        contentHash: currentContentHash,
      });
      const cached = cachedVideo.analysisJson as Record<string, unknown>;
      analysis = cached as CompetitorVideoAnalysis["analysis"];
      beatChecklist = normalizeBeatChecklist(cached?.beatThisVideo);

      // Still run comments LLM if needed (in background)
      if (needsCommentsLLM && commentsForLLM && commentsContentHash) {
        // Fire background comments analysis (non-blocking)
        import("@/lib/competitors/video-detail/analysis").then(
          ({ runCommentsAnalysis, cacheCommentsInBackground }) => {
            runCommentsAnalysis(commentsForLLM!, video.title, ctx)
              .then((result) => {
                if (result && commentsAnalysis) {
                  cacheCommentsInBackground(
                    videoId,
                    commentsForLLM!,
                    commentsContentHash!,
                    commentsAnalysis,
                    result
                  );
                }
              })
              .catch(() => {});
          }
        );
      }
    } else {
      // Generate fresh analysis
      logger.info("Generating new analysis", {
        videoId,
        contentHashOld: cachedVideo?.analysisContentHash,
        contentHashNew: currentContentHash,
      });

      try {
        const result = await runParallelAnalysis(
          video,
          videoDetails,
          channelOwnership.title ?? "Your Channel",
          needsCommentsLLM ? commentsForLLM : null,
          commentsAnalysis,
          ctx
        );

        analysis = result.analysis;
        beatChecklist = result.beatChecklist;
        commentsLLMResult = result.commentsLLMResult;

        // Update comments analysis with LLM result
        if (result.commentsAnalysis) {
          commentsAnalysis = result.commentsAnalysis;
        }

        // Cache comments in background
        if (
          needsCommentsLLM &&
          commentsForLLM &&
          commentsContentHash &&
          commentsAnalysis &&
          commentsLLMResult
        ) {
          cacheCommentsInBackground(
            videoId,
            commentsForLLM,
            commentsContentHash,
            commentsAnalysis,
            commentsLLMResult
          );
        }
      } catch (err) {
        if (err instanceof VideoDetailError) {
          // LLM failed - return error response (strategy A)
          return buildLLMErrorResponse(err, ctx);
        }
        throw err;
      }
    }

    // Normalize analysis (defensive)
    analysis = normalizeAnalysis(analysis, videoDetails);

    // ==========================================
    // STAGE 7: CACHE ANALYSIS (if fresh)
    // ==========================================
    if (!analysisIsCacheFresh) {
      // Save fresh analysis to cache
      saveAnalysisCache(
        videoId,
        {
          ...analysis,
          beatThisVideo: beatChecklist,
        },
        currentContentHash
      ).catch(() => {}); // Non-blocking
    } else if (
      cachedVideo?.analysisJson &&
      beatChecklist &&
      !Array.isArray((cachedVideo.analysisJson as Record<string, unknown>)?.beatThisVideo)
    ) {
      // Backfill beat checklist if missing from cached analysis
      backfillBeatChecklist(
        videoId,
        cachedVideo.analysisJson as object,
        beatChecklist
      ).catch(() => {}); // Non-blocking
    }

    // ==========================================
    // STAGE 8: BUILD RESPONSE
    // ==========================================
    const response = buildResponse({
      video,
      videoDetails,
      analysis,
      beatChecklist,
      commentsAnalysis,
      moreFromChannel,
      llmFailed,
      llmFailureReason,
      ctx,
    });

    // Log final timings
    const totalDuration = Date.now() - routeStartTime;
    logger.info("Request complete", {
      videoId,
      userId: user.id,
      channelId,
      totalDurationMs: totalDuration,
      timings: ctx.timings,
      cacheHit: {
        analysis: analysisIsCacheFresh,
        comments: isCacheFresh,
      },
    });

    return Response.json(response);
  } catch (err: unknown) {
    // Handle known error types
    if (err instanceof VideoDetailError) {
      logger.warn("VideoDetailError", {
        code: err.code,
        message: err.message,
        statusCode: err.statusCode,
        details: err.details,
        videoId: ctx.videoId,
      });
      return Response.json(
        { error: err.message, code: err.code, ...err.details },
        { status: err.statusCode }
      );
    }

    // Handle unexpected errors
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("Unexpected error", {
      videoId: ctx.videoId,
      error: message,
      stack: err instanceof Error ? err.stack : undefined,
      totalDurationMs: Date.now() - routeStartTime,
      timings: ctx.timings,
    });

    return Response.json(
      { error: "Failed to analyze competitor video", detail: message },
      { status: 500 }
    );
  }
}

export const GET = createApiRoute(
  { route: "/api/competitors/video/[videoId]" },
  async (req, ctx) => GETHandler(req, ctx as { params: Promise<{ videoId: string }> })
);

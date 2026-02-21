/**
 * Competitor Video Detail - LLM Analysis
 *
 * Orchestrates LLM calls for video analysis with proper error handling.
 * NO FALLBACK BEHAVIOR - if LLM fails, we return transparent error state.
 */

import {
  generateCompetitorVideoAnalysisParallel,
  analyzeVideoComments,
} from "@/lib/llm";
import { createLogger } from "@/lib/shared/logger";
import { withTimeout, TimeoutError } from "./timeout";
import { saveCommentsCache } from "./cache";
import { fallbackWhatItsAbout } from "./strategic";
import type {
  VideoDetailsResult,
  RequestContext,
  NormalizedAnalysis,
  BeatChecklist,
} from "./types";
import { TIMEOUTS as TO, VideoDetailError } from "./types";
import type { CompetitorVideo, CompetitorCommentsAnalysis } from "@/types/api";

const logger = createLogger({ module: "video-detail.analysis" });

// ============================================
// NORMALIZE BEAT CHECKLIST
// ============================================

/**
 * Normalize beat checklist from LLM output.
 */
export function normalizeBeatChecklist(input: unknown): BeatChecklist | undefined {
  if (!Array.isArray(input)) return undefined;
  const out = input
    .map((x: unknown) => {
      const item = x as Record<string, unknown>;
      return {
        action: typeof item?.action === "string" ? item.action.trim() : "",
        difficulty:
          item?.difficulty === "Easy" ||
          item?.difficulty === "Medium" ||
          item?.difficulty === "Hard"
            ? (item.difficulty as "Easy" | "Medium" | "Hard")
            : "Medium",
        impact:
          item?.impact === "Low" ||
          item?.impact === "Medium" ||
          item?.impact === "High"
            ? (item.impact as "Low" | "Medium" | "High")
            : "High",
      };
    })
    .filter((x) => x.action.length >= 16)
    .slice(0, 10);
  return out.length > 0 ? out : undefined;
}

/**
 * Normalize analysis output to protect UI from partial LLM output.
 */
export function normalizeAnalysis(
  analysis: Partial<NormalizedAnalysis>,
  videoDetails: { title: string; description?: string; tags?: string[] }
): NormalizedAnalysis {
  return {
    whatItsAbout:
      (analysis.whatItsAbout ?? "").trim() ||
      fallbackWhatItsAbout({
        title: videoDetails.title,
        description: videoDetails.description,
        tags: videoDetails.tags ?? [],
      }),
    whyItsWorking: Array.isArray(analysis.whyItsWorking)
      ? analysis.whyItsWorking
      : [],
    themesToRemix: Array.isArray(analysis.themesToRemix)
      ? analysis.themesToRemix
      : [],
    titlePatterns: Array.isArray(analysis.titlePatterns)
      ? analysis.titlePatterns
      : [],
    packagingNotes: Array.isArray(analysis.packagingNotes)
      ? analysis.packagingNotes
      : [],
    remixIdeasForYou: Array.isArray(analysis.remixIdeasForYou)
      ? analysis.remixIdeasForYou
      : [],
  };
}

// ============================================
// COMMENTS ANALYSIS
// ============================================

/**
 * Run comments LLM analysis with timeout.
 * Returns null on failure (non-critical).
 */
export async function runCommentsAnalysis(
  comments: Array<{ text: string; likeCount: number; authorName: string }>,
  videoTitle: string,
  ctx: RequestContext
): Promise<{
  sentiment: { positive: number; neutral: number; negative: number };
  themes: Array<{ theme: string; count: number; examples: string[] }>;
  viewerLoved: string[];
  viewerAskedFor: string[];
  hookInspiration: string[];
} | null> {
  const startTime = Date.now();

  try {
    const result = await withTimeout(
      analyzeVideoComments(comments, videoTitle),
      TO.COMMENTS_LLM_MS,
      "analyzeVideoComments"
    );

    ctx.timings.push({
      stage: "llm.comments",
      durationMs: Date.now() - startTime,
    });

    logger.info("Comments LLM complete", {
      videoId: ctx.videoId,
      themesCount: result.themes?.length ?? 0,
      durationMs: Date.now() - startTime,
    });

    return result;
  } catch (err) {
    const isTimeout = err instanceof TimeoutError;
    logger.warn("Comments LLM failed (non-critical)", {
      videoId: ctx.videoId,
      isTimeout,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - startTime,
    });
    return null;
  }
}

// ============================================
// MAIN ANALYSIS
// ============================================

/**
 * Run main video analysis LLM with timeout.
 * THROWS VideoDetailError on failure - NO FALLBACK.
 */
async function runMainAnalysis(
  video: CompetitorVideo,
  videoDetails: VideoDetailsResult,
  channelTitle: string,
  commentsAnalysis: CompetitorCommentsAnalysis | undefined,
  ctx: RequestContext
): Promise<{
  analysis: NormalizedAnalysis;
  beatChecklist: BeatChecklist | undefined;
}> {
  const startTime = Date.now();

  const videoInput = {
    videoId: video.videoId,
    title: video.title,
    description: videoDetails.description,
    tags: videoDetails.tags ?? [],
    channelTitle: video.channelTitle,
    durationSec: video.durationSec,
    stats: video.stats,
    derived: {
      viewsPerDay: video.derived.viewsPerDay,
      engagementPerView: video.derived.engagementPerView,
    },
  };

  try {
    const llmResult = await withTimeout(
      generateCompetitorVideoAnalysisParallel(
        videoInput,
        channelTitle,
        commentsAnalysis
      ),
      TO.MAIN_ANALYSIS_MS,
      "generateCompetitorVideoAnalysis"
    );

    ctx.timings.push({
      stage: "llm.mainAnalysis",
      durationMs: Date.now() - startTime,
    });

    logger.info("Main LLM analysis complete", {
      videoId: ctx.videoId,
      whatItsAboutLen: llmResult.whatItsAbout?.length ?? 0,
      whyItsWorkingCount: llmResult.whyItsWorking?.length ?? 0,
      durationMs: Date.now() - startTime,
    });

    const beatChecklist = normalizeBeatChecklist(llmResult.beatThisVideo);
    const { beatThisVideo: _beat, ...analysisOnly } = llmResult;
    const analysis = normalizeAnalysis(analysisOnly, videoDetails);

    return { analysis, beatChecklist };
  } catch (err) {
    const isTimeout = err instanceof TimeoutError;
    const errorMessage = err instanceof Error ? err.message : String(err);

    logger.error("Main LLM analysis failed", {
      videoId: ctx.videoId,
      isTimeout,
      error: errorMessage,
      durationMs: Date.now() - startTime,
    });

    // NO FALLBACK - throw error to be handled by caller
    throw new VideoDetailError(
      isTimeout
        ? "AI analysis timed out. Please try again."
        : `AI analysis failed: ${errorMessage}`,
      isTimeout ? "LLM_TIMEOUT" : "LLM_ERROR",
      502,
      {
        videoId: ctx.videoId,
        isTimeout,
        timeoutMs: isTimeout ? TO.MAIN_ANALYSIS_MS : undefined,
      }
    );
  }
}

// ============================================
// PARALLEL ANALYSIS (Comments + Main)
// ============================================

/**
 * Run comments LLM and main analysis LLM in parallel.
 * Main analysis failure is fatal; comments failure is non-critical.
 */
export async function runParallelAnalysis(
  video: CompetitorVideo,
  videoDetails: VideoDetailsResult,
  channelTitle: string,
  commentsForLLM: Array<{ text: string; likeCount: number; authorName: string }> | null,
  partialCommentsAnalysis: CompetitorCommentsAnalysis | undefined,
  ctx: RequestContext
): Promise<{
  analysis: NormalizedAnalysis;
  beatChecklist: BeatChecklist | undefined;
  commentsAnalysis: CompetitorCommentsAnalysis | undefined;
  commentsLLMResult: Awaited<ReturnType<typeof runCommentsAnalysis>>;
}> {
  const startTime = Date.now();

  if (commentsForLLM && commentsForLLM.length > 0) {
    logger.info("Running parallel LLM (comments + main)", {
      videoId: ctx.videoId,
      commentsCount: commentsForLLM.length,
    });

    // Run both in parallel
    const [commentsLLMResult, mainResult] = await Promise.all([
      runCommentsAnalysis(commentsForLLM, video.title, ctx).catch(() => null),
      runMainAnalysis(video, videoDetails, channelTitle, partialCommentsAnalysis, ctx),
    ]);

    // Merge comments result into analysis
    let commentsAnalysis = partialCommentsAnalysis;
    if (commentsLLMResult && partialCommentsAnalysis) {
      commentsAnalysis = {
        ...partialCommentsAnalysis,
        sentiment: commentsLLMResult.sentiment,
        themes: commentsLLMResult.themes,
        viewerLoved: commentsLLMResult.viewerLoved,
        viewerAskedFor: commentsLLMResult.viewerAskedFor,
        hookInspiration: commentsLLMResult.hookInspiration,
      };
    }

    ctx.timings.push({
      stage: "llm.parallel",
      durationMs: Date.now() - startTime,
    });

    return {
      analysis: mainResult.analysis,
      beatChecklist: mainResult.beatChecklist,
      commentsAnalysis,
      commentsLLMResult,
    };
  } else {
    // No comments LLM needed, just run main analysis
    logger.info("Running main LLM only (no comments)", {
      videoId: ctx.videoId,
    });

    const mainResult = await runMainAnalysis(
      video,
      videoDetails,
      channelTitle,
      partialCommentsAnalysis,
      ctx
    );

    ctx.timings.push({
      stage: "llm.mainOnly",
      durationMs: Date.now() - startTime,
    });

    return {
      analysis: mainResult.analysis,
      beatChecklist: mainResult.beatChecklist,
      commentsAnalysis: partialCommentsAnalysis,
      commentsLLMResult: null,
    };
  }
}

// ============================================
// CACHE COMMENTS ANALYSIS (Background)
// ============================================

/**
 * Cache comments analysis in background (non-blocking).
 * Call this after returning response to user.
 */
export function cacheCommentsInBackground(
  videoId: string,
  commentsForLLM: Array<{ text: string; likeCount: number; authorName: string }>,
  contentHash: string,
  commentsAnalysis: CompetitorCommentsAnalysis,
  commentsLLMResult: Awaited<ReturnType<typeof runCommentsAnalysis>>
): void {
  if (!commentsLLMResult || !commentsLLMResult.themes?.length) {
    return;
  }

  // Fire and forget - don't await
  saveCommentsCache(videoId, {
    topCommentsJson: commentsForLLM.slice(0, 20),
    contentHash,
    analysisJson: commentsAnalysis as object,
    sentiment: commentsLLMResult.sentiment,
    themes: commentsLLMResult.themes,
  }).catch((cacheErr: unknown) => {
    logger.warn("Background comments cache failed", {
      videoId,
      error: cacheErr instanceof Error ? cacheErr.message : String(cacheErr),
    });
  });
}

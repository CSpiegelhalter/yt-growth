/**
 * Competitor Video Detail - YouTube Fetch Helpers
 *
 * Wrappers around YouTube API calls with timeout handling.
 */

import {
  getGoogleAccount,
  fetchVideoDetails as ytFetchVideoDetails,
  fetchVideoComments as ytFetchVideoComments,
  fetchRecentChannelVideos as ytFetchRecentChannelVideos,
} from "@/lib/adapters/youtube";
import type { GoogleAccount } from "@/lib/youtube/types";
import { createLogger } from "@/lib/shared/logger";
import { withTimeout, withTimeoutOptional, TimeoutError } from "./timeout";
import { VideoDetailError, TIMEOUTS, CACHE_CONFIG } from "./types";
import type {
  VideoDetailsResult,
  CommentsResult,
  ChannelVideosResult,
  RequestContext,
} from "./types";

const logger = createLogger({ module: "video-detail.youtube" });

/**
 * Get Google account for API calls.
 * Throws VideoDetailError if account not found.
 */
export async function getGoogleAccountOrThrow(
  userId: number,
  channelId: string
): Promise<GoogleAccount> {
  const ga = await getGoogleAccount(userId, channelId);
  if (!ga) {
    throw new VideoDetailError(
      "Google account not connected",
      "GOOGLE_ACCOUNT_MISSING",
      400
    );
  }
  return ga;
}

/**
 * Fetch video details from YouTube API with timeout.
 * Throws VideoDetailError if video not found or timeout.
 */
export async function fetchVideoDetailsWithTimeout(
  ga: GoogleAccount,
  videoId: string,
  ctx: RequestContext
): Promise<VideoDetailsResult> {
  const startTime = Date.now();

  try {
    const videoDetails = await withTimeout(
      ytFetchVideoDetails(ga, videoId),
      TIMEOUTS.VIDEO_DETAILS_MS,
      "fetchVideoDetails"
    );

    if (!videoDetails) {
      throw new VideoDetailError("Video not found", "VIDEO_NOT_FOUND", 404, {
        videoId,
      });
    }

    ctx.timings.push({
      stage: "youtube.videoDetails",
      durationMs: Date.now() - startTime,
    });

    logger.info("Fetched video details", {
      videoId,
      channelId: videoDetails.channelId,
      titleLen: videoDetails.title?.length ?? 0,
      descLen: videoDetails.description?.length ?? 0,
      tagsCount: videoDetails.tags?.length ?? 0,
      durationMs: Date.now() - startTime,
    });

    return videoDetails as VideoDetailsResult;
  } catch (err) {
    if (err instanceof VideoDetailError) throw err;
    if (err instanceof TimeoutError) {
      throw new VideoDetailError(
        "YouTube API timed out fetching video details",
        "YOUTUBE_ERROR",
        504,
        { videoId, timeoutMs: TIMEOUTS.VIDEO_DETAILS_MS }
      );
    }
    throw new VideoDetailError(
      `Failed to fetch video details: ${
        err instanceof Error ? err.message : "Unknown error"
      }`,
      "YOUTUBE_ERROR",
      502,
      { videoId }
    );
  }
}

/**
 * Fetch video comments from YouTube API with timeout.
 * Returns null if comments disabled, error, or timeout.
 * This is a non-critical operation - we continue without comments.
 */
export async function fetchCommentsWithTimeout(
  ga: GoogleAccount,
  videoId: string,
  maxResults: number,
  ctx: RequestContext
): Promise<CommentsResult | null> {
  const startTime = Date.now();

  try {
    const result = await withTimeoutOptional(
      ytFetchVideoComments(ga, videoId, maxResults),
      TIMEOUTS.COMMENTS_FETCH_MS,
      "fetchVideoComments"
    );

    ctx.timings.push({
      stage: "youtube.comments",
      durationMs: Date.now() - startTime,
    });

    if (!result) {
      logger.warn("Comments fetch returned null", { videoId });
      return null;
    }

    logger.info("Fetched comments", {
      videoId,
      count: result.comments?.length ?? 0,
      commentsDisabled: result.commentsDisabled ?? false,
      error: result.error,
      durationMs: Date.now() - startTime,
    });

    return result as CommentsResult;
  } catch (err) {
    logger.warn("Comments fetch failed (non-critical)", {
      videoId,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - startTime,
    });
    return null;
  }
}

/**
 * Fetch recent videos from a channel with timeout.
 * This is a non-critical operation - returns empty array on failure.
 */
export async function fetchRecentChannelVideosWithTimeout(
  ga: GoogleAccount,
  channelId: string,
  ctx: RequestContext
): Promise<ChannelVideosResult> {
  const startTime = Date.now();
  const now = new Date();
  const publishedAfter = new Date(
    now.getTime() -
      CACHE_CONFIG.MORE_FROM_CHANNEL_RANGE_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  try {
    const result = await withTimeoutOptional(
      ytFetchRecentChannelVideos(ga, channelId, publishedAfter, 6),
      TIMEOUTS.CHANNEL_VIDEOS_MS,
      "fetchRecentChannelVideos"
    );

    ctx.timings.push({
      stage: "youtube.channelVideos",
      durationMs: Date.now() - startTime,
    });

    if (!result || !Array.isArray(result)) {
      logger.warn("Channel videos fetch returned null (non-critical)", {
        channelId,
        durationMs: Date.now() - startTime,
      });
      return [];
    }

    logger.info("Fetched channel videos", {
      channelId,
      count: result.length,
      durationMs: Date.now() - startTime,
    });

    return result;
  } catch (err) {
    // Log but don't fail - this is non-critical
    logger.warn("Channel videos fetch failed (non-critical)", {
      channelId,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - startTime,
    });
    return [];
  }
}

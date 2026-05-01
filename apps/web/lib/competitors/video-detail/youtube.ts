/**
 * Competitor Video Detail - YouTube Fetch Helpers
 *
 * Wrappers around YouTube API calls with timeout handling.
 * Supports dual auth: OAuth (authenticated users) and API key (anonymous).
 *
 *   ┌────────────────────────────┐
 *   │   getCredential(userId?)   │
 *   │                            │
 *   │  userId present → OAuth    │
 *   │  userId absent  → API key  │
 *   └────────────────────────────┘
 */

import {
  fetchRecentChannelVideos as ytFetchRecentChannelVideos,
  fetchVideoComments as ytFetchVideoComments,
  fetchVideoDetails as ytFetchVideoDetails,
  getGoogleAccount,
} from "@/lib/adapters/youtube";
import {
  fetchVideoCommentsByApiKey,
  fetchVideoDetailsByApiKey,
} from "@/lib/adapters/youtube/data-api";
import type { YouTubeCredential } from "@/lib/adapters/youtube/types";
import { createLogger } from "@/lib/shared/logger";
import type { GoogleAccount } from "@/lib/youtube/types";

import { TimeoutError,withTimeout, withTimeoutOptional } from "./timeout";
import type {
  ChannelVideosResult,
  CommentsResult,
  RequestContext,
  VideoDetailsResult,
} from "./types";
import { CACHE_CONFIG,TIMEOUTS, VideoDetailError } from "./types";

const logger = createLogger({ module: "video-detail.youtube" });

/**
 * Get credential for YouTube API calls.
 * - Authenticated users: looks up GoogleAccount via Prisma
 * - Anonymous users: returns API key credential
 * Throws VideoDetailError if authenticated but account not found.
 */
export async function getCredential(
  userId: number | undefined,
  channelId: string | undefined,
): Promise<YouTubeCredential> {
  if (!userId || !channelId) {
    // Anonymous mode — use system API key
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new VideoDetailError(
        "YouTube API is not configured",
        "YOUTUBE_ERROR",
        500,
      );
    }
    return { kind: "apiKey", apiKey };
  }

  // Authenticated mode — look up OAuth credentials
  const ga = await getGoogleAccount(userId, channelId);
  if (!ga) {
    throw new VideoDetailError(
      "Google account not connected",
      "GOOGLE_ACCOUNT_MISSING",
      400,
    );
  }
  return { kind: "oauth", account: ga };
}

/**
 * Legacy alias for backward compatibility.
 */
export async function getGoogleAccountOrThrow(
  userId: number,
  channelId: string,
): Promise<GoogleAccount> {
  const cred = await getCredential(userId, channelId);
  if (cred.kind !== "oauth") {
    throw new VideoDetailError(
      "Google account not connected",
      "GOOGLE_ACCOUNT_MISSING",
      400,
    );
  }
  return cred.account;
}

/**
 * Fetch video details from YouTube API with timeout.
 * Supports both OAuth and API key auth.
 */
export async function fetchVideoDetailsWithTimeout(
  cred: YouTubeCredential,
  videoId: string,
  ctx: RequestContext,
): Promise<VideoDetailsResult> {
  const startTime = Date.now();

  try {
    let videoDetails;
    if (cred.kind === "oauth") {
      videoDetails = await withTimeout(
        ytFetchVideoDetails(cred.account, videoId),
        TIMEOUTS.VIDEO_DETAILS_MS,
        "fetchVideoDetails",
      );
    } else {
      videoDetails = await withTimeout(
        fetchVideoDetailsByApiKey(videoId),
        TIMEOUTS.VIDEO_DETAILS_MS,
        "fetchVideoDetailsByApiKey",
      );
    }

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
      authMode: cred.kind,
      durationMs: Date.now() - startTime,
    });

    return videoDetails as VideoDetailsResult;
  } catch (error) {
    if (error instanceof VideoDetailError) {throw error;}
    if (error instanceof TimeoutError) {
      throw new VideoDetailError(
        "YouTube API timed out fetching video details",
        "YOUTUBE_ERROR",
        504,
        { videoId, timeoutMs: TIMEOUTS.VIDEO_DETAILS_MS },
      );
    }
    throw new VideoDetailError(
      `Failed to fetch video details: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      "YOUTUBE_ERROR",
      502,
      { videoId },
    );
  }
}

/**
 * Fetch video comments from YouTube API with timeout.
 * Supports both OAuth and API key auth.
 * Returns null if comments disabled, error, or timeout (non-critical).
 */
export async function fetchCommentsWithTimeout(
  cred: YouTubeCredential,
  videoId: string,
  maxResults: number,
  ctx: RequestContext,
): Promise<CommentsResult | null> {
  const startTime = Date.now();

  try {
    let result;
    if (cred.kind === "oauth") {
      result = await withTimeoutOptional(
        ytFetchVideoComments(cred.account, videoId, maxResults),
        TIMEOUTS.COMMENTS_FETCH_MS,
        "fetchVideoComments",
      );
    } else {
      result = await withTimeoutOptional(
        fetchVideoCommentsByApiKey(videoId, maxResults),
        TIMEOUTS.COMMENTS_FETCH_MS,
        "fetchVideoCommentsByApiKey",
      );
    }

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
      authMode: cred.kind,
      durationMs: Date.now() - startTime,
    });

    return result as CommentsResult;
  } catch (error) {
    logger.warn("Comments fetch failed (non-critical)", {
      videoId,
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startTime,
    });
    return null;
  }
}

/**
 * Fetch recent videos from a channel with timeout.
 * For API key mode: uses the analyzed video's channel (not the user's channel).
 * Returns empty array on failure (non-critical).
 */
export async function fetchRecentChannelVideosWithTimeout(
  cred: YouTubeCredential,
  channelId: string,
  ctx: RequestContext,
): Promise<ChannelVideosResult> {
  const startTime = Date.now();
  const now = new Date();
  const publishedAfter = new Date(
    now.getTime() -
      CACHE_CONFIG.MORE_FROM_CHANNEL_RANGE_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  try {
    if (cred.kind === "apiKey") {
      // For API key mode, we can't use the OAuth-based fetch.
      // The YouTube API playlistItems.list works with API key, but
      // our wrapper (ytFetchRecentChannelVideos) uses the OAuth transport.
      // For now, skip "more from channel" for anonymous to avoid
      // adding complexity. This is a non-critical enhancement.
      // TODO: Add API-key-based channel videos fetch
      logger.info("Skipping channel videos for API key mode", { channelId });
      ctx.timings.push({
        stage: "youtube.channelVideos",
        durationMs: Date.now() - startTime,
      });
      return [];
    }

    const result = await withTimeoutOptional(
      ytFetchRecentChannelVideos(cred.account, channelId, publishedAfter, 6),
      TIMEOUTS.CHANNEL_VIDEOS_MS,
      "fetchRecentChannelVideos",
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
  } catch (error) {
    logger.warn("Channel videos fetch failed (non-critical)", {
      channelId,
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startTime,
    });
    return [];
  }
}

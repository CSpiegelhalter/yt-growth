/**
 * POST /api/tags/extract
 *
 * Extract tags from a YouTube video URL.
 * Uses the YouTube Data API to fetch video metadata including tags.
 *
 * Auth: Optional (works for both authenticated and anonymous users)
 * Rate Limited: By IP for anonymous users, by user ID for authenticated users
 */
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { jsonOk, jsonError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { parseYouTubeVideoId } from "@/lib/youtube-video-id";
import { logger } from "@/lib/logger";

// ============================================
// VALIDATION SCHEMA
// ============================================

const requestSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .refine(
      (val) => parseYouTubeVideoId(val) !== null,
      { message: "Invalid YouTube URL" }
    ),
});

// ============================================
// YOUTUBE API FETCH
// ============================================

type YouTubeVideoData = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  tags: string[];
};

async function fetchYouTubeVideoData(
  videoId: string
): Promise<YouTubeVideoData | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    logger.warn("tags-extract.missing_api_key", {
      message: "YOUTUBE_API_KEY not configured",
    });
    throw new ApiError({
      code: "INTERNAL",
      status: 500,
      message: "YouTube API is not configured. Please contact support.",
    });
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", apiKey);
  url.searchParams.set(
    "fields",
    "items/snippet(title,channelTitle,tags,thumbnails/medium/url)"
  );

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url.toString(), {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const status = response.status;
      logger.warn("tags-extract.youtube_api_error", {
        status,
        videoId,
      });

      if (status === 404) {
        throw new ApiError({
          code: "NOT_FOUND",
          status: 404,
          message: "Video not found. Please check the URL and try again.",
        });
      }

      if (status === 403) {
        throw new ApiError({
          code: "FORBIDDEN",
          status: 403,
          message: "Unable to access this video. It may be private or restricted.",
        });
      }

      throw new ApiError({
        code: "INTERNAL",
        status: 500,
        message: "Failed to fetch video data. Please try again.",
      });
    }

    const data = await response.json();
    const item = data.items?.[0];

    if (!item) {
      throw new ApiError({
        code: "NOT_FOUND",
        status: 404,
        message: "Video not found. Please check the URL and try again.",
      });
    }

    const snippet = item.snippet;

    return {
      videoId,
      title: snippet.title || "Unknown Title",
      channelTitle: snippet.channelTitle || "Unknown Channel",
      thumbnailUrl: snippet.thumbnails?.medium?.url || null,
      tags: Array.isArray(snippet.tags) ? snippet.tags : [],
    };
  } catch (err) {
    // Re-throw ApiErrors
    if (err instanceof ApiError) {
      throw err;
    }

    logger.warn("tags-extract.youtube_fetch_failed", {
      videoId,
      error: err instanceof Error ? err.message : "Unknown error",
    });

    throw new ApiError({
      code: "INTERNAL",
      status: 500,
      message: "Failed to fetch video data. Please try again.",
    });
  }
}

// ============================================
// ROUTE HANDLER
// ============================================

export const POST = createApiRoute(
  { route: "/api/tags/extract" },
  withAuth({ mode: "optional" }, async (req, _ctx, api: ApiAuthContext) => {
    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        status: 400,
        message: "Invalid JSON body",
      });
    }

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        status: 400,
        message: parsed.error.errors[0]?.message || "Invalid request",
        details: parsed.error.flatten(),
      });
    }

    const { url: videoUrl } = parsed.data;

    // Parse video ID from URL
    const videoId = parseYouTubeVideoId(videoUrl);
    if (!videoId) {
      return jsonError({
        status: 400,
        code: "VALIDATION_ERROR",
        message: "Could not extract video ID from URL",
        requestId: api.requestId,
      });
    }

    // Fetch video data from YouTube API
    const videoData = await fetchYouTubeVideoData(videoId);

    if (!videoData) {
      return jsonError({
        status: 404,
        code: "NOT_FOUND",
        message: "Video not found",
        requestId: api.requestId,
      });
    }

    // Log success (no sensitive data)
    logger.info("tags-extract.success", {
      userId: api.user?.id ?? "anonymous",
      videoId,
      tagCount: videoData.tags.length,
      hasTags: videoData.tags.length > 0,
    });

    return jsonOk(
      {
        videoId: videoData.videoId,
        title: videoData.title,
        channelTitle: videoData.channelTitle,
        thumbnailUrl: videoData.thumbnailUrl,
        tags: videoData.tags,
        hasTags: videoData.tags.length > 0,
      },
      { requestId: api.requestId }
    );
  })
);

export const runtime = "nodejs";

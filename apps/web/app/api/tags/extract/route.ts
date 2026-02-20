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
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk, jsonError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { parseYouTubeVideoId } from "@/lib/youtube-video-id";
import { fetchVideoSnippetByApiKey } from "@/lib/youtube/data-api";
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
// ROUTE HANDLER
// ============================================

export const POST = createApiRoute(
  { route: "/api/tags/extract" },
  withAuth(
    { mode: "optional" },
    withValidation(
      { body: requestSchema },
      async (_req, _ctx, api: ApiAuthContext, validated) => {
        const { url: videoUrl } = validated.body!;

        const videoId = parseYouTubeVideoId(videoUrl);
        if (!videoId) {
          return jsonError({
            status: 400,
            code: "VALIDATION_ERROR",
            message: "Could not extract video ID from URL",
            requestId: api.requestId,
          });
        }

        const item = await fetchVideoSnippetByApiKey(videoId, {
          fields:
            "items/snippet(title,channelTitle,tags,thumbnails/medium/url)",
        });

        if (!item) {
          throw new ApiError({
            code: "NOT_FOUND",
            status: 404,
            message: "Video not found. Please check the URL and try again.",
          });
        }

        const snippet = item.snippet;
        const tags = Array.isArray(snippet.tags) ? snippet.tags : [];

        logger.info("tags-extract.success", {
          userId: api.user?.id ?? "anonymous",
          videoId,
          tagCount: tags.length,
          hasTags: tags.length > 0,
        });

        return jsonOk(
          {
            videoId,
            title: snippet.title || "Unknown Title",
            channelTitle: snippet.channelTitle || "Unknown Channel",
            thumbnailUrl: snippet.thumbnails?.medium?.url || null,
            tags,
            hasTags: tags.length > 0,
          },
          { requestId: api.requestId }
        );
      }
    )
  )
);

export const runtime = "nodejs";

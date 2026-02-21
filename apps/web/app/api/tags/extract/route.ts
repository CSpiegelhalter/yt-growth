/**
 * POST /api/tags/extract
 *
 * Extract tags from a YouTube video URL.
 *
 * Auth: Optional (works for both authenticated and anonymous users)
 */
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import { fetchVideoSnippetByApiKey } from "@/lib/youtube/data-api";
import { extractTags, ExtractTagsBodySchema } from "@/lib/features/tags";
import type { ExtractTagsDeps } from "@/lib/features/tags";

const deps: ExtractTagsDeps = {
  youtube: {
    async getVideoSnippet(videoId) {
      const item = await fetchVideoSnippetByApiKey(videoId, {
        fields: "items/snippet(title,channelTitle,tags,thumbnails/medium/url)",
      });
      if (!item?.snippet) {return null;}
      return {
        title: item.snippet.title || "",
        description: item.snippet.description || "",
        tags: item.snippet.tags || [],
        channelTitle: item.snippet.channelTitle || "",
        thumbnailUrl: item.snippet.thumbnails?.medium?.url || null,
      };
    },
  },
};

export const POST = createApiRoute(
  { route: "/api/tags/extract" },
  withAuth(
    { mode: "optional" },
    withValidation(
      { body: ExtractTagsBodySchema },
      async (_req, _ctx, api, { body }) => {
        const result = await extractTags({ url: body!.url }, deps);
        return jsonOk(result, { requestId: api.requestId });
      },
    ),
  ),
);

export const runtime = "nodejs";

/**
 * POST /api/youtube-tag-generator
 *
 * Generate YouTube tags using LLM based on video title, description,
 * and optional reference video.
 *
 * Auth: Optional (works for both authenticated and anonymous users)
 */
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import { callLLM } from "@/lib/llm";
import { fetchVideoSnippetByApiKey } from "@/lib/youtube/data-api";
import { getLimit } from "@/lib/features/subscriptions/use-cases/checkEntitlement";
import { checkAndIncrement } from "@/lib/features/subscriptions/use-cases/trackUsage";
import { hasActiveSubscription } from "@/lib/server/auth";
import {
  generateTags,
  GenerateTagsBodySchema,
} from "@/lib/features/tags";
import type { GenerateTagsDeps } from "@/lib/features/tags";

const deps: GenerateTagsDeps = {
  llm: {
    async complete(params) {
      return callLLM(
        params.messages.map((m) => ({
          role: m.role as "system" | "user" | "assistant",
          content: m.content,
        })),
        {
          model: params.model,
          temperature: params.temperature,
          maxTokens: params.maxTokens,
          responseFormat: "json_object",
        },
      );
    },
  },
  youtube: {
    async getVideoSnippet(videoId) {
      const item = await fetchVideoSnippetByApiKey(videoId, {
        fields: "items/snippet(title,description,tags,channelTitle)",
      });
      if (!item?.snippet) {return null;}
      return {
        title: item.snippet.title || "",
        description: item.snippet.description || "",
        tags: item.snippet.tags || [],
        channelTitle: item.snippet.channelTitle || "",
        thumbnailUrl: null,
      };
    },
  },
  usage: { checkAndIncrement },
  getLimit,
};

export const POST = createApiRoute(
  { route: "/api/youtube-tag-generator" },
  withAuth(
    { mode: "optional" },
    withValidation(
      { body: GenerateTagsBodySchema },
      async (req, _ctx, api: ApiAuthContext, { body }) => {
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        const isPro = api.user ? hasActiveSubscription(api.user.subscription) : false;
        const result = await generateTags(
          { ...body!, userId: api.user?.id, isPro, ip },
          deps,
        );
        return jsonOk(result, { requestId: api.requestId });
      },
    ),
  ),
);

export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { createApiRoute } from "@/lib/api/route";
import { getCurrentUserWithSubscription } from "@/lib/user";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";

import { getGoogleAccount } from "@/lib/youtube-api";
import { GoogleTokenRefreshError } from "@/lib/google-tokens";
import { fetchOwnedVideoComments, type VideoComment } from "@/lib/youtube-analytics";
import { callLLM } from "@/lib/llm";
import type { VideoMetadata } from "@/lib/youtube-analytics";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
  videoId: z.string().min(1),
});

const QuerySchema = z.object({
  range: z.enum(["7d", "28d", "90d"]).default("28d"),
});

export type CommentInsights = {
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  themes: Array<{
    theme: string;
    count: number;
    examples: string[];
  }>;
  viewerLoved: string[];
  viewerAskedFor: string[];
  hookInspiration: string[];
};

/**
 * GET - Fetch comment insights (deep dive, lazy loaded)
 */
async function GETHandler(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string; videoId: string }> }
) {
  const resolvedParams = await params;

  const parsedParams = ParamsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return Response.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { channelId, videoId } = parsedParams.data;

  const url = new URL(req.url);
  const queryResult = QuerySchema.safeParse({
    range: url.searchParams.get("range") ?? "28d",
  });
  if (!queryResult.success) {
    return Response.json({ error: "Invalid query parameters" }, { status: 400 });
  }
  const { range } = queryResult.data;

  try {
    const user = await getCurrentUserWithSubscription();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const channel = await prisma.channel.findFirst({
      where: { youtubeChannelId: channelId, userId: user.id },
    });
    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    // Get cached analytics data (for video metadata)
    const cached = await prisma.ownedVideoInsightsCache.findFirst({
      where: {
        userId: user.id,
        channelId: channel.id,
        videoId,
        range,
      },
    });

    if (!cached?.derivedJson) {
      return Response.json(
        { error: "Analytics not loaded. Call /analytics first." },
        { status: 400 }
      );
    }

    const derivedData = cached.derivedJson as any;

    // Rate limit (uses same limit as main insights)
    const rateResult = checkRateLimit(
      rateLimitKey("videoInsights", user.id),
      RATE_LIMITS.videoInsights
    );
    if (!rateResult.success) {
      return Response.json(
        { error: "Rate limit exceeded", retryAfter: rateResult.resetAt },
        { status: 429 }
      );
    }

    // Fetch comments
    const ga = await getGoogleAccount(user.id, channelId);
    if (!ga) {
      return Response.json(
        { error: "Google account not connected" },
        { status: 400 }
      );
    }

    const comments = await fetchOwnedVideoComments(ga, videoId, 30);

    if (comments.length === 0) {
      return Response.json({
        comments: {
          sentiment: { positive: 0, neutral: 100, negative: 0 },
          themes: [],
          viewerLoved: [],
          viewerAskedFor: [],
          hookInspiration: [],
          noComments: true,
        },
      });
    }

    const commentInsights = await generateCommentInsights(
      derivedData.video,
      comments
    );

    // Return with 12-hour cache header for browser caching
    return Response.json(
      { comments: commentInsights },
      {
        headers: {
          "Cache-Control": "private, max-age=43200", // 12 hours
        },
      }
    );
  } catch (err) {
    console.error("Comment insights error:", err);
    
    // Handle token refresh errors specifically
    if (err instanceof GoogleTokenRefreshError) {
      return Response.json(
        { error: err.message, code: "youtube_permissions" },
        { status: 403 }
      );
    }
    
    return Response.json(
      { error: "Failed to generate comment insights" },
      { status: 500 }
    );
  }
}

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/videos/[videoId]/insights/comments" },
  async (req, ctx) => GETHandler(req, ctx as any)
);

async function generateCommentInsights(
  video: VideoMetadata,
  comments: VideoComment[]
): Promise<CommentInsights> {
  const topComments = [...comments]
    .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
    .slice(0, 20)
    .map((c) => `[${c.likes ?? 0} likes] "${c.text.slice(0, 200)}"`)
    .join("\n");

  if (!topComments) {
    return {
      sentiment: { positive: 0, neutral: 100, negative: 0 },
      themes: [],
      viewerLoved: [],
      viewerAskedFor: [],
      hookInspiration: [],
    };
  }

  const systemPrompt = `You are a YouTube comment analyst. Extract viewer voice insights from these TOP COMMENTS.

Return ONLY valid JSON:
{
  "sentiment": { "positive": 60, "neutral": 30, "negative": 10 },
  "themes": [{ "theme": "Theme name", "count": 5, "examples": ["short quote"] }],
  "viewerLoved": ["What viewers praised - quote or paraphrase actual comments"],
  "viewerAskedFor": ["What viewers asked for in future content"],
  "hookInspiration": ["Short hook-worthy quotes under 25 words from comments"]
}

RULES:
1. Sentiment percentages must add up to 100
2. Base everything on the actual comments provided
3. viewerLoved and viewerAskedFor should quote or paraphrase real comments
4. hookInspiration should be memorable short quotes
5. If comments are sparse or generic, reflect that honestly
6. No emojis, no markdown`;

  try {
    const result = await callLLM(
      [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `VIDEO: "${video.title}"\n\nTOP COMMENTS (sorted by likes):\n${topComments}`,
        },
      ],
      { maxTokens: 600, temperature: 0.3, responseFormat: "json_object" }
    );
    return JSON.parse(result.content);
  } catch (err) {
    console.error("Comment insights LLM failed:", err);
    return {
      sentiment: { positive: 0, neutral: 100, negative: 0 },
      themes: [],
      viewerLoved: [],
      viewerAskedFor: [],
      hookInspiration: [],
    };
  }
}

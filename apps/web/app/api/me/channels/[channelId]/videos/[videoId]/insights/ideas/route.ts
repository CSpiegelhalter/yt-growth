import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { createApiRoute } from "@/lib/api/route";
import { getCurrentUserWithSubscription } from "@/lib/user";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import { callLLM } from "@/lib/llm";
import type {
  DerivedMetrics,
  BaselineComparison,
} from "@/lib/owned-video-math";
import type { VideoMetadata } from "@/lib/youtube-analytics";
import type { ChannelProfileAI } from "@/lib/channel-profile/types";
import { channelVideoParamsSchema } from "@/lib/competitors/video-detail/validation";

const QuerySchema = z.object({
  range: z.enum(["7d", "28d", "90d"]).default("28d"),
});

export type RemixIdea = {
  title: string;
  hook: string;
  keywords: string[];
  angle: string;
};

export type IdeasAnalysis = {
  remixIdeas: RemixIdea[];
  contentGaps: string[];
};

/**
 * GET - Fetch content ideas (deep dive, lazy loaded)
 */
async function GETHandler(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string; videoId: string }> },
) {
  const resolvedParams = await params;

  const parsedParams = channelVideoParamsSchema.safeParse(resolvedParams);
  if (!parsedParams.success) {
    return Response.json({ error: "Invalid parameters" }, { status: 400 });
  }

  const { channelId, videoId } = parsedParams.data;

  const url = new URL(req.url);
  const queryResult = QuerySchema.safeParse({
    range: url.searchParams.get("range") ?? "28d",
  });
  if (!queryResult.success) {
    return Response.json(
      { error: "Invalid query parameters" },
      { status: 400 },
    );
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

    // Get cached analytics data
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
        { status: 400 },
      );
    }

    const derivedData = cached.derivedJson as any;

    // Rate limit (uses same limit as main insights)
    const rateResult = checkRateLimit(
      rateLimitKey("videoInsights", user.id),
      RATE_LIMITS.videoInsights,
    );
    if (!rateResult.success) {
      return Response.json(
        { error: "Rate limit exceeded", retryAfter: rateResult.resetAt },
        { status: 429 },
      );
    }

    // Fetch channel profile for better idea context
    let channelProfile: ChannelProfileAI | null = null;
    try {
      const profiles = await prisma.$queryRaw<
        { aiProfileJson: string | null }[]
      >`
        SELECT "aiProfileJson" FROM "ChannelProfile" WHERE "channelId" = ${channel.id} LIMIT 1
      `;
      if (profiles[0]?.aiProfileJson) {
        channelProfile = JSON.parse(
          profiles[0].aiProfileJson,
        ) as ChannelProfileAI;
      }
    } catch {
      // Profile table may not exist or no profile set - continue without it
    }

    const ideas = await generateIdeasAnalysis(
      derivedData.video,
      derivedData.derived,
      derivedData.comparison,
      channelProfile,
    );

    if (!ideas) {
      return Response.json(
        { error: "Failed to generate content ideas" },
        { status: 500 },
      );
    }

    // Return with 12-hour cache header for browser caching
    return Response.json(
      { ideas },
      {
        headers: {
          "Cache-Control": "private, max-age=43200", // 12 hours
        },
      },
    );
  } catch (err) {
    console.error("Ideas analysis error:", err);
    return Response.json(
      { error: "Failed to generate content ideas" },
      { status: 500 },
    );
  }
}

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/videos/[videoId]/insights/ideas" },
  async (req, ctx) => GETHandler(req, ctx as any),
);

async function generateIdeasAnalysis(
  video: VideoMetadata,
  derived: DerivedMetrics,
  _comparison: BaselineComparison,
  channelProfile: ChannelProfileAI | null,
): Promise<IdeasAnalysis | null> {
  // Build channel profile context if available
  const profileContext = channelProfile
    ? `
CHANNEL PROFILE (use as PRIMARY context for idea generation):
- Channel Niche: ${channelProfile.nicheLabel}
- Description: ${channelProfile.nicheDescription}
- Target Audience: ${channelProfile.targetAudience}
- Content Pillars: ${channelProfile.contentPillars.map((p) => p.name).join(", ")}
- Value Proposition: ${channelProfile.channelValueProposition}
- Tone/Style: ${channelProfile.toneAndStyle.join(", ")}

IMPORTANT: Generate ideas that align with this channel's niche and audience. Ideas should fit within their content pillars and match their tone/style.
`
    : "";

  const systemPrompt = `You are a YouTube content strategist. Generate spinoff and remix ideas based on this video's topic and performance.
${profileContext}
Return ONLY valid JSON:
{
  "remixIdeas": [
    {
      "title": "Full video title ready to use",
      "hook": "Opening line for this video (2-3 sentences)",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "angle": "What makes this different from the original video"
    }
  ],
  "contentGaps": ["Topic gap 1 based on what viewers might want next", "Topic gap 2"]
}

RULES:
1. Generate exactly 4 remix ideas
2. Each title must be complete and usable (not a template)
3. Ideas should be genuine spinoffs from THIS video's topic${channelProfile ? " that align with the channel's niche and audience" : ""}
4. Include a mix: deep-dive, beginner version, contrarian take, related topic
5. Keywords should be searchable terms${channelProfile ? ` relevant to ${channelProfile.nicheLabel}` : ""}
6. Content gaps should be what viewers of this video would want next
7. No emojis, no hashtags`;

  const videoContext = `ORIGINAL VIDEO:
TITLE: "${video.title}"
DESCRIPTION: "${video.description?.slice(0, 300) || "No description"}"
TAGS: [${video.tags
    .slice(0, 10)
    .map((t) => `"${t}"`)
    .join(", ")}]
PERFORMANCE: ${derived.totalViews.toLocaleString()} views`;

  try {
    const result = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: videoContext },
      ],
      { maxTokens: 800, temperature: 0.4, responseFormat: "json_object" },
    );
    return JSON.parse(result.content);
  } catch (err) {
    console.error("Ideas analysis LLM failed:", err);
    return null;
  }
}

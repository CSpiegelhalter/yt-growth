import { NextRequest } from "next/server";
import { prisma } from "@/prisma";
import { createApiRoute } from "@/lib/api/route";
import { callLLM } from "@/lib/llm";
import type {
  DerivedMetrics,
  BaselineComparison,
} from "@/lib/owned-video-math";
import type { VideoMetadata } from "@/lib/youtube-analytics";
import type { ChannelProfileAI } from "@/lib/channel-profile/types";
import {
  getVideoInsightsContext,
  isErrorResponse,
} from "@/lib/insights/context";

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

async function GETHandler(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string; videoId: string }> },
) {
  const ctx = await getVideoInsightsContext(req, params);
  if (isErrorResponse(ctx)) return ctx;

  try {
    let channelProfile: ChannelProfileAI | null = null;
    try {
      const profiles = await prisma.$queryRaw<
        { aiProfileJson: string | null }[]
      >`
        SELECT "aiProfileJson" FROM "ChannelProfile" WHERE "channelId" = ${ctx.channel.id} LIMIT 1
      `;
      if (profiles[0]?.aiProfileJson) {
        channelProfile = JSON.parse(
          profiles[0].aiProfileJson,
        ) as ChannelProfileAI;
      }
    } catch {
      // Profile table may not exist or no profile set
    }

    const ideas = await generateIdeasAnalysis(
      ctx.derivedData.video,
      ctx.derivedData.derived,
      ctx.derivedData.comparison,
      channelProfile,
    );

    if (!ideas) {
      return Response.json(
        { error: "Failed to generate content ideas" },
        { status: 500 },
      );
    }

    return Response.json(
      { ideas },
      {
        headers: {
          "Cache-Control": "private, max-age=43200",
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

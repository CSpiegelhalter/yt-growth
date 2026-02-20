/**
 * POST /api/me/channels/[channelId]/subscriber-audit/ideas
 *
 * Generate more video ideas optimized for subscriber conversion.
 *
 * Auth: Required
 * Subscription: Required
 */
import { NextRequest } from "next/server";
import { prisma } from "@/prisma";
import { createApiRoute } from "@/lib/api/route";
import {
  getCurrentUserWithSubscription,
  hasActiveSubscription,
} from "@/lib/user";
import { callLLM } from "@/lib/llm";
import type { ConversionVideoIdea } from "@/types/api";
import { channelParamsSchema } from "@/lib/competitors/video-detail/validation";

async function POSTHandler(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  void req;
  try {
    // Auth check
    const user = await getCurrentUserWithSubscription();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Subscription check
    if (!hasActiveSubscription(user.subscription)) {
      return Response.json(
        { error: "Subscription required", code: "SUBSCRIPTION_REQUIRED" },
        { status: 403 }
      );
    }

    // Validate params
    const resolvedParams = await params;
    const parsedParams = channelParamsSchema.safeParse(resolvedParams);
    if (!parsedParams.success) {
      return Response.json({ error: "Invalid channel ID" }, { status: 400 });
    }

    const { channelId } = parsedParams.data;

    // Get channel and verify ownership
    const channel = await prisma.channel.findFirst({
      where: {
        youtubeChannelId: channelId,
        userId: user.id,
      },
    });

    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    // Get top videos for context
    const videos = await prisma.video.findMany({
      where: {
        channelId: channel.id,
        VideoMetrics: { isNot: null },
      },
      include: {
        VideoMetrics: true,
      },
      orderBy: { publishedAt: "desc" },
      take: 10,
    });

    const topTitles = videos
      .filter((v) => v.VideoMetrics)
      .slice(0, 5)
      .map((v) => v.title);

    // Generate new ideas
    const ideas = await generateMoreConversionIdeas(
      channel.title ?? "Your channel",
      topTitles
    );

    return Response.json({ ideas });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Generate ideas error:", err);
    return Response.json(
      { error: "Failed to generate ideas", detail: message },
      { status: 500 }
    );
  }
}

export const POST = createApiRoute(
  { route: "/api/me/channels/[channelId]/subscriber-audit/ideas" },
  async (req, ctx) => POSTHandler(req, ctx as any)
);

async function generateMoreConversionIdeas(
  channelTitle: string,
  recentTitles: (string | null)[]
): Promise<ConversionVideoIdea[]> {
  const systemPrompt = `You are a YouTube growth expert. Generate 3 new video ideas optimized for subscriber conversion.

Return ONLY valid JSON array:
[
  {
    "title": "Video title idea",
    "hook": "Opening line that grabs attention",
    "whyItConverts": "One line explanation",
    "ctaSuggestion": "When and how to ask for subscribe"
  }
]

Guidelines:
- Make titles specific and curiosity-driven
- Hooks should be conversational and relatable
- Focus on why viewers would want to subscribe
- CTA suggestions should be natural and non-pushy`;

  const userPrompt = `Channel: ${channelTitle}

Recent video topics:
${recentTitles.filter(Boolean).map((t, i) => `${i + 1}. ${t}`).join("\n")}

Generate 3 NEW video ideas that would convert viewers to subscribers. Different from the existing topics but aligned with the channel's niche.`;

  try {
    const result = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.8, maxTokens: 1000 }
    );

    const jsonMatch = result.content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ConversionVideoIdea[];
    }
  } catch (err) {
    console.warn("Failed to generate more ideas:", err);
  }

  // Fallback
  return [
    {
      title: "What I Wish I Knew When I Started",
      hook: "If I could go back and tell myself one thing...",
      whyItConverts: "Creates connection through shared learning journey",
      ctaSuggestion: "Subscribe CTA after sharing the key insight",
    },
    {
      title: "The Simple Trick That Changed Everything",
      hook: "I almost didn't believe it when I first tried this...",
      whyItConverts: "Promises transformation with low effort",
      ctaSuggestion: "Soft CTA after showing results, strong at end",
    },
    {
      title: "Why Most People Get This Wrong",
      hook: "Here's the mistake I see over and over again...",
      whyItConverts: "Positions viewer as getting insider knowledge",
      ctaSuggestion: "CTA after revealing the correct approach",
    },
  ];
}


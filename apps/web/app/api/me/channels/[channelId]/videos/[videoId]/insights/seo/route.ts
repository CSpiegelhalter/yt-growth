import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { createApiRoute } from "@/lib/api/route";
import { getCurrentUserWithSubscription } from "@/lib/user";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import { callLLM } from "@/lib/llm";
import type { DerivedMetrics } from "@/lib/owned-video-math";
import type { VideoMetadata } from "@/lib/youtube-analytics";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
  videoId: z.string().min(1),
});

const QuerySchema = z.object({
  range: z.enum(["7d", "28d", "90d"]).default("28d"),
});

export type FocusKeywordResult = {
  keyword: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  alternatives: string[];
};

export type SeoAnalysis = {
  focusKeyword?: FocusKeywordResult;
  titleAnalysis: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  descriptionAnalysis: {
    score: number;
    weaknesses: string[];
    rewrittenOpening: string;
    addTheseLines: string[];
  };
  tagAnalysis: {
    score: number;
    feedback: string;
    missing: string[];
    impactLevel: "high" | "medium" | "low";
  };
};

/**
 * GET - Fetch SEO analysis (deep dive, lazy loaded)
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
    return Response.json(
      { error: "Invalid query parameters" },
      { status: 400 }
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

    const seoAnalysis = await generateSeoAnalysis(
      derivedData.video,
      derivedData.derived
    );

    if (!seoAnalysis) {
      return Response.json(
        { error: "Failed to generate SEO analysis" },
        { status: 500 }
      );
    }

    // Return with 12-hour cache header for browser caching
    return Response.json(
      { seo: seoAnalysis },
      {
        headers: {
          "Cache-Control": "private, max-age=43200", // 12 hours
        },
      }
    );
  } catch (err) {
    console.error("SEO analysis error:", err);
    return Response.json(
      { error: "Failed to generate SEO analysis" },
      { status: 500 }
    );
  }
}

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/videos/[videoId]/insights/seo" },
  async (req, ctx) => GETHandler(req, ctx as any)
);

/**
 * Detect the focus keyword for a video using LLM.
 * This understands context like episode numbers, repeated words, game names, etc.
 */
async function detectFocusKeyword(
  video: VideoMetadata
): Promise<FocusKeywordResult | null> {
  const systemPrompt = `You are a YouTube SEO expert. Your task is to identify the main search keyword/phrase for a video.

Return ONLY valid JSON:
{
  "keyword": "the main searchable keyword (2-4 words ideal)",
  "confidence": "high" | "medium" | "low",
  "reasoning": "Brief explanation of why this keyword (1 sentence)",
  "alternatives": ["alt keyword 1", "alt keyword 2", "alt keyword 3"]
}

CRITICAL RULES:
1. The keyword should be what someone would SEARCH to find this video
2. IGNORE episode numbers, part numbers, day numbers (e.g., "#51", "Day 3", "Part 2")
3. IGNORE filler/repeated words in titles (e.g., "Please, Please, Please" is not a keyword)
4. For gaming videos: use the GAME NAME as the primary keyword (e.g., "Blue Prince", "Minecraft", "Elden Ring")
5. For series/vlogs: focus on the TOPIC, not the episode (e.g., "Japan travel", not "Day 3")
6. For tutorials: include the skill/topic (e.g., "smokey eye tutorial", "Python basics")
7. For reviews: include the product (e.g., "iPhone 15 review", "MacBook Pro review")
8. Keep keywords 2-4 words for best searchability
9. Confidence: high = clear topic, medium = somewhat ambiguous, low = very unclear/artistic title
10. Alternatives should be related searchable variations`;

  const videoContext = `TITLE: "${video.title}"
DESCRIPTION EXCERPT: "${video.description?.slice(0, 300) || "No description"}"
TAGS: [${video.tags
    .slice(0, 10)
    .map((t) => `"${t}"`)
    .join(", ")}]`;

  try {
    const result = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: videoContext },
      ],
      { maxTokens: 200, temperature: 0.2, responseFormat: "json_object" }
    );
    return JSON.parse(result.content);
  } catch (err) {
    console.error("Focus keyword detection failed:", err);
    return null;
  }
}

async function generateSeoAnalysis(
  video: VideoMetadata,
  derived: DerivedMetrics
): Promise<SeoAnalysis | null> {
  // First, detect the focus keyword (fast, separate call)
  const focusKeyword = await detectFocusKeyword(video);

  const searchTraffic = derived.trafficSources?.search ?? 0;
  const totalTraffic = derived.trafficSources?.total ?? 1;
  const isSearchDriven = searchTraffic > totalTraffic * 0.3;
  const tagImpactNote = isSearchDriven
    ? "Tags are HIGH IMPACT for this video since it gets significant search traffic."
    : "Tags are LOW IMPACT for most YouTube videos. Focus on title/thumbnail instead.";

  const keywordContext = focusKeyword
    ? `The main keyword for this video is "${focusKeyword.keyword}". Use this in your analysis.`
    : "";

  const systemPrompt = `You are an elite YouTube SEO specialist. Analyze this video's title, description, and tags.
${keywordContext}

Return ONLY valid JSON:
{
  "titleAnalysis": {
    "score": 7,
    "strengths": ["What makes this title work"],
    "weaknesses": ["What could be improved"],
    "suggestions": ["Full alternative title 1", "Full alternative title 2", "Full alternative title 3"]
  },
  "descriptionAnalysis": {
    "score": 7,
    "weaknesses": ["What is missing or hurting SEO"],
    "rewrittenOpening": "Stronger first 200 characters for search + humans",
    "addTheseLines": ["Copy/paste line 1", "Copy/paste line 2", "Copy/paste line 3"]
  },
  "tagAnalysis": {
    "score": 6,
    "feedback": "Specific feedback about the tags",
    "missing": ["specific tag 1", "specific tag 2", "...15-20 tags total"],
    "impactLevel": "high" | "medium" | "low"
  }
}

RULES:
1. Title suggestions MUST be complete, usable titles for THIS video's topic
2. Tag suggestions in "missing" must be SPECIFIC, ready to paste (15-20 tags)
3. ${tagImpactNote}
4. Description rewrite should include the main keyword naturally
5. No emojis, no hashtags`;

  const videoContext = `TITLE: "${video.title}"
DESCRIPTION: "${video.description?.slice(0, 500) || "No description"}"
TAGS: [${video.tags
    .slice(0, 20)
    .map((t) => `"${t}"`)
    .join(", ")}]
DURATION: ${Math.round(video.durationSec / 60)} minutes
VIEWS: ${derived.totalViews.toLocaleString()}`;

  try {
    const result = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: videoContext },
      ],
      { maxTokens: 1000, temperature: 0.3, responseFormat: "json_object" }
    );
    const analysis = JSON.parse(result.content);

    // Add focus keyword to the response
    if (focusKeyword) {
      analysis.focusKeyword = focusKeyword;
    }

    return analysis;
  } catch (err) {
    console.error("SEO analysis LLM failed:", err);
    return null;
  }
}

/**
 * GET/POST /api/me/channels/[channelId]/idea-board
 *
 * Get or generate IdeaBoard data - premium idea engine with proof from similar channels.
 * This is a PAID feature - requires active subscription.
 *
 * Auth: Required
 * Subscription: Required
 * Rate limit: 5 per hour per user (for POST only)
 * Caching: 24h per channelId + range
 *
 * GET - returns cached IdeaBoard or demo data
 * POST - generates new IdeaBoard or adds more ideas
 *
 * Query params:
 * - range: "7d" | "28d" (default: "7d")
 * - mode: "default" | "more" (POST only, default: "default")
 *
 * Demo mode: Returns fixture data when NEXT_PUBLIC_DEMO_MODE=1 or on API failure
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import {
  getCurrentUserWithSubscription,
  hasActiveSubscription,
} from "@/lib/user";
import {
  getGoogleAccount,
  searchSimilarChannels,
  fetchRecentChannelVideos,
} from "@/lib/youtube-api";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import { isDemoMode, getDemoData, isYouTubeMockMode } from "@/lib/demo-fixtures";
import { generateIdeaBoardPlan, generateMoreIdeas } from "@/lib/idea-board-llm";
import type { IdeaBoardData, SimilarChannel } from "@/types/api";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
});

const QuerySchema = z.object({
  range: z.enum(["7d", "28d"]).default("7d"),
});

const BodySchema = z.object({
  mode: z.enum(["default", "more"]).default("default"),
  range: z.enum(["7d", "28d"]).optional(),
});

// Common words to filter out
const commonWords = new Set([
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "from",
  "have",
  "you",
  "what",
  "when",
  "where",
  "how",
  "why",
  "who",
  "which",
  "your",
  "will",
  "video",
  "videos",
  "watch",
  "watching",
  "today",
  "new",
]);

/**
 * GET - Return cached IdeaBoard or demo data
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  // Return demo data if demo mode is enabled
  if (isDemoMode() && !isYouTubeMockMode()) {
    const demoData = getDemoData("idea-board") as IdeaBoardData;
    return Response.json({ ...demoData, demo: true });
  }

  try {
    // Auth check
    const user = await getCurrentUserWithSubscription();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Subscription check (paid feature)
    if (!hasActiveSubscription(user.subscription)) {
      return Response.json(
        { error: "Subscription required", code: "SUBSCRIPTION_REQUIRED" },
        { status: 403 }
      );
    }

    // Validate params
    const parsedParams = ParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      return Response.json({ error: "Invalid channel ID" }, { status: 400 });
    }

    const { channelId } = parsedParams.data;

    // Parse query params
    const url = new URL(req.url);
    const queryResult = QuerySchema.safeParse({
      range: url.searchParams.get("range") ?? "7d",
    });

    if (!queryResult.success) {
      return Response.json(
        { error: "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { range } = queryResult.data;

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

    // Check for cached IdeaBoard
    const cacheKey = `idea-board-${channelId}-${range}`;
    const cached = await prisma.plan.findFirst({
      where: {
        channelId: channel.id,
        inputsJson: { contains: cacheKey },
        cachedUntil: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (cached?.outputJson) {
      try {
        const data =
          typeof cached.outputJson === "string"
            ? JSON.parse(cached.outputJson)
            : cached.outputJson;
        return Response.json({ ...data, fromCache: true });
      } catch {
        // Fall through to return empty state
      }
    }

    // No cached data - return empty state (POST to generate)
    return Response.json({
      channelId,
      channelTitle: channel.title ?? undefined,
      range,
      ideas: [],
      nicheInsights: { momentumNow: [], patternsToCopy: [], gapsToExploit: [] },
      similarChannels: [],
    });
  } catch (err: unknown) {
    console.error("IdeaBoard GET error:", err);
    return Response.json(
      { error: "Failed to fetch idea board" },
      { status: 500 }
    );
  }
}

/**
 * POST - Generate new IdeaBoard or add more ideas
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { channelId: string } }
) {
  // Return demo data if demo mode is enabled
  if (isDemoMode() && !isYouTubeMockMode()) {
    const demoData = getDemoData("idea-board") as IdeaBoardData;
    return Response.json({ ...demoData, demo: true });
  }

  try {
    // Auth check
    const user = await getCurrentUserWithSubscription();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Subscription check (paid feature)
    if (!hasActiveSubscription(user.subscription)) {
      return Response.json(
        { error: "Subscription required", code: "SUBSCRIPTION_REQUIRED" },
        { status: 403 }
      );
    }

    // Validate params
    const parsedParams = ParamsSchema.safeParse(params);
    if (!parsedParams.success) {
      return Response.json({ error: "Invalid channel ID" }, { status: 400 });
    }

    const { channelId } = parsedParams.data;

    // Parse body
    let body: z.infer<typeof BodySchema>;
    try {
      body = BodySchema.parse(await req.json());
    } catch {
      body = { mode: "default" };
    }

    const mode = body.mode;
    const range = body.range ?? "7d";

    // Rate limit check
    const rateKey = rateLimitKey("planGeneration", user.id);
    const rateResult = checkRateLimit(rateKey, RATE_LIMITS.planGeneration);
    if (!rateResult.success) {
      return Response.json(
        {
          error: "Rate limit exceeded. Try again later.",
          resetAt: new Date(rateResult.resetAt),
        },
        { status: 429 }
      );
    }

    // Get channel with recent videos
    const channel = await prisma.channel.findFirst({
      where: {
        youtubeChannelId: channelId,
        userId: user.id,
      },
      include: {
        Video: {
          orderBy: { publishedAt: "desc" },
          take: 15,
          include: { VideoMetrics: true },
        },
      },
    });

    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    // Check for existing cached data when mode=more
    const cacheKey = `idea-board-${channelId}-${range}`;
    let existingData: IdeaBoardData | null = null;

    if (mode === "more") {
      const cached = await prisma.plan.findFirst({
        where: {
          channelId: channel.id,
          inputsJson: { contains: cacheKey },
          cachedUntil: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      if (cached?.outputJson) {
        try {
          existingData =
            typeof cached.outputJson === "string"
              ? JSON.parse(cached.outputJson)
              : (cached.outputJson as IdeaBoardData);
        } catch {
          existingData = null;
        }
      }
    }

    // Get Google account for API calls
    const ga = await getGoogleAccount(user.id);

    // Extract keywords from channel content
    const titleWords = channel.Video.flatMap((v) =>
      (v.title ?? "").toLowerCase().split(/\s+/)
    ).filter((w) => w.length > 3 && !commonWords.has(w));

    const tagWords = channel.Video.flatMap((v) =>
      (v.tags ?? "").split(",").map((t) => t.trim().toLowerCase())
    ).filter(Boolean);

    const wordCounts = new Map<string, number>();
    [...titleWords, ...tagWords].forEach((word) => {
      wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
    });

    const keywords = [...wordCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    // Fetch similar channels and their winners
    let similarChannels: SimilarChannel[] = [];

    if (ga && keywords.length > 0) {
      try {
        const similarResults = await searchSimilarChannels(ga, keywords, 6);
        const filteredChannels = similarResults
          .filter((c) => c.channelId !== channelId)
          .slice(0, 5);

        const rangeDays = range === "7d" ? 7 : 28;
        const publishedAfter = new Date(
          Date.now() - rangeDays * 24 * 60 * 60 * 1000
        ).toISOString();

        similarChannels = await Promise.all(
          filteredChannels.map(async (sc, index) => {
            try {
              const recentVideos = await fetchRecentChannelVideos(
                ga,
                sc.channelId,
                publishedAfter,
                3
              );
              const similarityScore = Math.max(0.3, 1 - index * 0.1);

              return {
                channelId: sc.channelId,
                channelTitle: sc.channelTitle,
                channelThumbnailUrl: sc.thumbnailUrl,
                similarityScore,
                // Cap winners per channel for diversity + quota efficiency
                recentWinners: recentVideos.slice(0, 3).map((v) => ({
                  videoId: v.videoId,
                  title: v.title,
                  publishedAt: v.publishedAt,
                  thumbnailUrl: v.thumbnailUrl,
                  views: v.views,
                  viewsPerDay: v.viewsPerDay,
                })),
              };
            } catch (err) {
              console.warn(
                `Failed to fetch videos for channel ${sc.channelId}:`,
                err
              );
              return {
                channelId: sc.channelId,
                channelTitle: sc.channelTitle,
                channelThumbnailUrl: sc.thumbnailUrl,
                similarityScore: 0.5,
                recentWinners: [],
              };
            }
          })
        );
      } catch (err) {
        console.warn("Failed to fetch similar channels:", err);
      }
    }

    // Prepare input for LLM
    const recentVideoTitles = channel.Video.map((v) => v.title ?? "Untitled");
    const topPerformingVideos = [...channel.Video]
      .filter((v) => v.VideoMetrics)
      .sort(
        (a, b) => (b.VideoMetrics?.views ?? 0) - (a.VideoMetrics?.views ?? 0)
      )
      .slice(0, 5);

    const proofVideos = similarChannels.flatMap((sc) =>
      sc.recentWinners.map((v) => ({
        ...v,
        channelId: sc.channelId,
        channelTitle: sc.channelTitle,
      }))
    );

    let ideaBoardData: IdeaBoardData;

    if (mode === "more" && existingData) {
      // Generate more ideas and append
      const existingTitles = existingData.ideas.map((i) => i.title);

      const newIdeas = await generateMoreIdeas({
        channelTitle: channel.title ?? "Your Channel",
        existingIdeas: existingTitles,
        nicheKeywords: keywords,
        proofVideos: proofVideos.slice(0, 10),
        count: 5,
      });

      ideaBoardData = {
        ...existingData,
        generatedAt: new Date().toISOString(),
        ideas: [...existingData.ideas, ...newIdeas],
      };
    } else {
      // Generate new IdeaBoard
      ideaBoardData = await generateIdeaBoardPlan({
        channelId,
        channelTitle: channel.title ?? "Your Channel",
        range,
        recentVideoTitles,
        topPerformingTitles: topPerformingVideos.map(
          (v) => v.title ?? "Untitled"
        ),
        nicheKeywords: keywords,
        proofVideos,
        similarChannels: similarChannels.map((sc) => ({
          channelId: sc.channelId,
          channelTitle: sc.channelTitle,
          channelThumbnailUrl: sc.channelThumbnailUrl,
          similarityScore: sc.similarityScore,
        })),
      });
    }

    // Save to database
    const cachedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.plan.create({
      data: {
        userId: user.id,
        channelId: channel.id,
        inputsJson: JSON.stringify({ cacheKey, range, mode }),
        outputMarkdown: "", // Not used for IdeaBoard
        outputJson: JSON.stringify(ideaBoardData),
        modelVersion: "gpt-4o-mini",
        tokensUsed: 0,
        cachedUntil,
      },
    });

    return Response.json({
      ...ideaBoardData,
      rateLimit: {
        remaining: rateResult.remaining,
        resetAt: new Date(rateResult.resetAt),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("IdeaBoard POST error:", err);

    return Response.json(
      { error: "Failed to generate idea board", detail: message },
      { status: 500 }
    );
  }
}

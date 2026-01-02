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
import { createApiRoute } from "@/lib/api/route";
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
import {
  isDemoMode,
  getDemoData,
  isYouTubeMockMode,
} from "@/lib/demo-fixtures";
import {
  generateIdeaBoardIdeasOnly,
  generateIdeaBoardPlan,
  generateMoreIdeas,
} from "@/lib/idea-board-llm";
import { normalizeIdeaBoardData } from "@/lib/idea-board-normalize";
import { getOrGenerateNiche } from "@/lib/channel-niche";
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

/**
 * GET - Return cached IdeaBoard or demo data
 */
async function GETHandler(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  // Return demo data if demo mode is enabled
  if (isDemoMode() && !isYouTubeMockMode()) {
    const demoData = getDemoData("idea-board") as IdeaBoardData;
    return Response.json({ ...demoData, demo: true });
  }

  try {
    const paramsObj = await params;

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
    const parsedParams = ParamsSchema.safeParse(paramsObj);
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
        const normalized =
          normalizeIdeaBoardData(data, { mode: "light" }) ??
          (data as IdeaBoardData);
        return Response.json({ ...normalized, fromCache: true });
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

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/idea-board" },
  async (req, ctx) => GETHandler(req, ctx as any)
);

/**
 * POST - Generate new IdeaBoard or add more ideas
 */
async function POSTHandler(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  console.log("[IdeaBoard POST] Starting generation...");
  console.log(
    "[IdeaBoard POST] isDemoMode:",
    isDemoMode(),
    "isYouTubeMockMode:",
    isYouTubeMockMode()
  );

  // Return demo data if demo mode is enabled
  if (isDemoMode() && !isYouTubeMockMode()) {
    console.log("[IdeaBoard POST] Returning demo fixture data");
    const demoData = getDemoData("idea-board") as IdeaBoardData;
    return Response.json({ ...demoData, demo: true });
  }

  try {
    const paramsObj = await params;

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
    const parsedParams = ParamsSchema.safeParse(paramsObj);
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

    // Get Google account for this channel
    const ga = await getGoogleAccount(user.id, channelId);

    // Get niche from cache or generate from last 15 videos
    // This uses the ChannelNiche table and regenerates if video titles change
    const nicheData = await getOrGenerateNiche(channel.id);

    // Use niche queries as keywords for idea generation
    // These are more relevant than raw title/tag extraction
    const keywords = nicheData?.queries?.slice(0, 8) ?? [];

    console.log(
      `[IdeaBoard] Using cached niche: "${nicheData?.niche ?? "unknown"}", keywords: ${keywords.join(", ")}`
    );

    // Fetch similar channels and their winners
    let similarChannels: SimilarChannel[] = [];

    if (ga && keywords.length > 0) {
      try {
        // Keep this light: fewer channels = fewer downstream API calls + faster generation.
        const similarResults = await searchSimilarChannels(ga, keywords, 4);
        const filteredChannels = similarResults
          .filter((c) => c.channelId !== channelId)
          .slice(0, 3);

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
                2
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
                  title:
                    v.title && v.title.trim() && v.title.trim() !== "N/A"
                      ? v.title
                      : "Untitled video",
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

    // Prepare rich input for LLM
    const recentVideos = channel.Video.slice(0, 6).map((v) => {
      const views = v.VideoMetrics?.views ?? 0;
      const daysOld = Math.max(
        1,
        Math.floor(
          (Date.now() - new Date(v.publishedAt ?? Date.now()).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      return {
        title: v.title ?? "Untitled",
        views,
        viewsPerDay: Math.round(views / daysOld),
        publishedAt: v.publishedAt?.toISOString() ?? new Date().toISOString(),
        tags: v.tags ?? undefined,
        description: v.description?.slice(0, 120) ?? undefined,
      };
    });

    const topPerformingVideos = [...channel.Video]
      .filter((v) => v.VideoMetrics && (v.VideoMetrics.views ?? 0) > 0)
      .sort(
        (a, b) => (b.VideoMetrics?.views ?? 0) - (a.VideoMetrics?.views ?? 0)
      )
      .slice(0, 6)
      .map((v) => {
        const views = v.VideoMetrics?.views ?? 0;
        const daysOld = Math.max(
          1,
          Math.floor(
            (Date.now() - new Date(v.publishedAt ?? Date.now()).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        );
        return {
          title: v.title ?? "Untitled",
          views,
          viewsPerDay: Math.round(views / daysOld),
          publishedAt: v.publishedAt?.toISOString() ?? new Date().toISOString(),
          tags: v.tags ?? undefined,
          description: v.description?.slice(0, 120) ?? undefined,
        };
      });

    const proofVideos = similarChannels.flatMap((sc) =>
      sc.recentWinners.map((v) => ({
        ...v,
        channelId: sc.channelId,
        channelTitle: sc.channelTitle,
      }))
    );

    let ideaBoardData: IdeaBoardData;

    console.log(
      "[IdeaBoard POST] Mode:",
      mode,
      "Keywords:",
      keywords.slice(0, 5),
      "ProofVideos:",
      proofVideos.length
    );

    if (mode === "more" && existingData) {
      // Generate more ideas and append
      console.log(
        "[IdeaBoard POST] Generating MORE ideas, existing:",
        existingData.ideas.length
      );
      const existingTitles = existingData.ideas.map((i) => i.title);

      const newIdeas = await generateMoreIdeas({
        channelTitle: channel.title ?? "Your Channel",
        existingIdeas: existingTitles,
        nicheKeywords: keywords,
        proofVideos: proofVideos.slice(0, 12),
        count: 6,
      });

      console.log("[IdeaBoard POST] Generated", newIdeas.length, "new ideas");

      ideaBoardData = {
        ...existingData,
        generatedAt: new Date().toISOString(),
        ideas: [...existingData.ideas, ...newIdeas],
      };
    } else {
      // Generate new IdeaBoard with rich context
      console.log(
        "[IdeaBoard POST] Generating NEW IdeaBoard (ideas only) via LLM..."
      );
      ideaBoardData = await generateIdeaBoardIdeasOnly({
        channelId,
        channelTitle: channel.title ?? "Your Channel",
        range,
        recentVideos,
        topPerformingVideos,
        nicheKeywords: keywords,
        proofVideos,
        similarChannels: similarChannels.map((sc) => ({
          channelId: sc.channelId,
          channelTitle: sc.channelTitle,
          channelThumbnailUrl: sc.channelThumbnailUrl,
          similarityScore: sc.similarityScore,
        })),
      });
      console.log(
        "[IdeaBoard POST] Generated",
        ideaBoardData.ideas.length,
        "ideas"
      );
    }

    // Normalize before saving/returning so the UI always has hooks/titles/keywords populated.
    ideaBoardData =
      normalizeIdeaBoardData(ideaBoardData, {
        nicheKeywords: keywords,
        mode: "light",
      }) ?? ideaBoardData;

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

export const POST = createApiRoute(
  { route: "/api/me/channels/[channelId]/idea-board" },
  async (req, ctx) => POSTHandler(req, ctx as any)
);

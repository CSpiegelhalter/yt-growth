/**
 * POST /api/me/channels/[channelId]/plan/generate
 *
 * Generate a "Decide-for-Me" content plan using cached stats and competitor data.
 * This is a PAID feature - requires active subscription.
 *
 * Auth: Required
 * Subscription: Required
 * Rate limit: 5 per hour per user
 * Caching: Saves Plan record with 24h TTL
 *
 * Query params:
 * - mode: "default" | "more" (default: generate new plan, more: add topics to existing)
 * - limit: number of topics to generate (default: 5, max: 15)
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { getCurrentUserWithSubscription, hasActiveSubscription } from "@/lib/user";
import { getGoogleAccount, searchCompetitorVideos } from "@/lib/youtube-api";
import { generateDecideForMePlan, generateMoreTopics } from "@/lib/llm";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
});

const BodySchema = z.object({
  nicheKeywords: z.array(z.string()).optional(),
  competitorChannelIds: z.array(z.string()).optional(),
  mode: z.enum(["default", "more"]).optional().default("default"),
  limit: z.number().min(1).max(15).optional().default(5),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
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
    const paramsObj = await params;
    const parsed = ParamsSchema.safeParse(paramsObj);
    if (!parsed.success) {
      return Response.json({ error: "Invalid channel ID" }, { status: 400 });
    }

    const { channelId } = parsed.data;

    // Parse body
    let body: z.infer<typeof BodySchema>;
    try {
      const jsonBody = await req.json();
      body = BodySchema.parse(jsonBody);
    } catch {
      // Use defaults if body parsing fails
      body = { mode: "default", limit: 5 };
    }

    const mode = body.mode ?? "default";
    const topicLimit = body.limit ?? 5;

    // Rate limit check
    const rateKey = rateLimitKey("planGeneration", user.id);
    const rateResult = checkRateLimit(rateKey, RATE_LIMITS.planGeneration);
    if (!rateResult.success) {
      return Response.json(
        {
          error: "Rate limit exceeded. Try again later.",
          resetAt: new Date(rateResult.resetAt),
          remaining: rateResult.remaining,
        },
        { status: 429 }
      );
    }

    // Get channel and verify ownership
    const channel = await prisma.channel.findFirst({
      where: {
        youtubeChannelId: channelId,
        userId: user.id,
      },
      include: {
        Video: {
          orderBy: { publishedAt: "desc" },
          take: 25, // We only need ~25 recent videos for good signal
          include: {
            VideoMetrics: true,
          },
        },
      },
    });

    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    // Check for recent cached plan (within 24h)
    const recentPlan = await prisma.plan.findFirst({
      where: {
        channelId: channel.id,
        cachedUntil: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    // If mode=default and we have a cached plan, return it
    if (mode === "default" && recentPlan) {
      // Parse outputJson if stored as string
      let outputJson = null;
      if (recentPlan.outputJson) {
        try {
          outputJson = typeof recentPlan.outputJson === "string"
            ? JSON.parse(recentPlan.outputJson)
            : recentPlan.outputJson;
        } catch {
          outputJson = null;
        }
      }

      return Response.json({
        plan: {
          id: recentPlan.id,
          outputMarkdown: recentPlan.outputMarkdown,
          outputJson,
          createdAt: recentPlan.createdAt,
          cachedUntil: recentPlan.cachedUntil,
          fromCache: true,
        },
        message: "Returning cached plan. Use mode=more to generate additional topics.",
      });
    }

    // Prepare input data
    const recentVideoTitles = channel.Video.map((v) => v.title ?? "Untitled").slice(0, 5);
    
    // Get top performing videos by views
    const topPerformingVideos = [...channel.Video]
      .filter((v) => v.VideoMetrics)
      .sort((a, b) => (b.VideoMetrics?.views ?? 0) - (a.VideoMetrics?.views ?? 0))
      .slice(0, 5);
    const topPerformingTitles = topPerformingVideos.map((v) => v.title ?? "Untitled");

    // Generate niche keywords from tags if not provided
    let nicheKeywords = body?.nicheKeywords ?? [];
    if (nicheKeywords.length === 0) {
      const allTags = channel.Video.flatMap((v) => (v.tags ?? "").split(",").filter(Boolean));
      const tagCounts = new Map<string, number>();
      allTags.forEach((tag) => {
        const clean = tag.trim().toLowerCase();
        tagCounts.set(clean, (tagCounts.get(clean) ?? 0) + 1);
      });
      nicheKeywords = [...tagCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag]) => tag);
    }

    // Mode: "more" - add topics to existing plan
    if (mode === "more" && recentPlan?.outputJson) {
      let existingJson: { topics?: Array<{ title: string }> } | null = null;
      try {
        existingJson = typeof recentPlan.outputJson === "string"
          ? JSON.parse(recentPlan.outputJson)
          : recentPlan.outputJson as { topics?: Array<{ title: string }> };
      } catch {
        existingJson = null;
      }

      const existingTopics = existingJson?.topics?.map((t) => t.title) ?? [];

      const moreResult = await generateMoreTopics({
        channelTitle: channel.title ?? "Your Channel",
        existingTopics,
        nicheKeywords,
        count: Math.min(topicLimit, 5),
      });

      // Merge new topics into existing plan
      const updatedJson = {
        ...existingJson,
        topics: [...(existingJson?.topics ?? []), ...moreResult.topics],
      };

      // Update the plan in DB
      const updatedPlan = await prisma.plan.update({
        where: { id: recentPlan.id },
        data: {
          outputJson: JSON.stringify(updatedJson),
          tokensUsed: (recentPlan.tokensUsed ?? 0) + moreResult.tokensUsed,
        },
      });

      return Response.json({
        plan: {
          id: updatedPlan.id,
          outputMarkdown: updatedPlan.outputMarkdown,
          outputJson: updatedJson,
          createdAt: updatedPlan.createdAt,
          cachedUntil: updatedPlan.cachedUntil,
          fromCache: false,
          tokensUsed: updatedPlan.tokensUsed,
        },
        newTopics: moreResult.topics,
        rateLimit: {
          remaining: rateResult.remaining,
          resetAt: new Date(rateResult.resetAt),
        },
      });
    }

    // Fetch competitor videos (avoid YouTube search.list if we already have competitor data cached)
    let competitorTitles: string[] = [];
    // 1) Prefer competitor feed cache (0 YouTube quota)
    try {
      const cachedFeed = await prisma.competitorFeedCache.findFirst({
        where: {
          userId: user.id,
          channelId: channel.id,
          cachedUntil: { gt: new Date() },
        },
        orderBy: { updatedAt: "desc" },
      });
      if (cachedFeed?.videosJson) {
        const raw = cachedFeed.videosJson as unknown as Array<{
          title: string;
          channelId: string;
        }>;
        const perChannel = new Map<string, number>();
        competitorTitles = raw
          .filter((v) => {
            const n = perChannel.get(v.channelId) ?? 0;
            if (n >= 3) return false;
            perChannel.set(v.channelId, n + 1);
            return true;
          })
          .map((v) => v.title)
          .slice(0, 20);
      }
    } catch {
      // ignore and fall back
    }

    // 2) If no cache, use recent DB competitor videos (still 0 YouTube quota)
    if (competitorTitles.length === 0 && nicheKeywords.length > 0) {
      const keywords = nicheKeywords
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 5);
      const candidates = await prisma.competitorVideo.findMany({
        where: {
          lastFetchedAt: { gt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
          ...(keywords.length
            ? {
                OR: keywords.map((k) => ({
                  title: { contains: k, mode: "insensitive" as const },
                })),
              }
            : {}),
        },
        select: { title: true, channelId: true },
        orderBy: { lastFetchedAt: "desc" },
        take: 60,
      });
      const perChannel = new Map<string, number>();
      competitorTitles = candidates
        .filter((v) => {
          const n = perChannel.get(v.channelId) ?? 0;
          if (n >= 3) return false;
          perChannel.set(v.channelId, n + 1);
          return true;
        })
        .map((v) => v.title)
        .slice(0, 20);
    }

    // 3) Last resort: YouTube search (costly: search.list = 100 units)
    if (competitorTitles.length === 0 && nicheKeywords.length > 0) {
      const ga = await getGoogleAccount(user.id, channelId);
      if (ga) {
        try {
          const competitors = await searchCompetitorVideos(
            ga,
            nicheKeywords.slice(0, 3).join(" "),
            20
          );
          competitorTitles = competitors.map((c) => c.title);
        } catch (err) {
          console.warn("Failed to fetch competitor videos:", err);
        }
      }
    }

    // Generate plan using LLM (new JSON format)
    const llmResult = await generateDecideForMePlan({
      channelTitle: channel.title ?? "Your Channel",
      recentVideoTitles,
      topPerformingTitles,
      nicheKeywords,
      competitorTitles,
      topicCount: topicLimit,
    });

    // Save plan
    const cachedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const plan = await prisma.plan.create({
      data: {
        userId: user.id,
        channelId: channel.id,
        inputsJson: JSON.stringify({
          channelTitle: channel.title,
          recentVideoTitles,
          topPerformingTitles,
          nicheKeywords,
          competitorTitles,
        }),
        outputMarkdown: llmResult.markdown,
        outputJson: llmResult.json ? JSON.stringify(llmResult.json) : null,
        modelVersion: llmResult.model,
        tokensUsed: llmResult.tokensUsed,
        cachedUntil,
      },
    });

    return Response.json({
      plan: {
        id: plan.id,
        outputMarkdown: plan.outputMarkdown,
        outputJson: llmResult.json,
        createdAt: plan.createdAt,
        cachedUntil: plan.cachedUntil,
        fromCache: false,
        tokensUsed: plan.tokensUsed,
        modelVersion: plan.modelVersion,
      },
      rateLimit: {
        remaining: rateResult.remaining,
        resetAt: new Date(rateResult.resetAt),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Plan generation error:", err);
    return Response.json(
      { error: "Failed to generate plan", detail: message },
      { status: 500 }
    );
  }
}

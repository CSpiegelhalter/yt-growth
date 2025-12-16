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
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { getCurrentUserWithSubscription, hasActiveSubscription } from "@/lib/user";
import { getGoogleAccount, searchCompetitorVideos } from "@/lib/youtube-api";
import { generateDecideForMePlan } from "@/lib/llm";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
});

const BodySchema = z.object({
  nicheKeywords: z.array(z.string()).optional(),
  competitorChannelIds: z.array(z.string()).optional(),
}).optional();

export async function POST(
  req: NextRequest,
  { params }: { params: { channelId: string } }
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
    const parsed = ParamsSchema.safeParse(params);
    if (!parsed.success) {
      return Response.json({ error: "Invalid channel ID" }, { status: 400 });
    }

    const { channelId } = parsed.data;

    // Parse body
    let body: z.infer<typeof BodySchema> = {};
    try {
      body = BodySchema.parse(await req.json());
    } catch {
      // Body is optional
    }

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
          take: 10,
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

    if (recentPlan) {
      return Response.json({
        plan: {
          id: recentPlan.id,
          outputMarkdown: recentPlan.outputMarkdown,
          createdAt: recentPlan.createdAt,
          cachedUntil: recentPlan.cachedUntil,
          fromCache: true,
        },
        message: "Returning cached plan. New plans can be generated after cache expires.",
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

    // Fetch competitor videos
    let competitorTitles: string[] = [];
    if (nicheKeywords.length > 0) {
      const ga = await getGoogleAccount(user.id);
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

    // Generate plan using LLM
    const llmResult = await generateDecideForMePlan({
      channelTitle: channel.title ?? "Your Channel",
      recentVideoTitles,
      topPerformingTitles,
      nicheKeywords,
      competitorTitles,
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
        outputMarkdown: llmResult.content,
        modelVersion: llmResult.model,
        tokensUsed: llmResult.tokensUsed,
        cachedUntil,
      },
    });

    return Response.json({
      plan: {
        id: plan.id,
        outputMarkdown: plan.outputMarkdown,
        createdAt: plan.createdAt,
        cachedUntil: plan.cachedUntil,
        fromCache: false,
        tokensUsed: plan.tokensUsed,
      },
      rateLimit: {
        remaining: rateResult.remaining,
        resetAt: new Date(rateResult.resetAt),
      },
    });
  } catch (err: any) {
    console.error("Plan generation error:", err);
    return Response.json(
      { error: "Failed to generate plan", detail: err.message },
      { status: 500 }
    );
  }
}


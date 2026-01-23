import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/prisma";
import { createApiRoute } from "@/lib/api/route";
import { getCurrentUserWithSubscription } from "@/lib/user";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";

import {
  checkEntitlement,
  entitlementErrorResponse,
} from "@/lib/with-entitlements";
import { callLLM } from "@/lib/llm";
import { hashVideoContent } from "@/lib/content-hash";
import type { DerivedMetrics, BaselineComparison } from "@/lib/owned-video-math";
import type { VideoMetadata } from "@/lib/youtube-analytics";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
  videoId: z.string().min(1),
});

const QuerySchema = z.object({
  range: z.enum(["7d", "28d", "90d"]).default("28d"),
});

// Core analysis result type
export type CoreAnalysis = {
  headline: string;
  wins: Array<{
    label: string;
    metric: string;
    why: string;
  }>;
  improvements: Array<{
    label: string;
    metric: string;
    fix: string;
  }>;
  topAction: {
    what: string;
    why: string;
    effort: "low" | "medium" | "high";
  };
};

/**
 * GET - Fetch AI summary (requires cached analytics)
 * Returns the consolidated AI analysis
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

    // Verify channel ownership
    const channel = await prisma.channel.findFirst({
      where: { youtubeChannelId: channelId, userId: user.id },
    });
    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    // Get cached data
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

    // Check if we have a cached summary that's still valid
    if (cached.llmJson && cached.cachedUntil > new Date()) {
      const llmData = cached.llmJson as any;
      // Check if it's the new format (has headline) vs old format
      if (llmData.headline) {
        // New format: llmData IS the summary
        return Response.json({
          summary: llmData,
          cached: true,
        });
      } else if (llmData.summary?.headline) {
        // Wrapped format: llmData contains a summary key
        return Response.json({
          summary: llmData.summary,
          cached: true,
        });
      }
    }

    // Check content hash - if unchanged, we can reuse cached LLM
    const currentHash = hashVideoContent({
      title: derivedData.video?.title,
      description: derivedData.video?.description,
      tags: derivedData.video?.tags,
      durationSec: derivedData.video?.durationSec,
      categoryId: derivedData.video?.categoryId,
    });

    if (cached.contentHash === currentHash && cached.llmJson) {
      const llmData = cached.llmJson as any;
      if (llmData.headline) {
        return Response.json({
          summary: llmData,
          cached: true,
        });
      } else if (llmData.summary?.headline) {
        return Response.json({
          summary: llmData.summary,
          cached: true,
        });
      }
    }

    // Rate limit
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

    // Entitlement check
    const entitlementResult = await checkEntitlement({
      featureKey: "owned_video_analysis",
      increment: true,
    });
    if (!entitlementResult.ok) {
      return entitlementErrorResponse(entitlementResult.error);
    }

    // Generate AI summary
    const summary = await generateCoreAnalysis(
      derivedData.video,
      derivedData.derived,
      derivedData.comparison,
      derivedData.bottleneck
    );

    if (!summary) {
      return Response.json(
        { error: "Failed to generate AI summary" },
        { status: 500 }
      );
    }

    // Cache the summary
    await prisma.ownedVideoInsightsCache.update({
      where: {
        userId_channelId_videoId_range: {
          userId: user.id,
          channelId: channel.id,
          videoId,
          range,
        },
      },
      data: {
        contentHash: currentHash,
        llmJson: summary as unknown as Prisma.JsonObject,
      },
    });

    return Response.json({
      summary,
      cached: false,
    });
  } catch (err) {
    console.error("Summary generation error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: "Failed to generate summary", detail: message },
      { status: 500 }
    );
  }
}

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/videos/[videoId]/insights/summary" },
  async (req, ctx) => GETHandler(req, ctx as any)
);

/**
 * Generate consolidated AI analysis
 * Single LLM call that provides the core value
 */
async function generateCoreAnalysis(
  video: VideoMetadata,
  derived: DerivedMetrics,
  comparison: BaselineComparison,
  bottleneck: { bottleneck: string; evidence: string; severity: string } | null
): Promise<CoreAnalysis | null> {
  const durationMin = Math.round(video.durationSec / 60);
  const descriptionSnippet = video.description?.slice(0, 300) || "No description";

  const videoContext = `VIDEO INFO:
TITLE: "${video.title}"
DESCRIPTION (first 300 chars): "${descriptionSnippet}"
TAGS: [${video.tags.slice(0, 10).map((t) => `"${t}"`).join(", ")}]
DURATION: ${durationMin} minutes

PERFORMANCE DATA (${derived.daysInRange} day period):
• Total Views: ${derived.totalViews.toLocaleString()}
• Views/Day: ${derived.viewsPerDay.toFixed(0)} ${
    comparison.viewsPerDay.vsBaseline !== "unknown"
      ? `(${comparison.viewsPerDay.delta?.toFixed(0)}% vs your channel avg)`
      : ""
  }
• Avg % Viewed: ${
    derived.avdRatio != null ? (derived.avdRatio * 100).toFixed(1) : "N/A"
  }% ${
    comparison.avgViewPercentage.vsBaseline !== "unknown"
      ? `(${comparison.avgViewPercentage.delta?.toFixed(0)}% vs avg)`
      : ""
  }
• Engagement Rate: ${
    derived.engagementPerView != null
      ? (derived.engagementPerView * 100).toFixed(2)
      : "N/A"
  }% ${
    comparison.engagementPerView.vsBaseline !== "unknown"
      ? `(${comparison.engagementPerView.delta?.toFixed(0)}% vs avg)`
      : ""
  }
• Subs/1K Views: ${derived.subsPer1k?.toFixed(2) ?? "N/A"} ${
    comparison.subsPer1k.vsBaseline !== "unknown"
      ? `(${comparison.subsPer1k.delta?.toFixed(0)}% vs avg)`
      : ""
  }
• Health Score: ${comparison.healthScore.toFixed(0)}/100 (${comparison.healthLabel})
${bottleneck ? `\nBOTTLENECK: ${bottleneck.bottleneck} - ${bottleneck.evidence}` : ""}`;

  const systemPrompt = `You are a YouTube growth expert. Analyze this video's performance data and provide a focused, actionable summary.

Return ONLY valid JSON in this exact format:
{
  "headline": "10 words max summarizing THIS video's performance (e.g., 'Strong engagement but retention drops mid-video')",
  "wins": [
    { "label": "Short win label", "metric": "The specific number (e.g., '6.4% vs 4.2% baseline')", "why": "One sentence explaining why this matters" }
  ],
  "improvements": [
    { "label": "Short problem label", "metric": "The specific number", "fix": "One specific action to take" }
  ],
  "topAction": {
    "what": "The single most impactful thing to do (specific action)",
    "why": "Why this matters for THIS video based on the data",
    "effort": "low" | "medium" | "high"
  }
}

CRITICAL RULES:
1. Provide exactly 3 wins and 3 improvements (or fewer if data doesn't support them)
2. Every insight MUST cite a specific metric from the data provided
3. The topAction must be concrete and specific to THIS video
4. If metrics are above channel average, that's a win. If below, that's an improvement area.
5. For videos with <100 views, note that engagement metrics aren't reliable yet
6. No emojis, no hashtags, no markdown
7. Keep the headline punchy - it should capture the essence in a glance`;

  try {
    const result = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: videoContext },
      ],
      { maxTokens: 700, temperature: 0.3, responseFormat: "json_object" }
    );
    return JSON.parse(result.content);
  } catch (err) {
    console.error("Core analysis LLM failed:", err);
    return null;
  }
}

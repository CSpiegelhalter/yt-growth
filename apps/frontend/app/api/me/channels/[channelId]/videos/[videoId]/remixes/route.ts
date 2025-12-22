/**
 * POST /api/me/channels/[channelId]/videos/[videoId]/remixes
 *
 * Generate additional remix ideas for an owned video.
 *
 * Auth: Required + active subscription
 * Rate limit: 20/hr per user
 * Cache: 24h by (userId, channelId, videoId, range, seedHash)
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/prisma";
import {
  getCurrentUserWithSubscription,
  hasActiveSubscription,
} from "@/lib/user";
import { checkRateLimit, rateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import { callLLM } from "@/lib/llm";
import crypto from "crypto";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
  videoId: z.string().min(1),
});

const BodySchema = z.object({
  range: z.enum(["7d", "28d", "90d"]).default("28d"),
  seed: z.object({
    title: z.string().min(1).max(500),
    tags: z.array(z.string().min(1)).max(100).default([]),
    currentRemixTitles: z.array(z.string().min(1)).max(100).default([]),
    currentHooks: z.array(z.string().min(1)).max(100).default([]),
    keyMetrics: z.object({
      subsPer1k: z.number().nullable().optional(),
      avgViewPercentage: z.number().nullable().optional(),
      watchTimePerViewSec: z.number().nullable().optional(),
      viewsPerDay: z.number().nullable().optional(),
    }),
  }),
});

const RemixIdeaSchema = z.object({
  title: z.string().min(1).max(200),
  hook: z.string().min(1).max(240),
  keywords: z.array(z.string().min(1).max(40)).max(8).default([]),
  inspiredByVideoIds: z.array(z.string().min(1)).max(20).default([]),
});

function stableSeedHash(input: unknown): string {
  // Ensure deterministic ordering for arrays to make cache keys stable.
  const normalized = JSON.parse(
    JSON.stringify(input, (_k, v) => {
      if (Array.isArray(v)) return [...v].slice().sort();
      return v;
    })
  );
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(normalized))
    .digest("hex");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string; videoId: string }> }
) {
  try {
    const user = await getCurrentUserWithSubscription();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    if (!hasActiveSubscription(user.subscription)) {
      return Response.json(
        { error: "Subscription required", code: "SUBSCRIPTION_REQUIRED" },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const parsedParams = ParamsSchema.safeParse(resolvedParams);
    if (!parsedParams.success) {
      return Response.json({ error: "Invalid parameters" }, { status: 400 });
    }
    const { channelId, videoId } = parsedParams.data;

    const bodyJson = await req.json().catch(() => ({}));
    const parsedBody = BodySchema.safeParse(bodyJson);
    if (!parsedBody.success) {
      return Response.json(
        { error: "Invalid request body", detail: parsedBody.error.flatten() },
        { status: 400 }
      );
    }
    const { range, seed } = parsedBody.data;

    const channel = await prisma.channel.findFirst({
      where: { youtubeChannelId: channelId, userId: user.id },
      select: { id: true },
    });
    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    const rateResult = checkRateLimit(
      rateLimitKey("videoRemixes", user.id),
      RATE_LIMITS.videoRemixes
    );
    if (!rateResult.success) {
      return Response.json(
        { error: "Rate limit exceeded", retryAfter: rateResult.resetAt },
        { status: 429 }
      );
    }

    const seedHash = stableSeedHash({ range, seed });

    const cached = await prisma.ownedVideoRemixCache.findFirst({
      where: {
        userId: user.id,
        channelId: channel.id,
        videoId,
        range,
        seedHash,
        cachedUntil: { gt: new Date() },
      },
    });

    if (cached?.remixJson) {
      return Response.json(cached.remixJson);
    }

    const systemPrompt = `You are an elite YouTube strategist. Generate additional remix ideas for a creator.

OUTPUT FORMAT: Return ONLY valid JSON:
{
  "remixIdeas": [
    { "title": "...", "hook": "...", "keywords": ["..."], "inspiredByVideoIds": [] }
  ]
}

RULES:
- 6-8 remix ideas
- Do NOT repeat any existing titles or hooks provided by the user
- Titles should be specific and plausible for YouTube
- Hooks should be 1 sentence max
- Keywords: 3-6 short keywords
- No emojis, hashtags, or markdown`;

    const metricLine = [
      seed.keyMetrics.subsPer1k != null
        ? `Subs/1k: ${seed.keyMetrics.subsPer1k.toFixed(2)}`
        : null,
      seed.keyMetrics.avgViewPercentage != null
        ? `Avg % viewed: ${seed.keyMetrics.avgViewPercentage.toFixed(1)}%`
        : null,
      seed.keyMetrics.watchTimePerViewSec != null
        ? `Watch time/view: ${Math.round(seed.keyMetrics.watchTimePerViewSec)}s`
        : null,
      seed.keyMetrics.viewsPerDay != null
        ? `Views/day: ${Math.round(seed.keyMetrics.viewsPerDay)}`
        : null,
    ]
      .filter(Boolean)
      .join(" · ");

    const userPrompt = `Seed video title: ${seed.title}
Range: ${range}
Tags: ${seed.tags.slice(0, 25).join(", ")}
Key metrics: ${metricLine || "N/A"}

Existing remix titles (avoid): ${seed.currentRemixTitles
      .slice(0, 50)
      .join(" | ")}
Existing hooks (avoid): ${seed.currentHooks.slice(0, 50).join(" | ")}

Generate more remix ideas now.`;

    const llm = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 1200, temperature: 0.8 }
    );

    const jsonMatch = llm.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json(
        { error: "LLM did not return JSON" },
        { status: 502 }
      );
    }

    const raw = JSON.parse(jsonMatch[0]) as unknown;
    const remixIdeas = z
      .object({ remixIdeas: z.array(RemixIdeaSchema).min(1) })
      .safeParse(raw);
    if (!remixIdeas.success) {
      return Response.json(
        { error: "Invalid LLM output", detail: remixIdeas.error.flatten() },
        { status: 502 }
      );
    }

    const response = remixIdeas.data;

    await prisma.ownedVideoRemixCache.upsert({
      where: {
        userId_channelId_videoId_range_seedHash: {
          userId: user.id,
          channelId: channel.id,
          videoId,
          range,
          seedHash,
        },
      },
      create: {
        userId: user.id,
        channelId: channel.id,
        videoId,
        range,
        seedHash,
        remixJson: response as unknown as Prisma.InputJsonValue,
        cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      update: {
        remixJson: response as unknown as Prisma.InputJsonValue,
        cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return Response.json(response);
  } catch (err) {
    console.error("Video remixes error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

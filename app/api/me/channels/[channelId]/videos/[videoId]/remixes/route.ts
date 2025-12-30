/**
 * GET /api/me/channels/[channelId]/videos/[videoId]/remixes
 *
 * Generate spin-off "remix" ideas for an owned video.
 * This is used as a lighter-weight endpoint than full insights.
 *
 * Auth: Required
 * Rate limit: videoRemixes (per-hour)
 * Entitlements: owned_video_analysis (usage-limited)
 */
import { NextRequest } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/prisma";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { checkEntitlement } from "@/lib/with-entitlements";
import { entitlementToApiError } from "@/lib/api/entitlements";
import { getGoogleAccount } from "@/lib/youtube-api";
import { fetchOwnedVideoMetadata } from "@/lib/youtube-analytics";
import { callLLM } from "@/lib/llm";

export const runtime = "nodejs";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
  videoId: z.string().min(1),
});

const QuerySchema = z.object({
  range: z.enum(["7d", "28d", "90d"]).default("28d"),
  seed: z.string().min(1).max(200).optional(),
});

function seedHash(seed: string) {
  return crypto.createHash("sha256").update(seed, "utf8").digest("hex");
}

async function generateRemixes(input: {
  title: string;
  description?: string | null;
  tags?: string[] | null;
}) {
  const system = `You are a YouTube growth strategist. Return ONLY valid JSON:
{
  "remixIdeas": [
    { "title": "Full YouTube title", "hook": "Opening line", "keywords": ["kw1"], "inspiredByVideoIds": [] }
  ]
}
Rules:
- No emojis, no hashtags, no markdown.
- Titles must be specific and plausible for the given topic.
- Provide 6-10 ideas.`;

  const user = `VIDEO:
Title: ${JSON.stringify(input.title)}
Description: ${JSON.stringify((input.description ?? "").slice(0, 600))}
Tags: ${JSON.stringify((input.tags ?? []).slice(0, 20))}`;

  const result = await callLLM(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { maxTokens: 900, temperature: 0.4, responseFormat: "json_object" }
  );
  const raw = (result.content ?? "").trim();
  const parsed = JSON.parse(raw) as { remixIdeas?: unknown };
  const remixes = Array.isArray(parsed.remixIdeas) ? parsed.remixIdeas : [];
  return { remixIdeas: remixes };
}

export const GET = createApiRoute(
  { route: "/api/me/channels/[channelId]/videos/[videoId]/remixes" },
  withAuth(
    { mode: "required" },
    withRateLimit(
      { operation: "videoRemixes", identifier: (api) => api.userId },
      withValidation({ params: ParamsSchema, query: QuerySchema }, async (_req: NextRequest, _ctx, api, v) => {
        const user = (api as ApiAuthContext).user!;
        const { channelId, videoId } = v.params!;
        const range = (v.query as any)?.range ?? "28d";
        const seed = (v.query as any)?.seed as string | undefined;

        // Verify ownership + resolve internal channel id
        const channel = await prisma.channel.findFirst({
          where: { youtubeChannelId: channelId, userId: user.id },
          select: { id: true },
        });
        if (!channel) {
          throw new ApiError({ code: "NOT_FOUND", status: 404, message: "Channel not found" });
        }

        // Entitlement check
        const ent = await checkEntitlement({ featureKey: "owned_video_analysis", increment: true });
        if (!ent.ok) throw entitlementToApiError(ent.error);

        const seedValue = seed ?? `${videoId}:${range}`;
        const sh = seedHash(seedValue);

        const cached = await prisma.ownedVideoRemixCache.findUnique({
          where: {
            userId_channelId_videoId_range_seedHash: {
              userId: user.id,
              channelId: channel.id,
              videoId,
              range,
              seedHash: sh,
            },
          },
        });

        if (cached?.remixJson && cached.cachedUntil > new Date()) {
          return jsonOk(cached.remixJson, { requestId: api.requestId });
        }

        if (!process.env.OPENAI_API_KEY) {
          throw new ApiError({
            code: "INTEGRATION_ERROR",
            status: 500,
            message: "LLM is not configured",
          });
        }

        const ga = await getGoogleAccount(user.id, channelId);
        if (!ga) {
          throw new ApiError({ code: "INTEGRATION_ERROR", status: 400, message: "Google account not connected" });
        }

        const meta = await fetchOwnedVideoMetadata(ga, videoId);
        if (!meta?.title) {
          throw new ApiError({ code: "NOT_FOUND", status: 404, message: "Video not found" });
        }

        const remixJson = await generateRemixes({
          title: meta.title,
          description: meta.description,
          tags: meta.tags ?? [],
        });

        const cachedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await prisma.ownedVideoRemixCache.upsert({
          where: {
            userId_channelId_videoId_range_seedHash: {
              userId: user.id,
              channelId: channel.id,
              videoId,
              range,
              seedHash: sh,
            },
          },
          create: {
            userId: user.id,
            channelId: channel.id,
            videoId,
            range,
            seedHash: sh,
            remixJson: remixJson as object,
            cachedUntil,
          },
          update: {
            remixJson: remixJson as object,
            cachedUntil,
          },
        });

        return jsonOk(remixJson, { requestId: api.requestId });
      })
    )
  )
);



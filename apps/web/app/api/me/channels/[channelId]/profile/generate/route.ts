/**
 * POST /api/me/channels/[channelId]/profile/generate
 *
 * Generate or regenerate the AI-structured profile from user input.
 * Uses caching with 3-day TTL and hash-based invalidation.
 *
 * Auth: Required
 * Subscription: NOT required (free feature)
 * Rate limit: Applied
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { createApiRoute } from "@/lib/api/route";
import { getCurrentUser } from "@/lib/user";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  ChannelProfileInput,
  ChannelProfileAI,
} from "@/lib/channel-profile/types";
import {
  computeProfileInputHash,
  isProfileCacheValid,
} from "@/lib/channel-profile/utils";
import { generateChannelProfileAI } from "@/lib/channel-profile/generate";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
});

const BodySchema = z.object({
  force: z.boolean().optional().default(false),
});

// Profile row type for raw SQL queries
type ProfileRow = {
  id: string;
  channelId: number;
  inputJson: string;
  inputHash: string;
  aiProfileJson: string | null;
  lastGeneratedAt: Date | null;
};

async function POSTHandler(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const paramsObj = await params;
  const parsed = ParamsSchema.safeParse(paramsObj);
  if (!parsed.success) {
    return Response.json({ error: "Invalid channel ID" }, { status: 400 });
  }

  const { channelId: youtubeChannelId } = parsed.data;

  // Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const bodyParsed = BodySchema.safeParse(body);
  const force = bodyParsed.success ? bodyParsed.data.force : false;

  // Rate limit check (prevent abuse of LLM calls)
  const rateLimitKey = `profile_generate:${user.id}`;
  const rateLimit = checkRateLimit(rateLimitKey, {
    limit: 10,
    windowSec: 60 * 60, // 10 per hour
  });

  if (!rateLimit.success) {
    return Response.json(
      {
        error: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
      },
      { status: 429 }
    );
  }

  // Get channel and verify ownership
  const channel = await prisma.channel.findFirst({
    where: {
      youtubeChannelId,
      userId: user.id,
    },
  });

  if (!channel) {
    return Response.json({ error: "Channel not found" }, { status: 404 });
  }

  // Get profile using raw SQL (model may not be in Prisma types yet)
  let profiles: ProfileRow[];
  try {
    profiles = await prisma.$queryRaw<ProfileRow[]>`
      SELECT id, "channelId", "inputJson", "inputHash", "aiProfileJson", "lastGeneratedAt"
      FROM "ChannelProfile"
      WHERE "channelId" = ${channel.id}
      LIMIT 1
    `;
  } catch {
    return Response.json(
      { error: "Profile system not available. Please run database migrations." },
      { status: 503 }
    );
  }

  const profile = profiles[0];
  if (!profile) {
    return Response.json(
      { error: "No profile found. Please create a profile first." },
      { status: 400 }
    );
  }

  // Parse stored input
  let input: ChannelProfileInput;
  try {
    input = JSON.parse(profile.inputJson) as ChannelProfileInput;
  } catch {
    return Response.json(
      { error: "Invalid stored profile data" },
      { status: 500 }
    );
  }

  // Check cache validity (unless force regenerate)
  const currentHash = computeProfileInputHash(input);

  if (!force && profile.aiProfileJson && profile.lastGeneratedAt) {
    const cacheValid = isProfileCacheValid(
      profile.lastGeneratedAt,
      currentHash,
      profile.inputHash
    );

    if (cacheValid) {
      let aiProfile: ChannelProfileAI | undefined;
      try {
        aiProfile = JSON.parse(profile.aiProfileJson) as ChannelProfileAI;
      } catch {
        // Cache corrupted, regenerate
        console.log("[profile/generate] Cache corrupted, regenerating");
      }

      if (aiProfile) {
        return Response.json({
          aiProfile,
          cached: true,
          message: "Using cached AI profile",
        });
      }
    }
  }

  // Generate new AI profile
  console.log(
    `[profile/generate] Generating AI profile for channel ${channel.id} (force=${force})`
  );

  try {
    const aiProfile = await generateChannelProfileAI(input);

    // Store the generated profile using raw SQL
    await prisma.$executeRaw`
      UPDATE "ChannelProfile"
      SET "aiProfileJson" = ${JSON.stringify(aiProfile)},
          "inputHash" = ${currentHash},
          "lastGeneratedAt" = NOW(),
          "updatedAt" = NOW()
      WHERE id = ${profile.id}::uuid
    `;

    return Response.json({
      aiProfile,
      cached: false,
      message: "AI profile generated successfully",
    });
  } catch (err) {
    console.error("[profile/generate] Error:", err);
    return Response.json(
      { error: "Failed to generate AI profile. Please try again." },
      { status: 500 }
    );
  }
}

export const POST = createApiRoute(
  { route: "/api/me/channels/[channelId]/profile/generate" },
  async (req, ctx) => POSTHandler(req, ctx as { params: Promise<{ channelId: string }> })
);

import "server-only";

import { prisma } from "@/prisma";
import { checkRateLimit } from "@/lib/shared/rate-limit";
import { generateChannelProfileAI } from "@/lib/channel-profile/generate";
import type { ChannelProfileInput, ChannelProfileAI } from "../schemas";
import { computeProfileInputHash, isProfileCacheValid } from "../utils";
import { ChannelError } from "../errors";
import type { ProfileRow } from "./profile-helpers";

type GenerateProfileInput = {
  userId: number;
  channelId: string;
  force?: boolean;
};

type GenerateProfileResult = {
  aiProfile: ChannelProfileAI;
  cached: boolean;
};

/**
 * Generate or regenerate the AI-structured profile from user input.
 * Uses caching with hash-based invalidation and TTL.
 */
export async function generateProfile(
  params: GenerateProfileInput,
): Promise<GenerateProfileResult> {
  const { userId, channelId, force = false } = params;

  const rateLimitKey = `profile_generate:${userId}`;
  const rateLimit = checkRateLimit(rateLimitKey, {
    limit: 10,
    windowSec: 60 * 60,
  });
  if (!rateLimit.success) {
    throw new ChannelError("RATE_LIMITED", "Rate limit exceeded. Please try again later.");
  }

  const channel = await prisma.channel.findFirst({
    where: { youtubeChannelId: channelId, userId },
  });
  if (!channel) {
    throw new ChannelError("NOT_FOUND", "Channel not found");
  }

  let profiles: ProfileRow[];
  try {
    profiles = await prisma.$queryRaw<ProfileRow[]>`
      SELECT id, "channelId", "inputJson", "inputHash", "aiProfileJson",
             "lastGeneratedAt", "createdAt", "updatedAt"
      FROM "ChannelProfile"
      WHERE "channelId" = ${channel.id}
      LIMIT 1
    `;
  } catch (err) {
    throw new ChannelError(
      "EXTERNAL_FAILURE",
      "Profile system not available. Please run database migrations.",
      err,
    );
  }

  const profile = profiles[0];
  if (!profile) {
    throw new ChannelError(
      "INVALID_INPUT",
      "No profile found. Please create a profile first.",
    );
  }

  let input: ChannelProfileInput;
  try {
    input = JSON.parse(profile.inputJson) as ChannelProfileInput;
  } catch {
    throw new ChannelError("EXTERNAL_FAILURE", "Invalid stored profile data");
  }

  const currentHash = computeProfileInputHash(input);

  if (!force && profile.aiProfileJson && profile.lastGeneratedAt) {
    const cacheValid = isProfileCacheValid(
      profile.lastGeneratedAt,
      currentHash,
      profile.inputHash,
    );

    if (cacheValid) {
      let aiProfile: ChannelProfileAI | undefined;
      try {
        aiProfile = JSON.parse(profile.aiProfileJson) as ChannelProfileAI;
      } catch {
        // Cache corrupted, fall through to regenerate
      }

      if (aiProfile) {
        return { aiProfile, cached: true };
      }
    }
  }

  try {
    const aiProfile = await generateChannelProfileAI(input);

    await prisma.$executeRaw`
      UPDATE "ChannelProfile"
      SET "aiProfileJson" = ${JSON.stringify(aiProfile)},
          "inputHash" = ${currentHash},
          "lastGeneratedAt" = NOW(),
          "updatedAt" = NOW()
      WHERE id = ${profile.id}::uuid
    `;

    return { aiProfile, cached: false };
  } catch (err) {
    throw new ChannelError(
      "EXTERNAL_FAILURE",
      "Failed to generate AI profile. Please try again.",
      err,
    );
  }
}

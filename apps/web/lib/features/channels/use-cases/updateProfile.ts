import "server-only";

import { prisma } from "@/prisma";
import type { ChannelProfileInput } from "../schemas";
import type { ChannelProfile } from "../types";
import { computeProfileInputHash, sanitizeProfileInput } from "../utils";
import { ChannelError } from "../errors";
import { dbToProfile, type ProfileRow } from "./profile-helpers";

type UpdateProfileInput = {
  userId: number;
  channelId: string;
  input: ChannelProfileInput;
};

type UpdateProfileResult = {
  profile: ChannelProfile;
  aiCleared: boolean;
};

/**
 * Save or update the user-defined channel profile input.
 * Clears the AI profile when input hash changes (requires regeneration).
 */
export async function updateProfile(
  params: UpdateProfileInput,
): Promise<UpdateProfileResult> {
  const channel = await prisma.channel.findFirst({
    where: { youtubeChannelId: params.channelId, userId: params.userId },
  });
  if (!channel) {
    throw new ChannelError("NOT_FOUND", "Channel not found");
  }

  const sanitizedInput = sanitizeProfileInput(params.input);
  const inputHash = computeProfileInputHash(sanitizedInput);
  const inputJson = JSON.stringify(sanitizedInput);

  let existing: ProfileRow | null = null;
  try {
    const existingProfiles = await prisma.$queryRaw<ProfileRow[]>`
      SELECT id, "channelId", "inputJson", "inputHash", "aiProfileJson",
             "lastGeneratedAt", "createdAt", "updatedAt"
      FROM "ChannelProfile"
      WHERE "channelId" = ${channel.id}
      LIMIT 1
    `;
    existing = existingProfiles[0] || null;
  } catch (err) {
    throw new ChannelError(
      "EXTERNAL_FAILURE",
      "Profile system not available. Please run database migrations.",
      err,
    );
  }

  const shouldClearAI = existing !== null && existing.inputHash !== inputHash;

  if (existing) {
    if (shouldClearAI) {
      await prisma.$executeRaw`
        UPDATE "ChannelProfile"
        SET "inputJson" = ${inputJson},
            "inputHash" = ${inputHash},
            "aiProfileJson" = NULL,
            "lastGeneratedAt" = NULL,
            "updatedAt" = NOW()
        WHERE "channelId" = ${channel.id}
      `;
    } else {
      await prisma.$executeRaw`
        UPDATE "ChannelProfile"
        SET "inputJson" = ${inputJson},
            "inputHash" = ${inputHash},
            "updatedAt" = NOW()
        WHERE "channelId" = ${channel.id}
      `;
    }
  } else {
    await prisma.$executeRaw`
      INSERT INTO "ChannelProfile" ("id", "channelId", "inputJson", "inputHash", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${channel.id}, ${inputJson}, ${inputHash}, NOW(), NOW())
    `;
  }

  const updated = await prisma.$queryRaw<ProfileRow[]>`
    SELECT id, "channelId", "inputJson", "inputHash", "aiProfileJson",
           "lastGeneratedAt", "createdAt", "updatedAt"
    FROM "ChannelProfile"
    WHERE "channelId" = ${channel.id}
    LIMIT 1
  `;

  if (!updated[0]) {
    throw new ChannelError(
      "EXTERNAL_FAILURE",
      "Failed to retrieve updated profile",
    );
  }

  return {
    profile: dbToProfile(updated[0]),
    aiCleared: shouldClearAI,
  };
}

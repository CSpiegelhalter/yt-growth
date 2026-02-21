import "server-only";

import { prisma } from "@/prisma";
import type { ChannelProfile } from "../types";
import { ChannelError } from "../errors";
import { dbToProfile, type ProfileRow } from "./profile-helpers";

type GetProfileInput = {
  userId: number;
  channelId: string;
};

/**
 * Retrieve the channel profile (user input + AI-generated data).
 * Returns null if no profile exists yet.
 */
export async function getProfile(
  input: GetProfileInput,
): Promise<ChannelProfile | null> {
  const channel = await prisma.channel.findFirst({
    where: { youtubeChannelId: input.channelId, userId: input.userId },
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
      "Profile system not available",
      err,
    );
  }

  if (profiles.length === 0) {
    return null;
  }

  return dbToProfile(profiles[0]);
}

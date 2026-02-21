/**
 * YouTube API Account Resolution
 *
 * Prisma-based Google account lookup for YouTube API calls.
 */
import "server-only";

import { prisma } from "@/prisma";
import type { GoogleAccount } from "./types";

/**
 * Get Google account for a user.
 * If youtubeChannelId is provided, returns the specific GoogleAccount that owns that channel.
 * Otherwise returns the first GoogleAccount for the user (fallback behavior).
 */
export async function getGoogleAccount(
  userId: number,
  youtubeChannelId?: string
): Promise<GoogleAccount | null> {
  // If a channel ID is provided, look up the specific GoogleAccount for that channel
  if (youtubeChannelId) {
    const channel = await prisma.channel.findFirst({
      where: { userId, youtubeChannelId },
      select: { googleAccountId: true },
    });

    if (channel?.googleAccountId) {
      const ga = await prisma.googleAccount.findUnique({
        where: { id: channel.googleAccountId },
      });
      if (ga) {return ga;}
    }
  }

  // Fallback: return first GoogleAccount for user
  const ga = await prisma.googleAccount.findFirst({ where: { userId } });
  if (ga) {return ga;}

  return null;
}

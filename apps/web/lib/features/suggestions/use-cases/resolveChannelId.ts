import "server-only";

import { prisma } from "@/prisma";

import { SuggestionError } from "../errors";

/**
 * Resolve a channel identifier to a numeric DB ID.
 * Accepts either a numeric DB ID (from dashboard) or a YouTube channel ID
 * string (from /videos page). Validates ownership via userId.
 */
export async function resolveChannelId(
  channelIdParam: string,
  userId: number,
): Promise<number> {
  const numeric = Number(channelIdParam);

  if (Number.isFinite(numeric) && numeric > 0) {
    const channel = await prisma.channel.findFirst({
      where: { id: numeric, userId },
      select: { id: true },
    });
    if (channel) { return channel.id; }
  }

  // Fall back to YouTube channel ID lookup
  const channel = await prisma.channel.findFirst({
    where: { youtubeChannelId: channelIdParam, userId },
    select: { id: true },
  });

  if (!channel) {
    throw new SuggestionError("NOT_FOUND", `Channel not found: ${channelIdParam}`);
  }

  return channel.id;
}

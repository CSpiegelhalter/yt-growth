import { prisma } from "@/prisma";
import { BadgeError } from "../errors";

type MarkBadgesSeenInput = {
  userId: number;
  badgeIds: string[];
  channelId?: string;
};

export async function markBadgesSeen(
  input: MarkBadgesSeenInput,
): Promise<{ success: true }> {
  const { userId, badgeIds, channelId } = input;

  if (!Array.isArray(badgeIds) || badgeIds.length === 0) {
    throw new BadgeError("INVALID_INPUT", "Invalid badgeIds");
  }

  let channelDbId: number | null = null;
  if (channelId) {
    const channel = await prisma.channel.findFirst({
      where: { userId, youtubeChannelId: channelId },
      select: { id: true },
    });
    channelDbId = channel?.id ?? null;
  }

  await prisma.userBadge.updateMany({
    where: {
      userId,
      channelId: channelDbId,
      badgeId: { in: badgeIds },
    },
    data: { seen: true },
  });

  return { success: true };
}

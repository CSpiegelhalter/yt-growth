import { prisma } from "@/prisma";
import { createLogger } from "@/lib/shared/logger";
import { ChannelError } from "../errors";

const log = createLogger({ subsystem: "channel-delete" });

type DeleteChannelInput = {
  userId: number;
  channelId: string;
};

export async function deleteChannel(
  input: DeleteChannelInput,
): Promise<{ success: true; message: string }> {
  const { userId, channelId } = input;

  const channel = await prisma.channel.findFirst({
    where: { youtubeChannelId: channelId, userId },
  });
  if (!channel) {
    throw new ChannelError("NOT_FOUND", "Channel not found");
  }

  await Promise.all([
    prisma.similarChannelsCache.deleteMany({
      where: { userId, channelId: channel.id },
    }),
    prisma.competitorFeedCache.deleteMany({
      where: { userId, channelId: channel.id },
    }),
    prisma.ownedVideoAnalyticsDay.deleteMany({
      where: { userId, channelId: channel.id },
    }),
    prisma.ownedVideoInsightsCache.deleteMany({
      where: { userId, channelId: channel.id },
    }),
    prisma.ownedVideoRemixCache.deleteMany({
      where: { userId, channelId: channel.id },
    }),
    prisma.subscriberAuditCache.deleteMany({
      where: { userId, channelId: channel.id },
    }),
    prisma.savedIdea.updateMany({
      where: { userId, channelId: channel.id },
      data: { channelId: null },
    }),
  ]);

  log.info("Cleared caches for channel", {
    channelId: channel.id,
    userId,
  });

  await prisma.channel.delete({
    where: { id: channel.id },
  });

  return { success: true, message: "Channel unlinked" };
}

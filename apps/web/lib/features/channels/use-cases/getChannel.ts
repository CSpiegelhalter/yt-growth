import { prisma } from "@/prisma";
import { ChannelError } from "../errors";

type GetChannelInput = {
  userId: number;
  channelId: string;
};

type ChannelDetail = {
  id: number;
  youtubeChannelId: string;
  title: string | null;
  thumbnailUrl: string | null;
  connectedAt: Date | null;
  lastSyncedAt: Date | null;
  syncStatus: string | null;
  syncError: string | null;
  recentVideos: {
    id: number;
    youtubeVideoId: string;
    title: string | null;
    publishedAt: Date | null;
    thumbnailUrl: string | null;
  }[];
  stats: {
    videoCount: number;
    planCount: number;
  };
};

export async function getChannel(
  input: GetChannelInput,
): Promise<ChannelDetail> {
  const { userId, channelId } = input;

  const channel = await prisma.channel.findFirst({
    where: { youtubeChannelId: channelId, userId },
    include: {
      Video: {
        orderBy: { publishedAt: "desc" },
        take: 10,
        select: {
          id: true,
          youtubeVideoId: true,
          title: true,
          publishedAt: true,
          thumbnailUrl: true,
        },
      },
      _count: {
        select: { Video: true, Plan: true },
      },
    },
  });

  if (!channel) {
    throw new ChannelError("NOT_FOUND", "Channel not found");
  }

  return {
    id: channel.id,
    youtubeChannelId: channel.youtubeChannelId,
    title: channel.title,
    thumbnailUrl: channel.thumbnailUrl,
    connectedAt: channel.connectedAt,
    lastSyncedAt: channel.lastSyncedAt,
    syncStatus: channel.syncStatus,
    syncError: channel.syncError,
    recentVideos: channel.Video,
    stats: {
      videoCount: channel._count.Video,
      planCount: channel._count.Plan,
    },
  };
}

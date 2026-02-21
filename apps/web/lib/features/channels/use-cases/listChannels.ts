import { prisma } from "@/prisma";
import {
  CHANNEL_LIST_SELECT,
  CHANNEL_LIST_ORDER_BY,
} from "@/lib/server/channel-query";

export type ListChannelsInput = {
  userId: number;
};

/**
 * List all channels connected to a user account.
 * Returns raw Prisma rows with the standard channel list select.
 */
export async function listChannels(input: ListChannelsInput) {
  return prisma.channel.findMany({
    where: { userId: input.userId },
    orderBy: CHANNEL_LIST_ORDER_BY,
    select: CHANNEL_LIST_SELECT,
  });
}

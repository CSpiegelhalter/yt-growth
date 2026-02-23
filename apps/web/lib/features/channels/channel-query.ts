import type { Prisma } from "@prisma/client";

/**
 * Shared Prisma select + orderBy for listing a user's connected channels.
 *
 * Used by both the server-side bootstrap (RSC) and the /api/me/channels route
 * to keep the queried columns in sync.
 */
export const CHANNEL_LIST_SELECT = {
  id: true,
  youtubeChannelId: true,
  title: true,
  thumbnailUrl: true,
  totalVideoCount: true,
  subscriberCount: true,
  connectedAt: true,
  lastSyncedAt: true,
  syncStatus: true,
  syncError: true,
  _count: {
    select: {
      Video: true,
      Plan: true,
    },
  },
} satisfies Prisma.ChannelSelect;

export const CHANNEL_LIST_ORDER_BY = [
  { connectedAt: "desc" as const },
];

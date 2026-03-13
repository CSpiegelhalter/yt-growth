/**
 * Server-side bootstrap utilities for pages.
 *
 * Use these to fetch user/channel data server-side instead of client-side useEffects.
 * This eliminates flicker and removes duplicate /api/me + /api/me/channels calls.
 */
import "server-only";

import { getServerSession } from "next-auth/next";
import { cache } from "react";

import { CHANNEL_LIST_ORDER_BY, CHANNEL_LIST_SELECT } from "@/lib/features/channels/channel-query";
import { authOptions } from "@/lib/server/auth";
import { getSubscriptionStatus } from "@/lib/stripe";
import { prisma } from "@/prisma";
import type { Channel,Me } from "@/types/api";

type BootstrapUser = {
  id: number;
  email: string;
  name: string | null;
};

type BootstrapData = {
  me: Me;
  channels: Channel[];
  activeChannelId: string | null;
  activeChannel: Channel | null;
};

const getCurrentUserServerCached = cache(async (): Promise<BootstrapUser | null> => {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as {
    id?: string | number;
    email?: string;
  } | null;
  if (!sessionUser) {return null;}

  let user = null;

  // First try to find by email (most reliable, especially for OAuth users)
  if (sessionUser.email) {
    user = await prisma.user.findUnique({
      where: { email: sessionUser.email },
      select: { id: true, email: true, name: true },
    });
  }

  // Fallback to ID lookup only if email lookup failed and ID is a safe integer
  // (Google OAuth IDs are very large numbers that exceed safe integer range)
  if (!user && sessionUser.id) {
    const idAsNumber =
      typeof sessionUser.id === "string"
        ? Number(sessionUser.id)
        : (typeof sessionUser.id === "number"
          ? sessionUser.id
          : undefined);

    // Only query by ID if it's within safe integer range for the database
    if (
      idAsNumber !== undefined &&
      Number.isFinite(idAsNumber) &&
      Number.isSafeInteger(idAsNumber) &&
      idAsNumber > 0
    ) {
      user = await prisma.user.findUnique({
        where: { id: idAsNumber },
        select: { id: true, email: true, name: true },
      });
    }
  }

  return user;
});

const getMeServerCached = cache(
  async (userId: number, email: string, name: string | null): Promise<Me> => {
    const subscription = await getSubscriptionStatus(userId);

    return {
      id: userId,
      email,
      name,
      plan: subscription.plan,
      status: subscription.status,
      channel_limit: subscription.channelLimit,
      subscription: {
        isActive: subscription.isActive,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ?? false,
        cancelAt: subscription.cancelAt?.toISOString() ?? null,
        canceledAt: subscription.canceledAt?.toISOString() ?? null,
      },
    };
  },
);

const getChannelsServerCached = cache(async (userId: number): Promise<Channel[]> => {
  const channels = await prisma.channel.findMany({
    where: { userId },
    orderBy: CHANNEL_LIST_ORDER_BY,
    select: CHANNEL_LIST_SELECT,
  });

  return channels.map((ch) => ({
    channel_id: ch.youtubeChannelId,
    id: ch.id,
    title: ch.title,
    thumbnailUrl: ch.thumbnailUrl,
    totalVideoCount: ch.totalVideoCount,
    subscriberCount: ch.subscriberCount,
    syncedVideoCount: ch._count.Video,
    connectedAt: ch.connectedAt?.toISOString() ?? "",
    lastSyncedAt: ch.lastSyncedAt?.toISOString() ?? null,
    syncStatus: ch.syncStatus ?? "idle",
    syncError: ch.syncError,
    videoCount: ch._count.Video,
    planCount: ch._count.Plan,
  }));
});

async function getCurrentUserServer(): Promise<BootstrapUser | null> {
  return getCurrentUserServerCached();
}

async function getMeServer(user: BootstrapUser): Promise<Me> {
  return getMeServerCached(user.id, user.email, user.name);
}

async function getChannelsServer(userId: number): Promise<Channel[]> {
  return getChannelsServerCached(userId);
}

function resolveActiveChannelId(
  channels: Channel[],
  searchParams?: { channelId?: string } | string | null
): string | null {
  if (channels.length === 0) {return null;}

  const channelIdParam =
    typeof searchParams === "string"
      ? searchParams
      : searchParams?.channelId ?? null;

  if (channelIdParam) {
    const found = channels.find((c) => c.channel_id === channelIdParam);
    if (found) {return found.channel_id;}
  }

  return channels[0]?.channel_id ?? null;
}

const getAppBootstrapOptionalCached = cache(
  async (channelIdParam: string | null): Promise<BootstrapData | null> => {
    const user = await getCurrentUserServer();
    if (!user) {return null;}

    const [me, channels] = await Promise.all([
      getMeServer(user),
      getChannelsServer(user.id),
    ]);

    const activeChannelId = resolveActiveChannelId(channels, channelIdParam);
    const activeChannel =
      channels.find((c) => c.channel_id === activeChannelId) ?? null;

    return {
      me,
      channels,
      activeChannelId,
      activeChannel,
    };
  },
);

/**
 * Optional bootstrap: returns null if not authenticated (no redirect).
 * Use for pages that work for both logged-in and logged-out users.
 */
export async function getAppBootstrapOptional(searchParams?: {
  channelId?: string;
}): Promise<BootstrapData | null> {
  return getAppBootstrapOptionalCached(searchParams?.channelId ?? null);
}

/**
 * Default AppShellServer props for unauthenticated (guest) users.
 */
export const GUEST_SHELL_PROPS = {
  channels: [] as Channel[],
  activeChannelId: null,
  channelLimit: 1,
};

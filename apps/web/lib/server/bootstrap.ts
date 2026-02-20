/**
 * Server-side bootstrap utilities for pages.
 *
 * Use these to fetch user/channel data server-side instead of client-side useEffects.
 * This eliminates flicker and removes duplicate /api/me + /api/me/channels calls.
 */
import { redirect } from "next/navigation";
import { cache } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/prisma";
import { getSubscriptionStatus } from "@/lib/stripe";
import type { Me, Channel } from "@/types/api";

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
  if (!sessionUser) return null;

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
        : typeof sessionUser.id === "number"
          ? sessionUser.id
          : undefined;

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
    orderBy: [{ connectedAt: "desc" }],
    select: {
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
    },
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

const getAppBootstrapOptionalCached = cache(
  async (channelIdParam: string | null): Promise<BootstrapData | null> => {
    const user = await getCurrentUserServer();
    if (!user) return null;

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
 * Get the current user from server session.
 * Returns null if not authenticated.
 */
export async function getCurrentUserServer(): Promise<BootstrapUser | null> {
  return getCurrentUserServerCached();
}

/**
 * Require authenticated user or redirect to login.
 * Use in server components where auth is required.
 */
async function requireUserServer(): Promise<BootstrapUser> {
  const user = await getCurrentUserServer();
  if (!user) {
    redirect("/auth/login");
  }
  return user;
}

/**
 * Get user profile with subscription (Me type).
 */
export async function getMeServer(user: BootstrapUser): Promise<Me> {
  return getMeServerCached(user.id, user.email, user.name);
}

/**
 * Get all channels for user.
 */
export async function getChannelsServer(userId: number): Promise<Channel[]> {
  return getChannelsServerCached(userId);
}

/**
 * Resolve the active channel ID from URL or first channel.
 *
 * @param channels - User's channels
 * @param searchParams - URL search params object or channelId string
 * @returns The active channel ID or null
 */
export function resolveActiveChannelId(
  channels: Channel[],
  searchParams?: { channelId?: string } | string | null
): string | null {
  if (channels.length === 0) return null;

  // Handle string param (direct channelId)
  const channelIdParam =
    typeof searchParams === "string"
      ? searchParams
      : searchParams?.channelId ?? null;

  // Check if the requested channelId is valid
  if (channelIdParam) {
    const found = channels.find((c) => c.channel_id === channelIdParam);
    if (found) return found.channel_id;
  }

  // Fallback to first channel
  return channels[0]?.channel_id ?? null;
}

/**
 * Full bootstrap: get user, me, channels, and activeChannelId.
 * Redirects to login if not authenticated.
 *
 * @param searchParams - URL search params (can be passed from page props)
 */
export async function getAppBootstrap(searchParams?: {
  channelId?: string;
}): Promise<BootstrapData> {
  const user = await requireUserServer();
  const [me, channels] = await Promise.all([
    getMeServer(user),
    getChannelsServer(user.id),
  ]);

  const activeChannelId = resolveActiveChannelId(channels, searchParams);
  const activeChannel =
    channels.find((c) => c.channel_id === activeChannelId) ?? null;

  return {
    me,
    channels,
    activeChannelId,
    activeChannel,
  };
}

/**
 * Optional bootstrap: returns null if not authenticated (no redirect).
 * Use for pages that work for both logged-in and logged-out users.
 */
export async function getAppBootstrapOptional(searchParams?: {
  channelId?: string;
}): Promise<BootstrapData | null> {
  return getAppBootstrapOptionalCached(searchParams?.channelId ?? null);
}

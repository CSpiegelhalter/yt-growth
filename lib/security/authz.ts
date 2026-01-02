/**
 * Authorization helpers
 *
 * Server-side authorization checks. NEVER trust client-side authorization.
 */

import { prisma } from "@/prisma";
import type { AuthUser, AuthUserWithSubscription } from "@/lib/user";

export type AuthzResult = {
  allowed: boolean;
  reason?: string;
};

/**
 * Verify user owns a specific channel
 */
export async function verifyChannelOwnership(
  userId: number,
  channelId: string | number
): Promise<AuthzResult> {
  const channel = await prisma.channel.findFirst({
    where: {
      ...(typeof channelId === "number"
        ? { id: channelId }
        : { youtubeChannelId: channelId }),
      userId,
    },
    select: { id: true },
  });

  if (!channel) {
    return { allowed: false, reason: "Channel not found or not owned by user" };
  }

  return { allowed: true };
}

/**
 * Verify user owns a specific video (via channel ownership)
 */
export async function verifyVideoOwnership(
  userId: number,
  videoId: string | number
): Promise<AuthzResult> {
  const video = await prisma.video.findFirst({
    where: {
      ...(typeof videoId === "number"
        ? { id: videoId }
        : { youtubeVideoId: videoId }),
      Channel: { userId },
    },
    select: { id: true },
  });

  if (!video) {
    return { allowed: false, reason: "Video not found or not owned by user" };
  }

  return { allowed: true };
}

/**
 * Verify user owns a saved idea
 */
export async function verifySavedIdeaOwnership(
  userId: number,
  ideaId: string
): Promise<AuthzResult> {
  const idea = await prisma.savedIdea.findFirst({
    where: {
      ideaId,
      userId,
    },
    select: { id: true },
  });

  if (!idea) {
    return { allowed: false, reason: "Idea not found or not owned by user" };
  }

  return { allowed: true };
}

/**
 * Check if user has active subscription
 */
export function hasActiveSubscription(
  user: AuthUserWithSubscription
): AuthzResult {
  const sub = user.subscription;

  if (!sub) {
    return { allowed: false, reason: "No subscription found" };
  }

  if (sub.plan === "free") {
    return { allowed: false, reason: "Free plan - subscription required" };
  }

  // Check if within valid period
  const effectiveEnd =
    sub.cancelAt && sub.currentPeriodEnd
      ? sub.cancelAt.getTime() <= sub.currentPeriodEnd.getTime()
        ? sub.cancelAt
        : sub.currentPeriodEnd
      : sub.cancelAt ?? sub.currentPeriodEnd;

  if (effectiveEnd && effectiveEnd.getTime() <= Date.now()) {
    return { allowed: false, reason: "Subscription expired" };
  }

  const validStatuses = ["active", "trialing", "past_due"];
  if (!validStatuses.includes(sub.status)) {
    return {
      allowed: false,
      reason: `Invalid subscription status: ${sub.status}`,
    };
  }

  return { allowed: true };
}

/**
 * Check channel limit for user
 */
export async function checkChannelLimit(
  userId: number,
  currentCount?: number
): Promise<AuthzResult & { limit: number; current: number }> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { channelLimit: true, plan: true },
  });

  const limit = sub?.channelLimit ?? 1;

  const count =
    currentCount ?? (await prisma.channel.count({ where: { userId } }));

  if (count >= limit) {
    return {
      allowed: false,
      reason: `Channel limit reached (${count}/${limit})`,
      limit,
      current: count,
    };
  }

  return { allowed: true, limit, current: count };
}

/**
 * Check if user is admin
 */
export function isAdminUser(user: AuthUser): boolean {
  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const adminIds = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => Number(id.trim()))
    .filter(Number.isFinite);

  return (
    adminEmails.includes(user.email.toLowerCase()) || adminIds.includes(user.id)
  );
}

/**
 * Require ownership or throw
 */
export async function requireChannelOwnership(
  userId: number,
  channelId: string | number
): Promise<void> {
  const result = await verifyChannelOwnership(userId, channelId);
  if (!result.allowed) {
    throw new Error(result.reason ?? "Unauthorized");
  }
}

/**
 * Require subscription or throw
 */
export function requireSubscription(user: AuthUserWithSubscription): void {
  const result = hasActiveSubscription(user);
  if (!result.allowed) {
    throw new Error(result.reason ?? "Subscription required");
  }
}

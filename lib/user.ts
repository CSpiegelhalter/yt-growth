/**
 * User authentication and authorization helpers
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/prisma";

export type AuthUser = {
  id: number;
  email: string;
  name: string | null;
};

export type AuthUserWithSubscription = AuthUser & {
  subscription: {
    status: string;
    plan: string;
    channelLimit: number;
    currentPeriodEnd: Date | null;
    cancelAt?: Date | null;
    cancelAtPeriodEnd?: boolean;
    canceledAt?: Date | null;
  } | null;
};

/**
 * Get the currently authenticated user from the session.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as {
    id?: string | number;
    email?: string;
  } | null;
  if (!sessionUser) return null;

  const idAsNumber =
    typeof sessionUser.id === "string"
      ? Number(sessionUser.id)
      : typeof sessionUser.id === "number"
      ? sessionUser.id
      : undefined;

  let user = null;
  if (Number.isFinite(idAsNumber)) {
    user = await prisma.user.findUnique({
      where: { id: idAsNumber as number },
      select: { id: true, email: true, name: true },
    });
  }
  if (!user && sessionUser.email) {
    user = await prisma.user.findUnique({
      where: { email: sessionUser.email },
      select: { id: true, email: true, name: true },
    });
  }
  return user;
}

/**
 * Get user with subscription status.
 */
export async function getCurrentUserWithSubscription(): Promise<AuthUserWithSubscription | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
    select: {
      status: true,
      plan: true,
      channelLimit: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      cancelAt: true,
      canceledAt: true,
    },
  });

  return { ...user, subscription };
}

/**
 * Check if user has an active paid subscription.
 */
export function hasActiveSubscription(
  subscription: AuthUserWithSubscription["subscription"]
): boolean {
  if (!subscription) return false;
  if (subscription.plan === "free") return false;

  // If Stripe gave us a period end, treat this as the source of truth:
  // user remains entitled until `currentPeriodEnd`, even if they canceled in the portal.
  const effectiveEnd =
    subscription.cancelAt && subscription.currentPeriodEnd
      ? subscription.cancelAt.getTime() <=
        subscription.currentPeriodEnd.getTime()
        ? subscription.cancelAt
        : subscription.currentPeriodEnd
      : subscription.cancelAt ?? subscription.currentPeriodEnd;

  if (effectiveEnd) {
    return effectiveEnd.getTime() > Date.now();
  }

  // Fallback for older rows without a period end.
  return (
    subscription.status === "active" ||
    subscription.status === "trialing" ||
    subscription.status === "past_due"
  );
}

/**
 * Get channel limit for user based on subscription.
 */
export function getChannelLimit(
  subscription: AuthUserWithSubscription["subscription"]
): number {
  if (!subscription) return 1;
  return subscription.channelLimit;
}

/**
 * Require authenticated user or throw.
 */
export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Require user with active subscription or throw.
 */
export async function requireSubscribedUser(): Promise<AuthUserWithSubscription> {
  const user = await getCurrentUserWithSubscription();
  if (!user) {
    throw new Error("Unauthorized");
  }
  if (!hasActiveSubscription(user.subscription)) {
    throw new Error("Subscription required");
  }
  return user;
}

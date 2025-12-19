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
  } | null;
};

/**
 * Get the currently authenticated user from the session.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string | number; email?: string } | null;
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
  return subscription.status === "active" && subscription.plan !== "free";
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


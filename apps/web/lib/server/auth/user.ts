/**
 * User authentication and authorization helpers
 */
import { getServerSession } from "next-auth/next";
import { authOptions } from "./nextauth";
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

  let user: AuthUser | null = null;

  // Prefer email lookup (most reliable, especially for OAuth users where `id`
  // can be a very large string/number that exceeds JS safe integer range).
  if (sessionUser.email) {
    user = await prisma.user.findUnique({
      where: { email: sessionUser.email },
      select: { id: true, email: true, name: true },
    });
  }

  // Fallback to ID lookup only if it's a safe integer.
  if (!user && sessionUser.id !== undefined) {
    const idAsNumber =
      typeof sessionUser.id === "string"
        ? Number(sessionUser.id)
        : typeof sessionUser.id === "number"
        ? sessionUser.id
        : undefined;

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

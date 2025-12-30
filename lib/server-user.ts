import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/prisma";
import { ApiError } from "@/lib/http";
import { LIMITS } from "@/lib/product";

const ACTIVE_SUB_STATUSES = ["active", "trialing", "past_due"];

function isEntitled(subscription: any): boolean {
  if (!subscription) return false;
  if (subscription.plan === "free") return false;

  const cancelAt =
    subscription.cancelAt instanceof Date ? subscription.cancelAt : null;
  const currentPeriodEnd =
    subscription.currentPeriodEnd instanceof Date
      ? subscription.currentPeriodEnd
      : null;
  const effectiveEnd =
    cancelAt && currentPeriodEnd
      ? cancelAt.getTime() <= currentPeriodEnd.getTime()
        ? cancelAt
        : currentPeriodEnd
      : cancelAt ?? currentPeriodEnd;

  if (effectiveEnd) {
    return effectiveEnd.getTime() > Date.now();
  }
  return ACTIVE_SUB_STATUSES.includes(subscription.status);
}

export async function requireUserContext() {
  const session = await getServerSession(authOptions);
  const userIdRaw = (session?.user as any)?.id;
  const userId = typeof userIdRaw === "string" ? Number(userIdRaw) : userIdRaw;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { Subscription: true },
  });
  if (!user) throw new ApiError(401, "Unauthorized");
  const subscription = user.Subscription ?? null;
  const isSubscribed = isEntitled(subscription);

  return { user, subscription, isSubscribed };
}

export function ensureSubscribed(isSubscribed: boolean) {
  if (!isSubscribed) throw new ApiError(402, "Subscription required");
}

export function channelLimitForUser(isSubscribed: boolean) {
  return isSubscribed
    ? LIMITS.PRO_MAX_CONNECTED_CHANNELS
    : LIMITS.FREE_MAX_CONNECTED_CHANNELS;
}

export function publicMePayload(
  ctx: Awaited<ReturnType<typeof requireUserContext>>
) {
  return {
    id: ctx.user.id,
    email: ctx.user.email,
    plan: ctx.isSubscribed ? "pro" : "free",
    status: ctx.subscription?.status ?? "inactive",
    channel_limit: channelLimitForUser(ctx.isSubscribed),
  };
}

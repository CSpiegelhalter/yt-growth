import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/prisma";
import { ApiError } from "@/lib/http";

const ACTIVE_SUB_STATUSES = ["active", "trialing", "past_due"];

export async function requireUserContext() {
  const session = await getServerSession(authOptions);
  const userIdRaw = (session?.user as any)?.id;
  const userId = typeof userIdRaw === "string" ? Number(userIdRaw) : userIdRaw;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { Subscription: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!user) throw new ApiError(401, "Unauthorized");
  const subscription = user.Subscription[0] ?? null;
  const isSubscribed = subscription ? ACTIVE_SUB_STATUSES.includes(subscription.status) : false;

  return { user, subscription, isSubscribed };
}

export function ensureSubscribed(isSubscribed: boolean) {
  if (!isSubscribed) throw new ApiError(402, "Subscription required");
}

export function channelLimitForUser(isSubscribed: boolean) {
  return isSubscribed ? 5 : 1;
}

export function publicMePayload(ctx: Awaited<ReturnType<typeof requireUserContext>>) {
  return {
    id: ctx.user.id,
    email: ctx.user.email,
    plan: ctx.isSubscribed ? "pro" : "free",
    status: ctx.subscription?.status ?? "inactive",
    channel_limit: channelLimitForUser(ctx.isSubscribed),
  };
}

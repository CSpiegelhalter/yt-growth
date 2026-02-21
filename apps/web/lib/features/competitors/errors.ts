import { DomainError } from "@/lib/shared/errors";
import { prisma } from "@/prisma";

export class CompetitorError extends DomainError {
  constructor(code: string, message: string, cause?: unknown) {
    super(code, message, cause);
    this.name = "CompetitorError";
  }
}

const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

export async function assertActiveSubscription(userId: number): Promise<void> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: {
      plan: true,
      status: true,
      cancelAt: true,
      currentPeriodEnd: true,
    },
  });

  if (!sub || sub.plan === "free") {
    throw new CompetitorError("FORBIDDEN", "Subscription required");
  }

  const effectiveEnd =
    sub.cancelAt && sub.currentPeriodEnd
      ? sub.cancelAt.getTime() <= sub.currentPeriodEnd.getTime()
        ? sub.cancelAt
        : sub.currentPeriodEnd
      : (sub.cancelAt ?? sub.currentPeriodEnd);

  if (effectiveEnd && effectiveEnd.getTime() <= Date.now()) {
    throw new CompetitorError("FORBIDDEN", "Subscription required");
  }

  if (!effectiveEnd && !ACTIVE_STATUSES.has(sub.status)) {
    throw new CompetitorError("FORBIDDEN", "Subscription required");
  }
}

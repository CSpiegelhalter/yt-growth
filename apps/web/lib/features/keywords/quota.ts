import "server-only";

import { getLimit } from "@/lib/features/subscriptions/use-cases/checkEntitlement";
import type { Plan, FeatureKey } from "@/lib/features/subscriptions/types";
import {
  checkAndIncrement,
  checkUsage,
} from "@/lib/features/subscriptions/use-cases/trackUsage";
import type { UsageCheckResult } from "@/lib/features/subscriptions/types";
import type { UsageInfo } from "./types";

/**
 * Map a UsageCheckResult (from the usage-tracking layer) to the domain UsageInfo DTO.
 * Eliminates the repeated 4-field pick that was duplicated across every use-case.
 */
export function toUsageInfo(result: UsageCheckResult): UsageInfo {
  return {
    used: result.used,
    limit: result.limit,
    remaining: result.remaining,
    resetAt: result.resetAt,
  };
}

type QuotaOk = { type: "ok"; plan: Plan; usage: UsageInfo };
type QuotaExceeded = { type: "quota_exceeded"; plan: Plan; usage: UsageInfo };
type QuotaResult = QuotaOk | QuotaExceeded;

/**
 * Resolve quota for a keyword-feature operation.
 *
 * When `cached` is true the counter is only peeked (cache hits are free).
 * When `cached` is false the counter is atomically checked-and-incremented;
 * returns `quota_exceeded` if the user has exhausted their daily limit.
 */
export async function resolveQuota(opts: {
  userId: number;
  isPro: boolean;
  featureKey: FeatureKey;
  cached: boolean;
}): Promise<QuotaResult> {
  const { userId, isPro, featureKey, cached } = opts;
  const plan: Plan = isPro ? "PRO" : "FREE";
  const limit = getLimit(plan, featureKey);

  if (cached) {
    const usage = await checkUsage({ userId, featureKey, limit });
    return { type: "ok", plan, usage: toUsageInfo(usage) };
  }

  const result = await checkAndIncrement({ userId, featureKey, limit });
  if (!result.allowed) {
    return { type: "quota_exceeded", plan, usage: toUsageInfo(result) };
  }

  return { type: "ok", plan, usage: toUsageInfo(result) };
}

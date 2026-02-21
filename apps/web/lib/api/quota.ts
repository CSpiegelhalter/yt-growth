import { logger } from "@/lib/shared/logger";
import { jsonError } from "@/lib/api/response";

/**
 * Build a standard 403 "quota exceeded" response for feature-gated endpoints.
 *
 * Both /api/keywords/research and /api/keywords/trends (and future rate-limited
 * endpoints) share the same shape — only the log tag differs.
 */
export function quotaExceededResponse(opts: {
  logEvent: string;
  userId: number;
  plan: string;
  limit: number;
  used: number;
  resetAt?: Date | string;
  requestId: string;
}) {
  logger.info(opts.logEvent, {
    userId: opts.userId,
    plan: opts.plan,
    used: opts.used,
    limit: opts.limit,
  });

  return jsonError({
    status: 403,
    code: "LIMIT_REACHED",
    message: `You've used all ${opts.limit} keyword searches for today.`,
    requestId: opts.requestId,
    details: {
      used: opts.used,
      limit: opts.limit,
      remaining: 0,
      resetAt: opts.resetAt,
      upgrade: opts.plan === "FREE",
    },
  });
}

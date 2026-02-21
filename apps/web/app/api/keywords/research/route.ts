/**
 * POST /api/keywords/research
 *
 * Keyword research API using DataForSEO Standard task-based workflow.
 *
 * Auth: Optional (returns needsAuth if not authenticated)
 * Rate Limited:
 *   - Free users: 5/day
 *   - Pro users: 100/day
 *   - Cached responses don't consume quota
 */

import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk, jsonError } from "@/lib/api/response";
import { quotaExceededResponse } from "@/lib/api/quota";
import { hasActiveSubscription } from "@/lib/server/auth";
import { logger } from "@/lib/shared/logger";
import { ResearchKeywordsBodySchema, researchKeywords } from "@/lib/features/keywords";

// ── IP rate limiting (abuse prevention for unauthenticated) ─────

const ipRateLimiter = new Map<string, { count: number; resetAt: number }>();
const IP_RATE_LIMIT = 20;
const IP_RATE_WINDOW_MS = 60 * 1000;

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateLimiter.get(ip);

  if (!entry || entry.resetAt < now) {
    ipRateLimiter.set(ip, { count: 1, resetAt: now + IP_RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= IP_RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

function cleanupIpLimiter() {
  const now = Date.now();
  for (const [ip, entry] of ipRateLimiter.entries()) {
    if (entry.resetAt < now) {
      ipRateLimiter.delete(ip);
    }
  }
}

// ── Route handler ───────────────────────────────────────────────

export const POST = createApiRoute(
  { route: "/api/keywords/research" },
  withAuth(
    { mode: "optional" },
    withValidation({ body: ResearchKeywordsBodySchema }, async (req, _ctx, api: ApiAuthContext, validated) => {
      const user = api.user;
      const { mode, phrase, phrases, database, displayLimit } = validated.body!;

      // IP rate limiting
      const forwardedFor = req.headers.get("x-forwarded-for");
      const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

      cleanupIpLimiter();
      if (!checkIpRateLimit(ip)) {
        logger.warn("keywords.ip_rate_limited", { ip });
        return jsonError({
          status: 429,
          code: "RATE_LIMITED",
          message: "Too many requests. Please slow down.",
          requestId: api.requestId,
        });
      }

      // If not authenticated, return needsAuth
      if (!user) {
        return jsonOk(
          { needsAuth: true, message: "Sign in to search keywords" },
          { requestId: api.requestId },
        );
      }

      const isPro = hasActiveSubscription(user.subscription);

      const result = await researchKeywords({
        userId: user.id,
        mode,
        phrase,
        phrases,
        database,
        displayLimit,
        isPro,
      });

      switch (result.type) {
        case "quota_exceeded":
          return quotaExceededResponse({
            logEvent: "keywords.quota_exceeded",
            userId: user.id,
            plan: result.usage.plan,
            limit: result.usage.limit,
            used: result.usage.used,
            resetAt: result.usage.resetAt,
            requestId: api.requestId,
          });

        case "pending":
          return jsonOk(result.body, { requestId: api.requestId });

        case "success":
          return jsonOk(
            {
              overview: result.overview,
              rows: result.rows,
              meta: result.meta,
              usage: result.usage,
            },
            { requestId: api.requestId },
          );
      }
    }),
  ),
);

export const runtime = "nodejs";

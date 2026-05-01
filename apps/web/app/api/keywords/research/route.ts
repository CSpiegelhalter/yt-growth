/**
 * POST /api/keywords/research
 *
 * Keyword research API using DataForSEO Standard task-based workflow.
 *
 * Auth: Optional — guests get real results, rate limited by IP (guestTrending: 5/day)
 * Rate Limited:
 *   - Guest: 5/day via guestTrending (IP-based)
 *   - Free users: 5/day (quota-based)
 *   - Pro users: 100/day (quota-based)
 *   - Cached responses don't consume quota
 */

import { quotaExceededResponse } from "@/lib/api/quota";
import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { type ApiAuthContext,withAuth } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { withValidation } from "@/lib/api/withValidation";
import { researchKeywords,ResearchKeywordsBodySchema } from "@/lib/features/keywords";
import { hasActiveSubscription } from "@/lib/server/auth";

export const POST = createApiRoute(
  { route: "/api/keywords/research" },
  withAuth(
    { mode: "optional" },
    withRateLimit(
      {
        operation: "guestTrending",
        identifier: (api) => api.userId ?? api.ip,
      },
      withValidation({ body: ResearchKeywordsBodySchema }, async (_req, _ctx, api: ApiAuthContext, validated) => {
        const user = api.user;
        const { mode, phrase, phrases, database, displayLimit } = validated.body!;

        const isPro = user ? hasActiveSubscription(user.subscription) : false;

        const result = await researchKeywords({
          userId: user?.id ?? null,
          mode,
          phrase,
          phrases,
          database,
          displayLimit,
          isPro,
        });

        switch (result.type) {
          case "quota_exceeded": {
            if (!user) {
              // Guest hit API rate limit — handled by withRateLimit middleware
              return jsonOk({ needsAuth: true, message: "Sign up for more keyword searches" }, { requestId: api.requestId });
            }
            return quotaExceededResponse({
              logEvent: "keywords.quota_exceeded",
              userId: user.id,
              plan: result.usage.plan,
              limit: result.usage.limit,
              used: result.usage.used,
              resetAt: result.usage.resetAt,
              requestId: api.requestId,
            });
          }

          case "pending": {
            return jsonOk(result.body, { requestId: api.requestId });
          }

          case "success": {
            const headers: Record<string, string> = {};
            if (!user && api.rateLimitResult) {
              headers["X-RateLimit-Remaining"] = String(api.rateLimitResult.remaining);
              headers["X-RateLimit-Reset"] = new Date(api.rateLimitResult.resetAt).toISOString();
            }
            return jsonOk(
              {
                overview: result.overview,
                rows: result.rows,
                meta: result.meta,
                usage: result.usage,
              },
              { requestId: api.requestId, headers },
            );
          }
        }
      }),
    ),
  ),
);

export const runtime = "nodejs";

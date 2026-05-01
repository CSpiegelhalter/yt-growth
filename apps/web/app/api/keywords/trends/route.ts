/**
 * POST /api/keywords/trends
 *
 * Fetch Google Trends data for a keyword.
 * Returns interest over time, rising queries, and regional breakdown.
 *
 * Auth: Optional — guests get real results, rate limited by IP
 */

import { quotaExceededResponse } from "@/lib/api/quota";
import { jsonOk } from "@/lib/api/response";
import { createApiRoute } from "@/lib/api/route";
import { type ApiAuthContext,withAuth } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { withValidation } from "@/lib/api/withValidation";
import { getKeywordTrends,KeywordTrendsBodySchema } from "@/lib/features/keywords";
import { hasActiveSubscription } from "@/lib/server/auth";

export const POST = createApiRoute(
  { route: "/api/keywords/trends" },
  withAuth(
    { mode: "optional" },
    withRateLimit(
      {
        operation: "guestTrending",
        identifier: (api) => api.userId ?? api.ip,
      },
      withValidation({ body: KeywordTrendsBodySchema }, async (_req, _ctx, api: ApiAuthContext, validated) => {
        const user = api.user;
        const { keyword, database, dateFrom, dateTo } = validated.body!;

        const isPro = user ? hasActiveSubscription(user.subscription) : false;

        const result = await getKeywordTrends({
          userId: user?.id ?? null,
          keyword,
          database,
          dateFrom,
          dateTo,
          isPro,
        });

        switch (result.type) {
          case "quota_exceeded": {
            if (!user) {
              return jsonOk({ needsAuth: true, message: "Sign up for more trend searches" }, { requestId: api.requestId });
            }
            return quotaExceededResponse({
              logEvent: "keywords.trends_quota_exceeded",
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
            return jsonOk(result.body, { requestId: api.requestId });
          }
        }
      }),
    ),
  ),
);

export const runtime = "nodejs";

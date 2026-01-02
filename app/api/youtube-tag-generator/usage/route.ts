/**
 * GET /api/youtube-tag-generator/usage
 *
 * Returns current usage information for the tag generator feature.
 *
 * Auth: Required
 */
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { jsonOk } from "@/lib/api/response";
import { getLimit, type Plan } from "@/lib/entitlements";
import { getUsageInfo } from "@/lib/usage";
import { hasActiveSubscription } from "@/lib/user";

export const GET = createApiRoute(
  { route: "/api/youtube-tag-generator/usage" },
  withAuth({ mode: "required" }, async (_req, _ctx, api: ApiAuthContext) => {
    const user = api.user!;

    // Determine plan and limits
    const isPro = hasActiveSubscription(user.subscription);
    const plan: Plan = isPro ? "PRO" : "FREE";
    const limit = getLimit(plan, "tag_generate");

    // Get current usage
    const usage = await getUsageInfo(user.id, "tag_generate", limit);

    return jsonOk(
      {
        remaining: usage.remaining,
        used: usage.used,
        limit: usage.limit,
        resetAt: usage.resetAt,
        isPro,
      },
      {
        requestId: api.requestId,
        headers: { "cache-control": "no-store" },
      }
    );
  })
);

export const runtime = "nodejs";

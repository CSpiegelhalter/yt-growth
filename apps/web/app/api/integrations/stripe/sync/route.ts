/**
 * POST /api/integrations/stripe/sync
 *
 * Manually sync subscription status from Stripe.
 * Used when webhook might not have fired (e.g., localhost testing).
 *
 * Auth: Required
 */
import { createApiRoute } from "@/lib/api/route";
import { withAuth } from "@/lib/api/withAuth";
import { jsonOk } from "@/lib/api/response";
import { syncSubscription } from "@/lib/features/subscriptions";

export const runtime = "nodejs";

export const POST = createApiRoute(
  { route: "/api/integrations/stripe/sync" },
  withAuth({ mode: "required" }, async (_req, _ctx, api) => {
    const result = await syncSubscription({ userId: api.userId! });

    return jsonOk(result, { requestId: api.requestId });
  }),
);

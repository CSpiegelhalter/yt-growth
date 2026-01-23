/**
 * POST /api/integrations/stripe/webhook
 *
 * Handle Stripe webhook events.
 *
 * Auth: Stripe signature verification
 */
import { NextRequest } from "next/server";
import { handleStripeWebhook } from "@/lib/stripe";
import { createApiRoute } from "@/lib/api/route";
import { ApiError } from "@/lib/api/errors";
import { jsonOk } from "@/lib/api/response";

export const runtime = "nodejs";

export const POST = createApiRoute(
  { route: "/api/integrations/stripe/webhook" },
  async (req: NextRequest, _ctx, api) => {
    const payload = await req.text();
    const signature = req.headers.get("stripe-signature") ?? "";
    if (!signature) {
      throw new ApiError({
        code: "INTEGRATION_ERROR",
        status: 400,
        message: "Missing Stripe signature",
      });
    }

    const result = await handleStripeWebhook(payload, signature);

    return jsonOk(result, { requestId: api.requestId });
  }
);

/**
 * GET/POST /api/integrations/stripe/checkout
 *
 * Create a Stripe Checkout session for subscription.
 * GET: Redirects directly to Stripe checkout
 * POST: Returns JSON with checkout URL
 *
 * Auth: Required
 * Rate limit: 3 per minute per user
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { createCheckoutSession } from "@/lib/stripe";

export const runtime = "nodejs";

const QuerySchema = z.object({
  redirect: z.string().optional(),
});

export const GET = createApiRoute(
  { route: "/api/integrations/stripe/checkout" },
  withAuth(
    { mode: "optional" },
    withRateLimit(
      { operation: "checkout", identifier: (api) => api.userId },
      withValidation({ query: QuerySchema }, async (_req: NextRequest, _ctx, api) => {
        const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const user = (api as ApiAuthContext).user;
        if (!user) {
          const res = NextResponse.redirect(
            new URL("/auth/login?redirect=/api/integrations/stripe/checkout", base)
          );
          res.headers.set("x-request-id", api.requestId);
          return res;
        }

        const { url } = await createCheckoutSession(user.id, user.email);
        const res = NextResponse.redirect(url);
        res.headers.set("x-request-id", api.requestId);
        return res;
      })
    )
  )
);

export const POST = createApiRoute(
  { route: "/api/integrations/stripe/checkout" },
  withAuth(
    { mode: "required" },
    withRateLimit({ operation: "checkout", identifier: (api) => api.userId }, async (_req, _ctx, api) => {
      const user = (api as ApiAuthContext).user!;
      try {
        const { url } = await createCheckoutSession(user.id, user.email);
        return jsonOk({ url }, { requestId: api.requestId });
      } catch (err) {
        throw new ApiError({
          code: "INTEGRATION_ERROR",
          status: 502,
          message: "Failed to create checkout session",
          details: { provider: "stripe" },
        });
      }
    })
  )
);

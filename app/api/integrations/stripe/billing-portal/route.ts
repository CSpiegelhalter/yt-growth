/**
 * GET/POST /api/integrations/stripe/billing-portal
 *
 * Create a Stripe Billing Portal session.
 * GET: Redirects directly to Stripe portal
 * POST: Returns JSON with portal URL
 *
 * Auth: Required
 */
import { NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { jsonOk } from "@/lib/api/response";
import { createPortalSession } from "@/lib/stripe";

export const runtime = "nodejs";

async function handlePortal(api: ApiAuthContext, returnJson: boolean) {
  const user = api.user!;
  const { url } = await createPortalSession(user.id);

  if (returnJson) {
    return jsonOk({ url }, { requestId: api.requestId });
  }

  const res = NextResponse.redirect(url);
  res.headers.set("x-request-id", api.requestId);
  return res;
}

export const GET = createApiRoute(
  { route: "/api/integrations/stripe/billing-portal" },
  withAuth({ mode: "required" }, async (_req, _ctx, api) => {
    return handlePortal(api, false);
  })
);

export const POST = createApiRoute(
  { route: "/api/integrations/stripe/billing-portal" },
  withAuth({ mode: "required" }, async (_req, _ctx, api) => {
    return handlePortal(api, true);
  })
);



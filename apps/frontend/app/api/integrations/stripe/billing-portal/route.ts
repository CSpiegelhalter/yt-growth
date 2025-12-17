/**
 * POST /api/integrations/stripe/billing-portal
 *
 * Creates a Stripe billing portal session for subscription management.
 *
 * Auth: Required
 */
import { asApiResponse } from "@/lib/http";
import { requireUserContext } from "@/lib/server-user";
import { createPortalSession } from "@/lib/stripe";

export async function POST() {
  try {
    const ctx = await requireUserContext();
    const session = await createPortalSession(ctx.user.id);
    return Response.json({ url: session.url });
  } catch (err) {
    return asApiResponse(err);
  }
}

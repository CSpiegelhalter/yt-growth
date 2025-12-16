/**
 * POST /api/integrations/stripe/portal
 *
 * Create a Stripe billing portal session for subscription management.
 *
 * Auth: Required
 */
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/user";
import { createPortalSession } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const user = await getCurrentUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create portal session
    const { url } = await createPortalSession(user.id);

    return Response.json({ url });
  } catch (err: any) {
    console.error("Portal error:", err);
    return Response.json(
      { error: "Failed to create billing portal", detail: err.message },
      { status: 500 }
    );
  }
}


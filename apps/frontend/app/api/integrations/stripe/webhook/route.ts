/**
 * POST /api/integrations/stripe/webhook
 *
 * Handle Stripe webhook events.
 *
 * Auth: Stripe signature verification
 */
import { NextRequest } from "next/server";
import { handleStripeWebhook } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get("stripe-signature") ?? "";

    const result = await handleStripeWebhook(payload, signature);

    return Response.json(result);
  } catch (err: any) {
    console.error("Webhook error:", err);
    return Response.json(
      { error: "Webhook handling failed", detail: err.message },
      { status: 400 }
    );
  }
}

// Stripe webhooks need the raw body, so disable body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};


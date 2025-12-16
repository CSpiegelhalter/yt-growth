import Stripe from "stripe";
import { z } from "zod";
import { prisma } from "@/prisma";
import { asApiResponse } from "@/lib/http";
import { requireUserContext } from "@/lib/server-user";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

const bodySchema = z
  .object({
    priceId: z.string().optional(),
  })
  .optional();

export async function POST(req: Request) {
  try {
    const ctx = await requireUserContext();
    const parsed = bodySchema.safeParse(await req.json().catch(() => ({} as any)));
    const priceId = parsed.success ? parsed.data?.priceId : undefined;
    const targetPrice = priceId ?? process.env.STRIPE_PRICE_ID;
    if (!targetPrice) throw new Error("Missing STRIPE_PRICE_ID");

    let subscription = await prisma.subscription.findFirst({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
    });

    let customerId = subscription?.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: ctx.user.email ?? undefined,
        metadata: { userId: String(ctx.user.id) },
      });
      customerId = customer.id;
      subscription = await prisma.subscription.create({
        data: { userId: ctx.user.id, stripeCustomerId: customerId, status: "inactive" },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: targetPrice, quantity: 1 }],
      success_url: process.env.STRIPE_SUCCESS_URL!,
      cancel_url: process.env.STRIPE_CANCEL_URL!,
      subscription_data: {
        metadata: { userId: String(ctx.user.id) },
      },
      metadata: { userId: String(ctx.user.id) },
    });

    return Response.json({ url: session.url });
  } catch (err) {
    return asApiResponse(err);
  }
}

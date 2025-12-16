import Stripe from "stripe";
import { prisma } from "@/prisma";
import { asApiResponse } from "@/lib/http";
import { requireUserContext } from "@/lib/server-user";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export async function POST() {
  try {
    const ctx = await requireUserContext();
    const sub = await prisma.subscription.findFirst({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
    });
    if (!sub?.stripeCustomerId) throw new Error("No Stripe customer");

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: process.env.STRIPE_SUCCESS_URL!,
    });
    return Response.json({ url: session.url });
  } catch (err) {
    return asApiResponse(err);
  }
}

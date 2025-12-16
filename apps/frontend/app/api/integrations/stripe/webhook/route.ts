import { headers } from "next/headers";
import Stripe from "stripe";
import { prisma } from "@/prisma";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

async function upsertSubscriptionFromStripe(obj: Stripe.Subscription) {
  const customerId = typeof obj.customer === "string" ? obj.customer : obj.customer?.id;
  if (!customerId) return;
  const status = obj.status;
  const currentPeriodEnd = obj.current_period_end
    ? new Date(obj.current_period_end * 1000)
    : null;
  const stripeSubscriptionId = obj.id;
  const userId = obj.metadata?.userId ? Number(obj.metadata.userId) : undefined;

  const existing = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
  });

  if (existing) {
    await prisma.subscription.update({
      where: { id: existing.id },
      data: { status, currentPeriodEnd },
    });
    return existing.userId;
  }

  const byCustomer = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
    orderBy: { createdAt: "desc" },
  });

  if (byCustomer) {
    await prisma.subscription.update({
      where: { id: byCustomer.id },
      data: { stripeSubscriptionId, status, currentPeriodEnd },
    });
    return byCustomer.userId;
  }

  if (userId) {
    await prisma.subscription.create({
      data: {
        userId,
        stripeCustomerId: customerId,
        stripeSubscriptionId,
        status,
        currentPeriodEnd,
      },
    });
    return userId;
  }
}

export async function POST(req: Request) {
  const sig = headers().get("stripe-signature");
  if (!sig) return new Response("missing signature", { status: 400 });
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (subscriptionId) {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        await upsertSubscriptionFromStripe(sub);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await upsertSubscriptionFromStripe(sub);
      break;
    }
    default:
      break;
  }

  return new Response("ok", { status: 200 });
}

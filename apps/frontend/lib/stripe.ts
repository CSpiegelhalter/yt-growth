/**
 * Stripe payment integration helpers
 *
 * In TEST_MODE, bypasses Stripe entirely for local testing.
 */
import { prisma } from "@/prisma";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

type StripeCustomer = {
  id: string;
  email: string;
};

type StripeCheckoutSession = {
  id: string;
  url: string;
};

type StripePortalSession = {
  id: string;
  url: string;
};

type StripeSubscription = {
  id: string;
  status: string;
  current_period_end: number;
  customer: string;
};

/**
 * Make a Stripe API request
 */
async function stripeRequest<T>(
  endpoint: string,
  options: {
    method?: string;
    body?: Record<string, string>;
  } = {}
): Promise<T> {
  if (!STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }

  const response = await fetch(`https://api.stripe.com/v1${endpoint}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: options.body ? new URLSearchParams(options.body).toString() : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Stripe API error ${response.status}: ${error}`);
  }

  return response.json();
}

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(
  userId: number,
  email: string
): Promise<string> {
  // Check if user already has a Stripe customer ID
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  });

  if (subscription?.stripeCustomerId) {
    return subscription.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripeRequest<StripeCustomer>("/customers", {
    method: "POST",
    body: {
      email,
      "metadata[userId]": String(userId),
    },
  });

  // Save to database
  await prisma.subscription.upsert({
    where: { userId },
    update: { stripeCustomerId: customer.id },
    create: {
      userId,
      stripeCustomerId: customer.id,
      status: "inactive",
      plan: "free",
    },
  });

  return customer.id;
}

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  userId: number,
  email: string
): Promise<{ url: string }> {
  // TEST_MODE: Return fake URL that simulates subscription activation
  if (process.env.TEST_MODE === "1") {
    return { url: `${APP_URL}/api/integrations/stripe/test-activate?userId=${userId}` };
  }

  if (!STRIPE_PRICE_ID) {
    throw new Error("STRIPE_PRICE_ID not configured");
  }

  const customerId = await getOrCreateStripeCustomer(userId, email);

  const session = await stripeRequest<StripeCheckoutSession>("/checkout/sessions", {
    method: "POST",
    body: {
      customer: customerId,
      mode: "subscription",
      "line_items[0][price]": STRIPE_PRICE_ID,
      "line_items[0][quantity]": "1",
      success_url: `${APP_URL}/dashboard?checkout=success`,
      cancel_url: `${APP_URL}/dashboard?checkout=canceled`,
      "metadata[userId]": String(userId),
    },
  });

  return { url: session.url };
}

/**
 * Create a Stripe billing portal session
 */
export async function createPortalSession(userId: number): Promise<{ url: string }> {
  // TEST_MODE: Return fake URL
  if (process.env.TEST_MODE === "1") {
    return { url: `${APP_URL}/profile?portal=test` };
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  });

  if (!subscription?.stripeCustomerId) {
    throw new Error("No Stripe customer found");
  }

  const session = await stripeRequest<StripePortalSession>("/billing_portal/sessions", {
    method: "POST",
    body: {
      customer: subscription.stripeCustomerId,
      return_url: `${APP_URL}/profile`,
    },
  });

  return { url: session.url };
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(
  payload: string,
  signature: string
): Promise<{ received: boolean }> {
  // In production, verify webhook signature
  // For MVP, we'll trust the payload structure
  
  const event = JSON.parse(payload);
  const eventType = event.type;

  switch (eventType) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const userId = parseInt(session.metadata?.userId, 10);
      const subscriptionId = session.subscription;

      if (userId && subscriptionId) {
        // Fetch subscription details
        const sub = await stripeRequest<StripeSubscription>(`/subscriptions/${subscriptionId}`);
        
        await prisma.subscription.upsert({
          where: { userId },
          update: {
            stripeSubscriptionId: subscriptionId,
            status: "active",
            plan: "pro",
            channelLimit: 5,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
          create: {
            userId,
            stripeCustomerId: String(sub.customer),
            stripeSubscriptionId: subscriptionId,
            status: "active",
            plan: "pro",
            channelLimit: 5,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
        });
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as StripeSubscription;
      const customerId = sub.customer;

      const subscription = await prisma.subscription.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (subscription) {
        const status = sub.status === "active" ? "active" : sub.status === "past_due" ? "past_due" : "canceled";
        const plan = status === "active" ? "pro" : "free";
        const channelLimit = status === "active" ? 5 : 1;

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status,
            plan,
            channelLimit,
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
          },
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const customerId = invoice.customer;

      await prisma.subscription.updateMany({
        where: { stripeCustomerId: customerId },
        data: { status: "past_due" },
      });
      break;
    }
  }

  return { received: true };
}

/**
 * Get subscription status for a user
 */
export async function getSubscriptionStatus(userId: number): Promise<{
  status: string;
  plan: string;
  channelLimit: number;
  currentPeriodEnd: Date | null;
  isActive: boolean;
}> {
  // TEST_MODE: Always return active subscription
  if (process.env.TEST_MODE === "1") {
    return {
      status: "active",
      plan: "pro",
      channelLimit: 5,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    };
  }

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    return {
      status: "inactive",
      plan: "free",
      channelLimit: 1,
      currentPeriodEnd: null,
      isActive: false,
    };
  }

  return {
    status: subscription.status,
    plan: subscription.plan,
    channelLimit: subscription.channelLimit,
    currentPeriodEnd: subscription.currentPeriodEnd,
    isActive: subscription.status === "active" && subscription.plan !== "free",
  };
}


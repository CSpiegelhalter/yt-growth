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

export type StripeSubscription = {
  id: string;
  status: string;
  customer: string;
  billing_cycle_anchor: number;
  cancel_at?: number | null;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  canceled_at?: number | null;
  plan: {
    interval: string;
    interval_count: number;
  };
};

function safeDateFromUnixSeconds(sec: unknown): Date | null {
  if (typeof sec !== "number" || !Number.isFinite(sec) || sec <= 0) return null;
  const d = new Date(sec * 1000);
  return Number.isFinite(d.getTime()) ? d : null;
}

function minDate(a: Date | null, b: Date | null): Date | null {
  if (a && b) return a.getTime() <= b.getTime() ? a : b;
  return a ?? b;
}

function computePeriodEndFromAnchor(sub: StripeSubscription): Date | null {
  if (typeof sub.billing_cycle_anchor !== "number") return null;
  const d = new Date(sub.billing_cycle_anchor * 1000);
  if (!Number.isFinite(d.getTime())) return null;

  const interval = sub.plan?.interval;
  const intervalCount = sub.plan?.interval_count ?? 1;

  if (interval === "month") d.setMonth(d.getMonth() + intervalCount);
  else if (interval === "year") d.setFullYear(d.getFullYear() + intervalCount);
  else if (interval === "week") d.setDate(d.getDate() + 7 * intervalCount);
  else if (interval === "day") d.setDate(d.getDate() + intervalCount);
  return d;
}

function normalizeDbStatus(stripeStatus: string | undefined): string {
  const s = (stripeStatus ?? "").toLowerCase();
  if (s === "active" || s === "trialing") return "active";
  if (s === "past_due") return "past_due";
  if (s === "canceled" || s === "unpaid" || s === "incomplete_expired")
    return "canceled";
  return "inactive";
}

function isEntitledFromStripe(
  sub: StripeSubscription,
  periodEnd: Date | null
): boolean {
  if (!periodEnd) return false;
  if (periodEnd.getTime() <= Date.now()) return false;
  const s = (sub.status ?? "").toLowerCase();

  // For "canceled" status, only entitled if cancel_at_period_end is true
  // (user chose to cancel at end of billing period, keeps access until then)
  // If cancel_at_period_end is false, it's an immediate cancellation - no access
  if (s === "canceled") {
    return Boolean(sub.cancel_at_period_end);
  }

  return ["active", "trialing", "past_due", "unpaid"].includes(s);
}

/**
 * Make a Stripe API request
 */
export async function stripeRequest<T>(
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
    body: options.body
      ? new URLSearchParams(options.body).toString()
      : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Stripe API error ${response.status}: ${error}`);
  }

  return response.json();
}

/**
 * Check if a Stripe customer ID is valid (exists in Stripe)
 */
async function isValidStripeCustomer(customerId: string): Promise<boolean> {
  // Skip validation for obviously fake test IDs
  if (customerId.startsWith("cus_test_") || customerId === "cus_demo") {
    return false;
  }

  try {
    await stripeRequest<StripeCustomer>(`/customers/${customerId}`, {
      method: "GET",
    });
    return true;
  } catch (err) {
    // Customer doesn't exist or other error
    return false;
  }
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

  // If we have a customer ID, validate it exists in Stripe
  if (subscription?.stripeCustomerId) {
    const isValid = await isValidStripeCustomer(subscription.stripeCustomerId);
    if (isValid) {
      return subscription.stripeCustomerId;
    }
    // Customer ID is invalid/fake, we'll create a new one below
    console.log(
      `[Stripe] Invalid customer ID ${subscription.stripeCustomerId} for user ${userId}, creating new customer`
    );
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
  if (!STRIPE_PRICE_ID) {
    throw new Error("STRIPE_PRICE_ID not configured");
  }

  const customerId = await getOrCreateStripeCustomer(userId, email);

  const session = await stripeRequest<StripeCheckoutSession>(
    "/checkout/sessions",
    {
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
    }
  );

  return { url: session.url };
}

/**
 * Create a Stripe billing portal session
 */
export async function createPortalSession(
  userId: number
): Promise<{ url: string }> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  });

  if (!subscription?.stripeCustomerId) {
    throw new Error("No Stripe customer found. Please contact support.");
  }

  const session = await stripeRequest<StripePortalSession>(
    "/billing_portal/sessions",
    {
      method: "POST",
      body: {
        customer: subscription.stripeCustomerId,
        return_url: `${APP_URL}/profile`,
      },
    }
  );

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

  console.log(`[Stripe Webhook] Received event: ${eventType}`);

  switch (eventType) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const subscriptionId = session.subscription;
      const customerId = session.customer;

      console.log(`[Stripe Webhook] checkout.session.completed:`, {
        subscriptionId,
        customerId,
        metadata: session.metadata,
      });

      if (!subscriptionId) {
        console.log(`[Stripe Webhook] No subscription ID in session, skipping`);
        break;
      }

      // Try to get userId from metadata first
      let userId = parseInt(session.metadata?.userId, 10);

      // If no userId in metadata, look up by customer ID
      if (!userId || isNaN(userId)) {
        console.log(
          `[Stripe Webhook] No userId in metadata, looking up by customer ID: ${customerId}`
        );
        const existingSub = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId },
          select: { userId: true },
        });
        if (existingSub) {
          userId = existingSub.userId;
          console.log(
            `[Stripe Webhook] Found userId by customer ID: ${userId}`
          );
        }
      }

      if (!userId || isNaN(userId)) {
        console.error(
          `[Stripe Webhook] Could not determine userId for subscription ${subscriptionId}`
        );
        break;
      }

      // Fetch subscription details from Stripe
      const sub = await stripeRequest<StripeSubscription>(
        `/subscriptions/${subscriptionId}`
      );
      console.log(`[Stripe Webhook] Fetched subscription from Stripe:`, {
        id: sub.id,
        status: sub.status,
        customer: sub.customer,
        billing_cycle_anchor: sub.billing_cycle_anchor,
        plan: sub.plan,
        cancel_at: sub.cancel_at,
        current_period_end: sub.current_period_end,
        cancel_at_period_end: sub.cancel_at_period_end,
      });

      // Prefer Stripe's authoritative current_period_end when present.
      const periodEndDate =
        safeDateFromUnixSeconds(sub.current_period_end) ??
        computePeriodEndFromAnchor(sub);

      if (!periodEndDate) {
        console.error(
          `[Stripe Webhook] Could not compute period end for subscription ${sub.id}`
        );
        break;
      }

      const cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);
      const cancelAt = safeDateFromUnixSeconds(sub.cancel_at ?? undefined);
      const canceledAt = safeDateFromUnixSeconds(sub.canceled_at ?? undefined);
      const effectiveEnd = minDate(cancelAt, periodEndDate);
      const entitled = isEntitledFromStripe(sub, effectiveEnd);
      const dbStatus = normalizeDbStatus(sub.status);

      console.log(`[Stripe Webhook] Period end:`, periodEndDate, {
        entitled,
        dbStatus,
        cancelAtPeriodEnd,
        cancelAt,
        effectiveEnd,
      });

      // Update or create the subscription record
      const result = await prisma.subscription.upsert({
        where: { userId },
        update: {
          stripeCustomerId: String(sub.customer),
          stripeSubscriptionId: subscriptionId,
          status: dbStatus,
          plan: entitled ? "pro" : "free",
          channelLimit: entitled ? 5 : 1,
          currentPeriodEnd: periodEndDate,
          cancelAtPeriodEnd,
          cancelAt,
          canceledAt,
        },
        create: {
          userId,
          stripeCustomerId: String(sub.customer),
          stripeSubscriptionId: subscriptionId,
          status: dbStatus,
          plan: entitled ? "pro" : "free",
          channelLimit: entitled ? 5 : 1,
          currentPeriodEnd: periodEndDate,
          cancelAtPeriodEnd,
          cancelAt,
          canceledAt,
        },
      });

      console.log(
        `[Stripe Webhook] Subscription activated for user ${userId}:`,
        {
          status: result.status,
          plan: result.plan,
        }
      );
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as StripeSubscription;
      const customerId = sub.customer;
      if (process.env.NODE_ENV !== "production") {
        console.log("sub", sub);
      }
      console.log(`[Stripe Webhook] ${eventType}:`, {
        stripeSubscriptionId: sub.id,
        stripeStatus: sub.status,
        stripeCustomerId: customerId,
        cancel_at: sub.cancel_at,
        cancel_at_period_end: sub.cancel_at_period_end,
        canceled_at: sub.canceled_at,
        current_period_end: sub.current_period_end,
        billing_cycle_anchor: sub.billing_cycle_anchor,
        // NOTE: For some webhook payloads, plan may not be present at the root.
        plan: sub.plan,
      });

      const existing = await prisma.subscription.findFirst({
        where: {
          OR: [
            { stripeCustomerId: String(customerId) },
            { stripeSubscriptionId: String(sub.id) },
          ],
        },
      });

      const periodEndDate =
        safeDateFromUnixSeconds(sub.current_period_end) ??
        computePeriodEndFromAnchor(sub);
      const cancelAt = safeDateFromUnixSeconds(sub.cancel_at ?? undefined);
      const cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);
      const canceledAt = safeDateFromUnixSeconds(sub.canceled_at ?? undefined);
      const effectiveEnd = minDate(cancelAt, periodEndDate);
      const entitled = isEntitledFromStripe(sub, effectiveEnd);
      const dbStatus = normalizeDbStatus(sub.status);

      console.log(`[Stripe Webhook] ${eventType} computed:`, {
        foundDbRow: Boolean(existing),
        dbRow: existing
          ? {
              id: existing.id,
              userId: existing.userId,
              stripeCustomerId: existing.stripeCustomerId,
              stripeSubscriptionId: existing.stripeSubscriptionId,
              status: existing.status,
              plan: existing.plan,
              currentPeriodEnd: existing.currentPeriodEnd,
              cancelAtPeriodEnd: (existing as any).cancelAtPeriodEnd,
              cancelAt: (existing as any).cancelAt,
              canceledAt: (existing as any).canceledAt,
            }
          : null,
        computed: {
          dbStatus,
          entitled,
          periodEndIso: periodEndDate ? periodEndDate.toISOString() : null,
          cancelAtPeriodEnd,
          cancelAtIso: cancelAt ? cancelAt.toISOString() : null,
          effectiveEndIso: effectiveEnd ? effectiveEnd.toISOString() : null,
          canceledAtIso: canceledAt ? canceledAt.toISOString() : null,
        },
      });

      if (existing) {
        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            status: dbStatus,
            plan: entitled ? "pro" : "free",
            channelLimit: entitled ? 5 : 1,
            currentPeriodEnd: periodEndDate ?? existing.currentPeriodEnd,
            cancelAtPeriodEnd,
            cancelAt,
            canceledAt,
            stripeSubscriptionId:
              existing.stripeSubscriptionId ?? String(sub.id),
          },
        });
      } else {
        console.log(
          `[Stripe Webhook] subscription update/delete: no matching DB row`,
          { customerId, stripeSubscriptionId: sub.id, dbStatus }
        );
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
  cancelAtPeriodEnd: boolean;
  cancelAt: Date | null;
  canceledAt: Date | null;
  isActive: boolean;
}> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (!subscription) {
    return {
      status: "inactive",
      plan: "free",
      channelLimit: 1,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      cancelAt: null,
      canceledAt: null,
      isActive: false,
    };
  }

  const now = Date.now();
  const effectiveEnd =
    subscription.cancelAt && subscription.currentPeriodEnd
      ? subscription.cancelAt.getTime() <=
        subscription.currentPeriodEnd.getTime()
        ? subscription.cancelAt
        : subscription.currentPeriodEnd
      : subscription.cancelAt ?? subscription.currentPeriodEnd;
  const isActive =
    subscription.plan !== "free" &&
    (effectiveEnd
      ? effectiveEnd.getTime() > now
      : subscription.status === "active" ||
        subscription.status === "trialing" ||
        subscription.status === "past_due");

  // Keep API-facing plan/status/channelLimit consistent with computed entitlement.
  // If the effective end is in the past, the DB row can still say plan=pro/status=active
  // (especially if someone manually edits the DB or a webhook is missed).
  const hasCancelSignal =
    Boolean(subscription.cancelAtPeriodEnd) ||
    Boolean(subscription.cancelAt) ||
    Boolean(subscription.canceledAt);
  const normalizedStatus = isActive
    ? subscription.status
    : hasCancelSignal
    ? "canceled"
    : "inactive";
  const normalizedPlan = isActive ? subscription.plan : "free";
  const normalizedChannelLimit = isActive ? subscription.channelLimit : 1;

  if (
    !isActive &&
    subscription.plan !== "free" &&
    effectiveEnd &&
    effectiveEnd.getTime() <= now
  ) {
    // Best-effort self-heal: downgrade stale rows so the UI doesn't show "Pro/active"
    // when the effective end has already passed.
    try {
      await prisma.subscription.update({
        where: { userId },
        data: {
          status: normalizedStatus,
          plan: "free",
          channelLimit: 1,
        },
      });
    } catch (err) {
      console.warn(
        `[Stripe] Failed to normalize expired subscription row for user ${userId}:`,
        err
      );
    }
  }

  return {
    status: normalizedStatus,
    plan: normalizedPlan,
    channelLimit: normalizedChannelLimit,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ?? false,
    cancelAt: subscription.cancelAt,
    canceledAt: subscription.canceledAt,
    isActive,
  };
}

/**
 * Stripe payment integration — business logic & orchestration.
 *
 * Pure Stripe I/O lives in lib/adapters/stripe/.
 * Entitlement calculation and subscription status normalization live here
 * and will move to lib/features/subscriptions/ in a future phase.
 */
import * as stripe from "@/lib/adapters/stripe";
import type { PaymentSubscription } from "@/lib/ports/StripePort";
import { LIMITS } from "@/lib/shared/product";
import { prisma } from "@/prisma";

// Re-export for backward compatibility (used by sync route)
export type { RawStripeSubscription as StripeSubscription } from "@/lib/adapters/stripe";
export { stripeRequest } from "@/lib/adapters/stripe";

const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ── Date Helpers ──────────────────────────────────────────

function safeDateFromUnixSeconds(sec: unknown): Date | null {
  if (typeof sec !== "number" || !Number.isFinite(sec) || sec <= 0) {return null;}
  const d = new Date(sec * 1000);
  return Number.isFinite(d.getTime()) ? d : null;
}

function minDate(a: Date | null, b: Date | null): Date | null {
  if (a && b) {return a.getTime() <= b.getTime() ? a : b;}
  return a ?? b;
}

// ── Entitlement / Status Logic ────────────────────────────

function computePeriodEndFromAnchor(sub: PaymentSubscription): Date | null {
  if (typeof sub.billingCycleAnchor !== "number") {return null;}
  const d = new Date(sub.billingCycleAnchor * 1000);
  if (!Number.isFinite(d.getTime())) {return null;}

  const interval = sub.plan?.interval;
  const intervalCount = sub.plan?.intervalCount ?? 1;

  switch (interval) {
  case "month": {d.setMonth(d.getMonth() + intervalCount);
  break;
  }
  case "year": {d.setFullYear(d.getFullYear() + intervalCount);
  break;
  }
  case "week": {d.setDate(d.getDate() + 7 * intervalCount);
  break;
  }
  case "day": {d.setDate(d.getDate() + intervalCount);
  break;
  }
  // No default
  }
  return d;
}

function normalizeDbStatus(stripeStatus: string | undefined): string {
  const s = (stripeStatus ?? "").toLowerCase();
  if (s === "active" || s === "trialing") {return "active";}
  if (s === "past_due") {return "past_due";}
  if (s === "canceled" || s === "unpaid" || s === "incomplete_expired")
    {return "canceled";}
  return "inactive";
}

function isEntitledFromStripe(
  sub: PaymentSubscription,
  periodEnd: Date | null,
): boolean {
  if (!periodEnd) {return false;}
  if (periodEnd.getTime() <= Date.now()) {return false;}
  const s = (sub.status ?? "").toLowerCase();

  if (s === "canceled") {
    return sub.cancelAtPeriodEnd;
  }

  return ["active", "trialing", "past_due", "unpaid"].includes(s);
}

// ── Customer Orchestration ────────────────────────────────

async function getOrCreateStripeCustomer(
  userId: number,
  email: string,
): Promise<string> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  });

  if (subscription?.stripeCustomerId) {
    const existing = await stripe.getCustomer(subscription.stripeCustomerId);
    if (existing) {
      return existing.id;
    }
    console.log(
      `[Stripe] Invalid customer ID ${subscription.stripeCustomerId} for user ${userId}, creating new customer`,
    );
  }

  const customer = await stripe.createCustomer(email, {
    userId: String(userId),
  });

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

// ── Public API ────────────────────────────────────────────

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  userId: number,
  email: string,
): Promise<{ url: string }> {
  if (!STRIPE_PRICE_ID) {
    throw new Error("STRIPE_PRICE_ID not configured");
  }

  const customerId = await getOrCreateStripeCustomer(userId, email);

  const session = await stripe.createCheckoutSession({
    customerId,
    priceId: STRIPE_PRICE_ID,
    successUrl: `${APP_URL}/videos?checkout=success`,
    cancelUrl: `${APP_URL}/videos?checkout=canceled`,
    metadata: { userId: String(userId) },
  });

  return { url: session.url };
}

/**
 * Create a Stripe billing portal session
 */
export async function createPortalSession(
  userId: number,
): Promise<{ url: string }> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  });

  if (!subscription?.stripeCustomerId) {
    throw new Error("No Stripe customer found. Please contact support.");
  }

  const session = await stripe.createPortalSession({
    customerId: subscription.stripeCustomerId,
    returnUrl: `${APP_URL}/profile`,
  });

  return { url: session.url };
}

// ── Webhook Event Handlers ───────────────────────────────

function buildSubscriptionFields(sub: PaymentSubscription) {
  const periodEndDate =
    safeDateFromUnixSeconds(sub.currentPeriodEnd) ??
    computePeriodEndFromAnchor(sub);
  const cancelAt = safeDateFromUnixSeconds(sub.cancelAt ?? undefined);
  const canceledAt = safeDateFromUnixSeconds(sub.canceledAt ?? undefined);
  const effectiveEnd = minDate(cancelAt, periodEndDate);
  const entitled = isEntitledFromStripe(sub, effectiveEnd);
  const dbStatus = normalizeDbStatus(sub.status);

  return {
    periodEndDate,
    cancelAt,
    canceledAt,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    effectiveEnd,
    entitled,
    dbStatus,
  };
}

function buildSubscriptionData(
  fields: ReturnType<typeof buildSubscriptionFields>,
) {
  return {
    status: fields.dbStatus,
    plan: fields.entitled ? "pro" : "free",
    channelLimit: fields.entitled
      ? LIMITS.PRO_MAX_CONNECTED_CHANNELS
      : LIMITS.FREE_MAX_CONNECTED_CHANNELS,
    currentPeriodEnd: fields.periodEndDate,
    cancelAtPeriodEnd: fields.cancelAtPeriodEnd,
    cancelAt: fields.cancelAt,
    canceledAt: fields.canceledAt,
  } as const;
}

async function resolveUserIdFromCheckout(
  metadata: Record<string, string> | undefined,
  customerId: string | undefined,
): Promise<number | null> {
  const parsed = Number.parseInt(metadata?.userId ?? "", 10);
  if (parsed && !Number.isNaN(parsed)) {
    return parsed;
  }

  console.log(
    `[Stripe Webhook] No userId in metadata, looking up by customer ID: ${customerId}`,
  );
  const existingSub = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId ?? "" },
    select: { userId: true },
  });

  if (existingSub) {
    console.log(
      `[Stripe Webhook] Found userId by customer ID: ${existingSub.userId}`,
    );
    return existingSub.userId;
  }

  return null;
}

async function handleCheckoutCompleted(
  session: Record<string, unknown>,
): Promise<void> {
  const subscriptionId = session.subscription as string | undefined;
  const customerId = session.customer as string | undefined;
  const metadata = session.metadata as Record<string, string> | undefined;

  console.log(`[Stripe Webhook] checkout.session.completed:`, {
    subscriptionId,
    customerId,
    metadata,
  });

  if (!subscriptionId) {
    console.log(
      `[Stripe Webhook] No subscription ID in session, skipping`,
    );
    return;
  }

  const userId = await resolveUserIdFromCheckout(metadata, customerId);
  if (!userId) {
    console.error(
      `[Stripe Webhook] Could not determine userId for subscription ${subscriptionId}`,
    );
    return;
  }

  const sub = await stripe.getSubscription(subscriptionId);
  console.log(`[Stripe Webhook] Fetched subscription from Stripe:`, {
    id: sub.id,
    status: sub.status,
    customerId: sub.customerId,
    billingCycleAnchor: sub.billingCycleAnchor,
    plan: sub.plan,
    cancelAt: sub.cancelAt,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
  });

  const fields = buildSubscriptionFields(sub);
  if (!fields.periodEndDate) {
    console.error(
      `[Stripe Webhook] Could not compute period end for subscription ${sub.id}`,
    );
    return;
  }

  console.log(`[Stripe Webhook] Period end:`, fields.periodEndDate, {
    entitled: fields.entitled,
    dbStatus: fields.dbStatus,
    cancelAtPeriodEnd: fields.cancelAtPeriodEnd,
    cancelAt: fields.cancelAt,
    effectiveEnd: fields.effectiveEnd,
  });

  const data = {
    stripeCustomerId: sub.customerId,
    stripeSubscriptionId: subscriptionId,
    ...buildSubscriptionData(fields),
  };

  const result = await prisma.subscription.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });

  console.log(
    `[Stripe Webhook] Subscription activated for user ${userId}:`,
    { status: result.status, plan: result.plan },
  );
}

async function handleSubscriptionChange(
  eventType: string,
  eventData: Record<string, unknown>,
): Promise<void> {
  const sub = stripe.toPaymentSubscription(eventData);
  const customerId = sub.customerId;

  if (process.env.NODE_ENV !== "production") {
    console.log("sub", sub);
  }
  console.log(`[Stripe Webhook] ${eventType}:`, {
    stripeSubscriptionId: sub.id,
    stripeStatus: sub.status,
    stripeCustomerId: customerId,
    cancelAt: sub.cancelAt,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    canceledAt: sub.canceledAt,
    currentPeriodEnd: sub.currentPeriodEnd,
    billingCycleAnchor: sub.billingCycleAnchor,
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

  const fields = buildSubscriptionFields(sub);

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
          cancelAtPeriodEnd: (existing as typeof existing & { cancelAtPeriodEnd?: boolean | null }).cancelAtPeriodEnd,
          cancelAt: (existing as typeof existing & { cancelAt?: Date | string | null }).cancelAt,
          canceledAt: (existing as typeof existing & { canceledAt?: Date | string | null }).canceledAt,
        }
      : null,
    computed: {
      dbStatus: fields.dbStatus,
      entitled: fields.entitled,
      periodEndIso: fields.periodEndDate ? fields.periodEndDate.toISOString() : null,
      cancelAtPeriodEnd: fields.cancelAtPeriodEnd,
      cancelAtIso: fields.cancelAt ? fields.cancelAt.toISOString() : null,
      effectiveEndIso: fields.effectiveEnd ? fields.effectiveEnd.toISOString() : null,
      canceledAtIso: fields.canceledAt ? fields.canceledAt.toISOString() : null,
    },
  });

  if (!existing) {
    console.log(
      `[Stripe Webhook] subscription update/delete: no matching DB row`,
      { customerId, stripeSubscriptionId: sub.id, dbStatus: fields.dbStatus },
    );
    return;
  }

  await prisma.subscription.update({
    where: { id: existing.id },
    data: {
      ...buildSubscriptionData(fields),
      currentPeriodEnd: fields.periodEndDate ?? existing.currentPeriodEnd,
      stripeSubscriptionId:
        existing.stripeSubscriptionId ?? String(sub.id),
    },
  });
}

async function handleInvoicePaymentFailed(
  invoice: Record<string, unknown>,
): Promise<void> {
  const customerId = invoice.customer as string;

  console.log(`[Stripe Webhook] invoice.payment_failed:`, {
    invoiceId: invoice.id,
    customerId,
    subscriptionId: invoice.subscription,
    attemptCount: invoice.attempt_count,
    amountDue: invoice.amount_due,
  });

  const result = await prisma.subscription.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      status: "canceled",
      plan: "free",
      channelLimit: LIMITS.FREE_MAX_CONNECTED_CHANNELS,
    },
  });

  console.log(
    `[Stripe Webhook] Revoked pro access for customer ${customerId} due to payment failure:`,
    { updatedCount: result.count },
  );
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(
  payload: string,
  signature: string,
): Promise<{ received: boolean }> {
  const event = stripe.verifyAndParseWebhook(payload, signature);
  const eventType = event.type;

  console.log(`[Stripe Webhook] Received event: ${eventType}`);

  switch (eventType) {
    case "checkout.session.completed": {
      await handleCheckoutCompleted(event.data.object as Record<string, unknown>);
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await handleSubscriptionChange(eventType, event.data.object as Record<string, unknown>);
      break;
    }

    case "invoice.payment_failed": {
      await handleInvoicePaymentFailed(event.data.object as Record<string, unknown>);
      break;
    }
  }

  return { received: true };
}

/**
 * Get subscription status for a user.
 *
 * Delegates to the subscriptions feature domain for the canonical
 * status-normalization logic.
 */
export { resolveSubscription as getSubscriptionStatus } from "@/lib/features/subscriptions/use-cases/resolveSubscription";

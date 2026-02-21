/**
 * Stripe payment integration — business logic & orchestration.
 *
 * Pure Stripe I/O lives in lib/adapters/stripe/.
 * Entitlement calculation and subscription status normalization live here
 * and will move to lib/features/subscriptions/ in a future phase.
 */
import { prisma } from "@/prisma";
import { LIMITS } from "@/lib/shared/product";
import type { PaymentSubscription } from "@/lib/ports/StripePort";
import * as stripe from "@/lib/adapters/stripe";

// Re-export for backward compatibility (used by sync route)
export { stripeRequest } from "@/lib/adapters/stripe";
export type { RawStripeSubscription as StripeSubscription } from "@/lib/adapters/stripe";

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

  if (interval === "month") {d.setMonth(d.getMonth() + intervalCount);}
  else if (interval === "year") {d.setFullYear(d.getFullYear() + intervalCount);}
  else if (interval === "week") {d.setDate(d.getDate() + 7 * intervalCount);}
  else if (interval === "day") {d.setDate(d.getDate() + intervalCount);}
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
    successUrl: `${APP_URL}/dashboard?checkout=success`,
    cancelUrl: `${APP_URL}/dashboard?checkout=canceled`,
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
      const session = event.data.object;
      const subscriptionId = session.subscription as string | undefined;
      const customerId = session.customer as string | undefined;
      const metadata = session.metadata as
        | Record<string, string>
        | undefined;

      console.log(`[Stripe Webhook] checkout.session.completed:`, {
        subscriptionId,
        customerId,
        metadata,
      });

      if (!subscriptionId) {
        console.log(
          `[Stripe Webhook] No subscription ID in session, skipping`,
        );
        break;
      }

      let userId = parseInt(metadata?.userId ?? "", 10);

      if (!userId || isNaN(userId)) {
        console.log(
          `[Stripe Webhook] No userId in metadata, looking up by customer ID: ${customerId}`,
        );
        const existingSub = await prisma.subscription.findFirst({
          where: { stripeCustomerId: customerId ?? "" },
          select: { userId: true },
        });
        if (existingSub) {
          userId = existingSub.userId;
          console.log(
            `[Stripe Webhook] Found userId by customer ID: ${userId}`,
          );
        }
      }

      if (!userId || isNaN(userId)) {
        console.error(
          `[Stripe Webhook] Could not determine userId for subscription ${subscriptionId}`,
        );
        break;
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

      const periodEndDate =
        safeDateFromUnixSeconds(sub.currentPeriodEnd) ??
        computePeriodEndFromAnchor(sub);

      if (!periodEndDate) {
        console.error(
          `[Stripe Webhook] Could not compute period end for subscription ${sub.id}`,
        );
        break;
      }

      const cancelAtPeriodEnd = sub.cancelAtPeriodEnd;
      const cancelAt = safeDateFromUnixSeconds(sub.cancelAt ?? undefined);
      const canceledAt = safeDateFromUnixSeconds(sub.canceledAt ?? undefined);
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

      const result = await prisma.subscription.upsert({
        where: { userId },
        update: {
          stripeCustomerId: sub.customerId,
          stripeSubscriptionId: subscriptionId,
          status: dbStatus,
          plan: entitled ? "pro" : "free",
          channelLimit: entitled
            ? LIMITS.PRO_MAX_CONNECTED_CHANNELS
            : LIMITS.FREE_MAX_CONNECTED_CHANNELS,
          currentPeriodEnd: periodEndDate,
          cancelAtPeriodEnd,
          cancelAt,
          canceledAt,
        },
        create: {
          userId,
          stripeCustomerId: sub.customerId,
          stripeSubscriptionId: subscriptionId,
          status: dbStatus,
          plan: entitled ? "pro" : "free",
          channelLimit: entitled
            ? LIMITS.PRO_MAX_CONNECTED_CHANNELS
            : LIMITS.FREE_MAX_CONNECTED_CHANNELS,
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
        },
      );
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = stripe.toPaymentSubscription(event.data.object);
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

      const periodEndDate =
        safeDateFromUnixSeconds(sub.currentPeriodEnd) ??
        computePeriodEndFromAnchor(sub);
      const cancelAt = safeDateFromUnixSeconds(sub.cancelAt ?? undefined);
      const cancelAtPeriodEnd = sub.cancelAtPeriodEnd;
      const canceledAt = safeDateFromUnixSeconds(sub.canceledAt ?? undefined);
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
              cancelAtPeriodEnd: (existing as typeof existing & { cancelAtPeriodEnd?: boolean | null }).cancelAtPeriodEnd,
              cancelAt: (existing as typeof existing & { cancelAt?: Date | string | null }).cancelAt,
              canceledAt: (existing as typeof existing & { canceledAt?: Date | string | null }).canceledAt,
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
            channelLimit: entitled
              ? LIMITS.PRO_MAX_CONNECTED_CHANNELS
              : LIMITS.FREE_MAX_CONNECTED_CHANNELS,
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
          { customerId, stripeSubscriptionId: sub.id, dbStatus },
        );
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
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

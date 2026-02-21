/**
 * Stripe Adapter — pure Stripe API I/O.
 *
 * Handles all HTTP communication with the Stripe API and webhook signature
 * verification.  Maps raw Stripe response shapes to port-defined types.
 *
 * Must NOT contain business decisions about plan tiers, feature locks, or
 * entitlement calculations — those belong in lib/features/.
 */

import "server-only";
import crypto from "crypto";
import { timingSafeEqualHex } from "@/lib/shared/crypto";
import type {
  PaymentCustomer,
  PaymentSubscription,
  CheckoutSessionParams,
  CheckoutSessionResult,
  PortalSessionParams,
  PortalSessionResult,
  WebhookEvent,
} from "@/lib/ports/StripePort";

// ── Config ────────────────────────────────────────────────

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

// ── Raw Stripe Response Types ─────────────────────────────

type RawStripeCustomer = { id: string; email: string };
type RawStripeCheckoutSession = { id: string; url: string };
type RawStripePortalSession = { id: string; url: string };

export type RawStripeSubscription = {
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

// ── Low-Level HTTP ────────────────────────────────────────

export async function stripeRequest<T>(
  endpoint: string,
  options: {
    method?: string;
    body?: Record<string, string>;
  } = {},
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

// ── Mapping ───────────────────────────────────────────────

function mapSubscription(raw: RawStripeSubscription): PaymentSubscription {
  return {
    id: raw.id,
    status: raw.status,
    customerId: raw.customer,
    billingCycleAnchor: raw.billing_cycle_anchor,
    currentPeriodEnd: raw.current_period_end ?? null,
    cancelAt: raw.cancel_at ?? null,
    cancelAtPeriodEnd: Boolean(raw.cancel_at_period_end),
    canceledAt: raw.canceled_at ?? null,
    plan: {
      interval: (raw.plan?.interval ?? "month") as PaymentSubscription["plan"]["interval"],
      intervalCount: raw.plan?.interval_count ?? 1,
    },
  };
}

/**
 * Parse a raw Stripe subscription object (e.g. from a webhook payload) into
 * a port-defined PaymentSubscription.
 */
export function toPaymentSubscription(
  data: Record<string, unknown>,
): PaymentSubscription {
  return mapSubscription(data as RawStripeSubscription);
}

// ── Customer Operations ───────────────────────────────────

export async function createCustomer(
  email: string,
  metadata?: Record<string, string>,
): Promise<PaymentCustomer> {
  const body: Record<string, string> = { email };
  if (metadata) {
    for (const [k, v] of Object.entries(metadata)) {
      body[`metadata[${k}]`] = v;
    }
  }
  const raw = await stripeRequest<RawStripeCustomer>("/customers", {
    method: "POST",
    body,
  });
  return { id: raw.id, email: raw.email };
}

export async function getCustomer(
  customerId: string,
): Promise<PaymentCustomer | null> {
  try {
    const raw = await stripeRequest<RawStripeCustomer>(
      `/customers/${customerId}`,
    );
    return { id: raw.id, email: raw.email };
  } catch {
    return null;
  }
}

// ── Checkout & Portal ─────────────────────────────────────

export async function createCheckoutSession(
  params: CheckoutSessionParams,
): Promise<CheckoutSessionResult> {
  const body: Record<string, string> = {
    customer: params.customerId,
    mode: "subscription",
    "line_items[0][price]": params.priceId,
    "line_items[0][quantity]": "1",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  };
  if (params.metadata) {
    for (const [k, v] of Object.entries(params.metadata)) {
      body[`metadata[${k}]`] = v;
    }
  }
  const raw = await stripeRequest<RawStripeCheckoutSession>(
    "/checkout/sessions",
    { method: "POST", body },
  );
  return { id: raw.id, url: raw.url };
}

export async function createPortalSession(
  params: PortalSessionParams,
): Promise<PortalSessionResult> {
  const raw = await stripeRequest<RawStripePortalSession>(
    "/billing_portal/sessions",
    {
      method: "POST",
      body: {
        customer: params.customerId,
        return_url: params.returnUrl,
      },
    },
  );
  return { id: raw.id, url: raw.url };
}

// ── Subscriptions ─────────────────────────────────────────

export async function getSubscription(
  subscriptionId: string,
): Promise<PaymentSubscription> {
  const raw = await stripeRequest<RawStripeSubscription>(
    `/subscriptions/${subscriptionId}`,
  );
  return mapSubscription(raw);
}

// ── Webhooks ──────────────────────────────────────────────

export function verifyAndParseWebhook(
  payload: string,
  signatureHeader: string,
): WebhookEvent {
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET not configured");
  }
  if (!signatureHeader) {
    throw new Error("Missing Stripe signature header");
  }

  const parts = signatureHeader.split(",").map((p) => p.trim());
  const tPart = parts.find((p) => p.startsWith("t="));
  const v1Parts = parts.filter((p) => p.startsWith("v1="));
  const tsRaw = tPart?.slice(2) ?? "";
  const timestamp = Number(tsRaw);
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    throw new Error("Invalid Stripe signature timestamp");
  }

  const age = Math.abs(Date.now() / 1000 - timestamp);
  if (age > WEBHOOK_TOLERANCE_SECONDS) {
    throw new Error("Stripe signature timestamp outside tolerance");
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", STRIPE_WEBHOOK_SECRET)
    .update(signedPayload, "utf8")
    .digest("hex");

  const provided = v1Parts.map((p) => p.slice(3)).filter(Boolean);
  const ok = provided.some((sig) => timingSafeEqualHex(sig, expected));
  if (!ok) {
    throw new Error("Invalid Stripe webhook signature");
  }

  const event = JSON.parse(payload);
  return {
    type: event.type,
    data: { object: event.data.object },
  };
}

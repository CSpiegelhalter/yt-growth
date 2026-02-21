/**
 * Stripe Port — contract for payment and subscription management.
 *
 * Ports are pure TypeScript interfaces — no runtime code, no implementations.
 * They define what features need from a payment provider without specifying how.
 *
 * Imported by:
 *   - lib/features/ (to declare dependency on payment capabilities)
 *   - lib/adapters/stripe/ (to implement)
 *   - app/ or lib/server/ (to wire adapter to features)
 */

// ─── Customer Types ─────────────────────────────────────────

export interface PaymentCustomer {
  id: string;
  email: string;
}

// ─── Subscription Types ─────────────────────────────────────

export interface SubscriptionPlan {
  interval: "day" | "week" | "month" | "year";
  intervalCount: number;
}

export interface PaymentSubscription {
  id: string;
  status: string;
  customerId: string;
  billingCycleAnchor: number;
  currentPeriodEnd: number | null;
  cancelAt: number | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: number | null;
  plan: SubscriptionPlan;
}

// ─── Checkout Types ─────────────────────────────────────────

export interface CheckoutSessionParams {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSessionResult {
  id: string;
  url: string;
}

// ─── Portal Types ───────────────────────────────────────────

export interface PortalSessionParams {
  customerId: string;
  returnUrl: string;
}

export interface PortalSessionResult {
  id: string;
  url: string;
}

// ─── Webhook Types ──────────────────────────────────────────

export interface WebhookEvent {
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

// ─── Port Interface ─────────────────────────────────────────

/** @public Contract for features to declare payment provider dependency. */
export interface StripePort {
  // ── Customer Operations ─────────────────────────────────

  /** Create a new customer in the payment provider. */
  createCustomer(
    email: string,
    metadata?: Record<string, string>,
  ): Promise<PaymentCustomer>;

  /** Fetch a customer by their provider ID. Returns null if not found. */
  getCustomer(customerId: string): Promise<PaymentCustomer | null>;

  // ── Checkout & Portal ───────────────────────────────────

  /** Create a checkout session for purchasing a subscription. */
  createCheckoutSession(
    params: CheckoutSessionParams,
  ): Promise<CheckoutSessionResult>;

  /** Create a billing portal session for managing a subscription. */
  createPortalSession(
    params: PortalSessionParams,
  ): Promise<PortalSessionResult>;

  // ── Subscriptions ───────────────────────────────────────

  /** Fetch subscription details by subscription ID. */
  getSubscription(subscriptionId: string): Promise<PaymentSubscription>;

  // ── Webhooks ────────────────────────────────────────────

  /**
   * Verify a webhook signature and parse the event payload.
   * Throws if the signature is invalid or the timestamp is outside tolerance.
   */
  verifyAndParseWebhook(
    payload: string,
    signatureHeader: string,
  ): WebhookEvent;
}

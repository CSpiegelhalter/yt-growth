/**
 * Product / business constants
 *
 * Keep all “change later” knobs here (pricing, plan limits, etc.) so the UI,
 * API gating, Stripe sync, and tests stay consistent.
 */
export const SUBSCRIPTION = {
  /** Displayed price (billing is controlled by Stripe Price ID) */
  PRO_MONTHLY_PRICE_USD: 12,
  PRO_INTERVAL: "month",
} as const;

export const LIMITS = {
  /** Max YouTube channels a FREE user can connect */
  FREE_MAX_CONNECTED_CHANNELS: 1,
  /** Max YouTube channels a PRO user can connect */
  PRO_MAX_CONNECTED_CHANNELS: 3,
} as const;

export function formatUsd(amount: number): string {
  // Simple formatting for integer USD amounts (e.g. 19 -> "$19")
  return `$${amount}`;
}

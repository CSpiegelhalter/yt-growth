/**
 * Analytics event tracking for the PLG gating system.
 *
 * 5 must-have events for funnel measurement:
 * - gate_shown: auth/limit gate rendered
 * - gate_action: user took action on a gate (signup/upgrade/dismiss/escape)
 * - limit_reached: usage limit was hit
 * - signup_completed: successful signup
 * - upgrade_completed: successful Pro upgrade
 *
 * Events are logged to console in development and can be wired to
 * any analytics provider (Mixpanel, Amplitude, PostHog, etc.).
 */

type GateType = "auth" | "limit";
type GateAction = "signup" | "upgrade" | "dismiss" | "escape";
type Tier = "guest" | "free" | "pro";

type AnalyticsEvent =
  | { name: "gate_shown"; props: { gate_type: GateType; tier: Tier; feature: string; trigger: string } }
  | { name: "gate_action"; props: { gate_type: GateType; action: GateAction; tier: Tier } }
  | { name: "limit_reached"; props: { tier: Tier; feature: string; used: number; limit: number } }
  | { name: "signup_completed"; props: { source: string; trigger_feature?: string; channel_connected: boolean } }
  | { name: "upgrade_completed"; props: { plan: string; source: string } };

/**
 * Track an analytics event.
 * In development, logs to console. In production, wire to your analytics provider.
 */
export function track(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${event.name}`, event.props);
  }

  // Wire to your analytics provider here:
  // posthog?.capture(event.name, event.props);
  // amplitude?.track(event.name, event.props);
}

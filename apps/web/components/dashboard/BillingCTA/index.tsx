"use client";

import { useState } from "react";
import { AlertCircleIcon } from "@/components/icons";
import s from "./style.module.css";
import { LIMITS, SUBSCRIPTION, formatUsd } from "@/lib/shared/product";

type Props = {
  isSubscribed: boolean;
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd?: boolean;
  cancelAt?: string | null;
};

export default function BillingCTA({
  isSubscribed,
  plan,
  status,
  currentPeriodEnd,
  cancelAtPeriodEnd,
  cancelAt,
}: Props) {
  void status;
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/stripe/checkout", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = () => {
    // Direct link to Stripe Customer Portal
    const portalUrl = process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL;
    if (portalUrl) {
      window.location.href = portalUrl;
    } else {
      alert("Billing portal not configured. Please contact support.");
    }
  };

  if (isSubscribed) {
    const isCanceling = cancelAtPeriodEnd || cancelAt;
    const endDate = cancelAt ?? currentPeriodEnd;
    const formattedEndDate = endDate
      ? new Date(endDate).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : null;

    return (
      <div className={s.card}>
        <div className={s.header}>
          <div>
            <h3 className={s.title}>
              {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
            </h3>
            <span
              className={`${s.badge} ${isCanceling ? s.badgeWarning : s.badgeSuccess}`}
            >
              {isCanceling ? "Canceling" : "Active"}
            </span>
          </div>
        </div>

        {/* Cancellation Notice */}
        {isCanceling && formattedEndDate && (
          <div className={s.cancelNotice} data-testid="cancellation-notice">
            <AlertCircleIcon size={16} />
            <span>
              Good until <strong>{formattedEndDate}</strong>
            </span>
          </div>
        )}

        <div className={s.details}>
          <div className={s.pricing}>
            <span className={s.price}>
              {formatUsd(SUBSCRIPTION.PRO_MONTHLY_PRICE_USD)}
            </span>
            <span className={s.period}>/{SUBSCRIPTION.PRO_INTERVAL}</span>
          </div>
          {!isCanceling && formattedEndDate && (
            <p className={s.meta}>Next billing date: {formattedEndDate}</p>
          )}
          <ul className={s.features}>
            <li>Unlimited idea generations</li>
            <li>Video analysis</li>
            <li>Subscriber driver insights</li>
            <li>Up to {LIMITS.PRO_MAX_CONNECTED_CHANNELS} channels</li>
          </ul>
        </div>
        <button
          onClick={handleManageBilling}
          disabled={loading}
          className={s.btn}
        >
          {loading ? "Loading..." : "Manage Subscription"}
        </button>
      </div>
    );
  }

  return (
    <div className={s.cardHighlight}>
      <div className={s.header}>
        <div>
          <h3 className={s.title}>Upgrade to Pro</h3>
          <p className={s.subtitle}>
            Unlock all features and grow your channel faster
          </p>
        </div>
      </div>
      <ul className={s.features}>
        <li>Unlimited Idea Engine</li>
        <li>Video analysis with fixes</li>
        <li>Subscriber driver insights</li>
        <li>Up to {LIMITS.PRO_MAX_CONNECTED_CHANNELS} connected channels</li>
        <li>Priority support</li>
      </ul>
      <div className={s.pricing}>
        <span className={s.price}>{formatUsd(SUBSCRIPTION.PRO_MONTHLY_PRICE_USD)}</span>
        <span className={s.period}>/{SUBSCRIPTION.PRO_INTERVAL}</span>
      </div>
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className={`${s.btn} ${s.btnPrimary}`}
      >
        {loading ? "Loading..." : "Subscribe Now"}
      </button>
    </div>
  );
}

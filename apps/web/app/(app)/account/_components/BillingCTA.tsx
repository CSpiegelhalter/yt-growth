"use client";

import { useState } from "react";

import { AlertCircleIcon } from "@/components/icons";
import { UpgradeCard } from "@/components/pricing/UpgradeCard";
import { formatUsd, LIMITS, SUBSCRIPTION } from "@/lib/shared/product";

import s from "./BillingCTA.module.css";

function handleManageBilling() {
  const portalUrl = process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL;
  if (portalUrl) {
    window.location.href = portalUrl;
  } else {
    alert("Billing portal not configured. Please contact support.");
  }
}

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
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoading(false);
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
    <UpgradeCard onPurchase={handleSubscribe} isPro={false} loading={loading} />
  );
}

"use client";

import { useState } from "react";
import s from "./style.module.css";

type Props = {
  isSubscribed: boolean;
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
};

export default function BillingCTA({
  isSubscribed,
  plan,
  status,
  currentPeriodEnd,
}: Props) {
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

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/stripe/portal", {
        method: "POST",
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.needsSubscription) {
        // User has a fake subscription, redirect to checkout
        window.location.href = "/api/integrations/stripe/checkout";
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error("Portal error:", err);
      alert("Failed to open billing portal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className={s.card}>
        <div className={s.header}>
          <div>
            <h3 className={s.title}>{plan.charAt(0).toUpperCase() + plan.slice(1)} Plan</h3>
            <span className={`${s.badge} ${s.badgeSuccess}`}>Active</span>
          </div>
        </div>
        <div className={s.details}>
          {currentPeriodEnd && (
            <p className={s.meta}>
              Next billing date: {new Date(currentPeriodEnd).toLocaleDateString()}
            </p>
          )}
          <ul className={s.features}>
            <li>Unlimited idea generations</li>
            <li>Video analysis</li>
            <li>Subscriber driver insights</li>
            <li>Up to 5 channels</li>
          </ul>
        </div>
        <button
          onClick={handleManageBilling}
          disabled={loading}
          className={s.btn}
        >
          {loading ? "Loading..." : "Manage Billing"}
        </button>
      </div>
    );
  }

  return (
    <div className={s.cardHighlight}>
      <div className={s.header}>
        <div>
          <h3 className={s.title}>Upgrade to Pro</h3>
          <p className={s.subtitle}>Unlock all features and grow your channel faster</p>
        </div>
      </div>
      <ul className={s.features}>
        <li>Unlimited Idea Engine</li>
        <li>Video analysis with fixes</li>
        <li>Subscriber driver insights</li>
        <li>Up to 5 connected channels</li>
        <li>Priority support</li>
      </ul>
      <div className={s.pricing}>
        <span className={s.price}>$19</span>
        <span className={s.period}>/month</span>
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


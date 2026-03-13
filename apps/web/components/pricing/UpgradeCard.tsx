"use client";

import { CheckCircleIcon, SparklesIcon } from "@/components/icons";
import { formatUsd, LIMITS, SUBSCRIPTION } from "@/lib/shared/product";

import s from "./UpgradeCard.module.css";

const PRO_FEATURES = [
  "Unlimited idea suggestions",
  "Video analysis with actionable fixes",
  "Subscriber driver insights",
  `Up to ${LIMITS.PRO_MAX_CONNECTED_CHANNELS} connected channels`,
  "Priority support",
] as const;

type UpgradeCardProps = {
  onPurchase: () => void;
  isPro: boolean;
  loading?: boolean;
};

export function UpgradeCard({ onPurchase, isPro, loading }: UpgradeCardProps) {
  return (
    <div className={s.card}>
      <div className={s.header}>
        <div className={s.titleRow}>
          <SparklesIcon size={24} className={s.sparkleIcon} />
          <h3 className={s.title}>Upgrade to Pro!</h3>
        </div>
        <p className={s.subtitle}>
          Unlock all features and grow your channel faster
        </p>
      </div>

      <div className={s.body}>
        <ul className={s.features}>
          {PRO_FEATURES.map((feature) => (
            <li key={feature} className={s.featureItem}>
              <CheckCircleIcon size={20} className={s.checkIcon} />
              {feature}
            </li>
          ))}
        </ul>

        <p className={s.price}>
          Only {formatUsd(SUBSCRIPTION.PRO_MONTHLY_PRICE_USD)}/
          {SUBSCRIPTION.PRO_INTERVAL}
        </p>

        {isPro ? (
          <span className={s.proBadge}>Current Plan</span>
        ) : (
          <button
            type="button"
            className={s.purchaseBtn}
            onClick={onPurchase}
            disabled={loading}
          >
            {loading ? "Loading..." : "Purchase"}
          </button>
        )}
      </div>
    </div>
  );
}

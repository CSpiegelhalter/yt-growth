"use client";

import { formatUsd, SUBSCRIPTION } from "@/lib/shared/product";

import s from "../keywords.module.css";

const PAYWALL_FEATURES = [
  "Unlimited keyword searches",
  "200 AI video ideas per day",
  "Full channel analytics & competitor tracking",
];

export function KeywordPaywall({ onClose }: { onClose: () => void }) {
  return (
    <div className={s.paywallOverlay}>
      <button className={s.paywallBackdrop} onClick={onClose} type="button" aria-label="Close dialog" />
      <div className={s.paywallCard}>
        <button className={s.paywallClose} onClick={onClose} type="button" aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div className={s.paywallIcon}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3>Unlock Unlimited Research</h3>
        <p>You&apos;ve used your free searches for today. Upgrade to Pro for unlimited keyword research and more.</p>
        <div className={s.paywallFeatures}>
          {PAYWALL_FEATURES.map((feat) => (
            <div key={feat} className={s.paywallFeature}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span>{feat}</span>
            </div>
          ))}
        </div>
        <a href="/api/integrations/stripe/checkout" className={s.upgradeButton}>
          Upgrade to Pro — {formatUsd(SUBSCRIPTION.PRO_MONTHLY_PRICE_USD)}/{SUBSCRIPTION.PRO_INTERVAL}
        </a>
        <button className={s.dismissButton} onClick={onClose}>Maybe later</button>
      </div>
    </div>
  );
}

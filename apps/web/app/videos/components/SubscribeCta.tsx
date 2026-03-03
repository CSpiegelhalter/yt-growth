"use client";

import { formatUsd, LIMITS, SUBSCRIPTION } from "@/lib/shared/product";

import s from "../style.module.css";

type SubscribeCtaProps = {
  visible: boolean;
};

export function SubscribeCta({ visible }: SubscribeCtaProps) {
  if (!visible) {return null;}

  return (
    <section className={s.ctaSection}>
      <div className={s.ctaCard}>
        <div className={s.ctaContent}>
          <h3 className={s.ctaTitle}>Unlock Full Insights</h3>
          <p className={s.ctaDesc}>
            Get video ideas, retention analysis, and subscriber driver
            insights.
          </p>
          <ul className={s.ctaFeatures}>
            <li>Unlimited idea generation</li>
            <li>Video analysis with fixes</li>
            <li>
              Up to {LIMITS.PRO_MAX_CONNECTED_CHANNELS} connected
              channels
            </li>
          </ul>
        </div>
        <div className={s.ctaAction}>
          <div className={s.ctaPrice}>
            <span className={s.ctaPriceAmount}>
              {formatUsd(SUBSCRIPTION.PRO_MONTHLY_PRICE_USD)}
            </span>
            <span className={s.ctaPricePeriod}>
              /{SUBSCRIPTION.PRO_INTERVAL}
            </span>
          </div>
          <a
            href="/api/integrations/stripe/checkout"
            className={s.ctaBtn}
          >
            Subscribe Now
          </a>
        </div>
      </div>
    </section>
  );
}

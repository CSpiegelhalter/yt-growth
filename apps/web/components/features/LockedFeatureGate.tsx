"use client";

import type { ReactNode } from "react";
import { SUBSCRIPTION, formatUsd } from "@/lib/shared/product";

type Styles = Record<string, string>;

type Props = {
  pageTitle: string;
  pageSubtitle: string;
  icon: ReactNode;
  unlockTitle: string;
  unlockDesc: string;
  styles?: Styles;
};

/**
 * Shared locked-state gate used by Pro-only feature pages
 * (Competitor Search, Trending Search, etc.).
 */
export function LockedFeatureGate({
  pageTitle,
  pageSubtitle,
  icon,
  unlockTitle,
  unlockDesc,
  styles: s,
}: Props) {
  return (
    <main className={s?.page}>
      <div className={s?.header}>
        <div>
          <h1 className={s?.title}>{pageTitle}</h1>
          <p className={s?.subtitle}>{pageSubtitle}</p>
        </div>
      </div>
      <div className={s?.lockedState}>
        <div className={s?.lockedIcon}>{icon}</div>
        <h2 className={s?.lockedTitle}>{unlockTitle}</h2>
        <p className={s?.lockedDesc}>{unlockDesc}</p>
        <a href="/api/integrations/stripe/checkout" className={s?.lockedBtn}>
          Subscribe to Pro — {formatUsd(SUBSCRIPTION.PRO_MONTHLY_PRICE_USD)}/
          {SUBSCRIPTION.PRO_INTERVAL}
        </a>
      </div>
    </main>
  );
}

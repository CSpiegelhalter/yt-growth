import type { Metadata } from "next";

import { getCurrentUserWithSubscription, hasActiveSubscription } from "@/lib/server/auth";
import { BRAND } from "@/lib/shared/brand";

import s from "./pricing.module.css";
import { PricingClient } from "./PricingClient";

export const metadata: Metadata = {
  title: `Pricing | ${BRAND.name}`,
  description: `Upgrade to ${BRAND.name} Pro for unlimited idea suggestions, video analysis, subscriber insights, and more. Only $12/month.`,
  openGraph: {
    title: `Pricing | ${BRAND.name}`,
    description: `Upgrade to ${BRAND.name} Pro for unlimited idea suggestions, video analysis, subscriber insights, and more.`,
  },
};

export default async function PricingPage() {
  const user = await getCurrentUserWithSubscription();
  const isAuthenticated = Boolean(user);
  const isPro = user ? hasActiveSubscription(user.subscription) : false;

  return (
    <div className={s.page}>
      <div className={s.container}>
        <h1 className={s.heading}>Simple, transparent pricing</h1>
        <p className={s.subheading}>
          Everything you need to grow your YouTube channel, backed by data.
        </p>
        <PricingClient isAuthenticated={isAuthenticated} isPro={isPro} />
      </div>
    </div>
  );
}

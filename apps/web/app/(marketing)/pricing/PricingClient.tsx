"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { UpgradeCard } from "@/components/pricing/UpgradeCard";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

type PricingClientProps = {
  isAuthenticated: boolean;
  isPro: boolean;
};

async function startCheckout(): Promise<string> {
  const res = await fetch("/api/integrations/stripe/checkout", {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok || !data.url) {
    throw new Error(
      data.message ?? "Failed to start checkout. Please try again.",
    );
  }
  return data.url;
}

export function PricingClient({ isAuthenticated, isPro }: PricingClientProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sp = useSearchParams();
  const autoCheckoutFired = useRef(false);

  const handlePurchase = useCallback(async () => {
    setError(null);

    if (!isAuthenticated) {
      window.location.href = "/auth/login?callbackUrl=/pricing?checkout=auto";
      return;
    }

    setLoading(true);
    try {
      const url = await startCheckout();
      window.location.href = url;
    } catch (error_) {
      setError(
        error_ instanceof Error
          ? error_.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Auto-initiate checkout after sign-in redirect
  useEffect(() => {
    if (
      sp.get("checkout") === "auto" &&
      isAuthenticated &&
      !isPro &&
      !autoCheckoutFired.current
    ) {
      autoCheckoutFired.current = true;
      void handlePurchase();
    }
  }, [sp, isAuthenticated, isPro, handlePurchase]);

  return (
    <>
      {error && (
        <ErrorBanner
          message={error}
          onRetry={handlePurchase}
          dismissible
          onDismiss={() => setError(null)}
        />
      )}
      <UpgradeCard
        onPurchase={handlePurchase}
        isPro={isPro}
        loading={loading}
      />
    </>
  );
}

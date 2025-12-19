"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import s from "./HeroCTAs.module.css";

type AuthState = "loading" | "signed-out" | "signed-in-free" | "signed-in-subscribed";

/**
 * HeroCTAs - Auth-aware call-to-action buttons for the landing page
 * Shows different CTAs based on user's authentication and subscription status
 */
export function HeroCTAs() {
  const [authState, setAuthState] = useState<AuthState>("loading");

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) {
          setAuthState("signed-out");
          return;
        }
        
        const data = await res.json();
        const isSubscribed = data?.subscription?.isActive ?? false;
        setAuthState(isSubscribed ? "signed-in-subscribed" : "signed-in-free");
      } catch {
        setAuthState("signed-out");
      }
    }
    
    checkAuth();
  }, []);

  // Loading skeleton - show placeholder while checking auth
  if (authState === "loading") {
    return (
      <div className={s.ctas}>
        <div className={s.skeleton} />
        <div className={s.skeletonSecondary} />
      </div>
    );
  }

  // Signed out - show trial + sign in
  if (authState === "signed-out") {
    return (
      <div className={s.ctas}>
        <Link href="/auth/signup" className={s.btnPrimary}>
          Start Free Trial
        </Link>
        <Link href="/auth/login" className={s.btnSecondary}>
          Sign In
        </Link>
      </div>
    );
  }

  // Signed in but not subscribed - show dashboard + subscribe
  if (authState === "signed-in-free") {
    return (
      <div className={s.ctas}>
        <Link href="/dashboard" className={s.btnPrimary}>
          Go to Dashboard
        </Link>
        <Link href="/api/integrations/stripe/checkout" className={s.btnSecondary}>
          Subscribe
        </Link>
      </div>
    );
  }

  // Signed in and subscribed - show dashboard + ideas
  return (
    <div className={s.ctas}>
      <Link href="/dashboard" className={s.btnPrimary}>
        Go to Dashboard
      </Link>
      <Link href="/ideas" className={s.btnSecondary}>
        Open Ideas
      </Link>
    </div>
  );
}


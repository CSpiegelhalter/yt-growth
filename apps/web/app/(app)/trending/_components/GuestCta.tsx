"use client";

import { useState } from "react";

import { AuthModal } from "@/components/auth";

import s from "../style.module.css";

export function GuestCta() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <section className={s.guestCta}>
        <h3 className={s.guestCtaTitle}>Want personalized opportunities?</h3>
        <p className={s.guestCtaDesc}>
          Connect your channel to see trending topics and gaps specific to your
          niche. Free forever.
        </p>
        <button
          type="button"
          className={s.guestCtaBtn}
          onClick={() => setShowAuth(true)}
        >
          Sign up free
        </button>
      </section>

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => setShowAuth(false)}
        title="Sign up for free"
        description="Create a free account to unlock personalized opportunity gaps, competitor overlap, and video ideas."
      />
    </>
  );
}

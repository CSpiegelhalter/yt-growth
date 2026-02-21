"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import s from "../login/style.module.css";

/**
 * ForgotPasswordForm - Client component for requesting password reset
 */
export default function ForgotPasswordForm() {
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "").trim();

    if (!email) {
      setErr("Please enter your email address");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setErr("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const footer = (
    <>
      Remember your password?{" "}
      <Link href="/auth/login" className={s.link}>
        Sign in
      </Link>
    </>
  );

  if (success) {
    return (
      <AuthPageShell
        styles={s}
        title="Check your email"
        subtitle={<>If an account exists with that email, we&apos;ve sent a password reset link. Please check your inbox and spam folder.</>}
        successMessage="Password reset email sent successfully."
        footer={footer}
      >
        {null}
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      styles={s}
      title="Forgot your password?"
      subtitle={<>Enter your email address and we&apos;ll send you a link to reset your password.</>}
      error={err}
      footer={footer}
    >
      <form onSubmit={onSubmit} className={s.form}>
        <div className={s.field}>
          <label htmlFor="email" className={s.label}>
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={s.input}
            aria-describedby={err ? "error-message" : undefined}
          />
        </div>

        <button type="submit" disabled={loading} className={s.submitBtn}>
          {loading ? (
            <>
              <span className={s.spinner} aria-hidden="true" />
              Sending...
            </>
          ) : (
            "Send reset link"
          )}
        </button>
      </form>
    </AuthPageShell>
  );
}

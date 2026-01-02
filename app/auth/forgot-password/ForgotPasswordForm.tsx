"use client";

import { useState } from "react";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
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

      // Always show success to prevent email enumeration
      setSuccess(true);
    } catch {
      setErr("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className={s.page}>
        <div className={s.card}>
          {/* Branding */}
          <div className={s.branding}>
            <h1 className={s.logo}>{BRAND.name}</h1>
            <p className={s.tagline}>{BRAND.tagline}</p>
          </div>

          {/* Success State */}
          <div className={s.header}>
            <h2 className={s.title}>Check your email</h2>
            <p className={s.subtitle}>
              If an account exists with that email, we&apos;ve sent a password reset
              link. Please check your inbox and spam folder.
            </p>
          </div>

          <div className={s.successAlert}>
            Password reset email sent successfully.
          </div>

          {/* Footer */}
          <p className={s.footer}>
            Remember your password?{" "}
            <Link href="/auth/login" className={s.link}>
              Sign in
            </Link>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={s.page}>
      <div className={s.card}>
        {/* Branding */}
        <div className={s.branding}>
          <h1 className={s.logo}>{BRAND.name}</h1>
          <p className={s.tagline}>{BRAND.tagline}</p>
        </div>

        {/* Header */}
        <div className={s.header}>
          <h2 className={s.title}>Forgot your password?</h2>
          <p className={s.subtitle}>
            Enter your email address and we&apos;ll send you a link to reset your
            password.
          </p>
        </div>

        {/* Error message */}
        {err && (
          <div className={s.errorAlert} role="alert">
            {err}
          </div>
        )}

        {/* Form */}
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

        {/* Footer */}
        <p className={s.footer}>
          Remember your password?{" "}
          <Link href="/auth/login" className={s.link}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

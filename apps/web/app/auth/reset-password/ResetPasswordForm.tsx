"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import s from "../login/style.module.css";

/**
 * ResetPasswordForm - Client component for setting a new password
 */
export default function ResetPasswordForm() {
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const sp = useSearchParams();
  const token = sp.get("token");

  useEffect(() => {
    // Verify token exists
    if (!token) {
      setTokenValid(false);
    } else {
      setTokenValid(true);
    }
  }, [token]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");

    if (!password) {
      setErr("Please enter a new password");
      setLoading(false);
      return;
    }

    if (password.length < 12) {
      setErr("Password must be at least 12 characters");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErr("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
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

  // Invalid or missing token
  if (tokenValid === false) {
    return (
      <main className={s.page}>
        <div className={s.card}>
          <div className={s.branding}>
            <h1 className={s.logo}>{BRAND.name}</h1>
            <p className={s.tagline}>{BRAND.tagline}</p>
          </div>

          <div className={s.header}>
            <h2 className={s.title}>Invalid reset link</h2>
            <p className={s.subtitle}>
              This password reset link is invalid or has expired. Please request
              a new one.
            </p>
          </div>

          <div className={s.errorAlert}>
            The reset link is missing or invalid.
          </div>

          <Link href="/auth/forgot-password" className={s.submitBtn} style={{ textDecoration: "none", textAlign: "center" }}>
            Request new link
          </Link>

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

  // Success state
  if (success) {
    return (
      <main className={s.page}>
        <div className={s.card}>
          <div className={s.branding}>
            <h1 className={s.logo}>{BRAND.name}</h1>
            <p className={s.tagline}>{BRAND.tagline}</p>
          </div>

          <div className={s.header}>
            <h2 className={s.title}>Password reset successful</h2>
            <p className={s.subtitle}>
              Your password has been updated. You can now sign in with your new
              password.
            </p>
          </div>

          <div className={s.successAlert}>
            Your password has been reset successfully.
          </div>

          <Link href="/auth/login" className={s.submitBtn} style={{ textDecoration: "none", textAlign: "center" }}>
            Sign in
          </Link>
        </div>
      </main>
    );
  }

  // Loading token validation
  if (tokenValid === null) {
    return (
      <main className={s.page}>
        <div className={s.card}>
          <div className={s.branding}>
            <h1 className={s.logo}>{BRAND.name}</h1>
            <p className={s.tagline}>{BRAND.tagline}</p>
          </div>
          <div className={s.header}>
            <h2 className={s.title}>Loading...</h2>
          </div>
        </div>
      </main>
    );
  }

  // Reset form
  return (
    <main className={s.page}>
      <div className={s.card}>
        <div className={s.branding}>
          <h1 className={s.logo}>{BRAND.name}</h1>
          <p className={s.tagline}>{BRAND.tagline}</p>
        </div>

        <div className={s.header}>
          <h2 className={s.title}>Reset your password</h2>
          <p className={s.subtitle}>Enter your new password below.</p>
        </div>

        {err && (
          <div className={s.errorAlert} role="alert">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className={s.form}>
          <div className={s.field}>
            <label htmlFor="password" className={s.label}>
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Enter new password (min 12 characters)"
              className={s.input}
              minLength={12}
            />
          </div>

          <div className={s.field}>
            <label htmlFor="confirmPassword" className={s.label}>
              Confirm password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm new password"
              className={s.input}
            />
          </div>

          <button type="submit" disabled={loading} className={s.submitBtn}>
            {loading ? (
              <>
                <span className={s.spinner} aria-hidden="true" />
                Resetting...
              </>
            ) : (
              "Reset password"
            )}
          </button>
        </form>

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

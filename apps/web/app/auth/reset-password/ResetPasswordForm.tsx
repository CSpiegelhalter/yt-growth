"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
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

  const signInFooter = (
    <>
      Remember your password?{" "}
      <Link href="/auth/login" className={s.link}>
        Sign in
      </Link>
    </>
  );

  if (tokenValid === false) {
    return (
      <AuthPageShell
        styles={s}
        title="Invalid reset link"
        subtitle="This password reset link is invalid or has expired. Please request a new one."
        error="The reset link is missing or invalid."
        footer={signInFooter}
      >
        <Link href="/auth/forgot-password" className={s.submitBtn} style={{ textDecoration: "none", textAlign: "center" }}>
          Request new link
        </Link>
      </AuthPageShell>
    );
  }

  if (success) {
    return (
      <AuthPageShell
        styles={s}
        title="Password reset successful"
        subtitle="Your password has been updated. You can now sign in with your new password."
        successMessage="Your password has been reset successfully."
      >
        <Link href="/auth/login" className={s.submitBtn} style={{ textDecoration: "none", textAlign: "center" }}>
          Sign in
        </Link>
      </AuthPageShell>
    );
  }

  if (tokenValid === null) {
    return (
      <AuthPageShell styles={s} title="Loading...">
        {null}
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      styles={s}
      title="Reset your password"
      subtitle="Enter your new password below."
      error={err}
      footer={signInFooter}
    >
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
    </AuthPageShell>
  );
}

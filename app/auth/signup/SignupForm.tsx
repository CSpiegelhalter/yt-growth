"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import s from "./style.module.css";

/**
 * SignupForm - Client component with interactive signup functionality
 */
export default function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    // Validation
    if (!name) {
      setErr("Please enter your name");
      setLoading(false);
      return;
    }

    if (!email) {
      setErr("Please enter your email address");
      setLoading(false);
      return;
    }

    if (!password) {
      setErr("Please create a password");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setErr("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        router.push("/auth/login?signup=1");
      } else {
        const j = await res.json().catch(() => ({}));
        setErr(j.error || "Something went wrong. Please try again.");
      }
    } catch {
      setErr("Network error. Please check your connection and try again.");
    }

    setLoading(false);
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
          <h2 className={s.title}>Create your account</h2>
          <p className={s.subtitle}>
            Start making smarter content decisions today
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
            <label htmlFor="name" className={s.label}>
              Full name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Jane Creator"
              className={s.input}
            />
          </div>

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
            />
          </div>

          <div className={s.field}>
            <label htmlFor="password" className={s.label}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              className={s.input}
            />
            <span className={s.hint}>Must be at least 8 characters</span>
          </div>

          <button type="submit" disabled={loading} className={s.submitBtn}>
            {loading ? (
              <>
                <span className={s.spinner} aria-hidden="true" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        {/* Terms */}
        <p className={s.terms}>
          By creating an account, you agree to our{" "}
          <a href="/terms" className={s.link}>
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className={s.link}>
            Privacy Policy
          </a>
          .
        </p>

        {/* Footer */}
        <p className={s.footer}>
          Already have an account?{" "}
          <Link href="/auth/login" className={s.link}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}


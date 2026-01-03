"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import s from "./style.module.css";

/**
 * SignupForm - Client component with interactive signup functionality
 */
export default function SignupForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Show verification login button when:
  // 1. In development mode (for local testing), OR
  // 2. NEXT_PUBLIC_ENABLE_OAUTH_VERIFY_BUTTON env var is "true", OR
  // 3. URL has ?verify=1 query param (for ad-hoc verification demos)
  const showVerifyButton =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ENABLE_OAUTH_VERIFY_BUTTON === "true" ||
    sp.get("verify") === "1";

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

    if (password.length < 12) {
      setErr("Password must be at least 12 characters");
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
        // Auto sign-in with the credentials we just used
        const signInRes = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (signInRes?.ok) {
          // Full page navigation to ensure server session is recognized
          window.location.href = "/dashboard";
        } else {
          // Fallback to login page if auto sign-in fails
          router.push("/auth/login?signup=1");
        }
      } else {
        const j = await res.json().catch(() => ({}));
        const message = j.error?.message || j.error || "Something went wrong. Please try again.";
        
        // Provide a more helpful message for duplicate email
        if (res.status === 409 || message === "Email already registered") {
          setErr("This email is already registered. Please sign in instead.");
        } else {
          setErr(message);
        }
        setLoading(false);
      }
    } catch {
      setErr("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  /**
   * Verification Login - forces Google consent screen for demo recordings.
   * Used when recording for Google OAuth verification process.
   */
  function handleVerificationLogin() {
    setLoading(true);
    // Full page navigation to hit the API route (not client-side routing)
    window.location.href = "/auth/verify?callbackUrl=%2Fdashboard";
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
              placeholder="Minimum 12 characters"
              minLength={12}
              className={s.input}
            />
            <span className={s.hint}>Must be at least 12 characters</span>
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

        {/* Divider */}
        <div className={s.divider}>
          <span className={s.dividerText}>or</span>
        </div>

        {/* Google Sign Up */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={loading}
          className={s.googleBtn}
        >
          <svg className={s.googleIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign up with Google
        </button>

        {/* Verification Login - only shown when enabled for demo recordings */}
        {showVerifyButton && (
          <div className={s.verifySection}>
            <button
              type="button"
              onClick={handleVerificationLogin}
              disabled={loading}
              className={s.verifyBtn}
            >
              <svg
                className={s.verifyIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Verification Login
            </button>
            <p className={s.verifyHint}>
              Use for Google verification recordings. Forces consent screen.
            </p>
          </div>
        )}

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


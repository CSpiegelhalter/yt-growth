"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { VerifyLoginSection } from "@/components/auth/VerifyLoginSection";
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
        <GoogleSignInButton
          onClick={handleGoogleSignUp}
          disabled={loading}
          className={s.googleBtn}
          iconClassName={s.googleIcon}
          label="Sign up with Google"
        />

        <VerifyLoginSection
          visible={showVerifyButton}
          disabled={loading}
          onClick={handleVerificationLogin}
          sectionClassName={s.verifySection}
          buttonClassName={s.verifyBtn}
          iconClassName={s.verifyIcon}
          hintClassName={s.verifyHint}
        />

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


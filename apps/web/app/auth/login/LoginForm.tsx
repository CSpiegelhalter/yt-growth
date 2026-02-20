"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { VerifyLoginSection } from "@/components/auth/VerifyLoginSection";
import s from "./style.module.css";

/**
 * LoginForm - Client component with interactive login functionality
 */
export default function LoginForm() {
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const sp = useSearchParams();

  const showSignupSuccess = sp.get("signup") === "1";

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
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    if (!email) {
      setErr("Please enter your email address");
      setLoading(false);
      return;
    }

    if (!password) {
      setErr("Please enter your password");
      setLoading(false);
      return;
    }

    const callbackUrl = sp.get("callbackUrl") || "/dashboard";
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (res?.ok) {
      // Use full page navigation to ensure server session is recognized
      // router.push() uses client-side navigation which doesn't re-validate the session
      window.location.href = callbackUrl;
    } else {
      setLoading(false);
      setErr("Invalid email or password. Please try again.");
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  /**
   * Verification Login - forces Google consent screen for demo recordings.
   * Used when recording for Google OAuth verification process.
   */
  function handleVerificationLogin() {
    setLoading(true);
    const callbackUrl = sp.get("callbackUrl") || "/dashboard";
    // Full page navigation to hit the API route (not client-side routing)
    window.location.href = `/auth/verify?callbackUrl=${encodeURIComponent(
      callbackUrl
    )}`;
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
          <h2 className={s.title}>Welcome back</h2>
          <p className={s.subtitle}>Sign in to continue to your dashboard</p>
        </div>

        {/* Success message */}
        {showSignupSuccess && (
          <div className={s.successAlert}>
            Account created successfully. Please sign in.
          </div>
        )}

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

          <div className={s.field}>
            <div className={s.labelRow}>
              <label htmlFor="password" className={s.label}>
                Password
              </label>
              <Link href="/auth/forgot-password" className={s.forgotLink}>
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              className={s.input}
            />
          </div>

          <button type="submit" disabled={loading} className={s.submitBtn}>
            {loading ? (
              <>
                <span className={s.spinner} aria-hidden="true" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className={s.divider}>
          <span className={s.dividerText}>or</span>
        </div>

        {/* Google Sign In */}
        <GoogleSignInButton
          onClick={handleGoogleSignIn}
          disabled={loading}
          className={s.googleBtn}
          iconClassName={s.googleIcon}
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

        {/* Footer */}
        <p className={s.footer}>
          Don't have an account?{" "}
          <Link href="/auth/signup" className={s.link}>
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}

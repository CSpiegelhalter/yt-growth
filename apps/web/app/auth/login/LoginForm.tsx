"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { VerifyLoginSection } from "@/components/auth/VerifyLoginSection";
import { shouldShowVerifyButton, validateEmailPassword } from "@/components/auth/auth-helpers";
import s from "./style.module.css";

/**
 * LoginForm - Client component with interactive login functionality
 */
export default function LoginForm() {
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const sp = useSearchParams();

  const showSignupSuccess = sp.get("signup") === "1";
  const showVerifyButton = shouldShowVerifyButton(sp);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const { email, password, error } = validateEmailPassword(new FormData(e.currentTarget));
    if (error) {
      setErr(error);
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

  function handleVerificationLogin() {
    setLoading(true);
    const callbackUrl = sp.get("callbackUrl") || "/dashboard";
    window.location.href = `/auth/verify?callbackUrl=${encodeURIComponent(
      callbackUrl
    )}`;
  }

  return (
    <AuthPageShell
      styles={s}
      title="Welcome back"
      subtitle="Sign in to continue to your dashboard"
      error={err}
      successMessage={showSignupSuccess ? "Account created successfully. Please sign in." : undefined}
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className={s.link}>
            Create one
          </Link>
        </>
      }
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

      <div className={s.divider}>
        <span className={s.dividerText}>or</span>
      </div>

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
    </AuthPageShell>
  );
}

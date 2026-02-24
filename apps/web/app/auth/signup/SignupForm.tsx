"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { shouldShowVerifyButton } from "@/components/auth/auth-helpers";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { VerifyLoginSection } from "@/components/auth/VerifyLoginSection";

import s from "./style.module.css";

type SignupFields = { name: string; email: string; password: string };

function extractFormFields(formData: FormData): SignupFields {
  return {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    password: String(formData.get("password") || ""),
  };
}

function validateSignupFields(fields: SignupFields): string | null {
  if (!fields.name) {return "Please enter your name";}
  if (!fields.email) {return "Please enter your email address";}
  if (!fields.password) {return "Please create a password";}
  if (fields.password.length < 12) {return "Password must be at least 12 characters";}
  return null;
}

function parseSignupError(status: number, body: Record<string, unknown>): string {
  const message = (body.error as { message?: string })?.message
    || (body.error as string)
    || "Something went wrong. Please try again.";
  if (status === 409 || message === "Email already registered") {
    return "This email is already registered. Please sign in instead.";
  }
  return message;
}

export default function SignupForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const showVerifyButton = shouldShowVerifyButton(sp);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const fields = extractFormFields(new FormData(e.currentTarget));
    const validationError = validateSignupFields(fields);
    if (validationError) {
      setErr(validationError);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(fields),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const signInRes = await signIn("credentials", {
          email: fields.email,
          password: fields.password,
          redirect: false,
        });
        if (signInRes?.ok) {
          window.location.href = "/videos";
        } else {
          router.push("/auth/login?signup=1");
        }
      } else {
        const j = await res.json().catch(() => ({}));
        setErr(parseSignupError(res.status, j));
        setLoading(false);
      }
    } catch {
      setErr("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/videos" });
  }

  function handleVerificationLogin() {
    setLoading(true);
    window.location.href = "/auth/verify?callbackUrl=%2Fdashboard";
  }

  return (
    <AuthPageShell
      styles={s}
      title="Create your account"
      subtitle="Start making smarter content decisions today"
      error={err}
      footer={
        <>
          Already have an account?{" "}
          <Link href="/auth/login" className={s.link}>
            Sign in
          </Link>
        </>
      }
    >
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

      <div className={s.divider}>
        <span className={s.dividerText}>or</span>
      </div>

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
    </AuthPageShell>
  );
}

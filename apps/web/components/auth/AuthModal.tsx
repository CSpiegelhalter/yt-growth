"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import s from "./AuthModal.module.css";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
};

/**
 * AuthModal - Modal for auth-on-action pattern
 * 
 * Used when a page is public but an action requires authentication.
 * Shows sign-in options without navigating away from the current page.
 */
export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  title = "Sign in to continue",
  description = "Create a free account or sign in to access this feature.",
}: AuthModalProps) {
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Save previous focus and set focus to modal
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Delay focus to allow modal animation
      setTimeout(() => {
        modalRef.current?.focus();
      }, 50);
    } else {
      // Return focus on close
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true);
    setErr(null);
    
    try {
      // Get current URL to return to after auth
      const callbackUrl = window.location.href;
      
      const result = await signIn("google", {
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setErr("Sign in failed. Please try again.");
        setLoading(false);
      } else if (result?.url) {
        // Redirect to Google OAuth - will come back to callbackUrl
        window.location.href = result.url;
      }
    } catch {
      setErr("Something went wrong. Please try again.");
      setLoading(false);
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
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

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        // Success - trigger callback and close modal
        onSuccess();
        onClose();
      } else {
        setErr("Invalid email or password.");
        setLoading(false);
      }
    } catch {
      setErr("Something went wrong. Please try again.");
      setLoading(false);
    }
  }, [onSuccess, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className={s.overlay} 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div 
        ref={modalRef}
        className={s.modal} 
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <button
          type="button"
          className={s.closeBtn}
          onClick={onClose}
          aria-label="Close"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className={s.header}>
          <div className={s.logo}>{BRAND.name}</div>
          <h2 id="auth-modal-title" className={s.title}>{title}</h2>
          <p className={s.description}>{description}</p>
        </div>

        {/* Error */}
        {err && (
          <div className={s.error} role="alert">
            {err}
          </div>
        )}

        {/* Google Sign In */}
        <GoogleSignInButton
          onClick={handleGoogleSignIn}
          disabled={loading}
          className={s.googleBtn}
          iconClassName={s.googleIcon}
          label={loading ? "Signing in..." : "Continue with Google"}
        />

        {/* Divider */}
        <div className={s.divider}>
          <span className={s.dividerText}>or</span>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className={s.form}>
          <div className={s.field}>
            <label htmlFor="auth-email" className={s.label}>
              Email
            </label>
            <input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={s.input}
              disabled={loading}
            />
          </div>

          <div className={s.field}>
            <label htmlFor="auth-password" className={s.label}>
              Password
            </label>
            <input
              id="auth-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              className={s.input}
              disabled={loading}
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

        {/* Footer */}
        <p className={s.footer}>
          Don't have an account?{" "}
          <Link href="/auth/signup" className={s.link} onClick={onClose}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

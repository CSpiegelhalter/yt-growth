"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
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
        <button
          type="button"
          onClick={handleGoogleSignIn}
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
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

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

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import s from "./style.module.css";

type Props = {
  userEmail?: string | null;
};

type FormErrors = {
  email?: string;
  message?: string;
};

export default function ContactClient({ userEmail }: Props) {
  const [email, setEmail] = useState(userEmail || "");
  const [subject, setSubject] = useState("general");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Pre-fill email if user is signed in
  useEffect(() => {
    if (userEmail && !email) {
      setEmail(userEmail);
    }
  }, [userEmail, email]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    // Message validation
    if (!message.trim()) {
      newErrors.message = "Message is required";
    } else if (message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    } else if (message.trim().length > 5000) {
      newErrors.message = "Message must be less than 5000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          subject,
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Contact form error:", err);
      setServerError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Success state
  if (submitted) {
    return (
      <div className={s.container}>
        <div className={s.inner}>
          <div className={s.successCard}>
            <div className={s.successIcon}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h1 className={s.successTitle}>Message Sent!</h1>
            <p className={s.successText}>
              Thanks for reaching out. I&apos;ll get back to you as soon as possible,
              usually within 24-48 hours.
            </p>
            <Link href="/dashboard" className={s.successBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={s.container}>
      <div className={s.inner}>
        {/* Header */}
        <header className={s.header}>
          <div className={s.iconWrap}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className={s.title}>Get in Touch</h1>
          <p className={s.subtitle}>
            Have a question, feedback, or running into an issue? 
            I&apos;d love to hear from you.
          </p>
        </header>

        {/* Form Card */}
        <div className={s.formCard}>
          {/* Server Error */}
          {serverError && (
            <div className={s.errorAlert}>
              <div className={s.errorAlertIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </div>
              <p className={s.errorAlertText}>{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className={s.fieldGroup}>
              <label htmlFor="email" className={s.label}>
                Your Email <span className={s.required}>*</span>
              </label>
              <input
                type="email"
                id="email"
                className={`${s.input} ${errors.email ? s.inputError : ""}`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                autoComplete="email"
              />
              {errors.email && (
                <p className={s.fieldError}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Subject */}
            <div className={s.fieldGroup}>
              <label htmlFor="subject" className={s.label}>
                What&apos;s this about?
              </label>
              <select
                id="subject"
                className={s.select}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="general">General Question</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="billing">Billing / Subscription</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Message */}
            <div className={s.fieldGroup}>
              <label htmlFor="message" className={s.label}>
                Message <span className={s.required}>*</span>
              </label>
              <textarea
                id="message"
                className={`${s.textarea} ${errors.message ? s.inputError : ""}`}
                placeholder="Tell me what's on your mind..."
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
                }}
                rows={6}
              />
              {errors.message ? (
                <p className={s.fieldError}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  {errors.message}
                </p>
              ) : (
                <p className={s.fieldHint}>
                  {message.length}/5000 characters
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className={s.submitBtn}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className={s.spinner} />
                  Sending...
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Links */}
        <div className={s.footerLinks}>
          <Link href="/dashboard" className={s.footerLink}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}


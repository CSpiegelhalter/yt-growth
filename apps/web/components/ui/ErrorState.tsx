"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./ErrorState.module.css";

type ApiErrorInfo = {
  message: string;
  code?: string;
  status?: number;
  requestId?: string;
  resetAt?: string; // For rate limiting
  details?: {
    used?: number;
    limit?: number;
    remaining?: number;
    upgrade?: boolean;
  };
};

type ErrorStateProps = {
  /** Error information from API */
  error?: ApiErrorInfo | null;
  /** Custom title override */
  title?: string;
  /** Custom description override */
  description?: string | ReactNode;
  /** Custom icon override */
  icon?: ReactNode;
  /** Retry callback (only rendered when actions is not provided) */
  onRetry?: () => void;
  /** Back link for navigation (only rendered when actions is not provided) */
  backLink?: { href: string; label: string };
  /** Custom action buttons — replaces all default action rendering when provided */
  actions?: ReactNode;
  /** Standalone requestId (falls back to error.requestId) */
  requestId?: string;
  /** Custom className to merge */
  className?: string;
};

const ErrorIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4M12 16h.01" />
  </svg>
);

const LimitIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M12 2v10l4 4M22 12A10 10 0 1112 2" />
  </svg>
);

const PermissionsIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

function formatResetTime(resetAt: string): string {
  try {
    const date = new Date(resetAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();

    if (diffMs <= 0) {return "soon";}
    if (diffMs < 60000) {return "less than a minute";}
    if (diffMs < 3600000) {
      const mins = Math.ceil(diffMs / 60000);
      return `${mins} minute${mins === 1 ? "" : "s"}`;
    }
    if (diffMs < 86400000) {
      const hours = Math.ceil(diffMs / 3600000);
      return `${hours} hour${hours === 1 ? "" : "s"}`;
    }
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "later";
  }
}

/**
 * ErrorState - Unified error display component
 *
 * Handles:
 * - Generic errors
 * - Rate limiting (429)
 * - Permission errors
 * - Limit reached states
 *
 * Shows requestId when available for debugging.
 */
export function ErrorState({
  error,
  title,
  description,
  icon,
  onRetry,
  backLink,
  actions,
  requestId,
  className = "",
}: ErrorStateProps) {
  const router = useRouter();

  const errorCode = error?.code?.toUpperCase() ?? "";
  const isRateLimited = error?.status === 429 || errorCode === "RATE_LIMITED";
  const isLimitReached = errorCode === "LIMIT_REACHED";
  const isPermissionError =
    errorCode === "UNAUTHORIZED" ||
    errorCode === "FORBIDDEN" ||
    errorCode === "YOUTUBE_PERMISSIONS";

  const computedTitle =
    title ??
    (isRateLimited
      ? "Too many requests"
      : isLimitReached
        ? "Daily limit reached"
        : isPermissionError
          ? "Permission required"
          : "Something went wrong");

  const computedDescription =
    description ??
    (isRateLimited
      ? `Please wait ${error?.resetAt ? formatResetTime(error.resetAt) : "a moment"} before trying again.`
      : isLimitReached
        ? `You've used ${error?.details?.used ?? 0} of ${error?.details?.limit ?? 0} analyses today. Upgrade for more.`
        : isPermissionError
          ? "You don't have permission to access this resource. Please sign in or reconnect your account."
          : error?.message ?? "An unexpected error occurred. Please try again.");

  const computedIcon =
    icon ??
    (isRateLimited || isLimitReached ? (
      <LimitIcon />
    ) : isPermissionError ? (
      <PermissionsIcon />
    ) : (
      <ErrorIcon />
    ));

  const resolvedRequestId = requestId ?? error?.requestId;

  return (
    <div className={`${styles.error} ${className}`.trim()}>
      <div className={styles.icon}>{computedIcon}</div>
      <h2 className={styles.title}>{computedTitle}</h2>
      <p className={styles.description}>{computedDescription}</p>

      {resolvedRequestId && (
        <p className={styles.requestId}>
          Request ID: <code>{resolvedRequestId}</code>
        </p>
      )}

      <div className={styles.actions}>
        {actions ? (
          actions
        ) : (
          <>
            {onRetry && (
              <button onClick={onRetry} className={styles.btnPrimary} type="button">
                Try Again
              </button>
            )}

            {isPermissionError && (
              <a href="/api/integrations/google/start" className={styles.btnPrimary}>
                Reconnect Account
              </a>
            )}

            {(isLimitReached || error?.details?.upgrade) && (
              <Link href="/api/integrations/stripe/checkout" className={styles.btnPrimary}>
                Upgrade to Pro
              </Link>
            )}

            {backLink ? (
              <Link href={backLink.href} className={styles.btnSecondary}>
                {backLink.label}
              </Link>
            ) : (
              <button
                onClick={() => router.back()}
                className={styles.btnSecondary}
                type="button"
              >
                Go Back
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}


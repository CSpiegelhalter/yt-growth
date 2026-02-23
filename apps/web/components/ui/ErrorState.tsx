"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

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
    if (diffMs < 60_000) {return "less than a minute";}
    if (diffMs < 3_600_000) {
      const mins = Math.ceil(diffMs / 60_000);
      return `${mins} minute${mins === 1 ? "" : "s"}`;
    }
    if (diffMs < 86_400_000) {
      const hours = Math.ceil(diffMs / 3_600_000);
      return `${hours} hour${hours === 1 ? "" : "s"}`;
    }
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "later";
  }
}

// ─── Category helpers ─────────────────────────────────────────

type ErrorCategory = "rate_limited" | "limit_reached" | "permission" | "generic";

function categorizeError(error?: ApiErrorInfo | null): ErrorCategory {
  const code = error?.code?.toUpperCase() ?? "";
  if (error?.status === 429 || code === "RATE_LIMITED") {return "rate_limited";}
  if (code === "LIMIT_REACHED") {return "limit_reached";}
  if (code === "UNAUTHORIZED" || code === "FORBIDDEN" || code === "YOUTUBE_PERMISSIONS") {
    return "permission";
  }
  return "generic";
}

const CATEGORY_TITLES: Record<ErrorCategory, string> = {
  rate_limited: "Too many requests",
  limit_reached: "Daily limit reached",
  permission: "Permission required",
  generic: "Something went wrong",
};

function getDefaultDescription(
  category: ErrorCategory,
  error?: ApiErrorInfo | null,
): string {
  if (category === "rate_limited") {
    return `Please wait ${error?.resetAt ? formatResetTime(error.resetAt) : "a moment"} before trying again.`;
  }
  if (category === "limit_reached") {
    return `You've used ${error?.details?.used ?? 0} of ${error?.details?.limit ?? 0} analyses today. Upgrade for more.`;
  }
  if (category === "permission") {
    return "You don't have permission to access this resource. Please sign in or reconnect your account.";
  }
  return error?.message ?? "An unexpected error occurred. Please try again.";
}

const CATEGORY_ICONS: Record<ErrorCategory, ReactNode> = {
  rate_limited: <LimitIcon />,
  limit_reached: <LimitIcon />,
  permission: <PermissionsIcon />,
  generic: <ErrorIcon />,
};

// ─── Default actions sub-component ────────────────────────────

function DefaultActions({
  category,
  error,
  onRetry,
  backLink,
}: {
  category: ErrorCategory;
  error?: ApiErrorInfo | null;
  onRetry?: () => void;
  backLink?: { href: string; label: string };
}) {
  const router = useRouter();

  return (
    <>
      {onRetry && (
        <button onClick={onRetry} className={styles.btnPrimary} type="button">
          Try Again
        </button>
      )}

      {category === "permission" && (
        <a href="/api/integrations/google/start" className={styles.btnPrimary}>
          Reconnect Account
        </a>
      )}

      {(category === "limit_reached" || error?.details?.upgrade) && (
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
  );
}

// ─── Main component ───────────────────────────────────────────

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
  const category = categorizeError(error);
  const computedTitle = title ?? CATEGORY_TITLES[category];
  const computedDescription = description ?? getDefaultDescription(category, error);
  const computedIcon = icon ?? CATEGORY_ICONS[category];
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
        {actions ?? (
          <DefaultActions
            category={category}
            error={error}
            onRetry={onRetry}
            backLink={backLink}
          />
        )}
      </div>
    </div>
  );
}

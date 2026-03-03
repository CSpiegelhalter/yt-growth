"use client";

import { useState } from 'react';

import styles from './ErrorBanner.module.css';

type ErrorBannerVariant = 'error' | 'warning' | 'info';

type ErrorBannerProps = {
  variant?: ErrorBannerVariant;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
};

/**
 * ErrorBanner -- Inline notification banner with left-accent border.
 *
 * Three variants:
 *   error   -- red accent, light red background
 *   warning -- blue accent, light blue background
 *   info    -- blue accent, light blue background
 *
 * Optional dismiss (X button) and retry (text link) actions.
 */
export function ErrorBanner({
  variant = 'error',
  message,
  dismissible = false,
  onDismiss,
  onRetry,
  className = '',
}: ErrorBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div
      className={`${styles.banner} ${styles[variant]} ${className}`.trim()}
      role="alert"
      style={dismissible ? { paddingRight: 36 } : undefined}
    >
      <span>{message}</span>

      {onRetry && (
        <button type="button" className={styles.retryBtn} onClick={onRetry}>
          Retry
        </button>
      )}

      {dismissible && (
        <button
          type="button"
          className={styles.dismissBtn}
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 4L4 12M4 4l8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

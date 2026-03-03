import type { ReactNode } from 'react';

import styles from './StatusBadge.module.css';

type StatusBadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'processing';
type StatusBadgeSize = 'sm' | 'md';

type StatusBadgeProps = {
  variant: StatusBadgeVariant;
  size?: StatusBadgeSize;
  dot?: boolean;
  pulse?: boolean;
  children: ReactNode;
  className?: string;
};

/**
 * StatusBadge — Pill-shaped status indicator.
 *
 * Five color variants with optional dot indicator and pulse animation.
 * Sizes: sm (24px) and md (32px, default).
 *
 * Usage:
 *   <StatusBadge variant="success">Active</StatusBadge>
 *   <StatusBadge variant="processing" dot pulse>Syncing</StatusBadge>
 */
export function StatusBadge({
  variant,
  size = 'md',
  dot = false,
  pulse = false,
  children,
  className = '',
}: StatusBadgeProps) {
  const dotClass = dot ? styles.dot : '';
  const pulseClass = dot && pulse ? styles.pulse : '';

  return (
    <span
      className={`${styles.badge} ${styles[variant]} ${styles[size]} ${dotClass} ${pulseClass} ${className}`.trim()}
    >
      {children}
    </span>
  );
}

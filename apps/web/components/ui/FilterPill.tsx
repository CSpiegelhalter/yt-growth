"use client";

import type { ReactNode } from 'react';

import styles from './FilterPill.module.css';

type FilterPillProps = {
  active?: boolean;
  dismissible?: boolean;
  onDismiss?: () => void;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
};

/**
 * FilterPill -- Interactive filter chip for toggling filters.
 *
 * Inactive: bordered pill with secondary text.
 * Active: primary-colored fill with white text.
 * Optional dismiss (X) button for removable filters.
 */
export function FilterPill({
  active = false,
  dismissible = false,
  onDismiss,
  onClick,
  children,
  className = '',
}: FilterPillProps) {
  const pillClass = `${styles.pill} ${active ? styles.active : ''} ${dismissible ? styles.dismissible : ''} ${className}`.trim();

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  }

  function handleDismiss(e: React.MouseEvent) {
    e.stopPropagation();
    onDismiss?.();
  }

  return (
    <span
      className={pillClass}
      role="option"
      aria-selected={active}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      {children}
      {dismissible && (
        <button
          type="button"
          className={styles.dismissBtn}
          onClick={handleDismiss}
          aria-label="Dismiss filter"
          tabIndex={-1}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4.5 4.5L11.5 11.5M11.5 4.5L4.5 11.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </span>
  );
}

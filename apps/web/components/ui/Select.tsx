"use client";

import type { ReactNode } from 'react';
import { forwardRef, useId } from 'react';

import styles from './Select.module.css';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  variant?: 'default' | 'error';
  label?: string;
  error?: string;
  helpText?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Select -- Native select with custom chevron.
 *
 * Surface background, 8px radius, 44px min-height.
 * Variants: default | error.
 * Supports label, help text, and error message.
 * Accessible: label linked via htmlFor, aria-invalid on error,
 * aria-describedby linking to help/error text.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      variant = 'default',
      label,
      error,
      helpText,
      children,
      className = '',
      id: externalId,
      ...rest
    },
    ref,
  ) {
    const generatedId = useId();
    const selectId = externalId ?? generatedId;
    const helpTextId = `${selectId}-help`;
    const errorTextId = `${selectId}-error`;

    const isError = variant === 'error' || !!error;

    const describedBy = [
      error ? errorTextId : null,
      helpText ? helpTextId : null,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className={`${styles.wrapper} ${className}`.trim()}>
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`${styles.select} ${isError ? styles.error : ''}`.trim()}
          aria-invalid={isError || undefined}
          aria-describedby={describedBy}
          {...rest}
        >
          {children}
        </select>
        {error && (
          <p id={errorTextId} className={styles.errorText} role="alert">
            {error}
          </p>
        )}
        {helpText && !error && (
          <p id={helpTextId} className={styles.helpText}>
            {helpText}
          </p>
        )}
      </div>
    );
  },
);

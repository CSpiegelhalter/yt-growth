"use client";

import type { ReactNode } from 'react';
import { forwardRef, useId } from 'react';

import styles from './Input.module.css';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  variant?: 'default' | 'error';
  label?: string;
  error?: string;
  helpText?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
};

function buildClassName(...parts: (string | false | undefined | null)[]): string {
  return parts.filter(Boolean).join(' ');
}

function buildDescribedBy(
  error: string | undefined,
  helpText: string | undefined,
  errorTextId: string,
  helpTextId: string,
): string | undefined {
  const parts: string[] = [];
  if (error) {
    parts.push(errorTextId);
  }
  if (helpText) {
    parts.push(helpTextId);
  }
  return parts.length > 0 ? parts.join(' ') : undefined;
}

/**
 * Input -- Form input component with label, help text, error, and icon slots.
 *
 * Variants: default, error.
 * Supports forwardRef for external ref access.
 * Accessible: label linked via htmlFor, aria-invalid on error,
 * aria-describedby linking to help/error text.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      variant = 'default',
      label,
      error,
      helpText,
      iconLeft,
      iconRight,
      className,
      id: externalId,
      ...rest
    },
    ref,
  ) {
    const generatedId = useId();
    const inputId = externalId ?? generatedId;
    const helpTextId = `${inputId}-help`;
    const errorTextId = `${inputId}-error`;

    const isError = variant === 'error' || Boolean(error);

    const describedBy = buildDescribedBy(error, helpText, errorTextId, helpTextId);

    const inputClassName = buildClassName(
      styles.input,
      isError && styles.error,
      Boolean(iconLeft) && styles.withIconLeft,
      Boolean(iconRight) && styles.withIconRight,
    );

    const bottomText = error
      ? <p id={errorTextId} className={styles.errorText} role="alert">{error}</p>
      : helpText
        ? <p id={helpTextId} className={styles.helpText}>{helpText}</p>
        : null;

    return (
      <div className={buildClassName(styles.wrapper, className)}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={styles.inputContainer}>
          {iconLeft && (
            <span className={styles.iconLeft} aria-hidden="true">
              {iconLeft}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={inputClassName}
            aria-invalid={isError || undefined}
            aria-describedby={describedBy}
            {...rest}
          />
          {iconRight && (
            <span className={styles.iconRight} aria-hidden="true">
              {iconRight}
            </span>
          )}
        </div>
        {bottomText}
      </div>
    );
  },
);

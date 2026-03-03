"use client";

import type { ReactNode } from 'react';

import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md';

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  as?: 'button' | 'a';
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
};

function buildClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  loading: boolean,
  disabled: boolean,
  className: string,
): string {
  const classes = [styles.button, styles[variant], styles[size]];
  if (loading) {
    classes.push(styles.loading);
  }
  if (disabled && !loading) {
    classes.push(styles.disabled);
  }
  if (className) {
    classes.push(className);
  }
  return classes.join(' ');
}

/**
 * Button -- Brand button component.
 *
 * Variants: primary (gradient), secondary (outlined), danger, ghost.
 * Sizes: sm (32px), md (44px).
 * Supports rendering as an anchor via as="a" + href.
 * Loading state shows a CSS spinner and disables interaction.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  as = 'button',
  href,
  onClick,
  children,
  className = '',
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const composedClassName = buildClassName(variant, size, loading, disabled, className);

  const content = (
    <>
      {loading && <span className={styles.spinner} aria-hidden="true" />}
      {children}
    </>
  );

  if (as === 'a') {
    return (
      <a
        className={composedClassName}
        href={href}
        role="button"
        aria-disabled={isDisabled || undefined}
        onClick={isDisabled ? (e) => e.preventDefault() : undefined}
        tabIndex={isDisabled ? -1 : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      className={composedClassName}
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      onClick={onClick}
    >
      {content}
    </button>
  );
}

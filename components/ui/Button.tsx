import { ReactNode, ButtonHTMLAttributes, forwardRef } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Show loading spinner */
  loading?: boolean;
  /** Make button full width */
  fullWidth?: boolean;
  /** Custom className to merge */
  className?: string;
};

/**
 * Button - Consistent button styling
 * 
 * Variants:
 * - primary: Main CTA, gradient background
 * - secondary: Outlined, less prominent
 * - ghost: Text only, subtle hover
 * - danger: Destructive actions
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { 
      children, 
      variant = 'secondary',
      size = 'md',
      loading = false,
      fullWidth = false,
      className = '',
      disabled,
      ...props 
    },
    ref
  ) {
    const variantClass = styles[variant];
    const sizeClass = styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`];
    
    return (
      <button
        ref={ref}
        className={`${styles.button} ${variantClass} ${sizeClass} ${fullWidth ? styles.fullWidth : ''} ${className}`.trim()}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <span className={styles.spinner} aria-hidden="true" />}
        <span className={loading ? styles.hiddenText : ''}>{children}</span>
      </button>
    );
  }
);


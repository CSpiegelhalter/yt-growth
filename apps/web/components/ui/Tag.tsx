import type { ReactNode } from 'react';
import styles from './Tag.module.css';

type TagVariant = 'positive' | 'negative' | 'neutral';

type TagProps = {
  variant?: TagVariant;
  children: ReactNode;
  className?: string;
};

/**
 * Tag — Brand pill component with gradient border.
 *
 * Height 40px, border-radius 20px, 2px gradient border,
 * transparent background. Three variants:
 *   positive  → Hot Rose → Cool Sky gradient
 *   negative  → Hot Rose → Imperial Blue gradient
 *   neutral   → Cool Sky → Stormy Teal gradient
 */
export function Tag({ variant = 'neutral', children, className = '' }: TagProps) {
  return (
    <span className={`${styles.tag} ${styles[variant]} ${className}`.trim()}>
      {children}
    </span>
  );
}

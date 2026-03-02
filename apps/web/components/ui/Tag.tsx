import type { ReactNode } from 'react';

import styles from './Tag.module.css';

type TagVariant = 'positive' | 'negative' | 'neutral';
type TagSize = 'default' | 'sm';
type TagIntent = 'pass' | 'fail';

type TagProps = {
  variant?: TagVariant;
  size?: TagSize;
  intent?: TagIntent;
  multiLine?: boolean;
  title?: string;
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
 *
 * Optional size="sm" for compact 28px pills.
 * Optional intent="pass"|"fail" for solid fill instead of gradient border.
 */
export function Tag({ variant = 'neutral', size = 'default', intent, multiLine, title, children, className = '' }: TagProps) {
  const sizeClass = size === 'sm' ? styles.sm : '';
  const intentClass = intent === 'pass' ? styles.intentPass : intent === 'fail' ? styles.intentFail : '';
  const multiLineClass = multiLine ? styles.tagMultiLine : '';

  return (
    <span className={`${styles.tag} ${styles[variant]} ${sizeClass} ${intentClass} ${multiLineClass} ${className}`.trim()} title={title}>
      {children}
    </span>
  );
}

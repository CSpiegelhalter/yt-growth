import type { ReactNode } from 'react';
import styles from './PageHeader.module.css';

type PageHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  /** Optional action button area */
  action?: ReactNode;
  /** Custom className to merge */
  className?: string;
};

/**
 * PageHeader - Standardized page header
 * 
 * Provides:
 * - Consistent title styling
 * - Optional subtitle
 * - Optional action area (right-aligned on desktop)
 */
export function PageHeader({ 
  title, 
  subtitle, 
  action,
  className = '' 
}: PageHeaderProps) {
  return (
    <header className={`${styles.header} ${className}`.trim()}>
      <div className={styles.content}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </header>
  );
}


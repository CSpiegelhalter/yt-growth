import type { ReactNode } from 'react';
import styles from './PageContainer.module.css';

type PageContainerProps = {
  children: ReactNode;
  /** Narrow max-width for article/detail pages */
  narrow?: boolean;
  /** Custom className to merge */
  className?: string;
};

/**
 * PageContainer - Consistent page wrapper
 * 
 * Provides:
 * - Max-width constraint
 * - Responsive padding
 * - Standard background
 */
export function PageContainer({ 
  children, 
  narrow = false,
  className = '' 
}: PageContainerProps) {
  return (
    <main 
      className={`${styles.page} ${narrow ? styles.narrow : ''} ${className}`.trim()}
    >
      {children}
    </main>
  );
}


import { ReactNode } from 'react';
import styles from './SectionCard.module.css';

type SectionCardProps = {
  children: ReactNode;
  /** Padding size */
  padding?: 'sm' | 'md' | 'lg';
  /** Custom className to merge */
  className?: string;
  /** Whether card should have hover state */
  hoverable?: boolean;
  /** HTML element to render as */
  as?: 'div' | 'section' | 'article';
};

/**
 * SectionCard - Consistent card styling
 * 
 * Provides:
 * - White background
 * - Border and shadow
 * - Responsive padding
 * - Optional hover state
 */
export function SectionCard({ 
  children, 
  padding = 'md',
  className = '',
  hoverable = false,
  as: Component = 'div'
}: SectionCardProps) {
  const paddingClass = styles[`padding${padding.charAt(0).toUpperCase() + padding.slice(1)}`];
  
  return (
    <Component 
      className={`${styles.card} ${paddingClass} ${hoverable ? styles.hoverable : ''} ${className}`.trim()}
    >
      {children}
    </Component>
  );
}


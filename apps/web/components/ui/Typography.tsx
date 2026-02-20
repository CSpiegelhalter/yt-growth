import { ReactNode, ElementType } from 'react';

type TypographyProps = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
};

/**
 * H1 — Big Header (Fustat 600 / 32px / line-height 1.0)
 */
export function H1({ children, className = '', as: Component = 'h1' }: TypographyProps) {
  return <Component className={`text-h1 ${className}`.trim()}>{children}</Component>;
}

/**
 * Subtitle — (Fustat 700 / 22px / line-height 1.0)
 */
export function Subtitle({ children, className = '', as: Component = 'h2' }: TypographyProps) {
  return <Component className={`text-subtitle ${className}`.trim()}>{children}</Component>;
}

/**
 * Text — Primary body text (Fustat 400 / 18px / line-height 1.0)
 */
export function Text({ children, className = '', as: Component = 'p' }: TypographyProps) {
  return <Component className={`text-body ${className}`.trim()}>{children}</Component>;
}

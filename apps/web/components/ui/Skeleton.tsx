import styles from "./Skeleton.module.css";

type SkeletonProps = {
  /** Skeleton variant */
  variant?: "text" | "thumbnail" | "card" | "circle" | "rect";
  /** Width (CSS value) */
  width?: string;
  /** Height (CSS value) */
  height?: string;
  /** Custom className to merge */
  className?: string;
};

/**
 * Skeleton - Loading placeholders
 *
 * Provides:
 * - Animated shimmer effect
 * - Multiple variants for different content types
 */
export function Skeleton({
  variant = "rect",
  width,
  height,
  className = "",
}: SkeletonProps) {
  const variantClass = styles[variant] || "";

  return (
    <div
      className={`${styles.skeleton} ${variantClass} ${className}`.trim()}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
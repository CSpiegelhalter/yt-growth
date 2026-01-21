/**
 * LearnToc - Responsive table of contents for learn articles
 * 
 * Mobile: Collapsible using native <details>/<summary> (no JS required)
 * Desktop: Sticky sidebar when space allows
 * 
 * Server component - no "use client" directive.
 */

type TocItem = {
  readonly id: string;
  readonly label: string;
};

type Props = {
  /** TOC items with id and label */
  items: readonly TocItem[];
  /** Title shown above the list */
  title?: string;
  /** "inline" for in-content, "sidebar" for sticky desktop positioning */
  variant?: "inline" | "sidebar";
  /** Additional CSS class */
  className?: string;
};

/**
 * Converts existing title-based TOC items to label-based format
 * for backwards compatibility
 */
export type TocItemCompat = { id: string; title?: string; label?: string };

export function normalizeItems(
  items: readonly TocItemCompat[]
): TocItem[] {
  return items.map((item) => ({
    id: item.id,
    label: item.label ?? item.title ?? item.id,
  }));
}

export function LearnToc({
  items,
  title = "In This Guide",
  variant = "inline",
  className = "",
}: Props) {
  if (items.length === 0) return null;

  const tocContent = (
    <ol className="learnToc__list">
      {items.map((item) => (
        <li key={item.id} className="learnToc__item">
          <a href={`#${item.id}`} className="learnToc__link">
            {item.label}
          </a>
        </li>
      ))}
    </ol>
  );

  // Sidebar variant - no collapsible, just sticky nav
  if (variant === "sidebar") {
    return (
      <nav
        className={`learnToc learnToc--sidebar ${className}`.trim()}
        aria-label={title}
      >
        <p className="learnToc__title">{title}</p>
        {tocContent}
      </nav>
    );
  }

  // Inline variant - collapsible on mobile, expanded on desktop
  return (
    <nav className={`learnToc learnToc--inline ${className}`.trim()} aria-label={title}>
      {/* Mobile: collapsible */}
      <details className="learnToc__details">
        <summary className="learnToc__summary">
          <span className="learnToc__summaryText">{title}</span>
          <svg
            className="learnToc__chevron"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </summary>
        <div className="learnToc__content">{tocContent}</div>
      </details>
    </nav>
  );
}

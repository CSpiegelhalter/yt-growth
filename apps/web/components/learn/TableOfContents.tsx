type TocItem = {
  readonly id: string;
  readonly title: string;
};

type Props = {
  items: readonly TocItem[];
  ariaLabel?: string;
};

/**
 * TableOfContents - Server-rendered navigation for article sections
 * 
 * Provides jump links to article sections for improved UX and SEO.
 * Fully accessible with proper ARIA labels and keyboard navigation.
 */
export function TableOfContents({ items, ariaLabel = "Table of Contents" }: Props) {
  if (items.length === 0) return null;

  return (
    <nav className="toc" aria-label={ariaLabel}>
      <h2 className="toc__title">In This Guide</h2>
      <ol className="toc__list">
        {items.map((item) => (
          <li key={item.id} className="toc__item">
            <a href={`#${item.id}`} className="toc__link">
              {item.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}


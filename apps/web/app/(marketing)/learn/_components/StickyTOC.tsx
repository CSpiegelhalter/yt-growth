type TocItem = {
  readonly id: string;
  readonly title: string;
};

type Props = {
  items: readonly TocItem[];
};

/**
 * StickyTOC - Table of contents with responsive behavior
 * Desktop: Sticky sidebar (when page layout allows)
 * Mobile: Normal inline TOC
 * 
 * Note: Active section highlighting would require client JS.
 * This version is server-rendered for performance.
 */
export function StickyTOC({ items }: Props) {
  if (items.length === 0) return null;

  return (
    <nav className="stickyToc" aria-label="Table of contents">
      <p className="stickyToc__title">In this guide</p>
      <ol className="stickyToc__list">
        {items.map((item) => (
          <li key={item.id}>
            <a href={`#${item.id}`} className="stickyToc__link">
              {item.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

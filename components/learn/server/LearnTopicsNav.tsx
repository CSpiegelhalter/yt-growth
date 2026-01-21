/**
 * Server component that renders the article topics navigation.
 * Uses native details/summary for a compact dropdown without JS.
 * Must remain a server component - no "use client" directive.
 */

import Link from "next/link";

interface NavItem {
  slug: string;
  label: string;
}

interface LearnTopicsNavProps {
  items: NavItem[];
  activeSlug: string;
  styles: {
    articleNav: string;
    articleNavLabel: string;
    articleNavLink: string;
    articleNavLinkActive: string;
  };
}

export function LearnTopicsNav({
  items,
  activeSlug,
  styles: s,
}: LearnTopicsNavProps) {
  const activeItem = items.find((item) => item.slug === activeSlug);
  const currentLabel = activeItem?.label || "Select topic";

  return (
    <nav className={s.articleNav} aria-label="Learn topics">
      <details className="topicsDropdown">
        <summary className="topicsDropdown__trigger">
          <span className="topicsDropdown__label">More guides</span>
          <span className="topicsDropdown__current">{currentLabel}</span>
          <svg 
            className="topicsDropdown__chevron" 
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
        <div className="topicsDropdown__menu">
          {items.map((article) => (
            <Link
              key={article.slug}
              href={`/learn/${article.slug}`}
              className={`topicsDropdown__item ${
                article.slug === activeSlug ? "topicsDropdown__item--active" : ""
              }`}
            >
              {article.label}
            </Link>
          ))}
        </div>
      </details>
    </nav>
  );
}

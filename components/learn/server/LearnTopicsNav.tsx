/**
 * Server component that renders the article topics navigation bar.
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
  return (
    <nav className={s.articleNav} aria-label="Learn topics">
      <span className={s.articleNavLabel}>Topics:</span>
      {items.map((article) => (
        <Link
          key={article.slug}
          href={`/learn/${article.slug}`}
          className={`${s.articleNavLink} ${
            article.slug === activeSlug ? s.articleNavLinkActive : ""
          }`}
        >
          {article.label}
        </Link>
      ))}
    </nav>
  );
}

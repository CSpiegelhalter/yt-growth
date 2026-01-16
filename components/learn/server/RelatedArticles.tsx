/**
 * Server component that renders the related articles navigation.
 * Must remain a server component - no "use client" directive.
 */

import Link from "next/link";

interface RelatedItem {
  slug: string;
  title: string;
}

interface RelatedArticlesProps {
  items: RelatedItem[];
  title?: string;
  styles: {
    related: string;
    relatedTitle: string;
    relatedLinks: string;
    relatedLink: string;
  };
}

export function RelatedArticles({
  items,
  title = "Continue Learning",
  styles: s,
}: RelatedArticlesProps) {
  return (
    <nav className={s.related} aria-label="Related articles">
      <h3 className={s.relatedTitle}>{title}</h3>
      <div className={s.relatedLinks}>
        {items.map((article) => (
          <Link
            key={article.slug}
            href={`/learn/${article.slug}`}
            className={s.relatedLink}
          >
            {article.title}
          </Link>
        ))}
      </div>
    </nav>
  );
}

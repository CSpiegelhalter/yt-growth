/**
 * Shared types for article body components.
 * Leaf body modules import from HERE, never from index.ts.
 */

import type { LearnArticle } from "../../articles";

export type StyleModule = Record<string, string>;

export interface BodyProps {
  s: StyleModule;
  article: LearnArticle;
}

export interface ArticleMeta {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly heroImage?: string;
  readonly heroAlt?: string;
}

export interface TocEntry {
  readonly id: string;
  readonly label: string;
  readonly level?: number;
}

/**
 * Convert articles.ts toc format ({id, title}) to TocEntry format ({id, label}).
 * Accepts `unknown[]` to avoid type-inference issues with large const objects.
 */
function tocFromArticle(
  items: ReadonlyArray<Record<string, string>>,
): readonly TocEntry[] {
  return items.map((t) => ({
    id: t.id ?? "",
    label: t.title ?? t.label ?? t.id ?? "",
  }));
}

/**
 * Build standard meta + toc exports from an article slug.
 * Reduces boilerplate in each article body file.
 */
export function articleExports(article: {
  slug: string;
  title: string;
  description: string;
  toc: ReadonlyArray<Record<string, string>>;
}) {
  const meta: ArticleMeta = {
    slug: article.slug,
    title: article.title,
    description: article.description,
  };
  const toc = tocFromArticle(article.toc);
  return { meta, toc } as const;
}

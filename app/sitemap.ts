import { MetadataRoute } from "next";
import { CANONICAL_ORIGIN } from "@/lib/brand";
import { LEARN_ARTICLES } from "./(marketing)/learn/articles";

/**
 * Generate sitemap.xml for SEO
 *
 * Only includes public, indexable pages that are NOT blocked by robots.txt.
 * Excludes:
 * - /auth/* (noindex, disallowed in robots.txt)
 * - /api/* (not pages)
 * - All logged-in app routes (dashboard, profile, ideas, etc.)
 *
 * URLs use consistent format: no trailing slash for pages.
 * All URLs use the canonical www origin to avoid redirect warnings in SEO audits.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = CANONICAL_ORIGIN;

  // Learn article entries with stable dates from articles.ts
  const learnArticleEntries = Object.values(LEARN_ARTICLES).map((article) => ({
    url: `${baseUrl}/learn/${article.slug}`,
    lastModified: new Date(article.dateModified),
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  return [
    // Landing page - highest priority
    {
      url: baseUrl,
      lastModified: new Date("2026-01-02"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    // Learn hub - high priority for SEO
    {
      url: `${baseUrl}/learn`,
      lastModified: new Date("2026-01-02"),
      changeFrequency: "weekly",
      priority: 0.95,
    },
    // Learn articles
    ...learnArticleEntries,
    // Contact page
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    // Legal pages - low priority but accessible
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}

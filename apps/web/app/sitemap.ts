import type { MetadataRoute } from "next";
import { CANONICAL_ORIGIN } from "@/lib/shared/brand";
import { LEARN_ARTICLES } from "./(marketing)/learn/articles";

/**
 * Generate sitemap.xml for SEO
 *
 * Includes all public, indexable pages.
 * Excludes:
 * - /auth/* (noindex, disallowed in robots.txt)
 * - /api/* (not pages)
 * - Private app routes that require login (dashboard, profile, competitors, etc.)
 *
 * Public SEO tool pages (/ideas, /keywords, /tags/*) ARE included here.
 *
 * URLs use consistent format: no trailing slash for pages.
 * All URLs use the canonical www origin to avoid redirect warnings in SEO audits.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // Belt-and-suspenders: even if CANONICAL_ORIGIN is wrong, force www for our domain
  const baseUrl = (
    CANONICAL_ORIGIN === "https://getchannelboost.com"
      ? "https://www.getchannelboost.com"
      : CANONICAL_ORIGIN
  ).replace(/\/$/, "");

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
    // SEO tool pages - high priority public pages
    {
      url: `${baseUrl}/ideas`,
      lastModified: new Date("2026-01-26"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/keywords`,
      lastModified: new Date("2026-01-26"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tags`,
      lastModified: new Date("2026-01-26"),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tags/generator`,
      lastModified: new Date("2026-01-26"),
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/tags/extractor`,
      lastModified: new Date("2026-01-26"),
      changeFrequency: "monthly",
      priority: 0.85,
    },
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

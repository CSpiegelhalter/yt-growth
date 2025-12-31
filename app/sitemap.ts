import { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";
import { LEARN_ARTICLES } from "./learn/articles";

/**
 * Generate sitemap.xml for SEO
 * Only include public, indexable pages
 * 
 * Note: lastModified uses stable dates for learn articles
 * to avoid constant sitemap churn
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${BRAND.domain}`;

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
      lastModified: new Date("2025-01-15"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    // Learn hub - high priority for SEO
    {
      url: `${baseUrl}/learn`,
      lastModified: new Date("2025-01-15"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    // Learn articles
    ...learnArticleEntries,
    // Auth pages (public, but lower priority)
    {
      url: `${baseUrl}/auth/login`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/auth/signup`,
      lastModified: new Date("2025-01-01"),
      changeFrequency: "yearly",
      priority: 0.5,
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

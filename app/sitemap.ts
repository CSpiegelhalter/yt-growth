import { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

/**
 * Generate sitemap.xml for SEO
 * Only include public, indexable pages
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${BRAND.domain}`;
  const now = new Date();

  return [
    // Landing page - highest priority
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    // Learn pages - high priority for SEO
    {
      url: `${baseUrl}/learn/youtube-channel-audit`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/learn/youtube-retention-analysis`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/learn/youtube-competitor-analysis`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/learn/youtube-video-ideas`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/learn/how-to-get-more-subscribers`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    // Contact page
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    // Legal pages - low priority but accessible
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}

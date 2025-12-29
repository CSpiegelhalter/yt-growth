import { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

/**
 * Generate robots.txt for SEO
 * - Allow crawling of marketing/public pages
 * - Disallow auth, api, and private app pages
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${BRAND.domain}`;

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/learn/", "/contact", "/terms", "/privacy"],
        disallow: [
          "/api/",
          "/auth/",
          "/dashboard",
          "/dashboard/",
          "/profile",
          "/profile/",
          "/ideas",
          "/ideas/",
          "/subscriber-insights",
          "/subscriber-insights/",
          "/competitors",
          "/competitors/",
          "/saved-ideas",
          "/saved-ideas/",
          "/video/",
          "/admin/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

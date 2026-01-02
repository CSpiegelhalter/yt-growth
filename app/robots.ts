import { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

/**
 * Generate robots.txt for SEO
 * - Allow crawling of marketing/public pages and Learn section
 * - Disallow auth, api, private app pages, and internal routes
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${BRAND.domain}`;

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/learn/", "/contact", "/terms", "/privacy"],
        disallow: [
          // API routes
          "/api/",
          // Auth flows
          "/auth/",
          // Private app pages (require login)
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
          // Admin routes
          "/admin/",
          // Internal integrations
          "/integrations/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

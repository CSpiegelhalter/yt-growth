import { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

/**
 * Generate robots.txt for SEO
 *
 * By default all paths are allowed. We only specify Disallow rules
 * for routes that should not be crawled:
 * - /api/ - API endpoints
 * - /auth/ - Login, signup, password reset flows
 * - All logged-in app routes (dashboard, profile, ideas, etc.)
 *
 * Note: All disallowed routes also have noindex metadata as a defense-in-depth.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${BRAND.domain}`;

  return {
    rules: [
      {
        userAgent: "*",
        disallow: [
          // API routes
          "/api/",
          // Auth flows (noindex set on pages)
          "/auth/",
          // Private app pages (require login, noindex set on pages)
          "/dashboard/",
          "/profile/",
          "/ideas/",
          "/goals/",
          "/subscriber-insights/",
          "/competitors/",
          "/saved-ideas/",
          "/video/",
          "/thumbnails/",
          "/channel-profile/",
          "/tag-generator/",
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

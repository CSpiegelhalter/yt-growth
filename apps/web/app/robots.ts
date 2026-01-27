import { MetadataRoute } from "next";
import { CANONICAL_ORIGIN } from "@/lib/brand";

/**
 * Generate robots.txt for SEO
 *
 * By default all paths are allowed. We only specify Disallow rules
 * for routes that should not be crawled:
 * - /api/ - API endpoints
 * - /auth/ - Login, signup, password reset flows
 * - Private app routes that require login (dashboard, profile, competitors, etc.)
 *
 * Public SEO tool pages (/ideas, /keywords, /tags/*) are intentionally ALLOWED.
 *
 * Note: All disallowed routes also have noindex metadata as a defense-in-depth.
 * Sitemap URL uses the canonical www origin for consistency.
 */
export default function robots(): MetadataRoute.Robots {
  // Belt-and-suspenders: even if CANONICAL_ORIGIN is wrong, force www for our domain
  const baseUrl = (
    CANONICAL_ORIGIN === "https://getchannelboost.com"
      ? "https://www.getchannelboost.com"
      : CANONICAL_ORIGIN
  ).replace(/\/$/, "");

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
          "/goals/",
          "/subscriber-insights/",
          "/competitors/",
          "/saved-ideas/",
          "/video/",
          "/thumbnails/",
          "/channel-profile/",
          // Admin routes
          "/admin/",
          // Internal integrations
          "/integrations/",
          // Note: /ideas, /keywords, and /tags/* are PUBLIC SEO pages - intentionally NOT disallowed
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

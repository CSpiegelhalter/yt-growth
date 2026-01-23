/**
 * Site configuration - Single source of truth for URLs and site metadata
 *
 * This file centralizes all site URL configuration to prevent orphaned pages
 * and ensure consistency across sitemap, robots.txt, canonicals, and metadata.
 *
 * IMPORTANT: All public pages must be listed in REQUIRED_PUBLIC_PAGES or
 * dynamically generated from LEARN_ARTICLES. The check:orphaned script
 * validates that all sitemap URLs have proper internal linking.
 */

import { BRAND, CANONICAL_ORIGIN } from "./brand";

/**
 * The canonical site URL.
 * - Always includes https://
 * - Always uses www subdomain
 * - Never ends with trailing slash
 *
 * Use this for sitemap generation, canonicals, and OpenGraph URLs.
 */
export const SITE_URL = CANONICAL_ORIGIN;

/**
 * Core public pages that must always be linked from header/footer/homepage.
 * These are verified by the check:orphaned script.
 */
export const REQUIRED_PUBLIC_PAGES = [
  "/",
  "/learn",
  "/contact",
  "/privacy",
  "/terms",
] as const;

/**
 * Pages that must be linked from the header navigation.
 */
export const HEADER_NAV_PAGES = ["/", "/learn", "/contact"] as const;

/**
 * Pages that must be linked from the footer.
 */
export const FOOTER_NAV_PAGES = [
  "/learn",
  "/contact",
  "/privacy",
  "/terms",
] as const;

/**
 * Full absolute URL for a path.
 * @example getAbsoluteUrl('/learn') => 'https://www.getchannelboost.com/learn'
 */
export function getAbsoluteUrl(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}

/**
 * Re-export brand for convenience
 */
export { BRAND, CANONICAL_ORIGIN };

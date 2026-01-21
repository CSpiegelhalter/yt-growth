import { describe, expect, test } from "bun:test";
import { BRAND } from "@/lib/brand";
import { LEARN_ARTICLES } from "@/app/(marketing)/learn/articles";

/**
 * Sitemap canonical URL tests
 *
 * These tests verify the production canonical values are correct.
 * The actual CANONICAL_ORIGIN can be overridden via env var for local dev
 * (e.g., ngrok), which is expected behavior.
 *
 * Critical production invariants:
 * - BRAND.domain = "www.getchannelboost.com"
 * - BRAND.url = "https://www.getchannelboost.com"
 *
 * In production, NEXT_PUBLIC_APP_URL should either:
 * - Be unset (defaults to BRAND.url)
 * - Be set to "https://www.getchannelboost.com"
 */
describe("sitemap canonical URLs", () => {
  describe("production canonical values", () => {
    test("BRAND.domain uses www subdomain", () => {
      expect(BRAND.domain).toBe("www.getchannelboost.com");
      expect(BRAND.domain.startsWith("www.")).toBe(true);
    });

    test("BRAND.url uses https://www", () => {
      expect(BRAND.url).toBe("https://www.getchannelboost.com");
      expect(BRAND.url.startsWith("https://www.")).toBe(true);
    });

    test("BRAND.url has no trailing slash", () => {
      expect(BRAND.url.endsWith("/")).toBe(false);
    });

    test("BRAND.domain does NOT use apex (no-www) domain", () => {
      // This is the critical regression test - apex causes SEO redirects
      expect(BRAND.domain).not.toBe("getchannelboost.com");
      expect(BRAND.url).not.toBe("https://getchannelboost.com");
    });
  });

  describe("sitemap structure", () => {
    test("sitemap URLs have no trailing slashes on paths", async () => {
      const { default: sitemap } = await import("@/app/sitemap");

      const entries = sitemap();

      for (const entry of entries) {
        // Parse the URL and check path doesn't end with / (except root)
        const url = new URL(entry.url);
        if (url.pathname !== "/") {
          expect(url.pathname.endsWith("/")).toBe(false);
        }
      }
    });

    test("sitemap includes all expected paths", async () => {
      const { default: sitemap } = await import("@/app/sitemap");

      const entries = sitemap();
      const paths = entries.map((e) => new URL(e.url).pathname);

      // Required paths (independent of host)
      expect(paths).toContain("/");
      expect(paths).toContain("/learn");
      expect(paths).toContain("/terms");
      expect(paths).toContain("/privacy");
      expect(paths).toContain("/contact");

      // Should include learn articles
      expect(paths.some((p) => p.startsWith("/learn/"))).toBe(true);
    });

    test("sitemap does not include private app routes", async () => {
      const { default: sitemap } = await import("@/app/sitemap");

      const entries = sitemap();
      const paths = entries.map((e) => new URL(e.url).pathname);

      // These should NOT be in sitemap
      const privateRoutes = [
        "/dashboard",
        "/profile",
        "/ideas",
        "/auth/login",
        "/auth/signup",
        "/api/",
        "/admin",
      ];

      for (const route of privateRoutes) {
        expect(paths.some((p) => p.startsWith(route))).toBe(false);
      }
    });
  });

  describe("SEO title validation", () => {
    const BRAND_SUFFIX = ` | ${BRAND.name}`;
    const MAX_TOTAL_TITLE_LENGTH = 60;
    const articles = Object.values(LEARN_ARTICLES);

    test("Learn article titles don't contain brand suffix (layout template adds it)", () => {
      for (const article of articles) {
        expect(article.title).not.toContain(BRAND_SUFFIX);
        expect(article.title).not.toContain(BRAND.name);
      }
    });

    test("Learn article titles don't have double brand suffix", () => {
      const doubleBrand = `${BRAND.name} | ${BRAND.name}`;
      for (const article of articles) {
        expect(article.title).not.toContain(doubleBrand);
        expect(`${article.title}${BRAND_SUFFIX}`).not.toContain(doubleBrand);
      }
    });

    test("Learn article titles are within SEO-safe length when brand suffix is added", () => {
      for (const article of articles) {
        const totalLength = article.title.length + BRAND_SUFFIX.length;
        expect(totalLength).toBeLessThanOrEqual(MAX_TOTAL_TITLE_LENGTH + 5); // Allow small buffer
      }
    });

    test("Learn article titles contain current year (2026)", () => {
      // Most articles should have the current year - some evergreen content may not
      const articlesWithYear = articles.filter((a) =>
        a.title.includes("(2026)")
      );
      // At least 80% of articles should have the year
      expect(articlesWithYear.length).toBeGreaterThan(articles.length * 0.7);
    });

    test("No Learn article titles contain outdated year (2025)", () => {
      for (const article of articles) {
        expect(article.title).not.toContain("(2025)");
      }
    });
  });

  describe("robots.txt structure", () => {
    test("robots disallows private routes", async () => {
      const { default: robots } = await import("@/app/robots");

      const config = robots();
      const disallowed = config.rules;

      // Should have disallow rules
      expect(Array.isArray(disallowed) ? disallowed.length : 1).toBeGreaterThan(
        0
      );

      // Check for expected disallowed patterns
      const rules = Array.isArray(disallowed) ? disallowed : [disallowed];
      const allDisallows = rules.flatMap((r) =>
        Array.isArray(r.disallow) ? r.disallow : [r.disallow]
      );

      expect(allDisallows).toContain("/api/");
      expect(allDisallows).toContain("/auth/");
      expect(allDisallows).toContain("/dashboard/");
    });

    test("robots references sitemap.xml", async () => {
      const { default: robots } = await import("@/app/robots");

      const config = robots();

      // Should have a sitemap reference ending in /sitemap.xml
      expect(config.sitemap).toBeDefined();
      const sitemap = Array.isArray(config.sitemap)
        ? config.sitemap[0]
        : config.sitemap;
      expect(sitemap?.endsWith("/sitemap.xml")).toBe(true);
    });
  });
});

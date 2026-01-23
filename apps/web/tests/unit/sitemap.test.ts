import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { normalizeCanonicalOrigin } from "@/lib/brand";

/**
 * Regression tests to ensure sitemap and robots never emit
 * the apex domain (getchannelboost.com) or http:// URLs.
 *
 * SEO audits flag redirecting URLs in sitemaps, so we must
 * always use the canonical www origin.
 */
describe("sitemap", () => {
  it("does not include apex domain URLs", () => {
    const entries = sitemap();

    for (const entry of entries) {
      // Must not be apex (non-www)
      expect(entry.url).not.toMatch(/^https:\/\/getchannelboost\.com(\/|$)/);
      // Must not be http (non-secure)
      expect(entry.url).not.toMatch(/^http:\/\//);
    }
  });

  it("homepage URL uses www subdomain", () => {
    const entries = sitemap();
    const homepage = entries.find(
      (e) =>
        e.url === "https://www.getchannelboost.com" ||
        e.url.match(/^https:\/\/[^/]+$/)
    );

    expect(homepage).toBeDefined();
    // In production, homepage should be www
    if (homepage?.url.includes("getchannelboost.com")) {
      expect(homepage.url).toBe("https://www.getchannelboost.com");
    }
  });

  it("all URLs have no trailing slash (except paths)", () => {
    const entries = sitemap();

    for (const entry of entries) {
      // The origin part should not have a trailing slash
      // e.g., "https://www.getchannelboost.com" not "https://www.getchannelboost.com/"
      const url = new URL(entry.url);
      if (url.pathname === "/" || url.pathname === "") {
        // Homepage should not have trailing slash
        expect(entry.url).not.toMatch(/\/$/);
      }
    }
  });
});

describe("robots", () => {
  it("sitemap URL does not use apex domain", () => {
    const result = robots();

    expect(result.sitemap).toBeDefined();
    expect(result.sitemap).not.toMatch(/^https:\/\/getchannelboost\.com(\/|$)/);
    expect(result.sitemap).not.toMatch(/^http:\/\//);
  });

  it("sitemap URL uses www subdomain in production", () => {
    const result = robots();

    if (result.sitemap?.includes("getchannelboost.com")) {
      expect(result.sitemap).toBe(
        "https://www.getchannelboost.com/sitemap.xml"
      );
    }
  });
});

describe("normalizeCanonicalOrigin", () => {
  it("adds https and www to apex domain", () => {
    expect(normalizeCanonicalOrigin("getchannelboost.com")).toBe(
      "https://www.getchannelboost.com"
    );
  });

  it("converts http to https", () => {
    expect(normalizeCanonicalOrigin("http://www.getchannelboost.com")).toBe(
      "https://www.getchannelboost.com"
    );
  });

  it("converts apex https to www", () => {
    expect(normalizeCanonicalOrigin("https://getchannelboost.com")).toBe(
      "https://www.getchannelboost.com"
    );
  });

  it("strips trailing slash", () => {
    expect(normalizeCanonicalOrigin("https://www.getchannelboost.com/")).toBe(
      "https://www.getchannelboost.com"
    );
  });

  it("strips path, query, and hash", () => {
    expect(
      normalizeCanonicalOrigin(
        "https://www.getchannelboost.com/some/path?q=1#hash"
      )
    ).toBe("https://www.getchannelboost.com");
  });

  it("strips port", () => {
    expect(normalizeCanonicalOrigin("https://www.getchannelboost.com:8080")).toBe(
      "https://www.getchannelboost.com"
    );
  });

  it("preserves non-getchannelboost domains (for previews)", () => {
    expect(normalizeCanonicalOrigin("myproj.vercel.app")).toBe(
      "https://myproj.vercel.app"
    );
    expect(normalizeCanonicalOrigin("https://preview-123.vercel.app")).toBe(
      "https://preview-123.vercel.app"
    );
  });

  it("returns fallback for empty input", () => {
    expect(normalizeCanonicalOrigin("")).toBe(
      "https://www.getchannelboost.com"
    );
    expect(normalizeCanonicalOrigin(undefined)).toBe(
      "https://www.getchannelboost.com"
    );
    expect(normalizeCanonicalOrigin("   ")).toBe(
      "https://www.getchannelboost.com"
    );
  });

  it("returns fallback for invalid URLs", () => {
    expect(normalizeCanonicalOrigin("not a url at all!!!")).toBe(
      "https://www.getchannelboost.com"
    );
  });

  it("handles www.getchannelboost.com without scheme", () => {
    expect(normalizeCanonicalOrigin("www.getchannelboost.com")).toBe(
      "https://www.getchannelboost.com"
    );
    expect(normalizeCanonicalOrigin("www.getchannelboost.com/")).toBe(
      "https://www.getchannelboost.com"
    );
  });
});

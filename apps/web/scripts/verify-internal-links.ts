#!/usr/bin/env bun
/**
 * Internal Link Verification Script
 *
 * Verifies that:
 * 1. All learn article slugs are in the LEARN_ARTICLES registry
 * 2. All required pages (home, learn hub, legal pages) are in sitemap
 * 3. Sitemap uses consistent canonical URLs (www domain)
 * 4. All learn articles are linked from the /learn hub page
 *
 * Run: bun run scripts/verify-internal-links.ts
 */

import { LEARN_ARTICLES, learnArticles } from "../app/(marketing)/learn/articles";
import sitemap from "../app/sitemap";
import { BRAND, CANONICAL_ORIGIN } from "../lib/brand";

// Required pages that must be in sitemap and internally linked
const REQUIRED_PAGES = [
  "/",
  "/learn",
  "/privacy",
  "/terms",
  "/contact",
];

// All learn article slugs that should exist
const REQUIRED_LEARN_SLUGS = [
  "how-to-see-your-subscribers-on-youtube",
  "youtube-algorithm",
  "youtube-shorts-monetization",
  "youtube-shorts-length",
  "youtube-tag-generator",
  "how-to-be-a-youtuber",
  "youtube-analytics-tools",
  "buy-youtube-views",
  "buy-youtube-subscribers",
  "how-to-go-live-on-youtube",
  "how-to-promote-youtube-videos",
  "free-youtube-subscribers",
  "youtube-seo",
  "how-much-does-youtube-pay",
  "youtube-monetization-requirements",
  "how-to-make-a-youtube-channel",
  "youtube-video-ideas",
  "youtube-competitor-analysis",
  "how-to-get-more-subscribers",
  "youtube-retention-analysis",
  "youtube-channel-audit",
];

interface VerificationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

function verifyLearnArticlesRegistry(): VerificationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log("\n📚 Checking LEARN_ARTICLES registry...");

  const registeredSlugs = Object.keys(LEARN_ARTICLES);

  // Check all required slugs exist
  for (const slug of REQUIRED_LEARN_SLUGS) {
    if (!registeredSlugs.includes(slug)) {
      errors.push(`Missing learn article: ${slug}`);
    }
  }

  // Report all registered slugs
  console.log(`   Found ${registeredSlugs.length} articles in registry`);

  if (errors.length === 0) {
    console.log("   ✅ All required learn articles are registered");
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

function verifySitemap(): VerificationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log("\n🗺️  Checking sitemap...");

  const sitemapEntries = sitemap();
  const sitemapUrls = sitemapEntries.map((entry) => entry.url);

  // Check canonical domain consistency
  const nonCanonicalUrls = sitemapUrls.filter(
    (url) => !url.startsWith(CANONICAL_ORIGIN)
  );
  if (nonCanonicalUrls.length > 0) {
    errors.push(
      `Sitemap has non-canonical URLs: ${nonCanonicalUrls.join(", ")}`
    );
  } else {
    console.log(`   ✅ All sitemap URLs use canonical origin: ${CANONICAL_ORIGIN}`);
  }

  // Check required pages
  for (const path of REQUIRED_PAGES) {
    const fullUrl = `${CANONICAL_ORIGIN}${path === "/" ? "" : path}`;
    if (!sitemapUrls.includes(fullUrl)) {
      errors.push(`Missing from sitemap: ${path}`);
    }
  }

  // Check all learn articles are in sitemap
  const registeredSlugs = Object.keys(LEARN_ARTICLES);
  for (const slug of registeredSlugs) {
    const fullUrl = `${CANONICAL_ORIGIN}/learn/${slug}`;
    if (!sitemapUrls.includes(fullUrl)) {
      errors.push(`Learn article missing from sitemap: /learn/${slug}`);
    }
  }

  console.log(`   Found ${sitemapEntries.length} URLs in sitemap`);

  if (errors.length === 0) {
    console.log("   ✅ All required pages are in sitemap");
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

function verifyLearnHubLinks(): VerificationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log("\n🔗 Checking /learn hub page links...");

  // learnArticles is the array used by the /learn page to render links
  const linkedSlugs: string[] = learnArticles.map((a) => a.slug);

  // All registered slugs should be in the array
  const registeredSlugs = Object.keys(LEARN_ARTICLES);
  for (const slug of registeredSlugs) {
    if (!linkedSlugs.includes(slug)) {
      errors.push(`Learn article not linked from /learn hub: ${slug}`);
    }
  }

  console.log(`   Found ${linkedSlugs.length} articles linked from /learn hub`);

  if (errors.length === 0) {
    console.log("   ✅ All learn articles are linked from /learn hub");
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

function verifyBrandConfig(): VerificationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log("\n🏷️  Checking brand configuration...");

  // Verify www is canonical in BRAND (production config)
  if (!BRAND.url.includes("www.")) {
    errors.push("BRAND.url should use www subdomain for SEO consistency");
  }

  if (!BRAND.domain.includes("www.")) {
    errors.push("BRAND.domain should use www subdomain for SEO consistency");
  }

  // CANONICAL_ORIGIN may use env override for development
  const isDevEnvironment =
    CANONICAL_ORIGIN.includes("localhost") ||
    CANONICAL_ORIGIN.includes("ngrok") ||
    CANONICAL_ORIGIN.includes("127.0.0.1");

  if (!isDevEnvironment && !CANONICAL_ORIGIN.includes("www.")) {
    errors.push("CANONICAL_ORIGIN should use www subdomain in production");
  } else if (isDevEnvironment) {
    console.log(`   ℹ️  Development environment detected: ${CANONICAL_ORIGIN}`);
    console.log(`   ℹ️  Production will use: ${BRAND.url}`);
  }

  // Check URL format
  if (CANONICAL_ORIGIN.endsWith("/")) {
    errors.push("CANONICAL_ORIGIN should not end with trailing slash");
  }

  if (errors.length === 0) {
    console.log(`   ✅ Brand config uses canonical www domain: ${BRAND.url}`);
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

async function verifyRelatedArticles(): Promise<VerificationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  console.log("\n🔀 Checking related articles linking...");

  // Import the function dynamically to test it
  const articlesModule = await import("../app/(marketing)/learn/articles");
  const getRelatedArticles = articlesModule.getRelatedArticles as (
    slug: string
  ) => Array<{ slug: string }>;

  const registeredSlugs = Object.keys(LEARN_ARTICLES);
  let minLinks = Infinity;
  let maxLinks = 0;

  for (const slug of registeredSlugs) {
    const related = getRelatedArticles(slug);

    if (related.length < 4) {
      warnings.push(`Article "${slug}" has only ${related.length} related links (target: 4-8)`);
    }

    minLinks = Math.min(minLinks, related.length);
    maxLinks = Math.max(maxLinks, related.length);

    // Check for self-links
    if (related.some((r) => r.slug === slug)) {
      errors.push(`Article "${slug}" links to itself in related articles`);
    }
  }

  console.log(`   Related articles per page: ${minLinks}-${maxLinks}`);

  if (errors.length === 0 && warnings.length === 0) {
    console.log("   ✅ All articles have proper related links (4-8 items)");
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

// Main execution
async function main() {
  console.log("🔍 Internal Link Verification");
  console.log("=".repeat(50));

  const results = [
    verifyBrandConfig(),
    verifyLearnArticlesRegistry(),
    verifySitemap(),
    verifyLearnHubLinks(),
    await verifyRelatedArticles(),
  ];

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Summary");

  const allErrors = results.flatMap((r) => r.errors);
  const allWarnings = results.flatMap((r) => r.warnings);

  if (allErrors.length > 0) {
    console.log("\n❌ Errors:");
    allErrors.forEach((e) => console.log(`   - ${e}`));
  }

  if (allWarnings.length > 0) {
    console.log("\n⚠️  Warnings:");
    allWarnings.forEach((w) => console.log(`   - ${w}`));
  }

  const passed = results.every((r) => r.passed);

  if (passed && allWarnings.length === 0) {
    console.log("\n✅ All checks passed!");
    process.exit(0);
  } else if (passed) {
    console.log("\n⚠️  Checks passed with warnings");
    process.exit(0);
  } else {
    console.log("\n❌ Some checks failed");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});

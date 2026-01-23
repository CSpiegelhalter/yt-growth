#!/usr/bin/env bun
/**
 * Crawlability Verification Script
 *
 * Ensures all public marketing pages are crawlable and indexable by Google.
 * Run in CI/prebuild to prevent SEO regressions.
 *
 * Usage:
 *   bun scripts/verify-crawlability.ts
 *
 * Exit codes:
 *   0 - All pages pass crawlability checks
 *   1 - Issues found (fails CI)
 *
 * What it checks:
 * 1. No noindex meta tags in marketing pages
 * 2. Footer contains required links (/privacy, /terms, /contact, /learn)
 * 3. Header contains required links (/, /learn, /contact)
 * 4. Learn hub (/learn) links to ALL learn articles
 * 5. Homepage links to /learn
 * 6. robots.txt does not block /learn or marketing pages
 * 7. sitemap uses canonical www origin
 */

import { readFile } from "fs/promises";
import { join } from "path";

// ANSI colors for output
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

// Required marketing pages that must be crawlable (used for documentation)
const _REQUIRED_PAGES = ["/", "/learn", "/privacy", "/terms", "/contact"];
void _REQUIRED_PAGES; // Document the expected pages

// Required learn article slugs (25 total)
const REQUIRED_LEARN_SLUGS = [
  "youtube-channel-audit",
  "youtube-retention-analysis",
  "youtube-thumbnail-best-practices",
  "how-to-get-more-subscribers",
  "youtube-competitor-analysis",
  "youtube-video-ideas",
  "how-to-make-a-youtube-channel",
  "youtube-monetization-requirements",
  "how-much-does-youtube-pay",
  "youtube-seo",
  "free-youtube-subscribers",
  "how-to-promote-youtube-videos",
  "how-to-see-your-subscribers-on-youtube",
  "how-to-go-live-on-youtube",
  "buy-youtube-subscribers",
  "buy-youtube-views",
  "youtube-analytics-tools",
  "how-to-be-a-youtuber",
  "youtube-tag-generator",
  "youtube-shorts-length",
  "youtube-shorts-monetization",
  "youtube-algorithm",
] as const;

// Canonical origin (www) - used for documentation/reference
const _CANONICAL_ORIGIN = "https://www.getchannelboost.com";
void _CANONICAL_ORIGIN; // Document the expected canonical origin

interface CheckResult {
  name: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
}

const results: CheckResult[] = [];

/**
 * Helper to read a file and return its contents
 */
async function readFileContent(relativePath: string): Promise<string> {
  const fullPath = join(process.cwd(), relativePath);
  return readFile(fullPath, "utf-8");
}

/**
 * Check that a file contains a link to a specific path
 */
function containsLink(content: string, path: string): boolean {
  // Check for various link formats
  const patterns = [
    // Next.js Link: href="/path"
    new RegExp(`href=["'\`]${escapeRegex(path)}["'\`]`, "i"),
    // Template literal: href={\`/path\`}
    new RegExp(`href=\\{["'\`]${escapeRegex(path)}["'\`]\\}`, "i"),
    // Dynamic path with variable
    new RegExp(`href=\\{.*${escapeRegex(path)}.*\\}`, "i"),
  ];
  return patterns.some((p) => p.test(content));
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Check 1: Footer contains required links
 */
async function checkFooterLinks(): Promise<CheckResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredLinks = ["/learn", "/contact", "/privacy", "/terms"];

  try {
    const content = await readFileContent("components/Footer.tsx");

    for (const link of requiredLinks) {
      if (!containsLink(content, link)) {
        errors.push(`Footer missing link to ${link}`);
      }
    }
  } catch (e) {
    errors.push(`Could not read Footer.tsx: ${e}`);
  }

  return {
    name: "Footer contains required links",
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check 2: Header contains required links
 */
async function checkHeaderLinks(): Promise<CheckResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const requiredLinks = ["/", "/learn", "/contact"];

  try {
    const content = await readFileContent(
      "components/marketing/MarketingHeader.tsx"
    );

    for (const link of requiredLinks) {
      if (!containsLink(content, link)) {
        errors.push(`Header missing link to ${link}`);
      }
    }
  } catch (e) {
    errors.push(`Could not read MarketingHeader.tsx: ${e}`);
  }

  return {
    name: "Header contains required links",
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check 3: Learn hub links to ALL learn articles
 */
async function checkLearnHubLinks(): Promise<CheckResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const content = await readFileContent("app/(marketing)/learn/page.tsx");

    // The learn page imports learnArticles and maps over them with links
    // Check that it uses the learnArticles array
    if (!content.includes("learnArticles.map")) {
      errors.push(
        "Learn page does not iterate over learnArticles - may have orphaned pages"
      );
    }

    // Check for the Link component
    if (!content.includes('href={`/learn/${')) {
      errors.push(
        "Learn page does not use dynamic links to learn articles"
      );
    }
  } catch (e) {
    errors.push(`Could not read learn page: ${e}`);
  }

  return {
    name: "Learn hub links to all articles",
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check 4: Homepage links to /learn
 */
async function checkHomepageLinks(): Promise<CheckResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const content = await readFileContent("app/(marketing)/page.tsx");

    if (!containsLink(content, "/learn")) {
      errors.push("Homepage missing link to /learn");
    }
  } catch (e) {
    errors.push(`Could not read homepage: ${e}`);
  }

  return {
    name: "Homepage links to /learn",
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check 5: All required learn slugs exist in LEARN_ARTICLES
 */
async function checkLearnArticlesExist(): Promise<CheckResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const content = await readFileContent("app/(marketing)/learn/articles.ts");

    for (const slug of REQUIRED_LEARN_SLUGS) {
      const pattern = new RegExp(`["']${slug}["']:\\s*\\{`);
      if (!pattern.test(content)) {
        errors.push(`Missing learn article: ${slug}`);
      }
    }
  } catch (e) {
    errors.push(`Could not read articles.ts: ${e}`);
  }

  return {
    name: "All required learn articles exist",
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check 6: robots.ts does not block marketing pages
 */
async function checkRobotsNotBlocking(): Promise<CheckResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const mustNotBlock = ["/learn", "/privacy", "/terms", "/contact"];

  try {
    const content = await readFileContent("app/robots.ts");

    for (const path of mustNotBlock) {
      // Check for Disallow rules that would block this path
      const blockPattern = new RegExp(
        `["']${escapeRegex(path)}/?["']`,
        "i"
      );
      
      // Check if it's in a disallow array
      const disallowSection = content.match(/disallow:\s*\[([\s\S]*?)\]/i);
      if (disallowSection && blockPattern.test(disallowSection[1])) {
        errors.push(`robots.txt blocks ${path}`);
      }
    }
  } catch (e) {
    errors.push(`Could not read robots.ts: ${e}`);
  }

  return {
    name: "robots.txt does not block marketing pages",
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check 7: Sitemap uses canonical www origin
 */
async function checkSitemapCanonical(): Promise<CheckResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const content = await readFileContent("app/sitemap.ts");

    // Check that it imports CANONICAL_ORIGIN from brand
    if (!content.includes("CANONICAL_ORIGIN")) {
      errors.push("Sitemap does not use CANONICAL_ORIGIN from lib/brand");
    }

    // Check for hardcoded apex domain (would be a problem)
    if (
      content.includes('"https://getchannelboost.com"') &&
      !content.includes("www.getchannelboost.com")
    ) {
      errors.push(
        "Sitemap contains hardcoded apex domain (should use www)"
      );
    }
  } catch (e) {
    errors.push(`Could not read sitemap.ts: ${e}`);
  }

  return {
    name: "Sitemap uses canonical www origin",
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check 8: Marketing pages have correct robots metadata (no noindex)
 */
async function checkNoNoindexOnMarketingPages(): Promise<CheckResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const pagesToCheck = [
    { path: "app/(marketing)/page.tsx", name: "Homepage" },
    { path: "app/(marketing)/learn/page.tsx", name: "Learn hub" },
    { path: "app/(marketing)/privacy/page.tsx", name: "Privacy" },
    { path: "app/(marketing)/terms/page.tsx", name: "Terms" },
    { path: "app/(marketing)/contact/page.tsx", name: "Contact" },
  ];

  for (const page of pagesToCheck) {
    try {
      const content = await readFileContent(page.path);

      // Check for noindex in robots metadata
      // Pattern: robots: { index: false } or robots: "noindex"
      if (/robots:\s*\{\s*index:\s*false/i.test(content)) {
        errors.push(`${page.name} has noindex metadata`);
      }
      if (/robots:\s*["']noindex/i.test(content)) {
        errors.push(`${page.name} has noindex metadata`);
      }

      // Positive check: should have index: true or no robots restriction
      if (
        content.includes("robots:") &&
        !content.includes("index: true")
      ) {
        warnings.push(
          `${page.name} has robots metadata but may not explicitly allow indexing`
        );
      }
    } catch (e) {
      errors.push(`Could not read ${page.path}: ${e}`);
    }
  }

  return {
    name: "Marketing pages have no noindex metadata",
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check 9: Learn article pages have related guides
 */
async function checkRelatedGuidesOnLearnPages(): Promise<CheckResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const content = await readFileContent(
      "app/(marketing)/learn/[slug]/page.tsx"
    );

    // Check for RelatedArticles component
    if (!content.includes("RelatedArticles")) {
      errors.push(
        "Learn article template does not include RelatedArticles component"
      );
    }

    // Check that getRelatedArticles is used
    if (!content.includes("getRelatedArticles")) {
      errors.push(
        "Learn article template does not call getRelatedArticles"
      );
    }
  } catch (e) {
    errors.push(`Could not read learn article template: ${e}`);
  }

  return {
    name: "Learn articles have related guides section",
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check 10: CANONICAL_ORIGIN in lib/brand forces www
 */
async function checkCanonicalOriginNormalization(): Promise<CheckResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const content = await readFileContent("lib/brand.ts");

    // Check for normalizeCanonicalOrigin function
    if (!content.includes("normalizeCanonicalOrigin")) {
      errors.push(
        "lib/brand.ts missing normalizeCanonicalOrigin function"
      );
    }

    // Check that apex is converted to www
    if (!content.includes('www.getchannelboost.com')) {
      errors.push(
        "lib/brand.ts does not normalize to www.getchannelboost.com"
      );
    }

    // Check for the CANONICAL_ORIGIN export
    if (!content.includes("export const CANONICAL_ORIGIN")) {
      errors.push("lib/brand.ts missing CANONICAL_ORIGIN export");
    }
  } catch (e) {
    errors.push(`Could not read lib/brand.ts: ${e}`);
  }

  return {
    name: "CANONICAL_ORIGIN normalizes to www",
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check 11: next.config.js has www redirect
 */
async function checkWwwRedirect(): Promise<CheckResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const content = await readFileContent("next.config.js");

    // Check for redirect from apex to www
    if (!content.includes("getchannelboost.com")) {
      errors.push(
        "next.config.js missing canonical domain redirect"
      );
    }

    // Check it redirects TO www (not from www)
    if (
      !content.includes("www.getchannelboost.com/:path*") ||
      !content.includes('host", value: "getchannelboost.com"')
    ) {
      warnings.push(
        "Verify next.config.js redirects apex to www correctly"
      );
    }
  } catch (e) {
    errors.push(`Could not read next.config.js: ${e}`);
  }

  return {
    name: "next.config.js has apex->www redirect",
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Main function
 */
async function main() {
  console.log("\n🔍 Verifying crawlability...\n");

  // Run all checks
  const checks = [
    checkFooterLinks,
    checkHeaderLinks,
    checkLearnHubLinks,
    checkHomepageLinks,
    checkLearnArticlesExist,
    checkRobotsNotBlocking,
    checkSitemapCanonical,
    checkNoNoindexOnMarketingPages,
    checkRelatedGuidesOnLearnPages,
    checkCanonicalOriginNormalization,
    checkWwwRedirect,
  ];

  for (const check of checks) {
    const result = await check();
    results.push(result);

    // Print result
    const status = result.passed ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
    console.log(`${status} ${result.name}`);

    for (const error of result.errors) {
      console.log(`  ${RED}Error: ${error}${RESET}`);
    }
    for (const warning of result.warnings) {
      console.log(`  ${YELLOW}Warning: ${warning}${RESET}`);
    }
  }

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

  console.log("\n" + "=".repeat(50));
  console.log(
    `Results: ${GREEN}${passed} passed${RESET}, ${failed > 0 ? RED : ""}${failed} failed${RESET}`
  );

  if (totalErrors > 0) {
    console.log(`${RED}Total errors: ${totalErrors}${RESET}`);
  }
  if (totalWarnings > 0) {
    console.log(`${YELLOW}Total warnings: ${totalWarnings}${RESET}`);
  }

  if (failed > 0) {
    console.log(
      `\n${RED}❌ Crawlability verification FAILED${RESET}`
    );
    console.log(
      "Fix the errors above to ensure pages are crawlable by search engines.\n"
    );
    process.exit(1);
  }

  console.log(`\n${GREEN}✅ All crawlability checks passed${RESET}\n`);
  process.exit(0);
}

main().catch((e) => {
  console.error(`${RED}Script error: ${e}${RESET}`);
  process.exit(1);
});

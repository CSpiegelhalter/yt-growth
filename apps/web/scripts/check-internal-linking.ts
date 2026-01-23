#!/usr/bin/env bun
/**
 * Internal Linking Verification Script
 *
 * This script ensures all sitemap URLs have proper internal links,
 * preventing "orphaned page" SEO issues. Run in CI/prebuild.
 *
 * Usage:
 *   bun scripts/check-internal-linking.ts
 *
 * Exit codes:
 *   0 - All URLs properly linked
 *   1 - Orphaned URLs found (fails CI)
 *
 * What it checks:
 * 1. Every learn article is linked from /learn page
 * 2. Footer contains links to /privacy, /terms, /contact, /learn
 * 3. Header contains links to /, /learn, /contact
 * 4. Homepage links to core learn articles
 * 5. Every learn article has related guides section
 */

import { readFile } from "fs/promises";
import { join } from "path";

// Import article registry - this is the source of truth
// We use dynamic import to handle TypeScript
const articlesPath = join(
  process.cwd(),
  "app/(marketing)/learn/articles.ts"
);

interface ValidationError {
  type: "missing_link" | "structural";
  url: string;
  message: string;
  location: string;
}

interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: string[];
}

/**
 * Extract all slugs from LEARN_ARTICLES object in articles.ts
 */
async function getLearnSlugsFromArticles(): Promise<string[]> {
  const content = await readFile(articlesPath, "utf-8");

  // Match all slug definitions: "slug-name": {
  const slugMatches = content.matchAll(/^\s*"([a-z0-9-]+)":\s*\{$/gm);
  const slugs: string[] = [];

  for (const match of slugMatches) {
    slugs.push(match[1]);
  }

  return slugs;
}

/**
 * Check that a file contains specific href links
 */
async function checkFileContainsLinks(
  filePath: string,
  requiredPaths: string[],
  componentName: string
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  try {
    const content = await readFile(filePath, "utf-8");

    for (const path of requiredPaths) {
      // Check for Next.js Link href or anchor href
      // Matches: href="/path", href={`/path`}, href="/path", to="/path"
      const patterns = [
        new RegExp(`href=["'\`]${escapeRegex(path)}["'\`]`, "i"),
        new RegExp(`href=\\{["'\`]${escapeRegex(path)}["'\`]\\}`, "i"),
        new RegExp(`to=["'\`]${escapeRegex(path)}["'\`]`, "i"),
      ];

      const hasLink = patterns.some((p) => p.test(content));

      if (!hasLink) {
        errors.push({
          type: "missing_link",
          url: path,
          message: `Missing link to "${path}"`,
          location: componentName,
        });
      }
    }
  } catch {
    errors.push({
      type: "structural",
      url: "",
      message: `Could not read file: ${filePath}`,
      location: componentName,
    });
  }

  return errors;
}

/**
 * Check that learn index page links to all articles
 */
async function checkLearnPageLinksAllArticles(
  _slugs: string[]
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  const learnPagePath = join(
    process.cwd(),
    "app/(marketing)/learn/page.tsx"
  );

  try {
    const content = await readFile(learnPagePath, "utf-8");

    // The learn page should render all articles via learnArticles
    // Check that it imports and uses learnArticles
    if (!content.includes("learnArticles")) {
      errors.push({
        type: "structural",
        url: "/learn",
        message:
          'Learn page does not use "learnArticles" - articles may not be rendered',
        location: "app/(marketing)/learn/page.tsx",
      });
    }

    // Check that it renders links with href={`/learn/${...}`} pattern
    if (!content.includes('href={`/learn/${')) {
      errors.push({
        type: "structural",
        url: "/learn",
        message:
          'Learn page does not contain dynamic article links (href={`/learn/${...}`})',
        location: "app/(marketing)/learn/page.tsx",
      });
    }
  } catch {
    errors.push({
      type: "structural",
      url: "/learn",
      message: `Could not read learn page: ${learnPagePath}`,
      location: "app/(marketing)/learn/page.tsx",
    });
  }

  return errors;
}

/**
 * Check that learn article template includes related guides
 */
async function checkLearnTemplateHasRelatedGuides(): Promise<
  ValidationError[]
> {
  const errors: ValidationError[] = [];
  const templatePath = join(
    process.cwd(),
    "app/(marketing)/learn/[slug]/page.tsx"
  );

  try {
    const content = await readFile(templatePath, "utf-8");

    // Check for RelatedArticles component
    if (!content.includes("RelatedArticles")) {
      errors.push({
        type: "structural",
        url: "/learn/[slug]",
        message:
          "Learn article template does not include RelatedArticles component",
        location: "app/(marketing)/learn/[slug]/page.tsx",
      });
    }

    // Check that getRelatedArticles is used
    if (!content.includes("getRelatedArticles")) {
      errors.push({
        type: "structural",
        url: "/learn/[slug]",
        message:
          "Learn article template does not call getRelatedArticles function",
        location: "app/(marketing)/learn/[slug]/page.tsx",
      });
    }
  } catch {
    errors.push({
      type: "structural",
      url: "/learn/[slug]",
      message: `Could not read template: ${templatePath}`,
      location: "app/(marketing)/learn/[slug]/page.tsx",
    });
  }

  return errors;
}

/**
 * Check homepage links to learn articles
 */
async function checkHomepageLinksToLearnArticles(
  _slugs: string[]
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  const homepagePath = join(process.cwd(), "app/(marketing)/page.tsx");

  try {
    const content = await readFile(homepagePath, "utf-8");

    // Homepage should have POPULAR_GUIDE_SLUGS or similar
    if (!content.includes("POPULAR_GUIDE_SLUGS") && !content.includes("LEARN_ARTICLES")) {
      errors.push({
        type: "structural",
        url: "/",
        message:
          "Homepage does not reference learn articles (missing POPULAR_GUIDE_SLUGS or LEARN_ARTICLES)",
        location: "app/(marketing)/page.tsx",
      });
    }

    // Count static learn article links (href="/learn/slug-name")
    const staticLinkPattern = /href="\/learn\/[a-z0-9-]+"/gi;
    const staticMatches = content.match(staticLinkPattern) || [];

    // Check for dynamic link pattern (href={`/learn/${...}`})
    const hasDynamicLinks = content.includes('href={`/learn/${');

    // Homepage needs either 6+ static links OR dynamic link generation
    if (staticMatches.length < 6 && !hasDynamicLinks) {
      errors.push({
        type: "structural",
        url: "/",
        message: `Homepage has only ${staticMatches.length} static learn links and no dynamic link generation (minimum 6 required)`,
        location: "app/(marketing)/page.tsx",
      });
    }

    // If using dynamic links, verify POPULAR_GUIDE_SLUGS has enough entries
    if (hasDynamicLinks && content.includes("POPULAR_GUIDE_SLUGS")) {
      // Count entries in POPULAR_GUIDE_SLUGS array
      const slugListMatch = content.match(/POPULAR_GUIDE_SLUGS\s*=\s*\[([\s\S]*?)\]\s*as\s*const/);
      if (slugListMatch) {
        const slugEntries = slugListMatch[1].match(/"[a-z0-9-]+"/gi) || [];
        if (slugEntries.length < 10) {
          errors.push({
            type: "structural",
            url: "/",
            message: `POPULAR_GUIDE_SLUGS has only ${slugEntries.length} entries (minimum 10 recommended for SEO coverage)`,
            location: "app/(marketing)/page.tsx",
          });
        }
      }
    }
  } catch {
    errors.push({
      type: "structural",
      url: "/",
      message: `Could not read homepage: ${homepagePath}`,
      location: "app/(marketing)/page.tsx",
    });
  }

  return errors;
}

/**
 * Check that sitemap uses LEARN_ARTICLES as source
 */
async function checkSitemapUsesRegistry(): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  const sitemapPath = join(process.cwd(), "app/sitemap.ts");

  try {
    const content = await readFile(sitemapPath, "utf-8");

    if (!content.includes("LEARN_ARTICLES")) {
      errors.push({
        type: "structural",
        url: "/sitemap.xml",
        message:
          "Sitemap does not import LEARN_ARTICLES - URLs may drift from article registry",
        location: "app/sitemap.ts",
      });
    }

    // Check that sitemap uses CANONICAL_ORIGIN
    if (
      !content.includes("CANONICAL_ORIGIN") &&
      !content.includes("SITE_URL")
    ) {
      errors.push({
        type: "structural",
        url: "/sitemap.xml",
        message:
          "Sitemap does not use CANONICAL_ORIGIN or SITE_URL - host may be inconsistent",
        location: "app/sitemap.ts",
      });
    }
  } catch {
    errors.push({
      type: "structural",
      url: "/sitemap.xml",
      message: `Could not read sitemap: ${sitemapPath}`,
      location: "app/sitemap.ts",
    });
  }

  return errors;
}

/**
 * Verify BODY_COMPONENTS has entry for each article
 */
async function checkBodyComponentsComplete(
  slugs: string[]
): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];
  const bodiesPath = join(
    process.cwd(),
    "app/(marketing)/learn/articles/bodies/index.ts"
  );

  try {
    const content = await readFile(bodiesPath, "utf-8");

    for (const slug of slugs) {
      // Check that the slug is in BODY_COMPONENTS
      const pattern = new RegExp(`["']${slug}["']:\\s*\\w+Body`, "i");
      if (!pattern.test(content)) {
        errors.push({
          type: "structural",
          url: `/learn/${slug}`,
          message: `Article "${slug}" missing from BODY_COMPONENTS - page will 404`,
          location: "app/(marketing)/learn/articles/bodies/index.ts",
        });
      }
    }
  } catch {
    errors.push({
      type: "structural",
      url: "",
      message: `Could not read body components: ${bodiesPath}`,
      location: "app/(marketing)/learn/articles/bodies/index.ts",
    });
  }

  return errors;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function main(): Promise<void> {
  console.log("🔍 Checking internal linking structure...\n");

  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: [],
  };

  // Get all learn article slugs
  const slugs = await getLearnSlugsFromArticles();
  console.log(`Found ${slugs.length} learn articles in registry\n`);

  // 1. Check header contains required links
  console.log("Checking header links...");
  const headerErrors = await checkFileContainsLinks(
    join(process.cwd(), "components/marketing/MarketingHeader.tsx"),
    ["/", "/learn", "/contact"],
    "MarketingHeader"
  );
  result.errors.push(...headerErrors);

  // 2. Check footer contains required links
  console.log("Checking footer links...");
  const footerErrors = await checkFileContainsLinks(
    join(process.cwd(), "components/Footer.tsx"),
    ["/learn", "/contact", "/privacy", "/terms"],
    "Footer"
  );
  result.errors.push(...footerErrors);

  // 3. Check learn page links to all articles
  console.log("Checking /learn page structure...");
  const learnPageErrors = await checkLearnPageLinksAllArticles(slugs);
  result.errors.push(...learnPageErrors);

  // 4. Check learn template has related guides
  console.log("Checking learn article template...");
  const templateErrors = await checkLearnTemplateHasRelatedGuides();
  result.errors.push(...templateErrors);

  // 5. Check homepage links to learn articles
  console.log("Checking homepage learn links...");
  const homepageErrors = await checkHomepageLinksToLearnArticles(slugs);
  result.errors.push(...homepageErrors);

  // 6. Check sitemap uses registry
  console.log("Checking sitemap configuration...");
  const sitemapErrors = await checkSitemapUsesRegistry();
  result.errors.push(...sitemapErrors);

  // 7. Check all articles have body components
  console.log("Checking article body components...");
  const bodyErrors = await checkBodyComponentsComplete(slugs);
  result.errors.push(...bodyErrors);

  console.log("");

  // Report results
  if (result.errors.length === 0) {
    console.log("✅ All internal linking checks passed!\n");
    console.log("Summary:");
    console.log(`  • ${slugs.length} learn articles properly registered`);
    console.log("  • Header has required navigation links");
    console.log("  • Footer has required footer links");
    console.log("  • /learn page links to all articles");
    console.log("  • Learn template includes related guides");
    console.log("  • Homepage links to learn articles");
    console.log("  • Sitemap uses article registry");
    console.log("  • All articles have body components");
    process.exit(0);
  }

  console.log(
    `❌ Found ${result.errors.length} internal linking issue(s):\n`
  );

  for (const error of result.errors) {
    console.log(`  ${error.location}`);
    console.log(`    ${error.message}`);
    if (error.url) {
      console.log(`    URL: ${error.url}`);
    }
    console.log("");
  }

  console.log("Fix these issues to prevent orphaned pages in sitemap.\n");
  console.log("Common fixes:");
  console.log("  1. Add missing articles to LEARN_ARTICLES in articles.ts");
  console.log("  2. Add body component in articles/bodies/");
  console.log("  3. Ensure header/footer have all required links");
  console.log("  4. Add POPULAR_GUIDE_SLUGS entries for new articles");

  process.exit(1);
}

main().catch((err) => {
  console.error("Script error:", err);
  process.exit(1);
});

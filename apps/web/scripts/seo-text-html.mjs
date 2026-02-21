#!/usr/bin/env node
/**
 * SEO Text-to-HTML Ratio Checker
 *
 * Dynamically discovers Learn routes by fetching the hub page,
 * then tests each page's text-to-HTML ratio for SEO compliance.
 *
 * Usage:
 *   bun run seo:ratio
 *   BASE_URL=https://staging.example.com bun run seo:ratio
 *   THRESHOLD=0.15 bun run seo:ratio
 *   PATH_PREFIX=/learn bun run seo:ratio
 *
 * Environment Variables:
 *   BASE_URL    - Base URL to test (default: http://localhost:3000)
 *   THRESHOLD   - Minimum text/HTML ratio (default: 0.12 = 12%)
 *   PATH_PREFIX - Path prefix for discovery (default: /learn)
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const THRESHOLD = parseFloat(process.env.THRESHOLD || "0.12");
const PATH_PREFIX = process.env.PATH_PREFIX || "/learn";

/**
 * Discover all Learn article URLs by fetching the hub page and extracting links.
 * This is dynamic - no hardcoded slugs needed.
 */
async function discoverLearnRoutes() {
  const hubUrl = `${BASE_URL}${PATH_PREFIX}`;
  console.log(`\n📂 Discovering routes from ${hubUrl}...`);

  try {
    const response = await fetch(hubUrl, {
      headers: {
        "User-Agent": "SEO-Ratio-Checker/2.0",
        Accept: "text/html",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch hub page: HTTP ${response.status}`);
    }

    const html = await response.text();

    // Extract all links matching /learn/{slug} pattern
    // This regex finds href="/learn/some-slug" patterns
    const linkRegex = new RegExp(
      `href=["']${PATH_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/([a-z0-9-]+)["']`,
      "gi"
    );

    const slugs = new Set();
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const slug = match[1];
      // Filter out non-article slugs (like "articles", "style", etc.)
      if (slug && !slug.includes(".") && slug.length > 2) {
        slugs.add(slug);
      }
    }

    const routes = [
      PATH_PREFIX, // Hub page
      ...Array.from(slugs)
        .sort()
        .map((slug) => `${PATH_PREFIX}/${slug}`),
    ];

    console.log(`   Found ${routes.length} routes (1 hub + ${slugs.size} articles)\n`);
    return routes;
  } catch (error) {
    console.error(`❌ Failed to discover routes: ${error.message}`);
    console.error("   Make sure the dev server is running: bun run dev\n");
    process.exit(1);
  }
}

/**
 * Strip HTML tags, scripts, styles, and extract visible text.
 * Uses robust regex patterns for accurate text extraction.
 */
function extractText(html) {
  let text = html;

  // Remove script content (including inline scripts and JSON-LD)
  text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ");

  // Remove style content
  text = text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");

  // Remove noscript content
  text = text.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ");

  // Remove SVG content (icons/graphics don't count as text)
  text = text.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ");

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, " ");

  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/")
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&rsquo;/gi, "'")
    .replace(/&lsquo;/gi, "'")
    .replace(/&rdquo;/gi, '"')
    .replace(/&ldquo;/gi, '"')
    .replace(/&hellip;/gi, "…")
    .replace(/&#\d+;/gi, " "); // Numeric entities

  // Collapse whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/**
 * Calculate text-to-HTML ratio metrics.
 */
function calculateRatio(html) {
  const text = extractText(html);
  const textLength = text.length;
  const htmlLength = html.length;

  return {
    textLength,
    htmlLength,
    ratio: htmlLength > 0 ? textLength / htmlLength : 0,
    textPreview: text.substring(0, 150) + (text.length > 150 ? "..." : ""),
  };
}

/**
 * Fetch a page and compute its text-to-HTML ratio.
 */
async function checkPage(path) {
  const url = `${BASE_URL}${path}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "SEO-Ratio-Checker/2.0",
        Accept: "text/html",
      },
    });

    if (!response.ok) {
      return {
        path,
        url,
        status: response.status,
        error: `HTTP ${response.status}`,
        pass: false,
      };
    }

    const html = await response.text();
    const { textLength, htmlLength, ratio, textPreview } = calculateRatio(html);

    return {
      path,
      url,
      status: response.status,
      textLength,
      htmlLength,
      ratio,
      ratioPercent: `${(ratio * 100).toFixed(1)}%`,
      pass: ratio >= THRESHOLD,
      textPreview,
    };
  } catch (error) {
    return {
      path,
      url,
      error: error.message,
      pass: false,
    };
  }
}

/**
 * Format number with comma separators.
 */
function formatNumber(num) {
  return num?.toLocaleString() ?? "N/A";
}

/**
 * Save JSON report to .seo directory.
 */
function saveReport(results, summary) {
  const reportDir = join(PROJECT_ROOT, ".seo");
  const reportPath = join(reportDir, "ratio-report.json");

  try {
    mkdirSync(reportDir, { recursive: true });

    const report = {
      timestamp: new Date().toISOString(),
      config: {
        baseUrl: BASE_URL,
        threshold: THRESHOLD,
        thresholdPercent: `${(THRESHOLD * 100).toFixed(0)}%`,
        pathPrefix: PATH_PREFIX,
      },
      summary: {
        total: summary.total,
        passed: summary.passed,
        failed: summary.failed,
        averageRatio: summary.avgRatio,
        averageRatioPercent: `${(summary.avgRatio * 100).toFixed(1)}%`,
      },
      results: results.map((r) => ({
        path: r.path,
        url: r.url,
        status: r.status,
        pass: r.pass,
        ratio: r.ratio,
        ratioPercent: r.ratioPercent,
        textLength: r.textLength,
        htmlLength: r.htmlLength,
        error: r.error,
      })),
    };

    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to: ${reportPath}\n`);
  } catch (error) {
    console.error(`⚠️  Could not save report: ${error.message}\n`);
  }
}

/**
 * Main execution.
 */
async function main() {
  console.log(`\n${  "=".repeat(70)}`);
  console.log("🔍 SEO Text-to-HTML Ratio Checker");
  console.log("=".repeat(70));
  console.log(`Base URL:   ${BASE_URL}`);
  console.log(`Threshold:  ${(THRESHOLD * 100).toFixed(0)}% minimum`);
  console.log(`Prefix:     ${PATH_PREFIX}`);
  console.log("=".repeat(70));

  // Dynamically discover routes
  const pages = await discoverLearnRoutes();

  console.log("Checking pages...\n");

  const results = [];

  for (const path of pages) {
    process.stdout.write(`  ${path.padEnd(50)} `);
    const result = await checkPage(path);
    results.push(result);

    if (result.error) {
      console.log(`❌ ERROR: ${result.error}`);
    } else if (result.pass) {
      console.log(`✅ ${result.ratioPercent.padStart(6)}`);
    } else {
      console.log(`❌ ${result.ratioPercent.padStart(6)} (below ${(THRESHOLD * 100).toFixed(0)}%)`);
    }
  }

  // Sort results by ratio ascending (worst first)
  const sortedResults = [...results].sort((a, b) => {
    if (a.ratio === undefined) {return -1;}
    if (b.ratio === undefined) {return 1;}
    return a.ratio - b.ratio;
  });

  // Summary table
  console.log(`\n${  "=".repeat(90)}`);
  console.log("RESULTS (sorted by ratio, worst first)");
  console.log("=".repeat(90));
  console.log(
    "Path".padEnd(50) +
      "Ratio".padStart(8) +
      "Text".padStart(10) +
      "HTML".padStart(12) +
      "Status".padStart(8)
  );
  console.log("-".repeat(90));

  for (const r of sortedResults) {
    if (r.error) {
      console.log(
        r.path.padEnd(50) +
          "N/A".padStart(8) +
          "N/A".padStart(10) +
          "N/A".padStart(12) +
          "ERROR".padStart(8)
      );
    } else {
      const status = r.pass ? "PASS" : "FAIL";
      console.log(
        r.path.padEnd(50) +
          r.ratioPercent.padStart(8) +
          formatNumber(r.textLength).padStart(10) +
          formatNumber(r.htmlLength).padStart(12) +
          status.padStart(8)
      );
    }
  }

  console.log("-".repeat(90));

  // Calculate summary
  const validResults = results.filter((r) => r.ratio !== undefined);
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  const avgRatio =
    validResults.length > 0
      ? validResults.reduce((sum, r) => sum + r.ratio, 0) / validResults.length
      : 0;

  const summary = {
    total: results.length,
    passed,
    failed,
    avgRatio,
  };

  console.log("");
  console.log(`📊 Summary`);
  console.log(`   Total pages:    ${results.length}`);
  console.log(`   Passed:         ${passed} ✅`);
  console.log(`   Failed:         ${failed} ❌`);
  console.log(`   Average ratio:  ${(avgRatio * 100).toFixed(1)}%`);
  console.log("");

  // Save JSON report
  saveReport(results, summary);

  // Exit with error if any failed
  if (failed > 0) {
    console.log("❌ FAILED: Some pages are below the text-to-HTML ratio threshold.");
    console.log(`   Minimum required: ${(THRESHOLD * 100).toFixed(0)}%`);
    console.log("");
    console.log("Failed pages:");
    for (const r of sortedResults.filter((r) => !r.pass)) {
      console.log(`  - ${r.path}: ${r.error || r.ratioPercent}`);
    }
    console.log("");
    console.log("To fix: Add more text content to article bodies and reduce markup bloat.");
    console.log("");
    process.exit(1);
  }

  console.log("✅ SUCCESS: All pages meet the text-to-HTML ratio threshold!");
  console.log("");
  process.exit(0);
}

main().catch((error) => {
  console.error("\n❌ Fatal error:", error.message);
  process.exit(1);
});

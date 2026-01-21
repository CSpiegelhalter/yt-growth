#!/usr/bin/env node
/**
 * Text-to-HTML Ratio Checker
 * 
 * Fetches pages from a local server and computes the ratio of visible text
 * to total HTML. Used to ensure SEO-friendly content density.
 * 
 * Usage:
 *   bun run seo:ratio
 *   BASE_URL=https://staging.example.com bun run seo:ratio
 *   THRESHOLD=0.15 bun run seo:ratio
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const THRESHOLD = parseFloat(process.env.THRESHOLD || "0.12");

// Pages to check
const PAGES = [
  "/contact",
  "/learn",
  "/learn/buy-youtube-views",
  "/learn/how-to-get-more-subscribers",
  "/learn/how-to-go-live-on-youtube",
  "/learn/how-to-make-a-youtube-channel",
  "/learn/youtube-channel-audit",
  "/learn/youtube-competitor-analysis",
  "/learn/youtube-monetization-requirements",
  "/learn/youtube-tag-generator",
  "/learn/youtube-video-ideas",
];

/**
 * Strip HTML tags, scripts, styles, and extract visible text
 */
function extractText(html) {
  // Remove script and style content
  let text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "");

  // Remove JSON-LD structured data (it's metadata, not visible content)
  text = text.replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, "");

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, " ");

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");

  // Normalize whitespace
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

/**
 * Calculate text-to-HTML ratio
 */
function calculateRatio(html) {
  const text = extractText(html);
  const textLength = text.length;
  const htmlLength = html.length;

  return {
    textLength,
    htmlLength,
    ratio: htmlLength > 0 ? textLength / htmlLength : 0,
    text: text.substring(0, 200) + (text.length > 200 ? "..." : ""), // Preview
  };
}

/**
 * Fetch a page and check its ratio
 */
async function checkPage(path) {
  const url = `${BASE_URL}${path}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "SEO-Ratio-Checker/1.0",
        "Accept": "text/html",
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
    const { textLength, htmlLength, ratio, text } = calculateRatio(html);

    return {
      path,
      url,
      status: response.status,
      textLength,
      htmlLength,
      ratio,
      ratioPercent: `${(ratio * 100).toFixed(1)}%`,
      pass: ratio >= THRESHOLD,
      preview: text,
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
 * Format number with commas
 */
function formatNumber(num) {
  return num?.toLocaleString() ?? "N/A";
}

/**
 * Main function
 */
async function main() {
  console.log("\n🔍 Text-to-HTML Ratio Checker");
  console.log("=".repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Threshold: ${(THRESHOLD * 100).toFixed(0)}%`);
  console.log(`Pages: ${PAGES.length}`);
  console.log("=".repeat(60));
  console.log("");

  const results = [];

  for (const path of PAGES) {
    process.stdout.write(`Checking ${path}... `);
    const result = await checkPage(path);
    results.push(result);

    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    } else if (result.pass) {
      console.log(`✅ ${result.ratioPercent}`);
    } else {
      console.log(`❌ ${result.ratioPercent} (below ${(THRESHOLD * 100).toFixed(0)}%)`);
    }
  }

  // Summary table
  console.log("\n" + "=".repeat(90));
  console.log("RESULTS SUMMARY");
  console.log("=".repeat(90));
  console.log(
    "Path".padEnd(45) +
    "Ratio".padStart(10) +
    "Text".padStart(12) +
    "HTML".padStart(12) +
    "Status".padStart(10)
  );
  console.log("-".repeat(90));

  for (const r of results) {
    if (r.error) {
      console.log(
        r.path.padEnd(45) +
        "N/A".padStart(10) +
        "N/A".padStart(12) +
        "N/A".padStart(12) +
        "ERROR".padStart(10)
      );
    } else {
      console.log(
        r.path.padEnd(45) +
        r.ratioPercent.padStart(10) +
        formatNumber(r.textLength).padStart(12) +
        formatNumber(r.htmlLength).padStart(12) +
        (r.pass ? "PASS" : "FAIL").padStart(10)
      );
    }
  }

  console.log("-".repeat(90));

  // Final summary
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  const avgRatio = results
    .filter((r) => r.ratio !== undefined)
    .reduce((sum, r) => sum + r.ratio, 0) / results.filter((r) => r.ratio !== undefined).length;

  console.log("");
  console.log(`Total: ${results.length} pages`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Average ratio: ${(avgRatio * 100).toFixed(1)}%`);
  console.log("");

  // Exit with error if any failed
  if (failed > 0) {
    console.log("❌ Some pages failed the text-to-HTML ratio check.");
    console.log(`   Target: >= ${(THRESHOLD * 100).toFixed(0)}%`);
    console.log("");

    // Show failed pages with previews
    console.log("Failed pages:");
    for (const r of results.filter((r) => !r.pass)) {
      console.log(`  - ${r.path}: ${r.error || r.ratioPercent}`);
      if (r.preview) {
        console.log(`    Preview: "${r.preview.substring(0, 100)}..."`);
      }
    }
    console.log("");

    process.exit(1);
  }

  console.log("✅ All pages passed the text-to-HTML ratio check!");
  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

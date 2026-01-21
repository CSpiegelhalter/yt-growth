#!/usr/bin/env bun
/**
 * Check for non-descriptive anchor text in the codebase
 * 
 * This script scans TSX files for generic anchor text patterns that hurt
 * SEO and AI search indexability. Run as part of CI to prevent regressions.
 * 
 * Usage:
 *   bun scripts/check-anchor-text.ts
 * 
 * Exit codes:
 *   0 - No violations found
 *   1 - Violations found (fails CI)
 */

import { readdir, readFile } from "fs/promises";
import { join, relative } from "path";

// Banned anchor text patterns (case-insensitive exact matches)
// These are non-descriptive and hurt SEO + AI search topic mapping
const BANNED_ANCHOR_TEXT = [
  "Learn More",
  "Learn more",
  "Read More",
  "Read more",
  "Click Here",
  "Click here",
  "click here",
  "Here",
  "More",
  "Details",
  ">Learn<", // Standalone "Learn" as link text
];

// Patterns that indicate anchor text in JSX
// Matches: >Learn More</Link>, >Learn More</a>, etc.
const ANCHOR_PATTERNS = BANNED_ANCHOR_TEXT.map(
  (text) => new RegExp(`>${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</(Link|a)`, "g")
);

// Also check for label/ctaLabel config values
const CONFIG_PATTERNS = BANNED_ANCHOR_TEXT.map(
  (text) => new RegExp(`(label|ctaLabel|linkText):\\s*["']${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`, "gi")
);

interface Violation {
  file: string;
  line: number;
  text: string;
  match: string;
}

async function* walkDir(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    // Skip node_modules, .next, .git
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") {
      continue;
    }
    if (entry.isDirectory()) {
      yield* walkDir(fullPath);
    } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
      yield fullPath;
    }
  }
}

async function checkFile(filePath: string, rootDir: string): Promise<Violation[]> {
  const violations: Violation[] = [];
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n");
  const relativePath = relative(rootDir, filePath);

  lines.forEach((line, index) => {
    // Check anchor patterns
    for (const pattern of ANCHOR_PATTERNS) {
      pattern.lastIndex = 0; // Reset regex state
      const match = pattern.exec(line);
      if (match) {
        violations.push({
          file: relativePath,
          line: index + 1,
          text: line.trim(),
          match: match[0],
        });
      }
    }

    // Check config patterns
    for (const pattern of CONFIG_PATTERNS) {
      pattern.lastIndex = 0;
      const match = pattern.exec(line);
      if (match) {
        violations.push({
          file: relativePath,
          line: index + 1,
          text: line.trim(),
          match: match[0],
        });
      }
    }
  });

  return violations;
}

async function main() {
  const rootDir = process.cwd();
  const allViolations: Violation[] = [];

  console.log("🔍 Checking for non-descriptive anchor text...\n");

  // Scan app/, components/, and lib/ directories
  const dirsToScan = ["app", "components", "lib"];

  for (const dir of dirsToScan) {
    const fullDir = join(rootDir, dir);
    try {
      for await (const file of walkDir(fullDir)) {
        const violations = await checkFile(file, rootDir);
        allViolations.push(...violations);
      }
    } catch {
      // Directory might not exist
    }
  }

  if (allViolations.length === 0) {
    console.log("✅ No non-descriptive anchor text found!\n");
    console.log("All links use descriptive anchor text for better SEO and AI search indexability.");
    process.exit(0);
  }

  console.log(`❌ Found ${allViolations.length} non-descriptive anchor text violation(s):\n`);

  for (const v of allViolations) {
    console.log(`  ${v.file}:${v.line}`);
    console.log(`    Match: ${v.match}`);
    console.log(`    Line:  ${v.text}\n`);
  }

  console.log("Fix these by using descriptive anchor text that reflects the destination page topic.");
  console.log("Example: Instead of 'Learn More', use 'Read YouTube retention analysis guide'\n");
  console.log("See: https://developers.google.com/search/docs/fundamentals/seo-starter-guide#use-links-wisely");

  process.exit(1);
}

main().catch((e) => {
  console.error("Script error:", e);
  process.exit(1);
});

import fs from "fs";
import path from "path";

type Result = {
  cssFile: string;
  unused: string[];
  suspiciousDynamicAccess: boolean;
  importers: string[];
};

const APPS_WEB = process.cwd();

function read(file: string) {
  return fs.readFileSync(file, "utf8");
}

function escapeRegExp(s: string) {
  return s.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

/**
 * Bun-native glob.
 * Returns absolute paths.
 */
async function bunGlob(pattern: string, cwdAbs: string): Promise<string[]> {
  const glob = new Bun.Glob(pattern);
  const out: string[] = [];
  for await (const rel of glob.scan({ cwd: cwdAbs, onlyFiles: true })) {
    out.push(path.join(cwdAbs, rel));
  }
  return out;
}

/**
 * Extract simple class names from `.module.css`.
 * Captures `.foo`, `.foo-bar`, `._private`, etc.
 */
function extractCssModuleClasses(css: string): Set<string> {
  const out = new Set<string>();
  const re = /\.([a-zA-Z_][a-zA-Z0-9_-]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) {out.add(m[1]);}
  return out;
}

/**
 * Find import variable names for this module within a file.
 * Matches:
 *   import s from "./style.module.css";
 *   import styles from "../x/style.module.css";
 */
function findImportNames(code: string, moduleCssBaseName: string): string[] {
  const names: string[] = [];
  const re = new RegExp(
    String.raw`import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s+["'][^"']*${escapeRegExp(
      moduleCssBaseName,
    )}["']`,
    "g",
  );
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {names.push(m[1]);}
  return names;
}

/**
 * Detect suspicious dynamic access like:
 *   s[someVar]
 *   s[`foo-${bar}`]
 * If we detect this, we should not auto-delete in that file without manual review.
 */
function detectDynamicIndexedAccess(code: string, importName: string): boolean {
  // s[ <anything not starting with quote> ... ]
  const re = new RegExp(
    String.raw`\b${escapeRegExp(importName)}\s*\[\s*[^"'\s]`,
    "m",
  );
  return re.test(code);
}

function countUsages(
  code: string,
  importName: string,
  className: string,
): number {
  const dot = new RegExp(
    String.raw`\b${escapeRegExp(importName)}\.${escapeRegExp(className)}\b`,
    "g",
  );
  const bracketDq = new RegExp(
    String.raw`\b${escapeRegExp(importName)}\s*\[\s*"${escapeRegExp(className)}"\s*\]`,
    "g",
  );
  const bracketSq = new RegExp(
    String.raw`\b${escapeRegExp(importName)}\s*\[\s*'${escapeRegExp(className)}'\s*\]`,
    "g",
  );

  return (
    (code.match(dot)?.length ?? 0) +
    (code.match(bracketDq)?.length ?? 0) +
    (code.match(bracketSq)?.length ?? 0)
  );
}

/**
 * Conservative importer filter:
 * - If file text includes the css base name AND "module.css", treat as candidate importer.
 * This avoids needing Node glob deps and stays reliable enough for most repos.
 */
function isLikelyImporter(code: string, cssBaseName: string): boolean {
  return (
    code.includes(cssBaseName) &&
    code.includes("module.css") &&
    code.includes("import")
  );
}

function findImporterCandidates(codeFiles: string[], cssBase: string): string[] {
  return codeFiles.filter((f) => isLikelyImporter(read(f), cssBase));
}

function collectUsages(
  importerCandidates: string[],
  cssBase: string,
  classes: Set<string>,
): { used: Set<string>; suspiciousDynamicAccess: boolean } {
  const used = new Set<string>();
  let suspiciousDynamicAccess = false;

  for (const importer of importerCandidates) {
    const code = read(importer);
    const importNames = findImportNames(code, cssBase);

    for (const importName of importNames) {
      if (detectDynamicIndexedAccess(code, importName)) {
        suspiciousDynamicAccess = true;
      }
      for (const cls of classes) {
        if (countUsages(code, importName, cls) > 0) {used.add(cls);}
      }
    }
  }

  return { used, suspiciousDynamicAccess };
}

function analyzeCssModule(cssFile: string, codeFiles: string[]): Result | null {
  const css = read(cssFile);
  const classes = extractCssModuleClasses(css);
  if (classes.size === 0) {return null;}

  const cssBase = path.basename(cssFile);
  const importerCandidates = findImporterCandidates(codeFiles, cssBase);

  if (importerCandidates.length === 0) {
    return {
      cssFile,
      unused: [...classes].sort(),
      suspiciousDynamicAccess: true,
      importers: [],
    };
  }

  const { used, suspiciousDynamicAccess } = collectUsages(importerCandidates, cssBase, classes);

  const unused = [...classes]
    .filter((c) => !used.has(c))
    .sort();

  if (unused.length === 0) {return null;}

  return {
    cssFile,
    unused,
    suspiciousDynamicAccess,
    importers: importerCandidates,
  };
}

async function main() {
  const cssFiles = await bunGlob("**/*.module.css", APPS_WEB);
  const codeFiles = [
    ...(await bunGlob("**/*.ts", APPS_WEB)),
    ...(await bunGlob("**/*.tsx", APPS_WEB)),
    ...(await bunGlob("**/*.js", APPS_WEB)),
    ...(await bunGlob("**/*.jsx", APPS_WEB)),
  ];

  const results: Result[] = [];

  for (const cssFile of cssFiles) {
    const result = analyzeCssModule(cssFile, codeFiles);
    if (result) {results.push(result);}
  }

  const reportPath = path.join(APPS_WEB, ".css-modules-unused.json");
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`Wrote report: ${reportPath}`);
  console.log(`Files with unused classes: ${results.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

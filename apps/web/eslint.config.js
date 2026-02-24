import eslintCommentsPlugin from "@eslint-community/eslint-plugin-eslint-comments";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import boundaries from "eslint-plugin-boundaries";
import importX from "eslint-plugin-import-x";
import jsxA11y from "eslint-plugin-jsx-a11y";
import promise from "eslint-plugin-promise";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import unusedImports from "eslint-plugin-unused-imports";

// Reuse the jsx-a11y plugin instance registered by next/core-web-vitals
// so we can add recommended rules without a "Cannot redefine plugin" error.
const nextJsxA11yPlugin =
  nextCoreWebVitals.find((c) => c.plugins?.["jsx-a11y"])?.plugins?.[
    "jsx-a11y"
  ] ?? jsxA11y;

/** @type {import("eslint").Linter.FlatConfig[]} */
const config = [
  { ignores: [".jscpd-report/**", ".next/**"] },

  ...nextCoreWebVitals,

  // ── Ban eslint-disable comments (fix the issue, never suppress it) ─
  {
    plugins: { "@eslint-community/eslint-comments": eslintCommentsPlugin },
    rules: {
      "@eslint-community/eslint-comments/no-use": ["error", { allow: [] }],
    },
  },

  // ── Promise correctness ─────────────────────────────────────────────
  promise.configs["flat/recommended"],

  // ── Accessibility (jsx-a11y recommended) ────────────────────────────
  {
    plugins: { "jsx-a11y": nextJsxA11yPlugin },
    rules: jsxA11y.flatConfigs.recommended.rules,
  },

  // ── Unicorn (modern JS best practices) ──────────────────────────────
  {
    ...unicorn.configs["flat/recommended"],
    rules: {
      ...unicorn.configs["flat/recommended"].rules,
      "unicorn/prefer-node-protocol": "off",
      "unicorn/no-null": "off",
      "unicorn/prevent-abbreviations": "off",
      "unicorn/no-array-reduce": "off",
      "unicorn/no-array-for-each": "off",
      "unicorn/filename-case": "off",
      "unicorn/prefer-global-this": "off",
      "unicorn/no-negated-condition": "off",
      "unicorn/no-array-callback-reference": "off",
      "unicorn/no-nested-ternary": "off",
      "unicorn/prefer-top-level-await": "off",
      "unicorn/consistent-function-scoping": "warn",
      "unicorn/text-encoding-identifier-case": "off",
      "unicorn/no-process-exit": "off",
      "unicorn/prefer-code-point": "off",
      "unicorn/import-style": "off",
      "unicorn/prefer-single-call": "off",
      "unicorn/prefer-query-selector": "off",
      "unicorn/prefer-add-event-listener": "off",
      "unicorn/no-array-sort": "off",
      "unicorn/numeric-separators-style": "off",
    },
  },

  // ── Import sorting & hygiene ────────────────────────────────────────
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
      "import-x": importX,
      "unused-imports": unusedImports,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "import-x/first": "error",
      "import-x/newline-after-import": "error",
      "import-x/no-duplicates": "error",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },

  // ── TypeScript strict rules ─────────────────────────────────────────
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        {
          "ts-ignore": "allow-with-description",
          "ts-expect-error": "allow-with-description",
          minimumDescriptionLength: 10,
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-require-imports": "error",
      "@typescript-eslint/prefer-as-const": "error",
      "@typescript-eslint/no-duplicate-enum-values": "error",
      "@typescript-eslint/no-unnecessary-type-constraint": "error",
      "@typescript-eslint/no-useless-empty-export": "error",

      // Type-checked rules (require projectService above)
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-floating-promises": "error",
    },
  },

  // ── Core code-quality rules ─────────────────────────────────────────
  {
    rules: {
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-var": "error",
      "prefer-const": "error",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-debugger": "error",
      curly: ["error", "all"],
      "no-throw-literal": "error",
      "prefer-template": "error",
      "no-else-return": ["error", { allowElseIf: false }],
      "object-shorthand": ["error", "always"],
      "no-useless-rename": "error",
      "no-unneeded-ternary": "error",
      "prefer-object-spread": "error",
      "no-lonely-if": "error",
      "prefer-arrow-callback": ["error", { allowNamedFunctions: true }],
      "no-param-reassign": ["error", { props: false }],
      complexity: ["error", 15],
    },
  },

  // ── SonarJS (code smells + complexity) ──────────────────────────────
  {
    plugins: { sonarjs },
    rules: {
      "sonarjs/no-duplicated-branches": "warn",
      "sonarjs/cognitive-complexity": ["error", 20],
    },
  },

  // ── React overrides ─────────────────────────────────────────────────
  {
    rules: {
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/static-components": "off",
    },
  },

  // ── Server component guardrails ─────────────────────────────────────
  {
    files: [
      "app/**/page.tsx",
      "app/**/layout.tsx",
      "app/**/loading.tsx",
      "app/**/error.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "react",
              importNames: [
                "useState",
                "useEffect",
                "useMemo",
                "useCallback",
              ],
              message:
                "Server components must not use client hooks. Move interactivity into a small 'use client' component.",
            },
          ],
        },
      ],
    },
  },

  // ── Test file globals ───────────────────────────────────────────────
  {
    files: ["tests/**/*", "e2e/**/*", "scripts/**/*", "lib/__tests__/**/*"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        beforeEach: "readonly",
        afterAll: "readonly",
        afterEach: "readonly",
        vi: "readonly",
      },
    },
  },

  // ── Architecture boundaries ──────────────────────────────────────────
  {
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "server", pattern: ["lib/server/**"] },
        { type: "shared", pattern: ["lib/shared/**"] },
        { type: "client-lib", pattern: ["lib/client/**"] },
        { type: "features", pattern: ["lib/features/**"] },
        { type: "adapters", pattern: ["lib/adapters/**"] },
        { type: "ports", pattern: ["lib/ports/**"] },
        { type: "api", pattern: ["lib/api/**"] },
        { type: "components", pattern: ["components/**"] },
        { type: "app", pattern: ["app/**"] },
        { type: "legacy-lib", pattern: ["lib/**"] },
      ],
      "boundaries/ignore": [
        "**/*.test.ts",
        "**/*.test.tsx",
        "tests/**",
        "**/__tests__/**",
        "scripts/**",
        "*.config.*",
        "prisma/**",
      ],
    },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "allow",
          rules: [
            { from: ["client-lib"], disallow: ["server"] },
            {
              from: ["shared"],
              disallow: ["server", "client-lib", "app", "components"],
            },
            {
              from: ["ports"],
              disallow: [
                "features",
                "adapters",
                "server",
                "client-lib",
                "components",
                "app",
                "api",
                "legacy-lib",
              ],
            },
            { from: ["features"], disallow: ["server", "app"] },
            { from: ["adapters"], disallow: ["features", "components", "app"] },
          ],
        },
      ],
    },
  },

  // ── Relax some rules for config & scripts ───────────────────────────
  {
    files: [
      "*.config.{js,mjs,cjs,ts}",
      "next.config.js",
      "scripts/**/*",
      "prisma/**/*",
    ],
    rules: {
      "unicorn/prefer-module": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },

  // ── proxy.ts: Next.js middleware config must be statically analyzable ─
  {
    files: ["proxy.ts"],
    rules: {
      "unicorn/prefer-string-raw": "off",
    },
  },
];

export default config;

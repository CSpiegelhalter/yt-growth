const unusedImports = require("eslint-plugin-unused-imports");
const nextCoreWebVitals = require("eslint-config-next/core-web-vitals");

/** @type {import("eslint").Linter.FlatConfig[]} */
module.exports = [
  // Keep Next's recommended ruleset.
  ...nextCoreWebVitals,
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
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
      // These are great rules, but they're very noisy for content-heavy JSX
      // and can block unrelated refactors/cleanup.
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/static-components": "off",
    },
  },
  {
    // Next's compat config doesn't always set language options for tests;
    // keep this minimal and explicit.
    files: ["tests/**/*", "e2e/**/*", "scripts/**/*", "lib/__tests__/**/*"],
    languageOptions: {
      globals: {
        // Vitest globals
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
];


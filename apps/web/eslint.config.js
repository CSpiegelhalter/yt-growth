import unusedImports from "eslint-plugin-unused-imports";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import sonarjs from "eslint-plugin-sonarjs";

/** @type {import("eslint").Linter.FlatConfig[]} */
const config = [
  { ignores: [".jscpd-report/**"] },

  ...nextCoreWebVitals,

  // ── Unused imports ──────────────────────────────────────────────────
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
      "react/no-unescaped-entities": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/static-components": "off",
    },
  },

  // ── TypeScript strict rules ─────────────────────────────────────────
  {
    files: ["**/*.ts", "**/*.tsx"],
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

  // ── SonarJS (code smells) ──────────────────────────────────────────
  {
    plugins: { sonarjs },
    rules: {
      "sonarjs/no-duplicated-branches": "warn",
    },
  },
];

export default config;

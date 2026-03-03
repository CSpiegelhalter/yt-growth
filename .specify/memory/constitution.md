<!--
  Sync Impact Report
  ==================
  Version change: 1.0.0 → 1.1.0 (MINOR)

  Modified principles:
  - "I. Hexagonal Architecture" — added docs/ARCHITECTURE.md as
    authoritative source; expanded to include forbidden imports,
    naming conventions, error model, and validation policy by ref.
  - "IV. Design System Compliance" — added styles.md as
    authoritative source; expanded to include gradient tokens,
    utility classes, and file map by ref.

  Added sections:
  - "Authoritative Reference Documents" (new section between
    Core Principles and Technology & Platform Constraints)

  Removed sections: None

  Templates requiring updates:
  - .specify/templates/plan-template.md — ✅ compatible
    (Constitution Check section references constitution dynamically)
  - .specify/templates/spec-template.md — ✅ compatible
    (No constitution-specific references to update)
  - .specify/templates/tasks-template.md — ✅ compatible
    (No constitution-specific references to update)
  - .specify/templates/commands/*.md — ✅ no command files exist

  Follow-up TODOs: None
-->

# YT Growth Constitution

## Core Principles

### I. Hexagonal Architecture (NON-NEGOTIABLE)

All code MUST follow the hexagonal (ports + adapters) layered
architecture defined in **`docs/ARCHITECTURE.md`** — the single
source of truth for layer boundaries, dependency direction, and
code placement.

Key constraints enforced by constitution:

- **Dependency direction** (strict, one-way):
  `app/` + `components/` → `lib/features/` → `lib/ports/`
  ← `lib/adapters/`. `lib/shared/` is a leaf layer.
- **Forbidden imports**: The forbidden-imports table in
  `docs/ARCHITECTURE.md` §1 MUST be followed. Violations are
  caught by `depcruise` in the pre-flight suite.
- **Entrypoints** (`app/`) MUST remain thin — orchestrate only.
- **UI components** (`components/`) MUST NOT contain domain logic.
- **External I/O** MUST live in `lib/adapters/` behind port
  interfaces defined in `lib/ports/`.
- **Domain logic** MUST live in `lib/features/`.
- **Cross-domain utilities** MUST live in `lib/shared/` and MUST
  be used by 3+ domains to justify existence.
- **Naming conventions**: Follow `docs/ARCHITECTURE.md` §4
  (kebab-case folders/files, PascalCase components/types,
  camelCase functions, schema/error suffixes).
- **Error model**: All domain errors MUST extend `DomainError`
  per `docs/ARCHITECTURE.md` §5. Route handlers map via
  `toApiError()`.
- **Validation policy**: Zod schemas in feature `schemas.ts`,
  validated at the route layer via `withValidation()`, per
  `docs/ARCHITECTURE.md` §6.

**Rationale**: Enforces separation of concerns, keeps domain logic
testable without infrastructure, and prevents coupling to external
services. The architecture doc provides the detailed specification;
this principle makes it constitutionally binding.

### II. Verified-Change Workflow (NON-NEGOTIABLE)

Every code modification MUST pass the pre-flight suite before the
task is considered complete. No exceptions.

- Run `make preflight` from the repo root after every change.
- This executes all six checks (build, lint, knip, madge,
  depcruise, jscpd), compares against `.agent/baseline.json`,
  and outputs the comparison table.
- Regressions in any metric = task failure. Fix before completing.
- The baseline auto-updates when metrics improve.
- Individual checks MUST NOT be run separately — always use
  `make preflight`.

**Rationale**: Prevents code quality decay by catching regressions
immediately. The baseline ensures the project never moves backward.

### III. Server-First Rendering

All pages and data fetching MUST default to React Server Components
and server-side data fetching.

- Minimize `'use client'`, `useEffect`, and `useState`.
- Client components are permitted ONLY for: interactive UI state,
  browser-only APIs, or realtime UX.
- Pages MUST remain thin: compose smaller components and delegate
  to `lib/features/`.
- Use server actions or route handlers for mutations.
- Server vs client separation rules in `docs/ARCHITECTURE.md` §3
  MUST be followed (server-only imports, `'use client'` placement,
  hook locations).

**Rationale**: Reduces client bundle size, improves SEO and
performance, and keeps rendering predictable.

### IV. Design System Compliance (NON-NEGOTIABLE)

All UI code MUST follow the brand design system defined in
**`styles.md`** (repo root) — the single source of truth for
colors, typography, gradients, and reusable UI components.

Key constraints enforced by constitution:

- **Brand colors**: Use CSS variables only (`--color-hot-rose`,
  `--color-imperial-blue`, `--color-lavender-mist`,
  `--color-cool-sky`, `--color-stormy-teal`). NEVER hardcode hex
  values outside `globals.css` `:root`.
- **Gradient tokens**: Use `--gradient-positive`,
  `--gradient-negative`, `--gradient-neutral` per `styles.md`.
- **Typography**: Use Fustat font classes (`.text-h1`,
  `.text-subtitle`, `.text-body`) or React components (`<H1>`,
  `<Subtitle>`, `<Text>` from `@/components/ui`). General-purpose
  size tokens (`--text-xs` through `--text-4xl`) for supporting UI.
- **Tags/pills/badges**: Use the shared `<Tag>` component with
  variants (`positive`, `negative`, `neutral`). NEVER create
  ad-hoc badge/chip/pill styles.
- **Spacing**: 4pt grid only. All margins/padding/gaps MUST be
  multiples of 4.
- **Mobile-first**: Design for small screens first, enhance
  at `md+`.
- **File map**: Token definitions live in `globals.css` `:root`.
  Components in `components/ui/`. See `styles.md` file map for
  authoritative locations.

**Rationale**: Ensures visual consistency, reduces design debt,
and prevents divergent one-off patterns. The styles doc provides
the detailed specification; this principle makes it
constitutionally binding.

### V. Code Minimalism

Write the minimum code needed for the current task. Complexity
MUST be justified.

- One component per file. Hooks in separate files. Pure logic
  in separate files.
- Target <150 lines per file. Exceeding this signals extraction
  is needed.
- Named exports only — no default exports.
- File naming: kebab-case files, camelCase functions, PascalCase
  types.
- Do NOT add features, abstractions, error handling, or
  configurability beyond what the task requires.
- Three similar lines of code are better than a premature
  abstraction.
- Never add `eslint-disable` comments. Fix the underlying issue.

**Rationale**: Small files are easier to read, review, and test.
Premature abstraction creates maintenance burden without
delivering value.

## Authoritative Reference Documents

The following documents are constitutionally binding. All rules,
conventions, and specifications within them carry the same
authority as principles defined in this constitution.

| Document | Path | Governs |
|----------|------|---------|
| Architecture | `docs/ARCHITECTURE.md` | Layer definitions, dependency direction, forbidden imports, naming conventions, error model, validation policy, server/client separation, migration plan |
| Design System | `styles.md` | Brand colors, gradient tokens, typography scale, Tag component spec, utility classes, file map |
| UI Style Rules | `.claude/rules/style.md` | Spacing system, visual hierarchy, accessibility, interaction states, mobile-first patterns, definition of done |
| Layer Guardrails | `.claude/rules/layer-guardrails.md` | Per-layer README enforcement before code modifications |
| No eslint-disable | `.claude/rules/no-eslint-disable.md` | Zero tolerance for inline eslint suppression |

When conflicts exist between this constitution and a reference
document, this constitution takes precedence. When this
constitution is silent on a topic covered by a reference document,
the reference document governs.

## Technology & Platform Constraints

- **Runtime**: Bun (MUST use `bun` commands; never npm or yarn).
- **Framework**: Next.js App Router (`app/` directory).
- **No Next.js middleware**: use `proxy.ts` for request proxying.
- **Database**: Supabase Postgres with pgvector; Prisma for ORM.
- **Auth**: NextAuth.js with Google OAuth.
- **Payments**: Stripe (webhook routes are externally-invoked
  entrypoints — never assume unused).
- **State management**: Zustand for global UI state,
  TanStack React Query for client fetching/caching.
- **HTTP**: Native `fetch` in adapters (no axios).
- **Worker**: Python pipeline (embed, cluster, score, rank).
- **Domain errors**: extend `DomainError` from
  `lib/shared/errors.ts`.
- **Validation**: Zod schemas in
  `lib/features/<domain>/schemas.ts`.
- **Adapters**: MUST include `import "server-only"` at the top.
- **Logging**: `import { createLogger } from
  "@/lib/shared/logger"`.

## Development Workflow & Quality Gates

- **Implementation method**:
  1. Analyze requirements and constraints.
  2. Plan the smallest safe change set.
  3. Implement step-by-step.
  4. Review for edge cases, performance, security.
  5. Run `make preflight`.
  6. Output the comparison table. Fix regressions. Baseline
     auto-updates on improvement.
- **Safe refactors**: Do not delete routes/files/exports unless
  confirmed unused by BOTH IDE references AND repo-wide search
  (including dynamic imports, string references, scripts, tests).
- **SEO**: Pages MUST be indexable and fast. Use
  `generateMetadata`, unique titles/descriptions per route,
  `next/image`, and responsive mobile-first layouts.
- **Accessibility**: Semantic HTML, keyboard navigation, ARIA
  attributes, focus management, and sufficient color contrast
  are required for all UI work.
- **Stripe webhooks**: Never remove or refactor webhook code
  without verifying event types, handling paths, idempotency,
  and signature verification.

## Governance

This constitution is the authoritative source of project
principles and constraints. It supersedes ad-hoc practices and
informal conventions.

- **Amendments**: Any change to this constitution MUST be
  documented with a version bump, rationale, and migration plan
  for affected code.
- **Versioning**: Follows semantic versioning:
  - MAJOR: Principle removal or backward-incompatible
    redefinition.
  - MINOR: New principle or materially expanded guidance.
  - PATCH: Clarifications, wording, or non-semantic refinements.
- **Compliance**: All code changes, reviews, and feature
  specifications MUST verify compliance with these principles.
  The `make preflight` suite enforces measurable quality gates.
- **Runtime guidance**: See `.claude/rules/` for detailed
  enforcement rules aligned with these principles.
- **Reference document updates**: Changes to any document listed
  in the Authoritative Reference Documents table MUST be treated
  as constitutional amendments and follow the same versioning
  and review process.

**Version**: 1.1.0 | **Ratified**: 2026-03-03 | **Last Amended**: 2026-03-03

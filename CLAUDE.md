# Claude Code Instructions

All project rules live in `.claude/rules/`. Follow ALL of them for EVERY task.

- **Runtime**: `bun` (not npm/yarn). Use `make` targets when available.
- **Verified-Change Workflow**: Run `make preflight` after every code change. Compare against `.agent/baseline.json`. Regressions = task failure.
- **No `eslint-disable`**: Fix the underlying issue instead.

## Active Technologies
- TypeScript 5.x, React 19, Next.js 15 (App Router) + next-auth (session), Prisma (user/channel queries), CSS Modules (005-access-gate)
- Existing PostgreSQL via Prisma (no schema changes) (005-access-gate)
- TypeScript 5.x + React 19, Next.js 15 (App Router), Zod, Prisma, next-auth (006-creator-profile)
- PostgreSQL via Prisma (`ChannelProfile.inputJson` TEXT field stores JSON) (006-creator-profile)
- TypeScript 5.x + React 19, Next.js 15 (App Router), Zod, next-auth (007-analyze-page)
- PostgreSQL via Prisma (read-only for this feature — analysis caching handled by existing competitor pipeline) (007-analyze-page)
- TypeScript 5.x + React 19, Next.js 15 (App Router), next-auth, CSS Modules (008-nav-routing-cleanup)
- N/A (no database changes) (008-nav-routing-cleanup)
- TypeScript 5.x + React 19, Next.js 15 (App Router), next-auth, Stripe (existing) (010-pricing-page)
- PostgreSQL via Prisma (read-only — Subscription table, no schema changes) (010-pricing-page)
- PostgreSQL via Prisma (read-only — no schema changes) (001-account-page-refactor)
- PostgreSQL via Prisma (read-only — no schema changes); localStorage for dismissal state (011-profile-completion-popup)
- TypeScript 5.x + React 19, Next.js 15 (App Router), CSS Modules + globals.css (012-landing-page-redesign)
- TypeScript 5.x + React 19, Next.js 15 (App Router), Prisma, next-auth, Zod, OpenAI (via lib/llm.ts) (014-competitor-backed-ideas)
- PostgreSQL via Prisma (one new column on VideoIdea) (014-competitor-backed-ideas)

## Recent Changes
- 005-access-gate: Added TypeScript 5.x, React 19, Next.js 15 (App Router) + next-auth (session), Prisma (user/channel queries), CSS Modules

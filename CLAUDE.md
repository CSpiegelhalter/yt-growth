# Claude Code Instructions

## Mandatory Rules

All project rules live in `.claude/rules/`. Read and follow ALL of them for EVERY task — no exceptions.

### Rule files:
- **`.claude/rules/rule.md`** — Master rules: architecture, code quality, verified-change workflow, pre-flight suite
- **`.claude/rules/design-system.md`** — Design system and component patterns
- **`.claude/rules/style.md`** — Styling conventions and CSS rules
- **`.claude/rules/no-eslint-disable.md`** — Never use eslint-disable comments
- **`.claude/rules/layer-guardrails.md`** — Layer boundary enforcement (dependency direction)

### Key non-negotiables:
- **Verified-Change Workflow**: Run the full pre-flight suite after every code change and output the comparison table. Never skip this.
- **Baseline tracking**: Compare against `.agent/baseline.json`. Regressions = task failure.
- **Architecture**: Follow the hexagonal architecture (ports + adapters). Respect dependency direction.
- **File structure**: One component per file, <150 lines, hooks in separate files.
- **Runtime**: Use `bun`, not npm or yarn.
- **No `eslint-disable`**: Never add eslint-disable comments. Fix the underlying issue instead.
- **Styling**: Follow the design system and style rules exactly.

## Active Technologies
- TypeScript 5.6.0, React 19.0.0, Node 18+ + Next.js 16.0.0, Zod 3.23.8, Prisma 5.22.0, (001-frontend-refactor)
- Supabase Postgres with pgvector (via Prisma) (001-frontend-refactor)
- TypeScript 5.6.0, React 19.0.0, Node 18+ + Next.js 16.0.0, Prisma 5.22.0, Zod 3.23.8, OpenAI (LLM), SerpAPI (transcripts), DataForSEO (SERP/trends) (002-video-perf-optimization)

## Recent Changes
- 001-frontend-refactor: Added TypeScript 5.6.0, React 19.0.0, Node 18+ + Next.js 16.0.0, Zod 3.23.8, Prisma 5.22.0,

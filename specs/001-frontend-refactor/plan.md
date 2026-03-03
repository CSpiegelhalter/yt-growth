# Implementation Plan: Frontend Component Audit & Refactor

**Branch**: `001-frontend-refactor` | **Date**: 2026-03-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-frontend-refactor/spec.md`

## Summary

Comprehensive refactor of the `apps/web` frontend to eliminate UI
duplication, extract reusable hooks, enforce server-first rendering
with leaf-level client boundaries, reorganize file structure, and
enable high-impact Next.js 16 performance features. The refactor
spans 8 user stories covering: shared UI component library (Button,
StatusBadge, FilterPill, Input, Select, ErrorBanner), custom hook
extraction, CSS hygiene, file reorganization with `_components/`
convention, PageContainer adoption, "use client" boundary
enforcement with 100kb First Load JS budget, Next.js config
enablements (Turbopack, React Compiler, PPR, AVIF), and page-level
Zod validation.

## Technical Context

**Language/Version**: TypeScript 5.6.0, React 19.0.0, Node 18+
**Primary Dependencies**: Next.js 16.0.0, Zod 3.23.8, Prisma 5.22.0,
Recharts 3.7.0, Konva 10.0.12, Zustand, TanStack React Query
**Storage**: Supabase Postgres with pgvector (via Prisma)
**Testing**: Vitest (unit), Playwright (e2e)
**Target Platform**: Web (Vercel deployment), mobile-first responsive
**Project Type**: Monorepo web application (Next.js App Router)
**Performance Goals**: <100kb First Load JS per page, LCP improvement
via AVIF + priority images, instant static shells via PPR
**Constraints**: Zero visual regressions, pre-flight baseline must
not regress, bun-only runtime
**Scale/Scope**: ~126 "use client" files, 20+ CSS modules with
duplication, 7+ components over 150 lines, 15+ pages to migrate

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1
design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Hexagonal Architecture | PASS | New UI components go in `components/ui/`. Hooks go in `lib/hooks/` or `components/features/<domain>/`. No domain logic in components. Dependency direction preserved. |
| II. Verified-Change Workflow | PASS | Every batch runs `make preflight`. Budget enforcement added to pre-flight. |
| III. Server-First Rendering | PASS | Core goal of US6. Pushing "use client" to leaf level, eliminating useEffect data fetching. |
| IV. Design System Compliance | PASS | New components follow CSS variables, 4pt grid, Fustat typography. Modeled after existing Tag component. |
| V. Code Minimalism | PASS | <150 lines per file. Named exports. No premature abstraction — each new component addresses 3+ duplication instances. |

**All gates pass. No violations to justify.**

## Project Structure

### Documentation (this feature)

```text
specs/001-frontend-refactor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (component catalog)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (component APIs)
│   ├── ui-components.md
│   └── hooks.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/web/
├── next.config.js                    # US7: Turbopack, React Compiler,
│                                     #   PPR, AVIF config
├── app/
│   ├── globals.css                   # US3: line-height tokens added
│   ├── (app)/
│   │   ├── competitors/
│   │   │   ├── page.tsx              # US8: Zod searchParams
│   │   │   ├── CompetitorsClient.tsx # US6: server/client split
│   │   │   └── _components/         # US4: moved from flat
│   │   │       ├── CompetitorFilters.tsx
│   │   │       ├── CompetitorResultsStream.tsx
│   │   │       ├── CompetitorSearchPanel.tsx
│   │   │       └── CompetitorVideoCard.tsx
│   │   ├── trending/
│   │   │   ├── page.tsx              # US8: Zod searchParams
│   │   │   ├── TrendingClient.tsx    # US2+US6: hook extraction +
│   │   │   │                         #   client boundary
│   │   │   └── _components/
│   │   │       └── NicheDiscoveryCard.tsx
│   │   ├── goals/
│   │   │   ├── page.tsx              # US5: PageContainer (already)
│   │   │   ├── GoalsClient.tsx       # US2: hook extraction
│   │   │   └── _components/
│   │   │       ├── BadgeArt.tsx      # US4: moved from components/
│   │   │       └── BadgeDetailModal.tsx
│   │   ├── thumbnails/
│   │   │   ├── ThumbnailsClient.tsx  # US2+US6: decompose 1339 lines
│   │   │   └── _components/          # US4: extracted sub-components
│   │   ├── saved-ideas/
│   │   │   └── SavedIdeasClient.tsx  # US2: hook extraction
│   │   ├── video/[videoId]/
│   │   │   └── page.tsx              # US8: Zod params
│   │   ├── profile/
│   │   │   ├── page.tsx              # US5: PageContainer
│   │   │   └── _components/          # US4: moved from components/
│   │   │       ├── ChannelCard.tsx
│   │   │       ├── AccountStats.tsx
│   │   │       └── BillingCTA.tsx
│   │   └── subscriber-insights/
│   │       └── page.tsx              # US5: PageContainer
│   ├── (marketing)/
│   │   ├── keywords/
│   │   │   └── KeywordResearchClient.tsx  # US2: hook extraction
│   │   └── tags/
│   │       └── _components/          # US4: reorganize
│   └── videos/
│       ├── page.tsx                  # US5: PageContainer
│       └── DashboardClient.tsx       # US2+US6: decompose 580 lines
├── components/
│   └── ui/
│       ├── index.ts                  # US1: updated barrel exports
│       ├── Button.tsx                # US1: NEW
│       ├── Button.module.css         # US1: NEW
│       ├── StatusBadge.tsx           # US1: NEW
│       ├── StatusBadge.module.css    # US1: NEW
│       ├── FilterPill.tsx            # US1: NEW
│       ├── FilterPill.module.css     # US1: NEW
│       ├── Input.tsx                 # US1: NEW
│       ├── Input.module.css          # US1: NEW
│       ├── Select.tsx                # US1: NEW
│       ├── Select.module.css         # US1: NEW
│       ├── ErrorBanner.tsx           # US1: NEW
│       └── ErrorBanner.module.css    # US1: NEW
└── lib/
    └── hooks/
        ├── use-async.ts             # US2: NEW — async data fetch
        ├── use-search-state.ts      # US2: NEW — search/filter + URL
        ├── use-polling.ts           # US2: NEW — polling with cleanup
        └── use-session-storage.ts   # US2: NEW — session persistence
```

**Structure Decision**: Existing monorepo structure preserved. All
changes occur within `apps/web/`. New UI components follow the
established Tag component pattern (`.tsx` + `.module.css` pair in
`components/ui/`). New hooks follow the `lib/hooks/` pattern with
kebab-case file naming.

## Complexity Tracking

> No Constitution Check violations. No complexity justification needed.

| Decision | Rationale |
|----------|-----------|
| 6 new UI components | Each addresses 3+ instances of duplication (audit-verified). Below the "premature abstraction" threshold. |
| 4 new hooks | Each addresses 3+ instances of duplicated state logic. Follows existing hook patterns. |
| _components/ convention | Adopts pattern already used in learn/ and competitors/video/. Not a new invention. |

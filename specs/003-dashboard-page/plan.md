# Implementation Plan: Dashboard Page

**Branch**: `003-dashboard-page` | **Date**: 2026-03-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-dashboard-page/spec.md`

## Summary

Build a new Dashboard page at `/dashboard` as the app's primary entry point. The page features a two-panel layout: a reusable channel overview chart (extracted from the Videos page) on the left, and a Video Suggestions panel with 4 cards (1 explainer + 3 AI-generated idea cards) on the right. Each idea card has save/dismiss/use actions with immediate backfill. The page works for both authenticated and unauthenticated users via a non-blocking auth prompt. Navigation, sitemap, robots.txt, and llm.txt are updated accordingly.

## Technical Context

**Language/Version**: TypeScript 5.6.0, React 19.0.0, Node 18+
**Primary Dependencies**: Next.js 16.0.0 (App Router), Prisma 5.22.0, Zod 3.23.8, OpenAI (LLM for idea generation), Recharts (charts)
**Storage**: Supabase Postgres via Prisma — new `VideoSuggestion` table
**Testing**: `make preflight` (build, lint, knip, madge, depcruise, jscpd)
**Target Platform**: Web (server-rendered + client hydration)
**Project Type**: Web application (Next.js monorepo)
**Performance Goals**: Dashboard loads within 2s (SC-001), suggestion actions complete on first click (SC-003)
**Constraints**: Mobile-first responsive, 4pt spacing grid, CSS variables only, <150 lines per file
**Scale/Scope**: Single new page + 1 new Prisma model + ~15 new/modified files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Check

| Principle | Status | Notes |
| --------- | ------ | ----- |
| I. Hexagonal Architecture | PASS | New domain logic in `lib/features/suggestions/`, API routes in `app/api/`, UI in `components/` and `app/dashboard/`. Dependency direction respected. |
| II. Verified-Change Workflow | PASS | Will run `make preflight` after every change. |
| III. Server-First Rendering | PASS | Dashboard page is a server component. Client components only for interactive suggestion cards. |
| IV. Design System Compliance | PASS | Will use CSS variables, 4pt grid, existing UI components. Figma MCP for design details. |
| V. Code Minimalism | PASS | One component per file, named exports, <150 lines target. |

### Post-Design Re-Check

| Principle | Status | Notes |
| --------- | ------ | ----- |
| I. Hexagonal Architecture | PASS | `lib/features/suggestions/` contains domain logic. `lib/ports/` not needed (Prisma direct access follows existing pattern). API routes are thin orchestrators. |
| II. Verified-Change Workflow | PASS | No changes to workflow. |
| III. Server-First Rendering | PASS | Page server-renders. Only `DashboardClient` (suggestion interactions) and `OverviewPanel` (chart interactivity) are client components. |
| IV. Design System Compliance | PASS | All new components use design tokens. AuthPrompt uses existing Button/Typography components. |
| V. Code Minimalism | PASS | VideoSuggestion model is minimal. No premature abstractions — suggestion generation is a single use-case function with a typed context input. |

## Project Structure

### Documentation (this feature)

```text
specs/003-dashboard-page/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research decisions
├── data-model.md        # VideoSuggestion model + relationships
├── quickstart.md        # Setup instructions
├── contracts/
│   └── api.md           # API endpoint contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
apps/web/
├── app/
│   └── dashboard/                          # New standalone route
│       ├── layout.tsx                      # Hybrid auth layout (AppShellServer)
│       ├── page.tsx                        # Server component (conditional auth render)
│       ├── loading.tsx                     # Loading skeleton
│       └── components/
│           ├── dashboard-client.tsx        # Client component (suggestion state)
│           ├── suggestion-panel.tsx        # Video Suggestions panel container
│           ├── suggestion-engine-card.tsx  # "Our suggestion engine" explainer
│           ├── video-idea-card.tsx         # Individual idea card with actions
│           └── styles/                    # CSS modules for dashboard components
├── components/
│   ├── overview/                           # Extracted from app/videos/components/
│   │   ├── overview-panel.tsx
│   │   ├── overview-chart.tsx
│   │   ├── metric-pills.tsx
│   │   ├── actionable-insights.tsx
│   │   ├── insight-card.tsx
│   │   └── *.module.css
│   └── auth/
│       └── auth-prompt.tsx                 # New reusable non-blocking auth prompt
├── lib/
│   └── features/
│       └── suggestions/                    # New domain module
│           ├── index.ts                    # Barrel exports
│           ├── types.ts                    # SuggestionContext, VideoSuggestion types
│           ├── schemas.ts                  # Zod validation schemas
│           ├── errors.ts                   # SuggestionError extends DomainError
│           └── use-cases/
│               ├── generate-suggestions.ts # LLM-based idea generation
│               ├── get-suggestions.ts      # Fetch active + backfill if needed
│               ├── act-on-suggestion.ts    # Handle save/dismiss/use actions
│               └── build-context.ts        # Aggregate creator context signals
├── app/api/me/channels/[channelId]/
│   └── suggestions/
│       ├── route.ts                        # GET active suggestions
│       └── [suggestionId]/
│           └── action/
│               └── route.ts                # POST save/dismiss/use
└── prisma/
    └── schema.prisma                       # + VideoSuggestion model
```

**Structure Decision**: Follows existing monorepo convention (`apps/web/`). New feature module at `lib/features/suggestions/` for domain logic. Shared overview components extracted to `components/overview/`. Dashboard route is standalone (outside `(app)` group) for hybrid auth support.

## Complexity Tracking

No constitution violations. No complexity justifications needed.

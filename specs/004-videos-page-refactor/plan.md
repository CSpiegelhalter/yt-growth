# Implementation Plan: Videos Page Refactor

**Branch**: `004-videos-page-refactor` | **Date**: 2026-03-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-videos-page-refactor/spec.md`

## Summary

Refactor the Videos page into a two-tab experience (Published / Planned) matching Figma designs. The Published tab preserves the existing video list + analysis panel flow without regressions. The Planned tab adds a new idea editor with AI-assisted field generation, backed by a new `VideoIdea` Prisma model. AI generation reuses the existing `callLLM()` infrastructure and `buildContext()` pattern from the suggestions feature.

## Technical Context

**Language/Version**: TypeScript 5.6.0, React 19.0.0, Node 18+
**Primary Dependencies**: Next.js 16.0.0 (App Router), Prisma 5.22.0, Zod 3.23.8, OpenAI (via `callLLM()`)
**Storage**: Supabase Postgres via Prisma — new `VideoIdea` table
**Testing**: `make preflight` (build, lint, knip, madge, depcruise, jscpd)
**Target Platform**: Web (desktop + mobile responsive)
**Project Type**: Web application (monorepo: `apps/web`)
**Performance Goals**: Tab switch <200ms, AI field suggestion <10s
**Constraints**: Preserve existing video analysis flow with zero regressions; follow hexagonal architecture
**Scale/Scope**: Single page refactor + 1 new data model + 1 new feature domain + ~15-20 new/modified files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Hexagonal Architecture | PASS | New `video-ideas` feature in `lib/features/`, API routes in `app/api/`, UI in `components/`. Dependency direction maintained. |
| II. Verified-Change Workflow | PASS | `make preflight` after every change. No baseline regressions. |
| III. Server-First Rendering | PASS | Page shell remains server component. Tab switching and form are client-only (interactive state). |
| IV. Design System Compliance | PASS | Using CSS variables for colors, Fustat typography tokens, Tag component for pills, 4pt grid spacing. No hardcoded hex outside globals.css. |
| V. Code Minimalism | PASS | One component per file, <150 lines, named exports, no premature abstractions. |

**Gate result**: ALL PASS — proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/004-videos-page-refactor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api-contracts.md
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
apps/web/
├── app/
│   ├── videos/
│   │   ├── page.tsx                          # Server component (unchanged)
│   │   ├── layout.tsx                        # Layout (unchanged)
│   │   ├── DashboardClient.tsx               # Refactor: add tab state, planned ideas state
│   │   ├── useDashboardData.ts               # Existing hooks (unchanged)
│   │   ├── style.module.css                  # Add tab toggle styles
│   │   └── components/
│   │       ├── SplitPanel.tsx                # Refactor: accept tab prop, render tab-specific content
│   │       ├── TabToggle.tsx                 # NEW: pill-style Published/Planned toggle
│   │       ├── tab-toggle.module.css         # NEW: tab toggle styles
│   │       ├── PlannedIdeasList.tsx           # NEW: left panel idea list
│   │       ├── planned-ideas-list.module.css  # NEW: styles
│   │       ├── NewIdeaCard.tsx               # NEW: "Start a new idea" card
│   │       ├── IdeaListItem.tsx              # NEW: individual idea in list
│   │       ├── IdeaEditorPanel.tsx           # NEW: right panel idea editor
│   │       ├── idea-editor-panel.module.css  # NEW: editor styles
│   │       ├── IdeaFormField.tsx             # NEW: field + label + suggest button
│   │       ├── AiHelpBanner.tsx              # NEW: "Create faster with help" banner
│   │       ├── VideoList.tsx                 # Existing (unchanged)
│   │       ├── VideoListItem.tsx             # Existing (unchanged)
│   │       ├── VideoDetailPanel.tsx          # Existing (unchanged)
│   │       └── full-report/                  # Existing (unchanged)
│   │
│   └── api/me/channels/[channelId]/
│       └── ideas/
│           ├── route.ts                      # NEW: GET (list), POST (create)
│           └── [ideaId]/
│               └── route.ts                  # NEW: GET (single), PATCH (update), DELETE
│
├── lib/features/
│   └── video-ideas/
│       ├── types.ts                          # NEW: VideoIdea, IdeaField types
│       ├── schemas.ts                        # NEW: Zod schemas
│       ├── errors.ts                         # NEW: VideoIdeaError extends DomainError
│       ├── index.ts                          # NEW: barrel exports
│       └── use-cases/
│           ├── createIdea.ts                 # NEW: create + persist idea
│           ├── updateIdea.ts                 # NEW: update idea fields
│           ├── listIdeas.ts                  # NEW: list ideas for channel
│           ├── getIdea.ts                    # NEW: get single idea
│           ├── deleteIdea.ts                 # NEW: delete idea
│           └── suggestField.ts              # NEW: AI generation for single field
│
├── lib/features/suggestions/                 # Existing (reuse buildContext)
│
├── prisma/
│   ├── schema.prisma                         # ADD: VideoIdea model
│   └── migrations/                           # NEW: migration for VideoIdea
│
└── components/ui/                            # Existing (reuse Input, Button, etc.)
```

**Structure Decision**: Follows existing monorepo pattern. New `video-ideas` feature domain in `lib/features/` per hexagonal architecture. New API routes follow existing `/api/me/channels/[channelId]/` pattern. UI components stay co-located in `app/videos/components/` for page-specific pieces.

## Complexity Tracking

No constitution violations. No complexity justifications needed.

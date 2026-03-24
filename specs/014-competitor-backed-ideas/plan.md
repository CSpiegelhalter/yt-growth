# Implementation Plan: Competitor-Backed Ideas

**Branch**: `014-competitor-backed-ideas` | **Date**: 2026-03-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-competitor-backed-ideas/spec.md`

## Summary

Refactor the video ideas system so suggestions are generated from cached competitor video data rather than generic AI brainstorming. Extend the data model to carry source provenance through the entire workflow (suggestion → action → planned idea → editor). Add "View source," "Analyze source," and "Make my version" interaction paths. Add on-demand generation triggers to dashboard and planned ideas tab.

**Approach**: Extend existing `buildContext` → `generateSuggestions` → `actOnSuggestion` pipeline with competitor data. Add `sourceProvenanceJson` column to VideoIdea. Refactor LLM prompts to produce source-attributed suggestions. Extend UI components (VideoIdeaCard, IdeaEditorPanel) to display provenance. Reuse existing competitor video analysis pages for the "Analyze source" flow.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 19, Next.js 15 (App Router), Prisma, next-auth, Zod, OpenAI (via lib/llm.ts)
**Storage**: PostgreSQL via Prisma (one new column on VideoIdea)
**Testing**: `make preflight` (build, lint, knip, madge, depcruise, jscpd)
**Target Platform**: Web (Next.js)
**Project Type**: Web application (monorepo: apps/web + apps/worker)
**Performance Goals**: Suggestion generation with competitor data < 15 seconds; dashboard load unaffected (suggestions are pre-generated)
**Constraints**: Cached competitor data only (no live YouTube API during generation); one Prisma migration; no new npm dependencies
**Scale/Scope**: Single-user per-channel; 3 active suggestions; 1-5 source videos per suggestion

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Hexagonal Architecture | PASS | New use-cases in `lib/features/suggestions/` and `lib/features/video-ideas/`. Types in feature `types.ts`. Schemas in feature `schemas.ts`. No forbidden imports. UI components in `components/features/` or co-located page components. |
| II. Verified-Change Workflow | PASS | `make preflight` after every change. No regressions allowed. |
| III. Server-First Rendering | PASS | Dashboard page is server-rendered with client interactivity only for actions. Suggestion generation is server-side. New "View source" panel is client-interactive (legitimate use of `'use client'`). |
| IV. Design System Compliance | PASS | New UI uses CSS variables, 4pt grid, existing Tag/card patterns. No hardcoded hex. |
| V. Code Minimalism | PASS | Extending existing pipeline, not creating new abstractions. One new column, one new endpoint, extended types. Components < 150 lines. |

**Post-Phase 1 Re-check**: All gates still pass. Data model uses existing patterns (TEXT JSON column like ChannelProfile). Contracts extend existing endpoints. No new external dependencies.

## Project Structure

### Documentation (this feature)

```text
specs/014-competitor-backed-ideas/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: decisions and rationale
├── data-model.md        # Phase 1: entity changes and new types
├── quickstart.md        # Phase 1: setup and testing guide
├── contracts/
│   └── api-contracts.md # Phase 1: API endpoint changes
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
apps/web/
├── prisma/
│   └── schema.prisma                          # Add sourceProvenanceJson to VideoIdea
│
├── lib/features/suggestions/
│   ├── types.ts                               # Extend with SourceProvenance, CompetitorBackedSuggestionContext
│   ├── schemas.ts                             # Add SourceProvenance Zod schema
│   └── use-cases/
│       ├── buildContext.ts                     # Unchanged
│       ├── buildCompetitorBackedContext.ts     # NEW: wraps buildContext + fetches competitor data
│       ├── generateSuggestions.ts              # Refactor prompt to accept competitor context
│       └── actOnSuggestion.ts                 # Transfer provenance to VideoIdea on "use"/"save"
│
├── lib/features/video-ideas/
│   ├── types.ts                               # Extend VideoIdea with sourceProvenanceJson
│   ├── schemas.ts                             # Add sourceProvenanceJson to create schema
│   └── use-cases/
│       ├── createIdea.ts                      # Accept and store sourceProvenanceJson
│       └── suggestField.ts                    # Use source context in prompts when available
│
├── app/api/me/channels/[channelId]/
│   ├── suggestions/
│   │   ├── route.ts                           # Use competitor-backed context for generation
│   │   ├── generate/route.ts                  # NEW: on-demand generation endpoint
│   │   └── [suggestionId]/action/route.ts     # Pass provenance through to idea creation
│   └── ideas/
│       └── route.ts                           # Accept sourceProvenanceJson in POST
│
├── app/(app)/dashboard/
│   ├── components/
│   │   ├── video-idea-card.tsx                # Add source evidence display + "View source" toggle
│   │   ├── source-panel.tsx                   # NEW: expandable source video details panel
│   │   ├── suggestion-panel.tsx               # Add "Find ideas from my niche" button
│   │   └── dashboard-client.tsx               # Wire on-demand generation + source panel state
│   └── dashboard.module.css                   # Styles for source panel
│
├── app/(app)/videos/components/
│   ├── IdeaEditorPanel.tsx                    # Add source provenance display section
│   ├── IdeaSourceSection.tsx                  # NEW: renders provenance in editor
│   └── PlannedTabContent.tsx                  # Add "Find ideas" button to header
│
├── app/(app)/competitors/video/[videoId]/
│   └── _components/
│       └── VideoDetailShell.tsx               # Add "Make my version" button
│
└── components/features/
    └── ideas/
        └── source-video-card.tsx              # NEW: reusable source video mini-card
```

**Structure Decision**: Extends the existing hexagonal architecture. New use-cases in `lib/features/`. New UI components co-located with their pages or in `components/features/` for reusable pieces. One new API route for on-demand generation. No new feature domains — everything fits within `suggestions` and `video-ideas`.

## Complexity Tracking

No constitution violations to justify. All changes follow existing patterns.

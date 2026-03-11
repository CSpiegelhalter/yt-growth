# Implementation Plan: Creator Profile Builder

**Branch**: `006-creator-profile` | **Date**: 2026-03-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-creator-profile/spec.md`

## Summary

Refactor the existing channel-profile page into a multi-tab creator intelligence form matching the Figma design. Expand the existing `ChannelProfileInput` schema to support 6 tab sections with ~22 targeted questions. Replace the current single-form `ProfileEditor` with a tabbed layout featuring progressive auto-save per field. The existing `ChannelProfile` Prisma model, API routes, and `useChannelProfile` hook are extended rather than replaced.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 19, Next.js 15 (App Router), Zod, Prisma, next-auth
**Storage**: PostgreSQL via Prisma (`ChannelProfile.inputJson` TEXT field stores JSON)
**Testing**: Playwright (e2e), `make preflight` (build, lint, knip, madge, depcruise, jscpd)
**Target Platform**: Web (desktop + mobile responsive)
**Project Type**: Web application (Next.js monorepo)
**Performance Goals**: Auto-save completes within 2s of user stopping input; page loads within 1s
**Constraints**: CSS Modules only (no Tailwind), CSS variables for design tokens, 4pt grid spacing
**Scale/Scope**: 1 page refactor, ~6 new tab components, 1 schema expansion, 1 hook modification

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Hexagonal Architecture | PASS | Domain logic stays in `lib/features/channels/`. UI in `app/(app)/channel-profile/`. Route handlers thin. |
| II. Verified-Change Workflow | PASS | Will run `make preflight` after implementation. |
| III. Server-First Rendering | PASS | Page component is server-side. Client components only for interactive form (required). |
| IV. Design System Compliance | PASS | Will use CSS variables, Tag component for chips, 4pt grid, Fustat typography. No hardcoded hex. |
| V. Code Minimalism | PASS | One component per file. <150 lines target. Named exports. |

No violations to track.

## Project Structure

### Documentation (this feature)

```text
specs/006-creator-profile/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── profile-api.md   # PUT /api/me/channels/[channelId]/profile contract
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
apps/web/
├── app/(app)/channel-profile/
│   ├── page.tsx                          # Server component (existing, minor update)
│   ├── ChannelProfileClient.tsx          # Client shell (refactor to tabbed layout)
│   ├── style.module.css                  # Page-level styles (refactor)
│   └── _components/
│       ├── ProfileTabNav.tsx             # Vertical tab navigation
│       ├── ProfileTabNav.module.css
│       ├── ProfileInfoBanner.tsx         # Dismissible completeness hint banner
│       ├── ProfileInfoBanner.module.css
│       ├── ProfileQuestionField.tsx      # Reusable question + input + "Suggest" button
│       ├── ProfileQuestionField.module.css
│       ├── OverviewTab.tsx               # Tab: channel identity & content strategy
│       ├── IdeaGuidanceTab.tsx           # Tab: new idea guidance
│       ├── ScriptGuidanceTab.tsx         # Tab: script guidance
│       ├── TagGuidanceTab.tsx            # Tab: tag guidance
│       ├── DescriptionGuidanceTab.tsx    # Tab: description guidance
│       ├── CompetitorsTab.tsx            # Tab: competitors & inspiration
│       ├── CompetitorCard.tsx            # Card tile for added competitor
│       ├── CompetitorCard.module.css
│       ├── tab-content.module.css        # Shared styles for tab content sections
│       └── ProfileEditor.tsx             # DELETED (replaced by tab components)
│       └── ProfileEditor.module.css      # DELETED
├── lib/features/channels/
│   ├── schemas.ts                        # Expand ChannelProfileInputSchema
│   ├── types.ts                          # Expand constants and defaults
│   └── use-cases/updateProfile.ts        # Minor: handle expanded input shape
├── lib/hooks/
│   └── use-channel-profile.ts            # Add debounced partial save support
└── components/ui/
    └── ChipGroup.tsx                     # Extract from ProfileEditor into shared UI (if reused 3+)
```

**Structure Decision**: Follows existing monorepo layout. All new components live under the existing `channel-profile` route directory. Domain logic stays in `lib/features/channels/`. The `ProfileEditor` monolith is replaced by individual tab components + shared `ProfileQuestionField` component.

## Complexity Tracking

No violations to justify. All changes follow existing patterns.

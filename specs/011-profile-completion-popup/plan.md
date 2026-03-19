# Implementation Plan: Profile Completion Popup

**Branch**: `011-profile-completion-popup` | **Date**: 2026-03-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-profile-completion-popup/spec.md`

## Summary

Add a dismissable profile-completion popup to the Dashboard page that shows a checklist of channel profile sections. The popup is driven by real profile data, supports temporary dismissal (3 days via localStorage), suppresses on first visit, and is built on reusable hooks (`useLocalStorage`, `useDismissable`) and a reusable section-completion utility. Styling matches the Figma reference using CSS Modules and existing design tokens.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 19, Next.js 15 (App Router), next-auth
**Storage**: PostgreSQL via Prisma (read-only — no schema changes); localStorage for dismissal state
**Testing**: `make preflight` (build, lint, knip, madge, depcruise, jscpd)
**Target Platform**: Web (browser)
**Project Type**: Web application (Next.js monorepo)
**Performance Goals**: Popup renders without layout shift; no additional API calls (uses existing profile hook data)
**Constraints**: CSS Modules only (no Tailwind); 4pt spacing grid; must pass `make preflight`
**Scale/Scope**: 5 new files, 1 modified file

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Hexagonal Architecture | PASS | Pure completion logic in `lib/features/channels/`. Hooks in `lib/hooks/`. Component in `app/dashboard/components/`. No new adapters/ports needed — reads profile via existing `useChannelProfile` hook. |
| II. Verified-Change Workflow | PASS | Will run `make preflight` after implementation. |
| III. Server-First Rendering | PASS | Popup is client-only (requires browser localStorage + interactive dismiss). Uses `"use client"` only where needed. Dashboard page remains a server component. |
| IV. Design System Compliance | PASS | Uses CSS variables (`--color-imperial-blue`, `--space-*`, `--radius-*`, `--shadow-*`). No hardcoded hex values outside Figma reference docs. Follows 4pt grid. |
| V. Code Minimalism | PASS | One component per file. Hooks in separate files. Pure logic in separate file. All files target <150 lines. Named exports only. |

**Post-Phase 1 Re-check**: All gates still pass. No new adapters, no schema changes, no server-side state. All new code follows hexagonal layers correctly.

## Project Structure

### Documentation (this feature)

```text
specs/011-profile-completion-popup/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
apps/web/
├── app/dashboard/
│   └── components/
│       ├── dashboard-client.tsx                        # MODIFY: add popup
│       ├── profile-completion-popup.tsx                # NEW: popup component
│       └── profile-completion-popup.module.css         # NEW: popup styles
├── lib/
│   ├── features/channels/
│   │   └── profile-completion.ts                       # NEW: section completion logic
│   └── hooks/
│       ├── use-local-storage.ts                        # NEW: reusable localStorage + TTL hook
│       └── use-dismissable.ts                          # NEW: reusable timed-dismissal hook
```

**Structure Decision**: All new code fits within existing project structure. Domain logic (`profile-completion.ts`) in `lib/features/channels/`. Reusable hooks in `lib/hooks/`. Dashboard-specific component in `app/dashboard/components/`. This follows the hexagonal architecture: UI → hooks → domain logic.

## Complexity Tracking

No constitution violations. Table omitted.

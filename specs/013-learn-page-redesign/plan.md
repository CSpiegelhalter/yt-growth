# Implementation Plan: Learn Page Redesign

**Branch**: `013-learn-page-redesign` | **Date**: 2026-03-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/013-learn-page-redesign/spec.md`

## Summary

Redesign the `/learn` page to match the new Figma layout (hero gradient band with texture + icon, bold subtitle, 2×2 value props, start-here card with pill buttons, 2-column article grid) while preserving all existing content. Extract a shared `MarketingHeroBand` component used by both the Landing page and Learn page to eliminate hero layout duplication.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 19, Next.js 15 (App Router), CSS Modules
**Storage**: N/A (no database changes)
**Testing**: `make preflight` (build, lint, knip, madge, depcruise, jscpd)
**Target Platform**: Web (all modern browsers)
**Project Type**: Web application (Next.js monorepo — `apps/web`)
**Performance Goals**: No LCP regression; hero images already optimized via `next/image` with `priority`
**Constraints**: Must use existing design system tokens (CSS variables), 4pt grid spacing, Fustat typography. No Tailwind.
**Scale/Scope**: 2 pages affected (Landing + Learn), ~5-7 files changed/created

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Hexagonal Architecture | ✅ PASS | No domain logic involved. Changes are in `app/` (thin page) and `components/` (UI only). No adapters, ports, or features touched. |
| II. Verified-Change Workflow | ✅ PASS | `make preflight` will be run after implementation. Must pass all 6 checks vs baseline. |
| III. Server-First Rendering | ✅ PASS | Both pages are server components. No `'use client'` needed for the shared hero or learn page layout. |
| IV. Design System Compliance | ✅ PASS | Will use CSS variables (`--color-hot-rose`, `--color-imperial-blue`, `--color-cool-sky`), `--hero-gradient`, design tokens for spacing. No hardcoded hex. Fustat typography via existing scale tokens. |
| V. Code Minimalism | ✅ PASS | One component per file. Shared hero avoids duplication. Files will target <150 lines. Named exports only. |

**Gate result**: PASS — proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/013-learn-page-redesign/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
apps/web/
├── app/(marketing)/
│   ├── layout.tsx                        # Unchanged (StaticNav + main)
│   ├── page.tsx                          # MODIFY: refactor hero to use MarketingHeroBand
│   └── learn/
│       ├── page.tsx                      # MODIFY: redesign layout per Figma
│       ├── style.module.css              # MODIFY: new styles for Figma layout
│       └── articles.ts                   # Unchanged
├── components/
│   └── marketing/
│       ├── MarketingHeroBand.tsx          # NEW: shared hero gradient band component
│       └── MarketingHeroBand.module.css   # NEW: shared hero styles (extracted from globals.css)
├── app/globals.css                       # MODIFY: remove landing hero styles moved to MarketingHeroBand.module.css
└── public/
    ├── landing_icon.svg                  # Unchanged (reused)
    └── hero-texture.webp                 # Unchanged (reused)
```

**Structure Decision**: Changes are within the existing `apps/web` structure. New shared component goes in `components/marketing/` since it's a marketing-specific UI component (not a generic `ui/` component). The hero pattern is used only by the `(marketing)` route group pages.

## Constitution Re-Check (Post Phase 1 Design)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Hexagonal Architecture | ✅ PASS | `MarketingHeroBand` lives in `components/marketing/` — UI layer only. No domain logic, no adapter/port/feature imports. Dependency direction respected. |
| II. Verified-Change Workflow | ✅ PASS | Implementation must run `make preflight` and pass all checks. Hero style extraction from `globals.css` to CSS Module may improve jscpd (less duplication). |
| III. Server-First Rendering | ✅ PASS | `MarketingHeroBand` is a server component (no `'use client'`). Uses `next/image` for optimized image loading. No client-side state needed. |
| IV. Design System Compliance | ✅ PASS | Research R2 maps all Figma values to existing CSS variables. No hardcoded hex values. Spacing on 4pt grid. Typography via existing scale tokens. Card styles use `--radius-xl`, existing shadow patterns. Pill buttons use `--color-hot-rose` border. |
| V. Code Minimalism | ✅ PASS | One new component (`MarketingHeroBand`) with minimal props (`children`, `iconAlt?`, `className?`). <150 lines per file. Named exports. No over-engineering. |

**Post-design gate result**: PASS — ready for `/speckit.tasks`.

## Complexity Tracking

No violations to justify.

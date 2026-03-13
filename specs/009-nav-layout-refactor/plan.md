# Implementation Plan: Navigation & Layout Refactor

**Branch**: `009-nav-layout-refactor` | **Date**: 2026-03-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-nav-layout-refactor/spec.md`

## Summary

Refactor navigation to cleanly separate static marketing pages (landing, learn, learn/*) from authenticated app pages. Static pages get a simplified top-only nav (logo + Learn/Pricing/Get Started). App pages retain the sidebar with new bottom items (Channel, Account, Support). The separation is layout-driven via existing `(marketing)` and `(app)` route groups.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 19, Next.js 15 (App Router), next-auth
**Storage**: N/A (no database changes)
**Testing**: Manual verification + `make preflight`
**Target Platform**: Web (desktop + mobile)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: No layout shift on static pages (no client-side sidebar toggle logic)
**Constraints**: Must follow hexagonal architecture, design system compliance, server-first rendering
**Scale/Scope**: ~8 files modified/created, 3 new components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Hexagonal Architecture | PASS | New components are UI-layer only (`components/navigation/`). No domain logic in UI. No forbidden imports. |
| II. Verified-Change Workflow | PASS | Will run `make preflight` after implementation. |
| III. Server-First Rendering | PASS | `StaticNav` will be a server component (no `'use client'`). `Logo` is a pure presentational component. Sidebar bottom items are static config. |
| IV. Design System Compliance | PASS | Will use CSS variables, 4pt grid, brand colors. `StaticNav` button uses existing Button component or matching styles. |
| V. Code Minimalism | PASS | One component per file. `StaticNav` < 50 lines. `Logo` < 30 lines. No unnecessary abstractions. |

**Post-Phase 1 re-check**: All gates still pass. No new dependencies, no domain logic in UI, no `'use client'` on StaticNav.

## Project Structure

### Documentation (this feature)

```text
specs/009-nav-layout-refactor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
apps/web/
├── app/
│   ├── (marketing)/
│   │   └── layout.tsx                    # MODIFY: Replace AppShellServer with StaticNav wrapper
│   └── (app)/
│       └── layout.tsx                    # NO CHANGE (already uses AppShellLayout)
├── components/
│   └── navigation/
│       ├── StaticNav.tsx                 # CREATE: Marketing top nav (logo + Learn/Pricing/Get Started)
│       ├── StaticNav.module.css          # CREATE: Styles for marketing top nav
│       ├── Logo.tsx                      # CREATE: Shared ChannelBoost logo SVG
│       ├── AppSidebar.tsx                # MODIFY: Add bottom nav section
│       ├── AppSidebar.module.css         # MODIFY: Styles for bottom nav section
│       └── MobileNav.tsx                 # MODIFY: Use shared Logo component
└── lib/
    └── shared/
        └── nav-config.ts                # MODIFY: Add sidebarBottomItems config
```

**Structure Decision**: Follows existing monorepo layout. All navigation components live in `components/navigation/`. New components (`StaticNav`, `Logo`) are added alongside existing navigation components. No new directories needed.

## Design Decisions

### D1: Marketing Layout Change

**Current**: `(marketing)/layout.tsx` renders `AppShellServer` (sidebar + header) for all marketing pages.

**New**: `(marketing)/layout.tsx` renders `StaticNav` + plain `<main>` wrapper. No sidebar, no `AppShellServer`, no `AppHeader`.

**Impact**: Landing page, learn page, all learn/* articles, privacy, terms, contact, tags, and keywords pages will get the static nav. Tags and keywords are currently under `(marketing)` but may need to stay in the app shell — this needs attention.

**Resolution**: Tags (`/tags`) and keywords (`/keywords`) are public tools that currently show sidebar for guests via `AppShellLayout`. They are under `(marketing)` route group. Since they function as app-like tools (not static marketing content), they should be moved to the `(app)` route group so they retain sidebar behavior. Alternatively, we keep them in `(marketing)` and accept that they'll get the static nav. Per the spec, only landing, learn, and learn/* are explicitly called out as static pages. Privacy, terms, and contact are also under `(marketing)` — the spec doesn't mention them but they're static content pages that should also get the static nav treatment.

**Final decision**: Keep `(marketing)` as-is for all its current routes. Tags and keywords routes that need sidebar should be handled by moving them to `(app)` or by creating a third layout. However, checking `AppShellLayout` — it already handles tags/keywords for unauthenticated users by showing sidebar. Since tags and keywords are under `(marketing)`, changing the marketing layout will affect them. We need to move `/tags` and `/keywords` routes to the `(app)` route group to preserve their sidebar behavior.

### D2: StaticNav as Server Component

`StaticNav` has no interactive state (no dropdowns, no auth checks). It can be a pure server component, avoiding client JS entirely. This aligns with constitution principle III (Server-First Rendering).

### D3: Sidebar Bottom Items Architecture

Add items between the existing `<nav>` section and the `bottomSection` (legal links + collapse toggle). Use a new `<nav>` element with `aria-label="Account navigation"` for accessibility. Items use the same `NavItemLink` pattern as primary items.

The three items are defined as a new `sidebarBottomItems` array in `nav-config.ts`:
- Channel → `/channel-profile` (channelScoped: true, icon: "channel")
- Account → `/profile` (channelScoped: false, icon: "user")
- Support → `/contact` (channelScoped: false, icon: "mail")

### D4: Logo Extraction

Extract the inline SVG from `AppSidebar.tsx` into `Logo.tsx`. Accept `size` prop. Use a unique gradient ID per instance to avoid SVG ID collisions when multiple logos render on the same page (use `useId()` or a prop-based approach).

## Complexity Tracking

No constitution violations. No complexity justifications needed.

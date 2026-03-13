# Implementation Plan: Account Page Refactor

**Branch**: `001-account-page-refactor` | **Date**: 2026-03-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-account-page-refactor/spec.md`

## Summary

Refactor the Account page to a two-column layout matching the Figma design: account overview card (left) with email, plan, channels; reusable UpgradeCard/BillingCTA (right); sign out button below. This is a presentation-layer refactor — no new domain logic, no schema changes. The existing `UpgradeCard` and `BillingCTA` components already handle Pro/Free states and will be reused directly.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 19, Next.js 15 (App Router), next-auth, CSS Modules
**Storage**: PostgreSQL via Prisma (read-only — no schema changes)
**Testing**: `make preflight` (build, lint, knip, madge, depcruise, jscpd)
**Target Platform**: Web (responsive 768px–1920px)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Standard web page rendering
**Constraints**: Must reuse existing `UpgradeCard` component; CSS Modules only; design system tokens; 4pt grid spacing; server-first rendering
**Scale/Scope**: 1 page refactor, ~5 files modified, ~2 files created

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Hexagonal Architecture | PASS | Presentation-layer refactor only. No domain logic changes. Page composes existing components. Imports follow allowed direction: `app/` → `components/` → `lib/features/`. |
| II. Verified-Change Workflow | PASS | Will run `make preflight` after implementation. |
| III. Server-First Rendering | PASS | Page route (`page.tsx`) remains a server component. `ProfileClient` stays `"use client"` as it handles interactive state (channel removal, sign out). No new client components needed. |
| IV. Design System Compliance | PASS | Will use CSS variables from `globals.css`, design tokens, 4pt grid spacing. Reuse `PageContainer`, `PageHeader`, existing card patterns. No hardcoded hex values. |
| V. Code Minimalism | PASS | Refactoring existing code. No new abstractions. Reusing `UpgradeCard` and `BillingCTA` as-is. Target <150 lines per file. |

## Project Structure

### Documentation (this feature)

```text
specs/001-account-page-refactor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
apps/web/
├── app/(app)/account/
│   ├── page.tsx                          # Server route (minor: update title text)
│   ├── ProfileClient.tsx                 # MODIFY: two-column grid layout
│   ├── style.module.css                  # MODIFY: add two-column grid, left/right card styles
│   ├── loading.tsx                       # No changes
│   └── _components/
│       ├── AccountStats.tsx              # MODIFY: restructure for left-card context (email/plan/channels)
│       ├── AccountStats.module.css       # MODIFY: update for new card layout
│       ├── BillingCTA.tsx                # No changes (already wraps UpgradeCard)
│       └── BillingCTA.module.css         # No changes
├── components/
│   ├── pricing/
│   │   ├── UpgradeCard.tsx               # No changes (reused as-is)
│   │   └── UpgradeCard.module.css        # No changes
│   └── ui/                               # Reuse PageContainer, PageHeader
└── lib/shared/product.ts                 # No changes (constants reused)
```

**Structure Decision**: No new directories or structural changes. This refactor modifies existing files in `app/(app)/account/` to change the layout from a vertical stack to a two-column grid. All reusable components (`UpgradeCard`, `BillingCTA`, `PageContainer`, `PageHeader`) are already in place.

## Implementation Approach

### Layout Strategy

The current layout is a single-column vertical stack (`.grid` with `flex-direction: column`). The refactor changes this to:

1. **Page header**: "Manage your account" title + subtitle (using `PageHeader`)
2. **Two-column grid**: CSS Grid with `grid-template-columns: 1fr 1fr` at `md+` breakpoint
   - **Left column**: Account overview card — email, plan badge, channels list, add channel button
   - **Right column**: `BillingCTA` component (which renders `UpgradeCard` for free users, subscription management for Pro users)
3. **Sign out button**: Full-width row below the grid, left-aligned

### Key Decisions

1. **Reuse `BillingCTA` directly** — it already handles both Pro (manage subscription) and Free (renders `UpgradeCard`) states. No new CTA component needed.
2. **Consolidate left card** — merge `AccountStats` grid display and `ChannelListSection` into a single left-side card with sections: Overview heading → Email → Plan (with badge) → Channels list → Add Channel button.
3. **CSS Grid over Flexbox** — CSS Grid provides cleaner two-column layout with equal heights and simpler responsive stacking.
4. **Mobile-first stacking** — single column on mobile, two columns at `768px+` breakpoint.

### Files Changed Summary

| File | Action | What Changes |
|------|--------|--------------|
| `account/page.tsx` | Modify | Update metadata title to "Manage your account" |
| `account/ProfileClient.tsx` | Modify | Restructure JSX: two-column grid wrapper, left card (overview + channels), right card (BillingCTA), sign out below |
| `account/style.module.css` | Modify | Add `.twoColumn` grid layout, `.leftCard` styles matching Figma (1px border, 20px radius), adjust sign out positioning |
| `account/_components/AccountStats.tsx` | Modify | Simplify to show email, plan badge, status in the left card context (remove grid layout, integrate inline) |
| `account/_components/AccountStats.module.css` | Modify | Update styles for inline display within left card |

### No Changes Required

- `UpgradeCard.tsx` / `.module.css` — already matches Figma right card design (gradient header, features, price, purchase button, 2px imperial-blue border, 20px radius)
- `BillingCTA.tsx` — already wraps UpgradeCard for free users and shows subscription management for Pro users
- `lib/shared/product.ts` — constants already correct
- No new components needed

## Complexity Tracking

No constitution violations. No complexity justifications needed.

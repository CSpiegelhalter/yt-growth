# Implementation Plan: AccessGate Component

**Branch**: `005-access-gate` | **Date**: 2026-03-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-access-gate/spec.md`

## Summary

Replace route-level auth guards and redirect-based authentication checks with a single reusable `AccessGate` server component. The component wraps page content and shows a sign-in prompt (unauthenticated), connect-channel prompt (no YouTube channel), or renders children (fully ready). This consolidates existing `AuthPrompt`, `ConnectChannelPrompt`, `LoggedOutDashboardPreview`, and `DashboardLoggedOut` into one component, removes the `(app)` layout redirect, and updates proxy.ts to stop redirecting page routes.

## Technical Context

**Language/Version**: TypeScript 5.x, React 19, Next.js 15 (App Router)
**Primary Dependencies**: next-auth (session), Prisma (user/channel queries), CSS Modules
**Storage**: Existing PostgreSQL via Prisma (no schema changes)
**Testing**: `make preflight` (build, lint, knip, madge, depcruise, jscpd)
**Target Platform**: Web (SSR, Edge middleware)
**Project Type**: Web application (Next.js monorepo)
**Performance Goals**: No added latency — AccessGate uses the same `getAppBootstrapOptional()` already in use
**Constraints**: Server-first rendering (constitution III), no `'use client'` on AccessGate
**Scale/Scope**: ~12 pages affected, 4 components consolidated, 1 middleware file updated

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Hexagonal Architecture | PASS | AccessGate is a UI component in `components/` — no domain logic. Uses `lib/server/bootstrap.ts` for data (correct dependency direction). |
| II. Verified-Change Workflow | PASS | Will run `make preflight` after implementation. |
| III. Server-First Rendering | PASS | AccessGate is a server component. No `'use client'`, no `useEffect`, no `useState`. |
| IV. Design System Compliance | PASS | Reuses existing `Button` component, CSS variables, 4pt grid spacing. |
| V. Code Minimalism | PASS | Single component, single CSS module, <150 lines. Consolidates 4 existing components. |

**Post-Phase 1 Re-check**: All gates still pass. No new layers, abstractions, or dependencies introduced.

## Project Structure

### Documentation (this feature)

```text
specs/005-access-gate/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
apps/web/
├── components/
│   └── auth/
│       ├── AccessGate.tsx              # NEW — main component
│       ├── access-gate.module.css      # NEW — gate state styles
│       ├── auth-prompt.tsx             # DELETE (absorbed into AccessGate)
│       └── auth-prompt.module.css      # DELETE (absorbed into AccessGate)
├── components/
│   ├── ui/
│   │   └── ConnectChannelPrompt.tsx    # DELETE (absorbed into AccessGate)
│   └── dashboard/
│       └── LoggedOutDashboardPreview/  # DELETE (replaced by AccessGate)
├── app/
│   ├── (app)/
│   │   └── layout.tsx                  # MODIFY — remove redirect, use optional bootstrap
│   ├── dashboard/
│   │   ├── page.tsx                    # MODIFY — use AccessGate
│   │   └── components/
│   │       └── dashboard-logged-out.tsx # DELETE (replaced by AccessGate)
│   └── videos/
│       └── page.tsx                    # MODIFY — use AccessGate
├── proxy.ts                            # MODIFY — remove page paths from isProtectedPath
└── lib/server/
    └── bootstrap.ts                    # NO CHANGE (already has getAppBootstrapOptional)
```

**Structure Decision**: All changes are within the existing `apps/web` project structure. No new directories created beyond `components/auth/` which already exists.

## Key Design Decisions

### D-001: Server Component (not client)

AccessGate is a React Server Component. It receives `bootstrap: BootstrapData | null` as a prop from the page's server-side data fetch. This avoids `'use client'`, keeps the component simple, and aligns with constitution principle III.

### D-002: Props-based (not context/hook)

The component takes `bootstrap` as a prop rather than calling `getAppBootstrapOptional()` internally. This keeps it a pure presentational wrapper — the page controls data fetching.

### D-003: (app) Layout Modification (not file moves)

Rather than moving pages out of the `(app)` route group, modify `(app)/layout.tsx` to use `getAppBootstrapOptional()` and stop redirecting. This is minimally invasive.

### D-004: Proxy.ts Scope Reduction

Remove page-level paths from `isProtectedPath()` while keeping API paths (`/api/me`, `/api/private`). Pages always render; APIs still return 401.

### D-005: Consolidation over Parallel Systems

Absorb `AuthPrompt` styling/content directly into AccessGate. Absorb `ConnectChannelPrompt` usage of `EmptyState` + `Button`. Delete originals. No wrappers around wrappers.

## Complexity Tracking

No constitution violations. No complexity justifications needed.

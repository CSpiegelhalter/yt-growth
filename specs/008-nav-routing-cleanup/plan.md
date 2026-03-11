# Implementation Plan: Navigation & Routing Cleanup

**Branch**: `008-nav-routing-cleanup` | **Date**: 2026-03-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-nav-routing-cleanup/spec.md`

## Summary

Standardize the app's left-hand sidebar to show exactly 6 items (Dashboard, Videos, Analyzer, Tags, Keywords, Profile) with consistent Hot Rose icon / Imperial Blue text styling. Remove all auth-guard redirects (already none exist — confirm). Implement conditional sidebar visibility: hide sidebar for signed-out users on Dashboard, Videos, and Profile (showing only `AccessGate`), keep sidebar visible on Tags/Keywords regardless of auth. Remove Competitors from nav/indexing while preserving its components. Update robots.txt, sitemap, and llms.txt to match.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 19, Next.js 15 (App Router), next-auth, CSS Modules
**Storage**: N/A (no database changes)
**Testing**: `make preflight` (build, lint, knip, madge, depcruise, jscpd)
**Target Platform**: Web (desktop + mobile)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: No regressions in build or runtime performance
**Constraints**: Must use existing design tokens (`--color-hot-rose`, `--color-imperial-blue`). No `eslint-disable`. Must pass all 6 preflight checks.
**Scale/Scope**: ~11 files modified, 0 new files, 0 deleted files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Hexagonal Architecture | PASS | Changes are in `app/` (entrypoints), `components/` (UI), and `lib/shared/` (config). No layer violations. No domain logic in UI. |
| II. Verified-Change Workflow | PASS | Will run `make preflight` after all changes. |
| III. Server-First Rendering | PASS | `AppShellLayout` remains a server component. No new client components. Sidebar visibility determined server-side. |
| IV. Design System Compliance | PASS | Using `--color-hot-rose` and `--color-imperial-blue` CSS variables. No hardcoded hex values in CSS. |
| V. Code Minimalism | PASS | No new files. Minimal changes — configuration updates + one conditional in layout. |

**Post-Phase 1 Re-check**: All gates still pass. No new abstractions, no new layers, no new dependencies.

## Project Structure

### Documentation (this feature)

```text
specs/008-nav-routing-cleanup/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (files to modify)

```text
apps/web/
├── lib/shared/
│   └── nav-config.ts                    # Sidebar item definitions (reorder, remove, add Profile)
├── lib/server/
│   └── nav-config.server.ts             # Serialization match patterns (remove competitors/trending)
├── components/navigation/
│   ├── nav-utils.ts                     # Icon map + active state matching
│   ├── AppShellLayout.tsx               # Sidebar visibility logic (new conditional)
│   ├── AppShellServer.tsx               # isChannelScopedPath helper (remove competitors)
│   └── AppSidebar.module.css            # Icon color styling (ensure Hot Rose)
├── public/sidebar/
│   ├── dashboard.svg                    # Verify Hot Rose fill color
│   └── analyze.svg                      # Verify Hot Rose fill color
├── app/
│   ├── robots.ts                        # Remove stale disallow entries
│   ├── sitemap.ts                       # Verify route list
│   └── llms.txt/build-llms-txt.ts       # Remove stale tool/page entries
```

**Structure Decision**: All changes are within the existing `apps/web` directory. No new directories or structural changes needed.

## Design Decisions

### D-001: Sidebar Visibility via Pathname Check in Server Layout

`AppShellLayout` (server component) will use Next.js `headers()` to read the request URL and determine the current pathname. A helper function `shouldShowSidebar(pathname, isAuthenticated)` returns `true` if the user is authenticated OR the pathname starts with `/tags` or `/keywords`.

When sidebar should be hidden (signed out + not on Tags/Keywords), render children directly without `AppShellServer` wrapper — the page's own `AccessGate` handles the sign-in prompt.

### D-002: Profile Moved to Primary Nav

"Profile" (route `/profile`) moves from `accountNavItems` to position 6 in `primaryNavItems`. It remains accessible in the account dropdown if the dropdown renders it independently, but its primary placement is now the sidebar.

### D-003: Competitors De-linked, Not Deleted

All competitor references removed from:
- `primaryNavItems` array
- `SIDEBAR_ICON_MAP`
- `isNavItemActive` match patterns
- `SerializableNavItem` match pattern type
- `isChannelScopedPath` helper
- `robots.ts` disallow list
- `build-llms-txt.ts` tools list

Preserved:
- `app/(app)/competitors/` directory (all pages + components)
- `lib/features/competitors/` directory (domain logic)
- Direct URL access still works (route files remain)

### D-004: Icon Color Strategy

SVG files loaded via `next/image` don't inherit CSS `color`. To ensure Hot Rose color:
1. Verify each SVG in `public/sidebar/` uses `#CA1F7B` as fill/stroke
2. If any SVG uses a different color, update the SVG file directly
3. This ensures icons are always Hot Rose regardless of hover/active state (only text changes on hover)

### D-005: Removed Items from Nav

Items removed from sidebar (kept in codebase for potential future use):
- Goals (`/goals`)
- Competitors (`/competitors`)
- Trending (`/trending`) — was feature-flagged
- Thumbnails (`/thumbnails`) — was feature-flagged
- Channel Profile (`/channel-profile`)
- Learn (`/learn`)

These routes and their page components remain functional. Only navigation links are removed.

## Complexity Tracking

No constitution violations. No complexity justifications needed.

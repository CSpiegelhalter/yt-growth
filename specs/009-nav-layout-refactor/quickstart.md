# Quickstart: Navigation & Layout Refactor

**Feature**: 009-nav-layout-refactor
**Date**: 2026-03-13

## What This Feature Does

Separates static marketing pages (landing, learn, learn/*) from app pages by giving them different navigation chrome:
- **Static pages**: Top nav only (logo + Learn/Pricing/Get Started), no sidebar
- **App pages**: Keep existing sidebar + header, add Channel/Account/Support at sidebar bottom

## Files to Create

1. `apps/web/components/navigation/StaticNav.tsx` — Marketing top nav component
2. `apps/web/components/navigation/StaticNav.module.css` — Styles for marketing top nav
3. `apps/web/components/navigation/Logo.tsx` — Shared logo SVG component

## Files to Modify

1. `apps/web/app/(marketing)/layout.tsx` — Replace `AppShellServer` with `StaticNav` + plain content wrapper
2. `apps/web/components/navigation/AppSidebar.tsx` — Add bottom nav section (Channel, Account, Support)
3. `apps/web/components/navigation/AppSidebar.module.css` — Styles for bottom nav section
4. `apps/web/components/navigation/MobileNav.tsx` — Use shared `Logo` component
5. `apps/web/lib/shared/nav-config.ts` — Add `sidebarBottomItems` config

## How to Verify

```bash
# Build check
make preflight

# Manual verification
# 1. Visit / (landing) — should see static top nav, no sidebar
# 2. Visit /learn — should see static top nav, no sidebar
# 3. Visit /learn/any-article — should see static top nav, no sidebar
# 4. Sign in and visit /dashboard — should see sidebar with bottom items
# 5. Click Channel/Account/Support in sidebar bottom — verify routing
```

## Architecture Notes

- Static pages use `(marketing)` route group → `StaticNav` replaces `AppShellServer`
- App pages use `(app)` route group → unchanged except sidebar bottom items
- `Logo` component extracted from `AppSidebar` inline SVG for reuse
- `StaticNav` is a simple server component (no client state needed)
- Sidebar bottom items use existing `NavItemLink` pattern and `NavIcon` types

# Quickstart: Navigation & Routing Cleanup

**Branch**: `008-nav-routing-cleanup` | **Date**: 2026-03-11

## Prerequisites

- Bun installed
- Database running (`make db-up`)
- On branch `008-nav-routing-cleanup`

## Key Files to Modify

### Navigation Configuration
1. `apps/web/lib/shared/nav-config.ts` — Primary/secondary/account nav item arrays
2. `apps/web/components/navigation/nav-utils.ts` — Icon map + active state matching
3. `apps/web/lib/server/nav-config.server.ts` — Serialization + feature flag filtering

### Layout & Sidebar
4. `apps/web/components/navigation/AppShellLayout.tsx` — Sidebar visibility logic
5. `apps/web/components/navigation/AppShellServer.tsx` — `isChannelScopedPath` helper
6. `apps/web/components/navigation/AppSidebar.module.css` — Icon color styling

### SVG Icons
7. `apps/web/public/sidebar/dashboard.svg` — Verify Hot Rose color
8. `apps/web/public/sidebar/analyze.svg` — Verify Hot Rose color

### Crawl/Indexing
9. `apps/web/app/robots.ts` — Disallow list updates
10. `apps/web/app/sitemap.ts` — Route list updates
11. `apps/web/app/llms.txt/build-llms-txt.ts` — Tools/pages list updates

## Verification

```bash
# After all changes
make preflight

# Visual verification
make dev
# Visit: /dashboard, /videos, /profile (signed out — should show sign-in only, no sidebar)
# Visit: /tags, /keywords (signed out — should show sidebar)
# Sign in and verify sidebar order: Dashboard, Videos, Analyzer, Tags, Keywords, Profile
# Verify icon colors (Hot Rose) and text colors (Imperial Blue default, Hot Rose hover)
```

## Architecture Notes

- **No database changes** — all configuration/UI
- **No new components** — reuses existing `AccessGate`, `AppShellLayout`, `AppSidebar`
- **Competitors preserved** — route files kept in filesystem, only de-linked from nav/indexing
- **Design tokens** — use `--color-hot-rose` and `--color-imperial-blue` CSS variables

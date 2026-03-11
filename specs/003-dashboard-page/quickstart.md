# Quickstart: Dashboard Page

**Branch**: `003-dashboard-page` | **Date**: 2026-03-09

## Prerequisites

- Bun installed
- Database running (`make db-up`)
- Environment variables configured (see `env.example`)

## Setup

```bash
# Switch to feature branch
git checkout 003-dashboard-page

# Install dependencies
cd apps/web && bun install

# Run database migration (after adding VideoSuggestion model)
bunx prisma migrate dev --name add-video-suggestions

# Generate Prisma client
bunx prisma generate

# Start dev server
make dev
```

## Key Files to Create/Modify

### New files
- `apps/web/app/dashboard/layout.tsx` — Hybrid auth layout
- `apps/web/app/dashboard/page.tsx` — Dashboard page (server component)
- `apps/web/app/dashboard/dashboard-client.tsx` — Client component with suggestion state
- `apps/web/app/dashboard/components/` — Dashboard-specific components
- `apps/web/components/overview/` — Extracted shared overview components
- `apps/web/components/auth/auth-prompt.tsx` — Reusable auth prompt
- `apps/web/lib/features/suggestions/` — Suggestion domain logic
- `apps/web/app/api/me/channels/[channelId]/suggestions/` — API routes
- `apps/web/prisma/migrations/*/` — VideoSuggestion migration

### Modified files
- `apps/web/lib/shared/nav-config.ts` — Add Dashboard nav item
- `apps/web/app/robots.ts` — Ensure /dashboard not disallowed
- `apps/web/app/sitemap.ts` — Add /dashboard entry
- `apps/web/app/llms.txt/build-llms-txt.ts` — Add Dashboard reference
- `apps/web/app/videos/components/SplitPanel.tsx` — Update OverviewPanel import
- `apps/web/components/navigation/NavIcon.tsx` — Add dashboard icon if needed

## Verification

```bash
# Run pre-flight suite
make preflight

# Manual checks
# 1. Visit /dashboard logged in → see overview + suggestions
# 2. Visit /dashboard logged out → see content + auth prompt
# 3. Check sidebar → Dashboard is first item
# 4. Click suggestion actions → verify save/dismiss/use
# 5. Check /sitemap.xml → /dashboard listed
# 6. Check /robots.txt → /dashboard not disallowed
```

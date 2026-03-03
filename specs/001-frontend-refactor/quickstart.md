# Quickstart: Frontend Component Audit & Refactor

**Branch**: `001-frontend-refactor` | **Date**: 2026-03-03

## Prerequisites

- Bun 1.0+ installed
- Repository cloned, `bun install` run
- Database running (`make db-up`)
- On branch `001-frontend-refactor`

## Verification Steps

After completing each phase of the refactor, verify:

### 1. Pre-flight Suite (after every change)

```bash
make preflight
```

All 6 checks must pass with zero regressions against baseline.

### 2. Dev Server (visual regression check)

```bash
make dev
```

Navigate to each modified page and compare against pre-refactor
screenshots. Key pages to check:

- `/competitors` — gradient buttons, filter pills, status badges
- `/trending` — filter pills, locked feature gates, discovery cards
- `/videos` — video list, insight cards, full report
- `/goals` — badge chips, progress bars, goal cards
- `/profile` — channel cards, billing CTA, account stats
- `/subscriber-insights` — overview chart, metric pills
- `/channel-profile` — profile editor form
- `/thumbnails` — upload area, generation flow

### 3. Build (bundle size verification)

```bash
cd apps/web && bun run build
```

Check the build output for First Load JS per page. Every page
must be under 100kb.

### 4. Type Check

```bash
cd apps/web && bun run check:types
```

Zero type errors after component migrations and hook extractions.

### 5. New Component Smoke Test

After UI components are created, verify they render correctly:

```tsx
// Create a temporary test page at app/(app)/test/page.tsx
import { Button, StatusBadge, FilterPill, Input, Select, ErrorBanner }
  from "@/components/ui";

export default function TestPage() {
  return (
    <PageContainer>
      <PageHeader title="Component Test" />
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="primary" loading>Loading</Button>
      <StatusBadge variant="success">Active</StatusBadge>
      <StatusBadge variant="error" dot>Error</StatusBadge>
      <StatusBadge variant="processing" pulse>Processing</StatusBadge>
      <FilterPill active>Active Filter</FilterPill>
      <FilterPill>Inactive Filter</FilterPill>
      <FilterPill active dismissible>Dismissible</FilterPill>
      <Input label="Text input" placeholder="Type here" />
      <Input label="Error input" error="Required field" />
      <Select label="Select">
        <option>Option 1</option>
        <option>Option 2</option>
      </Select>
      <ErrorBanner message="Something went wrong" onRetry={() => {}} />
      <ErrorBanner variant="warning" message="Low quota" dismissible />
    </PageContainer>
  );
}
```

Delete the test page after verification.

## Execution Order

1. **US7** — Next.js config (Turbopack, React Compiler, PPR, AVIF)
   - Low risk, enables subsequent work
2. **US1** — UI component library (Button through ErrorBanner)
   - Foundation for all migration work
3. **US2 + US6** — Hook extraction + client boundary enforcement
   - Tackle together since they touch the same files
4. **US3** — CSS hygiene (font-family, line-height cleanup)
   - Safe cleanup, can run in parallel with US4
5. **US4** — File structure reorganization (_components/)
   - File moves after component/hook work stabilizes
6. **US5** — PageContainer adoption
   - Final layout normalization
7. **US8** — Page-level Zod validation
   - Final consistency pass on all pages

## Rollback

If React Compiler or PPR causes issues:
- React Compiler: remove `reactCompiler: true` from next.config.js
  or add `'use no memo'` to affected files
- PPR: remove `ppr: true` and Suspense boundaries
- Turbopack: revert dev script to `next dev` without `--turbopack`

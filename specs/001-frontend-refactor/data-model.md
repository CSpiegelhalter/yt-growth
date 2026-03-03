# Data Model: Frontend Component Audit & Refactor

**Branch**: `001-frontend-refactor` | **Date**: 2026-03-03

This feature does not introduce database entities. The "data model"
for this refactor is a **component and hook catalog** — the shared
abstractions that replace duplicated patterns.

## UI Component Catalog

### Button

| Attribute | Value |
|-----------|-------|
| Location | `components/ui/Button.tsx` + `Button.module.css` |
| Variants | `primary` (gradient), `secondary` (outline), `danger`, `ghost` |
| Sizes | `sm` (32px), `md` (44px) |
| States | default, hover, active, disabled, loading |
| Elements | `<button>` (default), `<a>` via `as` prop |
| Replaces | `.lockedBtn` (trending, competitors), `.btnPrimary` (ErrorState), `.primaryBtn` (ChannelCard), `.nextStepsBtn` (video UI) |

### StatusBadge

| Attribute | Value |
|-----------|-------|
| Location | `components/ui/StatusBadge.tsx` + `StatusBadge.module.css` |
| Variants | `success`, `warning`, `error`, `info`, `processing` |
| Sizes | `sm` (24px), `md` (32px) |
| Features | Optional dot indicator, optional pulse animation |
| Replaces | `.statusChip` (ChannelCard, video UI), `.badge` (BillingCTA), `.completedBadge` (goals), `.goalBadgeChip` (goals) |

### FilterPill

| Attribute | Value |
|-----------|-------|
| Location | `components/ui/FilterPill.tsx` + `FilterPill.module.css` |
| Variants | `default` (inactive), `active` (selected) |
| Features | Optional dismiss (X) button, keyboard support |
| Replaces | `.quickFilterPill` (trending, competitors), `.activeFilterPill` (trending), `.filtersBadge` (trending) |

### Input

| Attribute | Value |
|-----------|-------|
| Location | `components/ui/Input.tsx` + `Input.module.css` |
| Variants | `default`, `error` |
| Sizes | `md` (44px min-height) |
| Features | Label association, error message, help text, icon slots |
| Replaces | Duplicated input CSS in trending, competitors, goals, FilterDrawer (5+ locations) |

### Select

| Attribute | Value |
|-----------|-------|
| Location | `components/ui/Select.tsx` + `Select.module.css` |
| Variants | `default`, `error` |
| Sizes | `md` (44px min-height) |
| Features | Label association, error message, native `<select>` |
| Replaces | Duplicated select CSS in trending, competitors, goals (3+ locations) |

### ErrorBanner

| Attribute | Value |
|-----------|-------|
| Location | `components/ui/ErrorBanner.tsx` + `ErrorBanner.module.css` |
| Variants | `error` (default), `warning`, `info` |
| Features | Optional dismiss, optional retry action, border-left accent |
| Replaces | `.errorBanner` (ChannelCard, goals, competitors), `.cancelNotice` (BillingCTA) |

## Hook Catalog

### useAsync\<T\>

| Attribute | Value |
|-----------|-------|
| Location | `lib/hooks/use-async.ts` |
| Purpose | Generic async operation with loading/error/data states |
| Returns | `{ data, loading, error, execute, clearError }` |
| Replaces | Manual `useState` + `useEffect` + try/catch in 6+ components |

### useSearchState

| Attribute | Value |
|-----------|-------|
| Location | `lib/hooks/use-search-state.ts` |
| Purpose | Search/filter state with URL parameter sync |
| Returns | `{ filters, setFilter, resetFilters, searchParams }` |
| Replaces | Manual `useSearchParams` + `useState` + URL sync in CompetitorsClient, TrendingClient, DashboardClient |

### usePolling

| Attribute | Value |
|-----------|-------|
| Location | `lib/hooks/use-polling.ts` |
| Purpose | Periodic data fetching with cleanup and pause/resume |
| Returns | `{ data, loading, error, pause, resume, isPolling }` |
| Replaces | Manual `setInterval` + cleanup in ThumbnailsClient, TrendingClient |

### useSessionStorage\<T\>

| Attribute | Value |
|-----------|-------|
| Location | `lib/hooks/use-session-storage.ts` |
| Purpose | SessionStorage persistence with TTL and hydration safety |
| Returns | `{ value, setValue, isHydrated, clear }` |
| Replaces | Manual `sessionStorage.getItem/setItem` in CompetitorsClient, DashboardClient |

## Design System Token Additions

### Line-Height Tokens (added to `globals.css`)

| Token | Value | Replaces |
|-------|-------|----------|
| `--leading-none` | 1 | Inline `line-height: 1` |
| `--leading-tight` | 1.2 | Already exists partially |
| `--leading-snug` | 1.35 | Ad-hoc `1.3`, `1.35` values |
| `--leading-normal` | 1.5 | Ad-hoc `1.5` values |
| `--leading-relaxed` | 1.6 | Already exists partially |

## Page Zod Schema Additions

| Page | Schema Fields |
|------|---------------|
| `video/[videoId]/page.tsx` | `videoId: string`, `channelId?: string`, `range?: enum("7d","28d","90d")`, `from?: string` |
| `competitors/page.tsx` | `channelId?: string` |
| `trending/page.tsx` | `channelId?: string`, `list?: enum(...)` |
| `goals/page.tsx` | `channelId?: string` |
| `profile/page.tsx` | (no searchParams) |
| `subscriber-insights/page.tsx` | `channelId?: string` |
| `saved-ideas/page.tsx` | `channelId?: string` |
| `channel-profile/page.tsx` | `channelId?: string` |
| `tags/page.tsx` | (no searchParams) |

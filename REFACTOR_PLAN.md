# Refactor Plan (Slice-Based)

This plan converts the audit into **10 small refactor slices**.  
Each slice:
- maps to an existing audit duplication cluster,
- touches **5–20 files**,
- and includes verification commands.

## Slice 1 - Standardize request parsing in keyword routes

- **Duplication cluster addressed:** API route body parsing and validation pattern
- **Scope (5 files):**
  - `apps/web/app/api/keywords/research/route.ts`
  - `apps/web/app/api/keywords/trends/route.ts`
  - `apps/web/app/api/keywords/youtube-serp/route.ts`
  - `apps/web/app/api/keywords/ideas/route.ts`
  - `apps/web/lib/api/withValidation.ts`
- **Goal:** Replace repeated `req.json()` + `safeParse` + `ApiError` blocks with the shared validation wrapper.
- **Verification commands:**
  - `bun run lint`
  - `bun run typecheck`
  - `bun run test:unit`

## Slice 2 - Standardize request parsing in tags routes

- **Duplication cluster addressed:** API route body parsing and validation pattern
- **Scope (5 files):**
  - `apps/web/app/api/tags/extract/route.ts`
  - `apps/web/app/api/youtube-tag-generator/route.ts`
  - `apps/web/app/api/contact/route.ts`
  - `apps/web/lib/api/withValidation.ts`
  - `apps/web/lib/api/errors.ts`
- **Goal:** Apply the same route-body validation pattern to tags-focused endpoints and keep error shape consistent.
- **Verification commands:**
  - `bun run lint`
  - `bun run typecheck`
  - `bun run test:unit`

## Slice 3 - Consolidate DataForSEO validation flow

- **Duplication cluster addressed:** DataForSEO validation pattern
- **Scope (6 files):**
  - `apps/web/app/api/keywords/research/route.ts`
  - `apps/web/app/api/keywords/trends/route.ts`
  - `apps/web/app/api/keywords/youtube-serp/route.ts`
  - `apps/web/app/api/keywords/ideas/route.ts`
  - `apps/web/lib/dataforseo/index.ts`
  - `apps/web/lib/api/errors.ts`
- **Goal:** Centralize `validatePhrase`/`validateLocation` + `DataForSEOError` to `ApiError` mapping so routes only call one helper.
- **Verification commands:**
  - `bun run lint`
  - `bun run typecheck`
  - `bun run test:unit`

## Slice 4 - Shared channel/video param schemas (insights endpoints)

- **Duplication cluster addressed:** ChannelId/VideoId validation schemas
- **Scope (6 files):**
  - `apps/web/app/api/me/channels/[channelId]/videos/[videoId]/insights/summary/route.ts`
  - `apps/web/app/api/me/channels/[channelId]/videos/[videoId]/insights/ideas/route.ts`
  - `apps/web/app/api/me/channels/[channelId]/videos/[videoId]/insights/analytics/route.ts`
  - `apps/web/app/api/me/channels/[channelId]/videos/[videoId]/insights/seo/route.ts`
  - `apps/web/app/api/me/channels/[channelId]/videos/[videoId]/insights/comments/route.ts`
  - `apps/web/lib/competitors/video-detail/validation.ts`
- **Goal:** Replace repeated inline Zod param schemas with shared `channelId` / `videoId` schema exports.
- **Verification commands:**
  - `bun run lint`
  - `bun run typecheck`
  - `bun run test:unit`

## Slice 5 - Shared channel param schemas (channel endpoints)

- **Duplication cluster addressed:** ChannelId/VideoId validation schemas
- **Scope (10 files):**
  - `apps/web/app/api/me/channels/[channelId]/videos/route.ts`
  - `apps/web/app/api/me/channels/[channelId]/audit/route.ts`
  - `apps/web/app/api/me/channels/[channelId]/niche/route.ts`
  - `apps/web/app/api/me/channels/[channelId]/profile/route.ts`
  - `apps/web/app/api/me/channels/[channelId]/sync/route.ts`
  - `apps/web/app/api/me/channels/[channelId]/route.ts`
  - `apps/web/app/api/me/channels/[channelId]/subscriber-audit/route.ts`
  - `apps/web/app/api/me/channels/[channelId]/subscriber-audit/ideas/route.ts`
  - `apps/web/app/api/me/channels/[channelId]/idea-board/route.ts`
  - `apps/web/app/api/me/channels/[channelId]/competitors/route.ts`
- **Goal:** Finish schema dedupe on channel-only routes using one shared schema import.
- **Verification commands:**
  - `bun run lint`
  - `bun run typecheck`
  - `bun run test:unit`

## Slice 6 - Consolidate YouTube single-video fetchers (core + API)

- **Duplication cluster addressed:** YouTube API video fetching implementations
- **Scope (5 files):**
  - `apps/web/lib/youtube/data-api.ts`
  - `apps/web/lib/youtube/index.ts`
  - `apps/web/lib/youtube-api.ts`
  - `apps/web/app/api/tags/extract/route.ts`
  - `apps/web/app/api/youtube-tag-generator/route.ts`
- **Goal:** Move duplicated single-video fetch logic to one shared implementation and keep route handlers thin.
- **Verification commands:**
  - `bun run lint`
  - `bun run typecheck`
  - `bun run test:unit`

## Slice 7 - Remove direct storage access (app shell and channel selection)

- **Duplication cluster addressed:** Direct localStorage/sessionStorage access
- **Scope (8 files):**
  - `apps/web/components/navigation/AppShellServer.tsx`
  - `apps/web/components/navigation/AppShell.tsx`
  - `apps/web/components/navigation/AppShellWrapper.tsx`
  - `apps/web/components/navigation/AppHeader.tsx`
  - `apps/web/components/header/hooks/useChannels.ts`
  - `apps/web/app/dashboard/DashboardClient.tsx`
  - `apps/web/app/(app)/trending/TrendingClient.tsx`
  - `apps/web/lib/storage/safeLocalStorage.ts`
- **Goal:** Replace ad hoc storage reads/writes with shared safe storage utilities.
- **Verification commands:**
  - `bun run lint`
  - `bun run typecheck`
  - `bun run test:unit`

## Slice 8 - Consolidate activeChannelId state flow

- **Duplication cluster addressed:** Active channel ID management
- **Scope (7 files):**
  - `apps/web/components/navigation/AppShellServer.tsx`
  - `apps/web/components/navigation/AppShell.tsx`
  - `apps/web/components/navigation/AppShellWrapper.tsx`
  - `apps/web/components/header/hooks/useChannels.ts`
  - `apps/web/components/navigation/AppHeader.tsx`
  - `apps/web/app/dashboard/DashboardClient.tsx`
  - `apps/web/lib/use-sync-active-channel.ts`
- **Goal:** Centralize `activeChannelId` read/write/sync behavior behind one hook/helper interface.
- **Verification commands:**
  - `bun run lint`
  - `bun run typecheck`
  - `bun run test:unit`

## Slice 9 - Consolidate OAuth attempt tracking

- **Duplication cluster addressed:** OAuth attempt tracking logic
- **Scope (5 files):**
  - `apps/web/app/(app)/video/[videoId]/VideoInsightsClientV2.tsx`
  - `apps/web/app/(app)/video/[videoId]/VideoInsightsError.tsx`
  - `apps/web/app/(app)/video/[videoId]/components/ErrorState.tsx`
  - `apps/web/app/(app)/competitors/CompetitorsClient.tsx`
  - `apps/web/components/dashboard/ProfileTip.tsx`
- **Goal:** Move `lastOAuthAttempt` throttling/session logic into a shared utility and remove duplicated timestamp checks.
- **Verification commands:**
  - `bun run lint`
  - `bun run typecheck`
  - `bun run test:unit`

## Slice 10 - Standardize error-state component pattern

- **Duplication cluster addressed:** Error state components
- **Scope (5 files):**
  - `apps/web/components/ui/ErrorState.tsx`
  - `apps/web/app/(app)/video/[videoId]/components/ErrorState.tsx`
  - `apps/web/app/(app)/competitors/video/[videoId]/_components/ErrorState.tsx`
  - `apps/web/app/(marketing)/ideas/IdeasPublicClient.tsx`
  - `apps/web/app/(app)/video/[videoId]/VideoInsightsError.tsx`
- **Goal:** Reuse one base error-state UI contract and reduce inline/variant drift.
- **Verification commands:**
  - `bun run lint`
  - `bun run typecheck`
  - `bun run test:unit`

---

## Recommended execution order

1. Slice 1  
2. Slice 2  
3. Slice 3  
4. Slice 4  
5. Slice 5  
6. Slice 6  
7. Slice 7  
8. Slice 8  
9. Slice 9  
10. Slice 10

Rationale for order: start with low-risk API validation consistency, then schema consolidation, then deeper integration/UI refactors.

# Tasks: Dashboard Page

**Input**: Design documents from `/specs/003-dashboard-page/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested — test tasks omitted.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database migration and feature module skeleton

- [X] T001 Add VideoSuggestion model to Prisma schema with fields (id, userId, channelId, title, description, sourceContext, status, generatedAt, actedAt, createdAt, updatedAt), indexes on (userId, channelId, status) and (userId, generatedAt DESC), and relations to User and Channel in `apps/web/prisma/schema.prisma`
- [ ] T002 Run Prisma migration for VideoSuggestion model: `bunx prisma migrate dev --name add-video-suggestions`
- [X] T003 [P] Create suggestion feature module barrel export in `apps/web/lib/features/suggestions/index.ts`
- [X] T004 [P] Create suggestion domain types (SuggestionContext, VideoSuggestionStatus, GenerateSuggestionsInput, ActOnSuggestionInput) in `apps/web/lib/features/suggestions/types.ts`
- [X] T005 [P] Create Zod validation schemas (SuggestionActionBodySchema, SuggestionParamsSchema) in `apps/web/lib/features/suggestions/schemas.ts`
- [X] T006 [P] Create SuggestionError extending DomainError in `apps/web/lib/features/suggestions/errors.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extract shared OverviewPanel and build core suggestion logic — MUST complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T007 Extract OverviewPanel component from `apps/web/app/videos/components/OverviewPanel.tsx` to `apps/web/components/overview/overview-panel.tsx`, moving CSS module alongside. Keep the same props interface but make the API base path configurable via an optional prop (default: `/api/me/channels`)
- [X] T008 [P] Extract OverviewChart component and CSS module from `apps/web/app/videos/components/` to `apps/web/components/overview/overview-chart.tsx`
- [X] T009 [P] Extract MetricPills component and CSS module from `apps/web/app/videos/components/` to `apps/web/components/overview/metric-pills.tsx`
- [X] T010 [P] Extract ActionableInsights and InsightCard components with CSS modules from `apps/web/app/videos/components/` to `apps/web/components/overview/actionable-insights.tsx` and `apps/web/components/overview/insight-card.tsx`
- [X] T011 Create barrel export for shared overview components in `apps/web/components/overview/index.ts`
- [X] T012 Update Videos page imports in `apps/web/app/videos/components/SplitPanel.tsx` (and any other files) to use the new shared `@/components/overview` path. Verify Videos page still works correctly
- [X] T013 Implement `buildContext` use-case that aggregates SuggestionContext from ChannelProfile, recent Videos, VideoMetrics, and trending data in `apps/web/lib/features/suggestions/use-cases/build-context.ts`. Use Prisma to query channel profile, last 10 videos, and their metrics. Return a typed SuggestionContext object
- [X] T014 Implement `generateSuggestions` use-case that takes a SuggestionContext and generates N video idea suggestions using the OpenAI LLM (follow the pattern in `lib/features/saved-ideas/use-cases/generateMoreIdeas.ts`). Persist generated suggestions as VideoSuggestion records with status "active" in `apps/web/lib/features/suggestions/use-cases/generate-suggestions.ts`
- [X] T015 Implement `getSuggestions` use-case that fetches active suggestions for a user+channel, auto-backfilling to 3 if fewer exist by calling `generateSuggestions` in `apps/web/lib/features/suggestions/use-cases/get-suggestions.ts`
- [X] T016 Implement `actOnSuggestion` use-case that handles save/dismiss/use actions: updates suggestion status, creates SavedIdea for "save" action (reusing `saveIdea` from `lib/features/saved-ideas`), generates 1 replacement suggestion, and returns the replacement in `apps/web/lib/features/suggestions/use-cases/act-on-suggestion.ts`
- [X] T017 Update barrel export in `apps/web/lib/features/suggestions/index.ts` to export all use-cases, schemas, types, and errors

**Checkpoint**: Foundation ready — OverviewPanel shared, suggestion domain logic complete, user story implementation can begin

---

## Phase 3: User Story 1 - Logged-in Creator Views Dashboard (Priority: P1) 🎯 MVP

**Goal**: Logged-in creator sees the Dashboard with overview chart and 4 suggestion cards

**Independent Test**: Log in, navigate to /dashboard, verify overview chart renders with channel data and 4 cards appear (1 explainer + 3 idea cards with titles/descriptions)

### Implementation for User Story 1

- [X] T018 [US1] Create GET suggestions API route handler at `apps/web/app/api/me/channels/[channelId]/suggestions/route.ts`. Use withAuth + withValidation. Call `getSuggestions` use-case. Return `{ suggestions, total }` per contract
- [X] T019 [US1] Create Dashboard hybrid auth layout at `apps/web/app/dashboard/layout.tsx`. Use `getAppBootstrapOptional()` — if authenticated, render AppShellServer with full nav; if not, render AppShellServer with guest props. Mirror the pattern from `apps/web/app/videos/layout.tsx`
- [X] T020 [US1] Create Dashboard server page at `apps/web/app/dashboard/page.tsx`. Use `getAppBootstrapOptional()` to check auth. If authenticated, render DashboardClient with bootstrap data (me, channels, activeChannelId). If not, render a placeholder (will be replaced in US3). Add `generateMetadata` with SEO title/description
- [X] T021 [US1] Create Dashboard loading skeleton at `apps/web/app/dashboard/loading.tsx` with skeleton placeholders for the two-panel layout
- [X] T022 [US1] Use the Figma MCP server to inspect the Dashboard design at `https://www.figma.com/design/FBUmzpPK0YTx1KpkaaMwth/channelboost?node-id=220-2&m=dev`. Extract exact spacing, card dimensions, icon details, typography, and color usage for the suggestion panel and idea cards. Document findings as CSS module values
- [X] T023 [US1] Create SuggestionEngineCard component at `apps/web/app/dashboard/components/suggestion-engine-card.tsx` with CSS module. This is the "Our suggestion engine" explainer card — concise copy explaining what the suggestion engine does. Match Figma card styling
- [X] T024 [US1] Create VideoIdeaCard component at `apps/web/app/dashboard/components/video-idea-card.tsx` with CSS module. Display title, description, and 3 action button placeholders (icons only, wired in US2). Match Figma card styling and height rhythm with SuggestionEngineCard
- [X] T025 [US1] Create SuggestionPanel container component at `apps/web/app/dashboard/components/suggestion-panel.tsx` with CSS module. Renders 1 SuggestionEngineCard + 3 VideoIdeaCards in a vertical stack. Accepts suggestions array as prop. Handles loading/empty states
- [X] T026 [US1] Create DashboardClient component at `apps/web/app/dashboard/components/dashboard-client.tsx`. This is the main "use client" component. Fetches suggestions from GET `/api/me/channels/[channelId]/suggestions` on mount. Renders two-panel layout: OverviewPanel (from `@/components/overview`) on left, SuggestionPanel on right. Responsive: stacks vertically on mobile. Create accompanying CSS module for the two-panel grid layout

**Checkpoint**: Dashboard page renders for logged-in users with overview chart + suggestion cards. Actions not yet wired.

---

## Phase 4: User Story 2 - Creator Interacts with Video Idea Cards (Priority: P1)

**Goal**: Each video idea card's 3 actions (Use this idea, Save for later, Not a fit) work correctly with immediate backfill

**Independent Test**: Click each action on an idea card — verify "Save" persists to saved ideas, "Not a fit" dismisses and replaces, "Use this idea" navigates to idea flow and replaces

### Implementation for User Story 2

- [X] T027 [US2] Create POST suggestion action API route handler at `apps/web/app/api/me/channels/[channelId]/suggestions/[suggestionId]/action/route.ts`. Use withAuth + withValidation. Validate action body with SuggestionActionBodySchema. Call `actOnSuggestion` use-case. Return response per contract (updated suggestion + replacement)
- [X] T028 [US2] Use the Figma MCP server to inspect the action icons for video idea cards (Use this idea, Save for later, Not a fit). Extract the exact SVG paths, sizes, and spacing. Implement the 3 action icons as small inline SVGs or icon components within `apps/web/app/dashboard/components/video-idea-card.tsx`
- [X] T029 [US2] Wire action handlers in VideoIdeaCard component at `apps/web/app/dashboard/components/video-idea-card.tsx`. Each action calls POST `/api/me/channels/[channelId]/suggestions/[suggestionId]/action` with the appropriate action type. On success, call an `onAction` callback prop to notify the parent
- [X] T030 [US2] Update DashboardClient at `apps/web/app/dashboard/components/dashboard-client.tsx` to handle suggestion actions. When an action completes: replace the acted-on suggestion with the replacement from the API response in local state. For "use" action, navigate to the idea flow URL returned by the API. Show loading state on the card during action processing

**Checkpoint**: All 3 card actions work. Dismissed/used ideas are replaced immediately. Saved ideas appear in saved ideas page.

---

## Phase 5: User Story 3 - Logged-out Dashboard with Auth Prompt (Priority: P2)

**Goal**: Logged-out users see the Dashboard with a non-blocking sign-in/sign-up prompt. The AuthPrompt component is reusable across other pages.

**Independent Test**: Visit /dashboard while logged out — page renders with content and a sign-in prompt. No redirect occurs. Page source is crawlable HTML.

### Implementation for User Story 3

- [X] T031 [US3] Create reusable AuthPrompt component at `apps/web/components/auth/auth-prompt.tsx` with CSS module. Props: `title` (string), `description` (string), `redirectPath` (string, defaults to current page). Renders a non-blocking card/banner with sign-in and sign-up buttons (using existing Button component from `@/components/ui`). Links include `?redirect=` query param. Styled per design system tokens
- [X] T032 [US3] Create logged-out Dashboard view at `apps/web/app/dashboard/components/dashboard-logged-out.tsx` with CSS module. Renders placeholder/demo content showing what the Dashboard offers (overview preview, suggestion examples) with the AuthPrompt component overlaid or positioned alongside. Content must be real HTML (not behind JS) for SEO crawlability
- [X] T033 [US3] Update Dashboard page at `apps/web/app/dashboard/page.tsx` to render DashboardLoggedOut component when `getAppBootstrapOptional()` returns null (replacing the placeholder from T020)

**Checkpoint**: Logged-out users see a meaningful, crawlable Dashboard page with auth prompt. No redirects.

---

## Phase 6: User Story 4 - Dashboard in Navigation (Priority: P2)

**Goal**: Dashboard appears as the first item in the left sidebar navigation on desktop and mobile

**Independent Test**: Log in, verify "Dashboard" is the first sidebar item above "Videos" on desktop and mobile drawer

### Implementation for User Story 4

- [X] T034 [US4] Add Dashboard nav item as the first entry in `primaryNavItems` array in `apps/web/lib/shared/nav-config.ts`. Set id: "dashboard", label: "Dashboard", href: "/dashboard", icon: "home" (or Figma-sourced icon), channelScoped: true
- [X] T035 [US4] Verify Dashboard icon renders correctly in `apps/web/components/navigation/NavIcon.tsx`. If Figma specifies a custom icon (check via Figma MCP), add a custom SVG to `SIDEBAR_ICON_MAP` in nav-utils.ts and a corresponding SVG file at `apps/web/public/sidebar/dashboard.svg`. Otherwise, verify the existing "home" icon works
- [X] T036 [US4] Verify Dashboard nav item appears first in both desktop sidebar (`apps/web/components/navigation/AppSidebar.tsx`) and mobile drawer (`apps/web/components/navigation/MobileNav.tsx`). No code changes should be needed if nav-config ordering is correct — just verify rendering

**Checkpoint**: Dashboard is the first nav item on all viewports.

---

## Phase 7: User Story 5 - SEO & Discoverability (Priority: P3)

**Goal**: Dashboard page is indexed by search engines and referenced by AI agents

**Independent Test**: Check /robots.txt doesn't disallow /dashboard, /sitemap.xml includes /dashboard URL, /llms.txt references Dashboard

### Implementation for User Story 5

- [X] T037 [P] [US5] Verify `/dashboard` is NOT in the disallow list in `apps/web/app/robots.ts`. If it is listed (or if `/dashboard/` pattern would be caught by existing rules), update to ensure it's allowed
- [X] T038 [P] [US5] Add `/dashboard` entry to sitemap in `apps/web/app/sitemap.ts` with priority 0.8, changeFrequency "weekly", and current date as lastModified
- [X] T039 [P] [US5] Add Dashboard to the `LLMS_PUBLIC_PAGES` array (or equivalent) in `apps/web/app/llms.txt/build-llms-txt.ts` with name "Dashboard", path "/dashboard", and a brief description
- [X] T040 [US5] Verify Dashboard page metadata in `apps/web/app/dashboard/page.tsx` includes proper `generateMetadata` with unique title, description, and `robots: { index: true, follow: true }`

**Checkpoint**: Dashboard is discoverable by search engines and AI agents.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, responsive behavior, design alignment, and final verification

- [X] T041 [P] Handle no-channel edge case in DashboardClient at `apps/web/app/dashboard/components/dashboard-client.tsx` — show an onboarding/empty state when the creator has no connected channel (no overview chart, generic suggestion cards or connect-channel prompt)
- [X] T042 [P] Handle suggestion generation failure in SuggestionPanel at `apps/web/app/dashboard/components/suggestion-panel.tsx` — show fallback cards ("We're generating ideas for you...") when API returns error or empty results. Add retry capability
- [X] T043 Verify responsive layout in DashboardClient CSS module — two-panel grid must stack vertically (overview on top, suggestions below) at mobile breakpoints. Use mobile-first approach per constitution
- [X] T044 Inspect Figma design one final time via Figma MCP server and verify pixel-level alignment of card spacing, typography, icon sizes, and colors across all Dashboard components. Adjust CSS modules as needed
- [X] T045 Run `make preflight` and fix any regressions against `.agent/baseline.json`. Output comparison table. All 6 checks must pass without regressions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (Prisma migration must complete first for T013-T016). T007-T012 (OverviewPanel extraction) can start in parallel with Phase 1
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 and US4 can proceed in parallel
  - US2 depends on US1 (needs suggestion cards rendered before wiring actions)
  - US3 can proceed in parallel with US1/US2 (independent logged-out view)
  - US5 can proceed in parallel with any user story
- **Polish (Phase 8)**: Depends on US1 and US2 being complete

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 only — no cross-story dependencies
- **US2 (P1)**: Depends on US1 (video idea cards must exist before actions can be wired)
- **US3 (P2)**: Depends on Phase 2 only — independent of US1/US2
- **US4 (P2)**: Depends on Phase 2 only — independent of all other stories
- **US5 (P3)**: Depends on Phase 2 only — independent of all other stories

### Within Each User Story

- Models/schemas before use-cases
- Use-cases before API routes
- API routes before client components
- Figma inspection before component styling

### Parallel Opportunities

- T003, T004, T005, T006 (Phase 1 skeleton files) can all run in parallel
- T008, T009, T010 (OverviewPanel child extraction) can all run in parallel
- T037, T038, T039 (SEO updates) can all run in parallel
- T041, T042 (edge case handlers) can run in parallel
- US3, US4, US5 can all run in parallel after Phase 2

---

## Parallel Example: User Story 1

```bash
# After Phase 2 completes, launch these in parallel:
Task T022: "Inspect Figma design for Dashboard layout details"
Task T023: "Create SuggestionEngineCard component"
Task T024: "Create VideoIdeaCard component"

# Then sequentially:
Task T025: "Create SuggestionPanel (depends on T023, T024)"
Task T026: "Create DashboardClient (depends on T025, T018)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (Prisma migration + module skeleton)
2. Complete Phase 2: Foundational (OverviewPanel extraction + suggestion domain logic)
3. Complete Phase 3: US1 (Dashboard page with overview + suggestion cards)
4. **STOP and VALIDATE**: Log in, verify Dashboard renders with chart + 4 cards
5. Deploy/demo if ready — actions not yet wired but page is functional

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Dashboard renders for logged-in users → Deploy (MVP!)
3. US2 → Card actions work (save/dismiss/use with backfill) → Deploy
4. US4 → Dashboard appears first in nav → Deploy
5. US3 → Logged-out experience with auth prompt → Deploy
6. US5 → SEO/sitemap/llm.txt updates → Deploy
7. Polish → Edge cases, responsive, Figma alignment, preflight → Final deploy

### Parallel Team Strategy

With multiple developers after Phase 2 completes:
- Developer A: US1 → US2 (sequential, US2 depends on US1)
- Developer B: US3 + US4 (parallel, independent)
- Developer C: US5 + Polish prep

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Figma MCP server must be used for design inspection (T022, T028, T035, T044)
- Run `make preflight` after completing each phase — do not wait until the end
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently

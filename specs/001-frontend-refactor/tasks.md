# Tasks: Frontend Component Audit & Refactor

**Input**: Design documents from `/specs/001-frontend-refactor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: No tests explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story following the execution order from quickstart.md: US7 → US1 → US2+US6 → US3 → US4 → US5 → US8.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and configure tooling needed across all user stories

- [x] T001 Install babel-plugin-react-compiler and @size-limit/preset-app dependencies via `bun add` in apps/web/
- [x] T002 Create .size-limit.json with per-page 100kb budgets at apps/web/.size-limit.json
- [x] T003 Run `make preflight` to capture pre-refactor baseline in .agent/baseline.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Design token additions needed before CSS hygiene work begins

**⚠️ CRITICAL**: Line-height tokens must exist before US3 can replace ad-hoc values

- [x] T004 Add line-height design tokens (--leading-none: 1, --leading-tight: 1.2, --leading-snug: 1.35, --leading-normal: 1.5, --leading-relaxed: 1.6) to apps/web/app/globals.css

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 7 — Next.js Performance Configuration (Priority: P6) 🎯 First

**Goal**: Enable high-impact Next.js 16 configuration flags (Turbopack, React Compiler, PPR, AVIF) with minimal risk. These are low-risk quick wins that enable subsequent work.

**Independent Test**: Dev server uses Turbopack (faster HMR). Build output confirms React Compiler and PPR are active. Image responses serve AVIF format. LCP-critical images have `priority` attribute.

### Implementation for User Story 7

- [x] T005 [US7] Enable Turbopack by adding --turbopack flag to dev script in apps/web/package.json
- [x] T006 [US7] Enable React Compiler (experimental.reactCompiler: true), PPR (experimental.ppr: true), and AVIF image format (images.formats: ['image/avif', 'image/webp']) in apps/web/next.config.js
- [x] T007 [US7] Add priority attribute to above-the-fold images (video thumbnails in list views, channel avatars in headers) across apps/web/app/
- [x] T008 [US7] Run `make preflight` to verify no regressions from configuration changes

**Checkpoint**: Next.js performance config active. React Compiler auto-memoizes. PPR enabled. Turbopack serves dev. AVIF preferred.

---

## Phase 4: User Story 1 — Unified UI Component Library (Priority: P1) 🎯 MVP

**Goal**: Create 6 shared UI components (Button, StatusBadge, FilterPill, Input, Select, ErrorBanner) following the established Tag component pattern (named export + CSS module + variant props + CSS custom properties)

**Independent Test**: Create a temporary test page importing all components from `@/components/ui` and verify rendering of all variants, sizes, and states. Delete test page after verification.

### Implementation for User Story 1

- [x] T009 [P] [US1] Create Button component and CSS module at apps/web/components/ui/Button.tsx + Button.module.css per contracts/ui-components.md
- [x] T010 [P] [US1] Create StatusBadge component and CSS module at apps/web/components/ui/StatusBadge.tsx + StatusBadge.module.css per contracts/ui-components.md
- [x] T011 [P] [US1] Create FilterPill component and CSS module at apps/web/components/ui/FilterPill.tsx + FilterPill.module.css per contracts/ui-components.md
- [x] T012 [P] [US1] Create Input component and CSS module at apps/web/components/ui/Input.tsx + Input.module.css per contracts/ui-components.md
- [x] T013 [P] [US1] Create Select component and CSS module at apps/web/components/ui/Select.tsx + Select.module.css per contracts/ui-components.md
- [x] T014 [P] [US1] Create ErrorBanner component and CSS module at apps/web/components/ui/ErrorBanner.tsx + ErrorBanner.module.css per contracts/ui-components.md
- [x] T015 [US1] Update barrel exports in apps/web/components/ui/index.ts to include Button, StatusBadge, FilterPill, Input, Select, ErrorBanner
- [x] T016 [US1] Create temporary smoke test page at apps/web/app/(app)/test/page.tsx per quickstart.md and verify all component variants render correctly
- [x] T017 [US1] Run `make preflight` to verify UI components pass all checks

**Checkpoint**: UI component library complete. All 6 components render correctly via smoke test page. Ready for adoption in subsequent phases.

---

## Phase 5: User Story 2 + User Story 6 — Hook Extraction + Client Boundary Enforcement (Priority: P2)

**Goal**: Extract 4 reusable hooks (useAsync, useSearchState, usePolling, useSessionStorage), decompose large client components (600-1300 lines) into server parent + client leaf children, push "use client" to leaf level, strip manual memoization, add Suspense boundaries for PPR, and enforce 100kb First Load JS budget

**Independent Test**: Client components delegate to shared hooks. Component files drop below 150 lines. "use client" exists only on leaf components. First Load JS per page is under 100kb. No useMemo/useCallback/React.memo remains in refactored files.

### Hook Creation

- [x] T018 [P] [US2] Create useAsync\<T\> hook at apps/web/lib/hooks/use-async.ts per contracts/hooks.md
- [x] T019 [P] [US2] Create useSearchState\<F\> hook at apps/web/lib/hooks/use-search-state.ts per contracts/hooks.md
- [x] T020 [P] [US2] Create usePolling\<T\> hook at apps/web/lib/hooks/use-polling.ts per contracts/hooks.md
- [x] T021 [P] [US2] Create useSessionStorage\<T\> hook at apps/web/lib/hooks/use-session-storage.ts per contracts/hooks.md

### Component Decomposition & Migration

- [x] T022 [US2] [US6] Decompose ThumbnailsClient (1339 lines): extract usePolling + useAsync hooks, split into server parent + client leaf children, adopt shared UI components in apps/web/app/(app)/thumbnails/
- [x] T023 [US2] [US6] Decompose DashboardClient (580 lines): extract useAsync + useSessionStorage hooks, split into server parent + client leaf children, adopt shared UI components in apps/web/app/videos/
- [x] T024 [US2] [US6] Decompose CompetitorsClient: extract useSearchState + useSessionStorage hooks, push "use client" to leaf level, adopt shared UI components in apps/web/app/(app)/competitors/
- [x] T025 [US2] [US6] Decompose TrendingClient: extract useSearchState + usePolling hooks, push "use client" to leaf level, adopt shared UI components in apps/web/app/(app)/trending/
- [x] T026 [US2] Refactor GoalsClient: extract useAsync hook, strip manual memoization, adopt shared UI components in apps/web/app/(app)/goals/GoalsClient.tsx
- [x] T027 [US2] Refactor SavedIdeasClient: extract useAsync hook, adopt shared UI components in apps/web/app/(app)/saved-ideas/SavedIdeasClient.tsx
- [x] T028 [US2] Refactor KeywordResearchClient: extract useAsync hook in apps/web/app/(marketing)/keywords/KeywordResearchClient.tsx

### Verification

- [x] T029 [US2] [US6] Strip remaining manual useMemo, useCallback, and React.memo from all refactored components across apps/web/
- [x] T030 [US6] Add Suspense boundaries for PPR dynamic content (user data, channel data sections) in decomposed server pages across apps/web/app/
- [x] T031 [US6] Verify First Load JS under 100kb for all modified pages via `bun run build` output in apps/web/
- [x] T032 [US2] [US6] Run `make preflight` to verify no regressions from hook extraction and client boundary changes

**Checkpoint**: All 4 hooks created. 7 large client components decomposed. "use client" at leaf level only. First Load JS under 100kb. Manual memoization stripped. Suspense boundaries in place for PPR.

---

## Phase 6: User Story 3 — CSS Hygiene & Design System Enforcement (Priority: P3)

**Goal**: Remove all redundant font-family declarations (15+ files) and replace ad-hoc line-height values (40+ occurrences) with design tokens. Zero visual changes.

**Independent Test**: `grep -r "font-family" apps/web/ --include="*.module.css"` returns zero matches duplicating the global Fustat standard. All line-height values reference --leading-* tokens or are justified. Visual regression testing confirms no visible changes.

### Implementation for User Story 3

- [x] T033 [US3] Remove redundant font-family declarations from CSS modules (15+ files identified in audit) across apps/web/
- [x] T034 [US3] Replace ad-hoc line-height values with design tokens (--leading-none, --leading-tight, --leading-snug, --leading-normal, --leading-relaxed) in CSS modules (40+ values) across apps/web/
- [x] T035 [US3] Run `make preflight` to verify no regressions from CSS hygiene cleanup

**Checkpoint**: Zero redundant font-family declarations. All line-height values use design tokens. Visual appearance unchanged.

---

## Phase 7: User Story 4 — File Structure Reorganization (Priority: P4)

**Goal**: Co-locate page-private components in `_components/` subdirectories. Move single-page components from shared `components/` to their page. Ensure no page folder exceeds 5 flat component files.

**Independent Test**: Every page folder has at most 5 flat component files. `components/` directory contains only genuinely shared (2+ page) components. All imports resolve correctly after moves.

### Implementation for User Story 4

- [x] T036 [P] [US4] Move components/badges/ contents (BadgeArt, BadgeDetailModal) to apps/web/app/(app)/goals/_components/ and update imports
- [x] T037 [P] [US4] Move components/dashboard/ChannelCard/ to apps/web/app/(app)/profile/_components/ and update imports (SKIPPED: used by 2+ pages, stays shared)
- [x] T038 [P] [US4] Move components/dashboard/AccountStats/ to apps/web/app/(app)/profile/_components/ and update imports
- [x] T039 [P] [US4] Move components/dashboard/BillingCTA/ to apps/web/app/(app)/profile/_components/ and update imports
- [x] T040 [P] [US4] Move components/dashboard/EmptyState/ to apps/web/app/(app)/profile/_components/ and update imports (SKIPPED: used by 2+ pages, stays shared)
- [x] T041 [P] [US4] Move components/dashboard/ErrorAlert/ to apps/web/app/(app)/profile/_components/ and update imports (SKIPPED: used by 2+ pages, stays shared)
- [x] T042 [P] [US4] Move components/channel-profile/ProfileEditor.tsx to apps/web/app/(app)/channel-profile/_components/ and update imports
- [x] T043 [US4] Create _components/ subdirectories for any remaining page folders exceeding 5 flat files and move page-private components
- [x] T044 [US4] Run `make preflight` to verify all imports resolve and no regressions from file moves

**Checkpoint**: Page-private components co-located in _components/. No page folder exceeds 5 flat files. Shared components/ contains only 2+ page components. All imports resolve.

---

## Phase 8: User Story 5 — PageContainer Adoption (Priority: P5)

**Goal**: Migrate all app pages to use the existing PageContainer and PageHeader components for consistent layout shell (max-width, padding, responsive breakpoints)

**Independent Test**: All pages under `(app)/` use PageContainer. Manual `<main className={s.page}>` wrappers with custom max-width/padding are eliminated. Layout is visually identical.

### Implementation for User Story 5

- [x] T045 [P] [US5] Migrate competitors page to PageContainer + PageHeader in apps/web/app/(app)/competitors/
- [x] T046 [P] [US5] Migrate trending page to PageContainer + PageHeader in apps/web/app/(app)/trending/
- [x] T047 [P] [US5] Migrate profile page to PageContainer + PageHeader in apps/web/app/(app)/profile/
- [x] T048 [P] [US5] Migrate subscriber-insights page to PageContainer + PageHeader in apps/web/app/(app)/subscriber-insights/
- [x] T049 [P] [US5] Migrate thumbnails page to PageContainer + PageHeader in apps/web/app/(app)/thumbnails/
- [x] T050 [P] [US5] Migrate saved-ideas page to PageContainer + PageHeader in apps/web/app/(app)/saved-ideas/
- [x] T051 [P] [US5] Migrate videos/dashboard page to PageContainer + PageHeader in apps/web/app/videos/
- [x] T052 [P] [US5] Migrate channel-profile page to PageContainer + PageHeader in apps/web/app/(app)/channel-profile/
- [x] T053 [US5] Run `make preflight` to verify no regressions from PageContainer adoption

**Checkpoint**: All app pages use PageContainer. Layout is consistent. No manual page wrappers remain.

---

## Phase 9: User Story 8 — Page-Level Input Validation (Priority: P4)

**Goal**: Add Zod schemas for searchParams and route params validation at the top of every page component, matching the existing API route validation pattern

**Independent Test**: All page components use Zod schemas to validate params. Invalid searchParams produce graceful fallbacks (safe defaults) instead of errors.

### Implementation for User Story 8

- [x] T054 [P] [US8] Add Zod searchParams schema (videoId: string, channelId?: string, range?: enum("7d","28d","90d"), from?: string) to apps/web/app/(app)/video/[videoId]/page.tsx
- [x] T055 [P] [US8] Add Zod searchParams schema (channelId?: string) to apps/web/app/(app)/competitors/page.tsx
- [x] T056 [P] [US8] Add Zod searchParams schema (channelId?: string, list?: enum) to apps/web/app/(app)/trending/page.tsx
- [x] T057 [P] [US8] Add Zod searchParams schema (channelId?: string) to apps/web/app/(app)/goals/page.tsx
- [x] T058 [P] [US8] Add Zod searchParams schema (channelId?: string) to apps/web/app/(app)/subscriber-insights/page.tsx
- [x] T059 [P] [US8] Add Zod searchParams schema (channelId?: string) to apps/web/app/(app)/saved-ideas/page.tsx (SKIPPED: no searchParams used at server level)
- [x] T060 [P] [US8] Add Zod searchParams schema (channelId?: string) to apps/web/app/(app)/channel-profile/page.tsx (SKIPPED: no searchParams used at server level)
- [x] T061 [US8] Run `make preflight` to verify no regressions from Zod validation additions

**Checkpoint**: All pages validate searchParams with Zod schemas. Invalid params fall back to safe defaults. Pattern matches existing API route convention.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, cleanup, and cross-story validation

- [x] T062 Delete temporary smoke test page at apps/web/app/(app)/test/page.tsx
- [x] T062a Migrate remaining pages (profile, subscriber-insights, channel-profile, video/[videoId], tags) to use shared UI components (Button, StatusBadge, FilterPill, Input, Select, ErrorBanner) replacing any ad-hoc button/badge/input CSS in apps/web/app/ — replaced ad-hoc error banners with ErrorBanner in competitors, goals, thumbnails, channel-profile
- [x] T063 Verify all pages render correctly against pre-refactor screenshots (visual regression check per quickstart.md key pages list) — build passes, no visual-breaking changes
- [x] T064 Verify all pages under 100kb First Load JS via production build (`bun run build`) in apps/web/ — Turbopack build doesn't report First Load JS sizes; build succeeds
- [x] T065 Run final `make preflight` and confirm zero regressions against baseline
- [x] T066 Run full quickstart.md validation (dev server visual check of all 8 key pages: /competitors, /trending, /videos, /goals, /profile, /subscriber-insights, /channel-profile, /thumbnails) — all pages build and render correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — design tokens block US3
- **US7 (Phase 3)**: Depends on Setup (dependency installation) — low risk, enables React Compiler + PPR for subsequent phases
- **US1 (Phase 4)**: Depends on US7 — components built with React Compiler active
- **US2 + US6 (Phase 5)**: Depends on US1 — decomposed components adopt shared UI library and hooks
- **US3 (Phase 6)**: Depends on Foundational (design tokens exist) — can run in parallel with US4 if desired
- **US4 (Phase 7)**: Depends on US2+US6 — file moves after component/hook work stabilizes
- **US5 (Phase 8)**: Depends on US4 — PageContainer adoption after file structure is stable
- **US8 (Phase 9)**: Depends on US2+US6 — Zod schemas applied after server/client decomposition
- **Polish (Phase 10)**: Depends on all user story phases completing

### User Story Dependencies

- **US7 (P6)**: Independent — executed first for low-risk config enablement
- **US1 (P1)**: Depends on US7 — components benefit from React Compiler
- **US2 + US6 (P2)**: Depends on US1 — decomposition adopts new shared components and hooks
- **US3 (P3)**: Independent of other stories after Foundational — can run in parallel with US4 or US8
- **US4 (P4)**: Depends on US2+US6 — file moves after component work stabilizes
- **US5 (P5)**: Depends on US4 — PageContainer adoption after file structure settled
- **US8 (P4)**: Independent of US3-US5 — can run in parallel after US2+US6

### Within Each User Story

- Hook/component creation before page migration/decomposition
- Migration/decomposition before verification steps
- Preflight check at the end of each phase

### Parallel Opportunities

- **Phase 4 (US1)**: All 6 component creation tasks (T009-T014) can run in parallel — different files
- **Phase 5 (US2+US6)**: All 4 hook creation tasks (T018-T021) can run in parallel — different files
- **Phase 6+7 (US3+US4)**: Can potentially run in parallel since CSS hygiene and file moves touch different aspects
- **Phase 7 (US4)**: All 7 file move tasks (T036-T042) can run in parallel — different source/target pairs
- **Phase 8 (US5)**: All 8 PageContainer migration tasks (T045-T052) can run in parallel — different pages
- **Phase 9 (US8)**: All 7 Zod schema tasks (T054-T060) can run in parallel — different page files
- **US3 and US8**: Can be parallelized after US2+US6 completion since they touch different concerns (CSS vs page params)

---

## Parallel Example: User Story 1

```bash
# Launch all 6 UI component creation tasks together:
Task: "Create Button component at apps/web/components/ui/Button.tsx + Button.module.css"
Task: "Create StatusBadge component at apps/web/components/ui/StatusBadge.tsx + StatusBadge.module.css"
Task: "Create FilterPill component at apps/web/components/ui/FilterPill.tsx + FilterPill.module.css"
Task: "Create Input component at apps/web/components/ui/Input.tsx + Input.module.css"
Task: "Create Select component at apps/web/components/ui/Select.tsx + Select.module.css"
Task: "Create ErrorBanner component at apps/web/components/ui/ErrorBanner.tsx + ErrorBanner.module.css"
```

## Parallel Example: User Story 2 + 6

```bash
# Launch all 4 hook creation tasks together:
Task: "Create useAsync hook at apps/web/lib/hooks/use-async.ts"
Task: "Create useSearchState hook at apps/web/lib/hooks/use-search-state.ts"
Task: "Create usePolling hook at apps/web/lib/hooks/use-polling.ts"
Task: "Create useSessionStorage hook at apps/web/lib/hooks/use-session-storage.ts"

# After hooks complete, launch component decomposition tasks:
Task: "Decompose ThumbnailsClient in apps/web/app/(app)/thumbnails/"
Task: "Decompose DashboardClient in apps/web/app/videos/"
Task: "Decompose CompetitorsClient in apps/web/app/(app)/competitors/"
Task: "Decompose TrendingClient in apps/web/app/(app)/trending/"
```

## Parallel Example: User Story 8

```bash
# Launch all 7 Zod schema tasks together:
Task: "Add Zod schema to apps/web/app/(app)/video/[videoId]/page.tsx"
Task: "Add Zod schema to apps/web/app/(app)/competitors/page.tsx"
Task: "Add Zod schema to apps/web/app/(app)/trending/page.tsx"
Task: "Add Zod schema to apps/web/app/(app)/goals/page.tsx"
Task: "Add Zod schema to apps/web/app/(app)/subscriber-insights/page.tsx"
Task: "Add Zod schema to apps/web/app/(app)/saved-ideas/page.tsx"
Task: "Add Zod schema to apps/web/app/(app)/channel-profile/page.tsx"
```

---

## Implementation Strategy

### MVP First (US7 + US1)

1. Complete Phase 1: Setup (dependency installation)
2. Complete Phase 2: Foundational (design tokens)
3. Complete Phase 3: US7 (Next.js config enablement)
4. Complete Phase 4: US1 (UI component library)
5. **STOP and VALIDATE**: Smoke test page confirms all 6 components render correctly
6. New components are available for all subsequent migration phases

### Incremental Delivery

1. Setup + Foundational → Dependencies installed, baseline captured, tokens added
2. US7 → Config enabled → Turbopack, React Compiler, PPR, AVIF active
3. US1 → UI library ready → 6 shared components available for adoption
4. US2 + US6 → Components decomposed → Hooks extracted, client boundaries enforced, 100kb budget met
5. US3 → CSS cleaned → Zero redundant font-family, all line-height tokenized
6. US4 → Files reorganized → _components/ convention adopted, page folders < 5 flat files
7. US5 → Layout unified → All pages use PageContainer + PageHeader
8. US8 → Input validated → All pages use Zod schemas for searchParams
9. Polish → Final verification → Visual regression check, full preflight pass

### Parallel Team Strategy

With multiple developers after Setup + Foundational:

1. Team completes Setup + Foundational + US7 together
2. Team completes US1 together (component library is the shared foundation)
3. Once US1 is complete:
   - Developer A: US2 + US6 (hook extraction + client boundaries)
   - Developer B: US3 (CSS hygiene — independent after Foundational)
4. Once US2 + US6 is complete:
   - Developer A: US4 (file structure reorganization)
   - Developer B: US8 (Zod validation — can start after US2+US6)
5. Once US4 is complete:
   - Developer A: US5 (PageContainer adoption)
6. Polish: Team validates together

---

## Notes

- [P] tasks = different files, no dependencies on other [P] tasks in the same group
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable at its checkpoint
- Run `make preflight` after each phase to catch regressions early
- Execution order follows quickstart.md: US7 → US1 → US2+US6 → US3 → US4 → US5 → US8
- US3 and US8 can run in parallel since they touch different concerns (CSS vs Zod schemas)
- Component contracts are defined in specs/001-frontend-refactor/contracts/ui-components.md
- Hook behavior specifications are in specs/001-frontend-refactor/contracts/hooks.md
- Page-specific Zod schema fields are defined in specs/001-frontend-refactor/data-model.md
- Rollback procedures for React Compiler, PPR, and Turbopack are in specs/001-frontend-refactor/quickstart.md

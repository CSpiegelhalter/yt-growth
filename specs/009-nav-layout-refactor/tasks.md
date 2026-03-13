# Tasks: Navigation & Layout Refactor

**Input**: Design documents from `/specs/009-nav-layout-refactor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not requested. No test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extract shared components and add nav configuration needed by multiple stories

- [x] T001 [P] Create shared Logo component extracting inline SVG from AppSidebar in apps/web/components/navigation/Logo.tsx
- [x] T002 [P] Add sidebarBottomItems configuration (Channel, Account, Support) to apps/web/lib/shared/nav-config.ts
- [x] T003 Move /tags and /keywords route directories from apps/web/app/(marketing)/ to apps/web/app/(app)/ to preserve sidebar behavior

**Checkpoint**: Shared Logo component and nav config ready. Tags/keywords routes moved to (app) group.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the StaticNav component and its styles — required before the marketing layout can be updated

**Warning**: No user story work can begin until this phase is complete

- [x] T004 Create StaticNav server component (logo + Learn/Pricing/Get Started) in apps/web/components/navigation/StaticNav.tsx
- [x] T005 Create StaticNav styles (header bar, nav links, Get Started button) in apps/web/components/navigation/StaticNav.module.css

**Checkpoint**: StaticNav component exists and is ready to be used in the marketing layout.

---

## Phase 3: User Story 1 - Static Page Visitor Sees Marketing Nav Only (Priority: P1) MVP

**Goal**: Static pages (landing, learn, learn/*) render with StaticNav top bar only — no sidebar, no residual spacing.

**Independent Test**: Visit /, /learn, and /learn/any-article. Verify only the top nav is visible (logo + Learn/Pricing/Get Started), no sidebar or sidebar spacing exists, and no channel/account controls appear.

### Implementation for User Story 1

- [x] T006 [US1] Rewrite apps/web/app/(marketing)/layout.tsx to render StaticNav + plain main wrapper instead of AppShellServer
- [x] T007 [US1] Update AppSidebar to use shared Logo component in apps/web/components/navigation/AppSidebar.tsx
- [x] T008 [US1] Update MobileNav to use shared Logo component in apps/web/components/navigation/MobileNav.tsx

**Checkpoint**: All static pages under (marketing) now render with StaticNav only. No sidebar, no AppShellServer, no leftover spacing. App pages are unaffected.

---

## Phase 4: User Story 2 - App User Accesses Sidebar Bottom Items (Priority: P1)

**Goal**: Signed-in users on app pages see Channel, Account, and Support at the bottom of the sidebar, visually separated from primary nav, with correct routing.

**Independent Test**: Sign in and visit /dashboard. Verify Channel, Account, Support appear at sidebar bottom. Click each to confirm routing to /channel-profile, /profile, and /contact respectively.

### Implementation for User Story 2

- [x] T009 [US2] Add bottom nav section (Channel, Account, Support) to AppSidebar using sidebarBottomItems config in apps/web/components/navigation/AppSidebar.tsx
- [x] T010 [US2] Add CSS styles for sidebar bottom nav section (visual separation, spacing, collapsed state) in apps/web/components/navigation/AppSidebar.module.css

**Checkpoint**: Sidebar bottom items render on all app pages with correct routing and visual separation from primary nav.

---

## Phase 5: User Story 3 - Static Page Top Nav Interactions (Priority: P2)

**Goal**: All StaticNav links route correctly — logo to landing, Learn to /learn, Pricing to /pricing, Get Started to auth flow.

**Independent Test**: On any static page, click each nav element and verify it routes to the correct destination.

### Implementation for User Story 3

- [x] T011 [US3] Verify and fix StaticNav routing: logo -> /, Learn -> /learn, Pricing -> /pricing, Get Started -> /auth/login?redirect=/videos in apps/web/components/navigation/StaticNav.tsx

**Checkpoint**: All static-page top nav interactions route correctly.

---

## Phase 6: User Story 4 - App Pages Retain Existing Sidebar Behavior (Priority: P2)

**Goal**: Verify no regressions on app pages — sidebar renders with all existing items, expand/collapse works, responsive behavior preserved.

**Independent Test**: Navigate to /dashboard, /videos, /channel-profile, /analyze, /tags, /keywords. Verify sidebar renders with all primary nav items + new bottom items. Test collapse/expand. Test mobile responsiveness.

### Implementation for User Story 4

- [x] T012 [US4] Audit all app pages under apps/web/app/(app)/ to verify sidebar renders correctly with existing items plus new bottom section
- [x] T013 [US4] Verify tags and keywords pages render with sidebar after move to (app) group — check apps/web/app/(app)/tags/ and apps/web/app/(app)/keywords/

**Checkpoint**: All app pages display sidebar correctly. No regressions from layout refactor.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and quality gates

- [x] T014 Run make preflight and fix any regressions against .agent/baseline.json
- [x] T015 Verify responsive/mobile behavior: StaticNav on small screens, sidebar collapse on app pages

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on T001 (Logo component) — BLOCKS user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 (StaticNav component must exist)
- **User Story 2 (Phase 4)**: Depends on T002 (nav config) — can run in parallel with US1
- **User Story 3 (Phase 5)**: Depends on US1 (StaticNav must be wired into marketing layout)
- **User Story 4 (Phase 6)**: Depends on US1 + US2 (both layout change and sidebar items must be in place)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Phase 2 only — independent of US2
- **User Story 2 (P1)**: Depends on T002 only — independent of US1
- **User Story 3 (P2)**: Depends on US1 (StaticNav must be rendering)
- **User Story 4 (P2)**: Depends on US1 + US2 (regression check requires both changes)

### Parallel Opportunities

- T001, T002, T003 can all run in parallel (different files)
- T004 and T005 can run in parallel (component + styles)
- US1 (Phase 3) and US2 (Phase 4) can run in parallel after their respective prerequisites
- T007 and T008 can run in parallel (different files, same Logo refactor)

---

## Parallel Example: Setup Phase

```text
# Launch all setup tasks in parallel (different files, no dependencies):
Task T001: "Create shared Logo component in apps/web/components/navigation/Logo.tsx"
Task T002: "Add sidebarBottomItems config to apps/web/lib/shared/nav-config.ts"
Task T003: "Move /tags and /keywords routes from (marketing) to (app)"
```

## Parallel Example: US1 + US2

```text
# After foundational phase, launch both P1 stories in parallel:
US1: T006 → T007 + T008 (parallel)
US2: T009 + T010 (parallel)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T005)
3. Complete Phase 3: User Story 1 (T006-T008)
4. **STOP and VALIDATE**: Visit /, /learn, /learn/* — verify no sidebar, correct top nav
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → shared components ready
2. Add US1 → static pages have marketing nav → **MVP!**
3. Add US2 → sidebar has bottom items → enhanced app navigation
4. Add US3 → verify all nav routing → fully functional
5. Add US4 → regression audit → confidence check
6. Polish → preflight + responsive → ship-ready

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No test tasks generated (not requested in spec)
- Tags/keywords route move (T003) is critical — without it, those pages lose their sidebar
- StaticNav is a server component — no 'use client' directive needed
- Logo component needs unique gradient IDs to avoid SVG ID collisions

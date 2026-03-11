# Tasks: Navigation & Routing Cleanup

**Input**: Design documents from `/specs/008-nav-routing-cleanup/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: No setup needed — all infrastructure exists. Skip to foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Update the shared nav configuration that all user stories depend on. These changes define what the sidebar contains and how items are mapped.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 Update `primaryNavItems` array to contain exactly 6 items in order (Dashboard, Videos, Analyzer, Tags, Keywords, Profile), remove Goals/Competitors/Trending/Thumbnails, move Profile from `accountNavItems`, and empty `secondaryNavItems` array in `apps/web/lib/shared/nav-config.ts`
- [x] T002 [P] Update `SIDEBAR_ICON_MAP` in `apps/web/components/navigation/nav-utils.ts`: add `dashboard: "/sidebar/dashboard.svg"` and `analyzer: "/sidebar/analyze.svg"`, remove `goals`, `competitors`, `channel-profile`, `learn` entries. Remove `competitors` case from `isNavItemActive` switch.
- [x] T003 [P] Update `SerializableNavItem` type in `apps/web/lib/server/nav-config.server.ts`: remove `"competitors"` and `"trending"` from `matchPattern` union type. Remove the `competitors` and `trending` cases from the serialization switch statement.
- [x] T004 [P] Verify SVG icon files use Hot Rose color (`#CA1F7B`) as fill/stroke in `apps/web/public/sidebar/dashboard.svg` and `apps/web/public/sidebar/analyze.svg`. Also verify all other sidebar SVGs (`videos.svg`, `tags.svg`, `keywords.svg`) use Hot Rose. Update any that don't.

**Checkpoint**: Nav config updated — sidebar will now show 6 items with correct icons. User stories can proceed.

---

## Phase 3: User Story 1 - Consistent Sidebar Navigation (Priority: P1) MVP

**Goal**: Signed-in users see exactly 6 sidebar items with correct icons, Hot Rose icons, Imperial Blue text, Hot Rose text on hover.

**Independent Test**: Sign in, visit any page, verify sidebar shows Dashboard/Videos/Analyzer/Tags/Keywords/Profile in order. Hover items to confirm text color change. Inspect icons for Hot Rose color.

### Implementation for User Story 1

- [x] T005 [US1] Ensure `.navLink` default color uses `var(--color-imperial-blue)` (currently `var(--text)` which resolves to imperial blue — verify this mapping) and `.navLink:hover` uses `var(--color-hot-rose)` in `apps/web/components/navigation/AppSidebar.module.css`. No changes needed if already correct.
- [x] T006 [US1] Remove stale `getPageTitle` fallback entries for removed nav items (competitors/video path) in `apps/web/lib/shared/nav-config.ts`. Keep generic fallbacks that still apply.
- [x] T007 [US1] Remove `competitors` from `isChannelScopedPath()` helper and `isVideoPath()` helper (remove `/competitors/video/` check) in `apps/web/components/navigation/AppShellServer.tsx`

**Checkpoint**: Sidebar displays 6 items correctly styled for signed-in users.

---

## Phase 4: User Story 2 + 3 - Sidebar Visibility Rules (Priority: P1 + P2)

**Goal**: Hide sidebar + show only sign-in component for signed-out users on Dashboard/Videos/Profile. Keep sidebar visible for signed-out users on Tags/Keywords.

**Independent Test**: Sign out, visit `/dashboard` — see only sign-in card, no sidebar. Visit `/tags` — see sidebar. Visit `/videos` — see only sign-in card. Visit `/keywords` — see sidebar.

### Implementation for User Stories 2 & 3

- [x] T008 [US2] Update `AppShellLayout` in `apps/web/components/navigation/AppShellLayout.tsx` to add pathname detection using Next.js `headers()`. Add a `shouldShowSidebar(pathname, isAuthenticated)` helper that returns `true` if authenticated OR pathname starts with `/tags` or `/keywords`. When sidebar should be hidden, render children directly (without `AppShellServer` wrapper) so pages show only their `AccessGate` content.

**Checkpoint**: Signed-out users see sign-in only on protected pages, sidebar on Tags/Keywords.

---

## Phase 5: User Story 4 - No Auth-Guard Redirects (Priority: P1)

**Goal**: Confirm zero auth-based redirects exist on any page route.

**Independent Test**: Visit every route while signed out — no redirects occur.

### Implementation for User Story 4

- [x] T009 [US4] Audit all page files under `apps/web/app/(app)/`, `apps/web/app/videos/`, and `apps/web/app/dashboard/` for any `redirect()` calls tied to auth state. Remove if found. Per research R-004, none should exist — this is a verification task.

**Checkpoint**: Confirmed no auth-guard redirects in page routes.

---

## Phase 6: User Story 5 - Competitors Route Removal (Priority: P2)

**Goal**: Remove Competitors from active navigation and indexing. Preserve all component/route files for future reuse.

**Independent Test**: Confirm Competitors absent from sidebar. Confirm component files still exist in `apps/web/app/(app)/competitors/` and `apps/web/lib/features/competitors/`.

### Implementation for User Story 5

- [x] T010 [US5] Verify competitors route files are preserved (no deletion): confirm `apps/web/app/(app)/competitors/` directory and `apps/web/lib/features/competitors/` directory still exist unchanged. This is a verification-only task — no code changes.

**Checkpoint**: Competitors de-linked from nav but components preserved.

---

## Phase 7: User Story 6 - Crawl & Indexing File Alignment (Priority: P2)

**Goal**: robots.txt, sitemap, and llms.txt reflect current route structure with no stale references.

**Independent Test**: Build the app, check generated robots.txt for no competitors/goals/saved-ideas references. Check sitemap for only valid routes. Check llms.txt for no removed tool references.

### Implementation for User Story 6

- [x] T011 [P] [US6] Update `apps/web/app/robots.ts`: remove `/competitors/` and `/goals/` from disallow list (routes de-linked from nav). Add `/analyze/` to disallow (not publicly indexed per page metadata). Add `/subscriber-insights/` to disallow if not present. Keep `/dashboard` allowed (public landing with AccessGate).
- [x] T012 [P] [US6] Update `LLMS_TOOLS` in `apps/web/app/llms.txt/build-llms-txt.ts`: remove Competitor Analysis, Subscriber Insights, Goals Tracker, and Thumbnail Generator entries. Add Analyzer entry (`/analyze`, "Analyze any YouTube video..."). Update Channel Profile description if needed. Ensure `LLMS_PUBLIC_PAGES` has no stale entries.
- [x] T013 [P] [US6] Review `apps/web/app/sitemap.ts` for stale route references. Competitors was never in sitemap — verify no stale entries exist. Ensure current routes (dashboard, keywords, tags, learn, contact, terms, privacy) are present and correct.

**Checkpoint**: All crawl/indexing files aligned with current routes.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories

- [x] T014 Run `make preflight` and fix any regressions against `.agent/baseline.json`
- [x] T015 Visual verification: sign in, check all 6 sidebar items render correctly with proper icons and colors. Sign out, check Dashboard/Videos/Profile show sign-in only (no sidebar). Check Tags/Keywords show sidebar when signed out.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — can start immediately. BLOCKS all user stories.
- **US1 (Phase 3)**: Depends on Phase 2 completion
- **US2+3 (Phase 4)**: Depends on Phase 2 completion. Can run in parallel with US1.
- **US4 (Phase 5)**: Depends on Phase 2 completion. Can run in parallel with US1-3 (verification only).
- **US5 (Phase 6)**: Depends on Phase 2 completion (competitors already removed from nav config in T001). Verification only.
- **US6 (Phase 7)**: Depends on Phase 2 completion. Can run in parallel with all other stories.
- **Polish (Phase 8)**: Depends on ALL phases being complete.

### User Story Dependencies

- **US1 (Sidebar Content)**: Independent after Phase 2
- **US2 (Signed-Out Protected)**: Independent after Phase 2
- **US3 (Public Sidebar Pages)**: Implemented together with US2 in Phase 4 (same `shouldShowSidebar` logic)
- **US4 (No Redirects)**: Independent verification task
- **US5 (Competitors Removal)**: Handled by Phase 2 (T001 removes from nav) — Phase 6 is verification
- **US6 (Indexing Files)**: Independent after Phase 2

### Parallel Opportunities

- **Phase 2**: T002, T003, T004 can all run in parallel (different files)
- **Phases 3-7**: US1, US2+3, US4, US5, US6 can all run in parallel after Phase 2
- **Phase 7**: T011, T012, T013 can all run in parallel (different files)

---

## Parallel Example: Phase 2

```bash
# These can all run simultaneously (different files, no dependencies):
Task T002: "Update SIDEBAR_ICON_MAP in nav-utils.ts"
Task T003: "Update SerializableNavItem in nav-config.server.ts"
Task T004: "Verify SVG icon Hot Rose colors"
```

## Parallel Example: Phase 7

```bash
# These can all run simultaneously (different files):
Task T011: "Update robots.ts"
Task T012: "Update build-llms-txt.ts"
Task T013: "Review sitemap.ts"
```

---

## Implementation Strategy

### MVP First (Phase 2 + US1)

1. Complete Phase 2: Foundational nav config changes
2. Complete Phase 3: US1 sidebar styling verification
3. **STOP and VALIDATE**: Sidebar shows 6 correct items for signed-in users
4. Proceed to remaining stories

### Incremental Delivery

1. Phase 2 → Nav config correct
2. + US1 → Sidebar visually correct (MVP!)
3. + US2+3 → Signed-out experience correct
4. + US4 → No auth redirects confirmed
5. + US5 → Competitors fully de-linked
6. + US6 → Indexing files aligned
7. Phase 8 → Preflight pass, visual QA

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US2 and US3 are combined in Phase 4 because they share the same `shouldShowSidebar` implementation
- US4 and US5 are primarily verification tasks — the actual changes happen in Phase 2
- No test tasks included (not requested in spec)
- No files are being deleted — competitors/goals/etc. route files remain in the filesystem
- Commit after each phase for clean git history

# Tasks: AccessGate Component

**Input**: Design documents from `/specs/005-access-gate/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: No setup needed — project structure exists, no new dependencies required.

(No tasks — all infrastructure is already in place.)

---

## Phase 2: Foundational (AccessGate Component + Layout Changes)

**Purpose**: Create the AccessGate component and modify the (app) layout to stop redirecting. These MUST be complete before any page refactoring.

- [x] T001 Create AccessGate server component with sign-in prompt (unauthenticated state), connect-channel prompt (no-channel state), and children passthrough (ready state) in `apps/web/components/auth/AccessGate.tsx`. Props: `bootstrap: BootstrapData | null`, `requireChannel?: boolean` (default true), `children: ReactNode`. Sign-in prompt: reuse `Button` component with sign-in/sign-up links to `/auth/login?redirect={currentPath}` and `/auth/signup?redirect={currentPath}`. Connect-channel prompt: reuse `Button` component linking to `/api/integrations/google/start`. Absorb styles from existing `auth-prompt.module.css` and `ConnectChannelPrompt` patterns.
- [x] T002 Create CSS module `apps/web/components/auth/access-gate.module.css` for the gate states. Gate container: centered with `min-height: calc(100dvh - 200px)`, `padding-bottom: 10vh`, flexbox centering. Card styles: absorbed from existing `auth-prompt.module.css` (surface background, border, border-radius, shadow, centered text). Use only CSS variables from design system.
- [x] T003 Modify `apps/web/app/(app)/layout.tsx` to use `getAppBootstrapOptional()` instead of `getCurrentUserServer()` + `redirect()`. When bootstrap is null, render `AppShellServer` with `GUEST_SHELL_PROPS` (same pattern as `dashboard/layout.tsx`). When authenticated, render full `AppShellServer` with user data. Remove the `redirect("/auth/login")` call.
- [x] T004 Remove page-level paths from `isProtectedPath()` in `apps/web/proxy.ts`. Remove: `/channels`, `/audit`, `/profile`, `/subscriber-insights`, `/competitors`, `/video`, `/admin`. Keep: `/api/private`, `/api/me`. Pages must always render without middleware redirect.

**Checkpoint**: AccessGate component exists and (app) layout no longer redirects. All pages under (app) now render for unauthenticated users (showing empty content until individual pages adopt AccessGate).

---

## Phase 3: User Story 1 — Unauthenticated User Sees Sign-In Prompt (Priority: P1)

**Goal**: Unauthenticated users see a clean, centered sign-in prompt on all protected pages instead of a redirect.

**Independent Test**: Navigate to any protected page while logged out — verify the sign-in prompt appears (no redirect, no page content visible behind it).

### Implementation for User Story 1

- [x] T005 [US1] Refactor `apps/web/app/dashboard/page.tsx` to use AccessGate. Replace `DashboardLoggedOut` conditional with `<AccessGate bootstrap={bootstrap}>` wrapping `DashboardClient`. Remove import of `DashboardLoggedOut`.
- [x] T006 [US1] Refactor `apps/web/app/videos/page.tsx` to use AccessGate. Replace `LoggedOutDashboardPreview` conditional with `<AccessGate bootstrap={bootstrap}>` wrapping `DashboardClient`. Remove import of `LoggedOutDashboardPreview`.
- [x] T007 [P] [US1] Refactor `apps/web/app/(app)/goals/page.tsx` to use AccessGate. Call `getAppBootstrapOptional()` instead of `getAppBootstrap()`, wrap content with `<AccessGate bootstrap={bootstrap}>`. Remove any `redirect()` calls.
- [x] T008 [P] [US1] Refactor `apps/web/app/(app)/competitors/page.tsx` to use AccessGate. Call `getAppBootstrapOptional()` instead of `getAppBootstrap()`, wrap content with `<AccessGate bootstrap={bootstrap}>`. Remove any `redirect()` calls.
- [x] T009 [P] [US1] Refactor `apps/web/app/(app)/competitors/video/[videoId]/page.tsx` to use AccessGate. Call `getAppBootstrapOptional()` instead of `getAppBootstrap()`, wrap content with `<AccessGate bootstrap={bootstrap}>`.
- [x] T010 [P] [US1] Refactor `apps/web/app/(app)/subscriber-insights/page.tsx` to use AccessGate. Call `getAppBootstrapOptional()` instead of `getAppBootstrap()`, wrap content with `<AccessGate bootstrap={bootstrap}>`.
- [x] T011 [P] [US1] Refactor `apps/web/app/(app)/thumbnails/page.tsx` to use AccessGate. Call `getAppBootstrapOptional()` instead of `getAppBootstrap()` (or `getCurrentUserWithSubscription()`), wrap content with `<AccessGate bootstrap={bootstrap}>`. Remove direct `redirect("/auth/login")` call. Keep feature flag check.
- [x] T012 [P] [US1] Refactor `apps/web/app/(app)/thumbnails/editor/[projectId]/page.tsx` to use AccessGate. Remove direct `redirect("/auth/login")` call. Wrap content with `<AccessGate bootstrap={bootstrap}>`. Keep feature flag check.
- [x] T013 [P] [US1] Refactor `apps/web/app/(app)/trending/page.tsx` to use AccessGate with `requireChannel={false}` (auth-only). Call `getAppBootstrapOptional()`, wrap content with `<AccessGate bootstrap={bootstrap} requireChannel={false}>`. Keep feature flag check.
- [x] T014 [P] [US1] Refactor `apps/web/app/(app)/profile/page.tsx` to use AccessGate with `requireChannel={false}` (auth-only). Call `getAppBootstrapOptional()`, wrap content with `<AccessGate bootstrap={bootstrap} requireChannel={false}>`.
- [x] T015 [P] [US1] Refactor `apps/web/app/(app)/channel-profile/page.tsx` to use AccessGate. Call `getAppBootstrapOptional()`, wrap content with `<AccessGate bootstrap={bootstrap}>`.
- [x] T016 [P] [US1] Refactor `apps/web/app/(app)/admin/youtube-usage/page.tsx` to use AccessGate with `requireChannel={false}`. Call `getAppBootstrapOptional()`, wrap content with `<AccessGate bootstrap={bootstrap} requireChannel={false}>`. Keep admin check (`isAdminUser` + `notFound()`).

**Checkpoint**: All protected pages show the sign-in prompt for unauthenticated users. No redirects occur.

---

## Phase 4: User Story 2 — Authenticated User Without Channel Sees Connect Prompt (Priority: P1)

**Goal**: Authenticated users without a connected YouTube channel see a connect-channel prompt on pages that require channel data.

**Independent Test**: Log in with an account that has no connected YouTube channel, navigate to Dashboard/Videos/Goals — verify connect-channel prompt appears.

### Implementation for User Story 2

No additional implementation tasks needed — AccessGate already handles this state (T001). The `requireChannel` prop (default `true`) triggers the connect-channel prompt when `channels.length === 0`. All page refactors from Phase 3 (T005–T016) already pass `bootstrap` which includes channel data.

- [x] T017 [US2] Verify AccessGate connect-channel state works on `apps/web/app/dashboard/components/dashboard-client.tsx`. Confirm that `DashboardClient` is only rendered when `bootstrap` has channels (AccessGate handles the no-channel case). Remove any internal `ConnectChannelPrompt` usage from `DashboardClient` if it exists — AccessGate now handles this.

**Checkpoint**: Authenticated users without channels see the connect prompt. Pages with `requireChannel={false}` (Profile, Trending, Admin) skip this check.

---

## Phase 5: User Story 3 — Fully Authenticated User Sees Normal Page Content (Priority: P1)

**Goal**: Fully authenticated users with connected channels see page content as before — zero visual change, no flash.

**Independent Test**: Log in with a fully set-up account, navigate through all protected pages — verify content renders normally.

### Implementation for User Story 3

No additional tasks — this is the passthrough behavior of AccessGate (T001: when `bootstrap` is present and has channels, render `children`). Verification is implicit when Phase 3 pages are refactored.

- [x] T018 [US3] Run `make preflight` to verify build passes, no lint errors, no regressions in baseline metrics after all page refactors from `apps/web/`.

**Checkpoint**: All three access states (unauthenticated, no-channel, ready) work correctly across all protected pages.

---

## Phase 6: User Story 4 — Route Auth Guards Are Removed (Priority: P2)

**Goal**: No route-level auth guards or redirect-based authentication checks remain for protected pages.

**Independent Test**: Grep codebase for `redirect("/auth/login")` in page/layout files — verify zero matches (API routes excluded).

### Implementation for User Story 4

- [x] T019 [US4] Remove `requireUserServer()` function from `apps/web/lib/server/bootstrap.ts` if it is no longer called by any file. Search for all usages first — if still used by API routes, keep it; if only used by the now-removed layout redirect, delete it.
- [x] T020 [US4] Audit all files under `apps/web/app/` for remaining `redirect("/auth/login")` calls in page or layout files. Remove any that were missed. API route files (`app/api/`) are excluded — they use `withAuth()` middleware which returns 401, not redirect.

**Checkpoint**: Zero auth redirects in page/layout files. API routes remain protected via `withAuth()`.

---

## Phase 7: User Story 5 — Existing Auth Prompt Components Are Consolidated (Priority: P2)

**Goal**: All duplicate auth-prompt and connect-channel-prompt components are removed. Only AccessGate remains.

**Independent Test**: Search codebase for `AuthPrompt`, `ConnectChannelPrompt`, `LoggedOutDashboardPreview`, `DashboardLoggedOut` — verify zero import/usage matches.

### Implementation for User Story 5

- [x] T021 [P] [US5] Delete `apps/web/components/auth/auth-prompt.tsx` and `apps/web/components/auth/auth-prompt.module.css`. Verify no remaining imports reference these files.
- [x] T022 [P] [US5] Delete `apps/web/components/ui/ConnectChannelPrompt.tsx`. Verify no remaining imports reference this file. If `DashboardClient` or other components import it, update them to remove the import (AccessGate handles this state now).
- [x] T023 [P] [US5] Delete `apps/web/components/dashboard/LoggedOutDashboardPreview/` directory (index.tsx + style.module.css). Verify no remaining imports reference this component.
- [x] T024 [P] [US5] Delete `apps/web/app/dashboard/components/dashboard-logged-out.tsx` and its CSS module `apps/web/app/dashboard/components/dashboard-logged-out.module.css`. Verify no remaining imports reference these files.
- [x] T025 [US5] Run `make preflight` to verify build passes with all deletions. Fix any broken imports or references.

**Checkpoint**: Only `AccessGate` handles auth-state UI. Zero duplicate components.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup.

- [x] T026 Verify all pages render correctly by running `make build` from repo root in `apps/web/`.
- [x] T027 Run `make preflight` final pass — confirm zero regressions against `.agent/baseline.json`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 2 (Foundational)**: No dependencies — start immediately
- **Phase 3 (US1)**: Depends on Phase 2 completion (AccessGate must exist)
- **Phase 4 (US2)**: Depends on Phase 3 (page refactors must be done)
- **Phase 5 (US3)**: Depends on Phase 3 (page refactors must be done)
- **Phase 6 (US4)**: Depends on Phase 3 (all pages must use AccessGate before removing guards)
- **Phase 7 (US5)**: Depends on Phase 3 (all pages must stop importing old components)
- **Phase 8 (Polish)**: Depends on all prior phases

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational (Phase 2). Core story — all others depend on it.
- **US2 (P1)**: Depends on US1 page refactors being complete.
- **US3 (P1)**: Depends on US1 page refactors being complete. Verification-only.
- **US4 (P2)**: Depends on US1. Can run in parallel with US2/US3/US5.
- **US5 (P2)**: Depends on US1. Can run in parallel with US2/US3/US4.

### Within Phase 3 (US1)

- T005, T006 must run first (Dashboard + Videos pages are the primary test targets)
- T007–T016 can all run in parallel (independent page files)

### Parallel Opportunities

```text
# After Phase 2, these can run in parallel:
T007, T008, T009, T010, T011, T012, T013, T014, T015, T016

# After Phase 3, these can run in parallel:
T021, T022, T023, T024 (all deletions in Phase 7)

# US4 and US5 can run in parallel after US1
```

---

## Parallel Example: Phase 3 (US1)

```text
# Sequential first (primary pages):
Task T005: Refactor dashboard/page.tsx to use AccessGate
Task T006: Refactor videos/page.tsx to use AccessGate

# Then parallel (all (app) pages):
Task T007: Refactor goals/page.tsx
Task T008: Refactor competitors/page.tsx
Task T009: Refactor competitors/video/[videoId]/page.tsx
Task T010: Refactor subscriber-insights/page.tsx
Task T011: Refactor thumbnails/page.tsx
Task T012: Refactor thumbnails/editor/[projectId]/page.tsx
Task T013: Refactor trending/page.tsx
Task T014: Refactor profile/page.tsx
Task T015: Refactor channel-profile/page.tsx
Task T016: Refactor admin/youtube-usage/page.tsx
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 2: Create AccessGate + modify (app) layout + update proxy.ts
2. Complete Phase 3: Refactor all pages to use AccessGate
3. **STOP and VALIDATE**: Test sign-in prompt on all pages while logged out
4. Run `make preflight`

### Incremental Delivery

1. Phase 2 (Foundational) → AccessGate exists, layout stops redirecting
2. Phase 3 (US1) → All pages show sign-in prompt → **MVP complete**
3. Phase 4 (US2) → Verify connect-channel prompt works
4. Phase 5 (US3) → Verify happy path still works
5. Phase 6 (US4) → Clean up remaining guards
6. Phase 7 (US5) → Delete old components
7. Phase 8 (Polish) → Final preflight

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US2 and US3 are mostly verification — the heavy lifting is in US1
- Feature flag checks (thumbnails, trending) must be preserved — AccessGate does not replace feature flags
- Admin check (admin/youtube-usage) must be preserved — AccessGate does not replace role-based access
- `getAppBootstrap()` (redirect version) should have zero usages after Phase 3 — verify in Phase 6

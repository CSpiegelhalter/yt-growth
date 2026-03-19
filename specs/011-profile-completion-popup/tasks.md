# Tasks: Profile Completion Popup

**Input**: Design documents from `/specs/011-profile-completion-popup/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Tests**: Not explicitly requested — test tasks omitted. Validation via `make preflight`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Foundational (Reusable Hooks)

**Purpose**: Create reusable infrastructure that multiple user stories depend on. These hooks are generic and not coupled to the profile-completion popup.

- [x] T001 [P] Create `useLocalStorage` hook with TTL support in `apps/web/lib/hooks/use-local-storage.ts`. Mirror the existing `useSessionStorage` pattern from `apps/web/lib/hooks/use-session-storage.ts` but use `window.localStorage`. Must support: generic type parameter, TTL-based expiry with timestamp envelope, hydration mismatch prevention, graceful error handling (private browsing, quota exceeded), `value`/`setValue`/`isHydrated`/`clear` return interface. Named export only. `"use client"` directive.

- [x] T002 [P] Create `useDismissable` hook in `apps/web/lib/hooks/use-dismissable.ts`. Accepts `(key: string, durationMs: number)`. Uses `useLocalStorage` internally with TTL set to `durationMs`. Returns `{ isDismissed: boolean, dismiss: () => void, isHydrated: boolean }`. The `dismiss` callback sets the value to `true` with the configured TTL. When TTL expires, `isDismissed` returns `false`. Keyed by `dismissable:${key}` in localStorage so multiple independent surfaces don't conflict. Named export only. `"use client"` directive.

**Checkpoint**: Reusable hooks ready. No UI changes yet.

---

## Phase 2: User Story 1 — See Profile Completion Nudge on Dashboard (Priority: P1) MVP

**Goal**: Display a profile-completion popup at the top of the Dashboard when the user's channel profile is incomplete. Popup shows a checklist of 6 profile sections with accurate completion state. Each checklist item links to the corresponding profile section.

**Independent Test**: Log in as a user with an incomplete profile. Visit Dashboard (not first visit). Popup appears with correct checked/unchecked items. Click a checklist item — navigates to profile section.

### Implementation for User Story 1

- [x] T003 [P] [US1] Create `getProfileCompletion` pure function in `apps/web/lib/features/channels/profile-completion.ts`. Export `ProfileSectionCompletion` type (`{ sectionId: ProfileTabId, label: string, isComplete: boolean, href: string }`). Export `getProfileCompletion(input: ChannelProfileInput, channelId: string): ProfileSectionCompletion[]`. Map each of the 6 sections from `PROFILE_TABS` to completion checks per research.md Decision 2: overview complete if `channelDescription` non-empty OR `coreTopics.length > 0`; ideaGuidance if any text field non-empty OR `formatPreferences.length > 0`; scriptGuidance if any of `tone`/`structurePreference`/`styleNotes` non-empty; tagGuidance if `primaryKeywords.length > 0` OR `nicheTerms.length > 0`; descriptionGuidance if `descriptionFormat` or `standardLinks` non-empty; competitors if any tier array has an entry with non-empty `channelUrl`. Export `isProfileComplete(sections: ProfileSectionCompletion[]): boolean` helper (all sections complete). Generate `href` as `/channel-profile?tab=${sectionId}&channelId=${channelId}`. Named exports only. No `"use client"` directive (pure logic).

- [x] T004 [P] [US1] Create CSS Module `apps/web/app/dashboard/components/profile-completion-popup.module.css`. Match Figma reference: `.popup` container — white background, 2px solid `var(--color-imperial-blue)` border, `var(--radius-xl)` border-radius, `var(--shadow-md)` box-shadow, `var(--space-6)` padding, full width, margin-bottom `var(--space-6)`. `.header` — flex row, justify space-between, align center. `.title` — `var(--text-xl)` font-size, `var(--font-bold)` weight, `var(--color-imperial-blue)` color. `.description` — `var(--text-sm)` font-size, `var(--text)` color, margin-top `var(--space-2)`. `.checklist` — CSS grid, 3 columns on desktop (repeat(3, 1fr)), 2 columns on tablet, 1 column on mobile, gap `var(--space-3)`, margin-top `var(--space-4)`. `.checklistItem` — flex row, align center, gap `var(--space-2)`, text-decoration none, color `var(--color-imperial-blue)`, font-weight `var(--font-semibold)`, font-size `var(--text-base)`. `.checklistItem:hover` — opacity 0.7 (for clickable items). `.checkIcon` — 20px width/height, flex-shrink 0. `.dismissBtn` — flex row, align center, gap `var(--space-2)`, background `var(--surface-alt)`, border none, border-radius `var(--radius-full)`, padding `var(--space-2) var(--space-3)`, cursor pointer, font-size `var(--text-sm)`, color `var(--color-imperial-blue)`. `.dismissBtn:hover` — opacity 0.8. Use `fadeIn` animation on `.popup`. Mobile-first media queries.

- [x] T005 [US1] Create `ProfileCompletionPopup` component in `apps/web/app/dashboard/components/profile-completion-popup.tsx`. `"use client"` directive. Props: `channelId: string`. Use `useChannelProfile(channelId)` to get profile data. Use `getProfileCompletion()` to compute section completion. Use `useLocalStorage` for first-visit detection (key `dashboard-visited:${channelId}`, on first render without flag set it and return null). If `loading` or `!isHydrated` return null (FR-011). If profile exists and `isProfileComplete(sections)` return null (FR-002). If first visit return null (FR-014). Render: container with `.popup` class, header row with title "Complete your profile to get better results!" and dismiss button placeholder (just render the structure — dismissal wired in US2). Render description text. Render checklist grid using `Link` from `next/link` for each section — checked items get a filled checkmark SVG icon, unchecked get an empty circle SVG icon. All items are clickable links to `section.href` (FR-013). Named export only.

- [x] T006 [US1] Modify `apps/web/app/dashboard/components/dashboard-client.tsx` to render `ProfileCompletionPopup` above the grid. Import `ProfileCompletionPopup`. Render it inside `PageContainer` before the `.grid` div, passing `channelId={initialActiveChannelId!}`. Only render if `initialActiveChannelId` is truthy.

**Checkpoint**: Popup appears on Dashboard with accurate checklist. Clickable links navigate to profile sections. No dismissal yet (button visible but non-functional). First-visit suppression works.

---

## Phase 3: User Story 2 — Dismiss Popup Temporarily (Priority: P2)

**Goal**: Add "Dismiss for 3 days" functionality. After dismissal, popup stays hidden for 3 days then resurfaces if profile still incomplete.

**Independent Test**: Click "Dismiss for 3 days" — popup disappears. Refresh — still hidden. Manually clear localStorage key `dismissable:profile-completion` — popup returns on next visit.

### Implementation for User Story 2

- [x] T007 [US2] Wire dismissal into `ProfileCompletionPopup` in `apps/web/app/dashboard/components/profile-completion-popup.tsx`. Import `useDismissable` hook. Call `useDismissable("profile-completion", 3 * 24 * 60 * 60 * 1000)`. Add `isDismissed` and `isHydrated` from the hook to the visibility checks — if dismissed, return null. Wire the `dismiss` callback to the dismiss button's `onClick`. Ensure the dismiss button renders as a pill with "Dismiss for 3 days" text and an X icon SVG (per Figma). Add `aria-label="Dismiss for 3 days"` for accessibility.

**Checkpoint**: Full dismiss + resurface behavior works. 3-day TTL in localStorage. Dismiss button accessible.

---

## Phase 4: User Story 3 — Track Profile Completion Progress (Priority: P3)

**Goal**: As the user completes profile sections, the popup checklist reflects updated completion state in real-time.

**Independent Test**: Complete the "Overview" section at `/channel-profile`. Return to Dashboard. The "Overview" item is now checked. Complete all sections — popup disappears.

### Implementation for User Story 3

- [x] T008 [US3] Verify dynamic completion tracking in `apps/web/app/dashboard/components/profile-completion-popup.tsx`. The popup already uses `useChannelProfile(channelId)` which fetches fresh profile data on mount. Confirm that `getProfileCompletion()` is called with the latest `profile.input` on every render. If the profile was updated on the channel-profile page and the user navigates back, `useChannelProfile` refetches, and the checklist updates. If all sections are now complete, `isProfileComplete()` returns true and the popup disappears (FR-002). No code changes expected — this task is verification that US1 implementation handles this correctly. If `useChannelProfile` does not refetch on navigation, add a dependency trigger (e.g., check if `profile.input` changed).

**Checkpoint**: Checklist dynamically reflects real profile data. Completing all sections permanently hides the popup.

---

## Phase 5: User Story 4 — Reusable Dismissal for Future Surfaces (Priority: P4)

**Goal**: Ensure `useLocalStorage` and `useDismissable` hooks are truly reusable and decoupled from the profile-completion popup.

**Independent Test**: Verify that `useDismissable` can be called with a different key and duration (e.g., `useDismissable("upgrade-nudge", 7 * 24 * 60 * 60 * 1000)`) and operates independently from the profile-completion dismissal.

### Implementation for User Story 4

- [x] T009 [US4] Verify reusability of hooks in `apps/web/lib/hooks/use-dismissable.ts` and `apps/web/lib/hooks/use-local-storage.ts`. Confirm: (1) `useDismissable` accepts arbitrary `key` and `durationMs` parameters, (2) localStorage keys are namespaced as `dismissable:${key}` so they don't collide, (3) `useLocalStorage` has no profile-specific logic — it's a generic storage hook, (4) both hooks use named exports and have no default exports. No code changes expected if T001 and T002 were implemented correctly — this task is a review/audit pass.

**Checkpoint**: Hooks are generic, namespaced, and independently usable. SC-005 met.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and quality checks.

- [x] T010 Run `make preflight` from repo root. Compare output against `.agent/baseline.json`. Fix any regressions (build errors, lint violations, circular dependencies, dead code, duplication). All 6 checks must pass or improve.

- [x] T011 Verify accessibility of the popup component in `apps/web/app/dashboard/components/profile-completion-popup.tsx`: dismiss button has `aria-label`, checklist links are focusable and have descriptive text, popup container has appropriate `role` attribute if needed, keyboard navigation works (Tab through items, Enter to activate).

- [x] T012 Verify responsive behavior of `apps/web/app/dashboard/components/profile-completion-popup.module.css`: 3-column checklist on desktop, 2 columns on tablet, 1 column on mobile. Popup has no horizontal overflow on small screens. Dismiss button doesn't wrap awkwardly.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Foundational)**: No dependencies — can start immediately
- **Phase 2 (US1)**: Depends on T001 completion (needs `useLocalStorage` for first-visit detection). T003 and T004 can run in parallel with T001/T002.
- **Phase 3 (US2)**: Depends on Phase 2 completion (needs popup to exist) and T002 (needs `useDismissable`)
- **Phase 4 (US3)**: Depends on Phase 2 completion (verification of existing behavior)
- **Phase 5 (US4)**: Depends on Phase 1 completion (review of hooks)
- **Phase 6 (Polish)**: Depends on all previous phases

### User Story Dependencies

- **US1 (P1)**: Depends on `useLocalStorage` hook (T001) for first-visit detection
- **US2 (P2)**: Depends on US1 (popup must exist) + `useDismissable` hook (T002)
- **US3 (P3)**: Depends on US1 (verification task — no new code expected)
- **US4 (P4)**: Depends on T001/T002 (review task — no new code expected)

### Within Each User Story

- Pure logic (T003) and CSS (T004) before component (T005)
- Component (T005) before dashboard integration (T006)
- Integration before dismissal wiring (T007)

### Parallel Opportunities

- T001 and T002 can run in parallel (different files, T002 depends on T001's interface but not its implementation)
- T003 and T004 can run in parallel (different files, no dependencies between them)
- T003/T004 can run in parallel with T001/T002 (different file groups)

---

## Parallel Example: Phase 1 + Phase 2 Start

```bash
# Launch all foundational hooks together:
Task T001: "Create useLocalStorage hook in apps/web/lib/hooks/use-local-storage.ts"
Task T002: "Create useDismissable hook in apps/web/lib/hooks/use-dismissable.ts"

# Launch US1 pure logic and CSS in parallel:
Task T003: "Create getProfileCompletion in apps/web/lib/features/channels/profile-completion.ts"
Task T004: "Create CSS Module in apps/web/app/dashboard/components/profile-completion-popup.module.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: T001, T002 (reusable hooks)
2. Complete Phase 2: T003-T006 (popup with checklist, first-visit suppression)
3. **STOP and VALIDATE**: Popup appears with correct completion state, clickable links work, first visit suppressed
4. Run `make preflight`

### Incremental Delivery

1. T001 + T002 → Reusable hooks ready
2. T003-T006 → Popup visible with checklist (MVP!)
3. T007 → Dismissal works (US2)
4. T008 → Progress tracking verified (US3)
5. T009 → Hook reusability confirmed (US4)
6. T010-T012 → Polish, a11y, responsive

### Files Created/Modified Summary

| File | Action | Task |
|------|--------|------|
| `apps/web/lib/hooks/use-local-storage.ts` | NEW | T001 |
| `apps/web/lib/hooks/use-dismissable.ts` | NEW | T002 |
| `apps/web/lib/features/channels/profile-completion.ts` | NEW | T003 |
| `apps/web/app/dashboard/components/profile-completion-popup.module.css` | NEW | T004 |
| `apps/web/app/dashboard/components/profile-completion-popup.tsx` | NEW | T005, T007 |
| `apps/web/app/dashboard/components/dashboard-client.tsx` | MODIFY | T006 |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- T008 and T009 are verification/audit tasks — they may require no code changes
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The existing `ProfileTip` component is intentionally left untouched (per research.md Decision 5)

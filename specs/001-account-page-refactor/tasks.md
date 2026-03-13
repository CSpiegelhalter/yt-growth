# Tasks: Account Page Refactor

**Input**: Design documents from `/specs/001-account-page-refactor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `apps/web/` (Next.js App Router)
- Account page: `apps/web/app/(app)/account/`
- Shared components: `apps/web/components/`

---

## Phase 1: Setup

**Purpose**: Verify existing components and prepare for layout refactor

- [x] T001 Audit existing UpgradeCard component at `apps/web/components/pricing/UpgradeCard.tsx` and confirm it matches the Figma right-card design (gradient header, feature list, pricing, purchase button, 2px imperial-blue border, 20px radius). No code changes expected — document any gaps.
- [x] T002 Audit existing BillingCTA component at `apps/web/app/(app)/account/_components/BillingCTA.tsx` and confirm it correctly renders UpgradeCard for free users and subscription management for Pro users. No code changes expected — document any gaps.

**Checkpoint**: Existing reusable components verified. Layout refactor can begin.

---

## Phase 2: Foundational (CSS Grid Layout)

**Purpose**: Add the two-column grid CSS that all user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Add two-column grid layout styles to `apps/web/app/(app)/account/style.module.css`: add `.twoColumn` class using CSS Grid with `grid-template-columns: 1fr 1fr` at `768px+` breakpoint, single column on mobile. Add `gap` using `var(--space-5)` (20px). Add `.leftCard` class matching Figma left card: white background, 1px `var(--border-light)` border, `var(--radius-lg)` border-radius, `var(--shadow-card)` box-shadow, padding `var(--space-6)`. Add `.rightColumn` wrapper class for the CTA side.
- [x] T004 Update page metadata title in `apps/web/app/(app)/account/page.tsx`: change title to "Manage your account | ChannelBoost" and update PageHeader props in ProfileClient to use title "Manage your account" and subtitle "View your account details and manage your subscription".

**Checkpoint**: Foundation ready — two-column grid CSS in place, page title updated.

---

## Phase 3: User Story 1 — View Account Overview in Two-Column Layout (Priority: P1) MVP

**Goal**: Restructure the Account page to show a left card with email, plan (with Active badge), and connected channels in a two-column layout alongside the existing BillingCTA on the right.

**Independent Test**: Navigate to /account as a signed-in user. Verify: (1) page title is "Manage your account", (2) left card shows email, plan with badge, and channels, (3) right card shows UpgradeCard or subscription management, (4) layout is two columns on desktop, stacked on mobile.

### Implementation for User Story 1

- [x] T005 [P] [US1] Restructure AccountStats component in `apps/web/app/(app)/account/_components/AccountStats.tsx`: Replace the stat-grid layout with labeled rows matching Figma. Show "Overview" heading (20px bold), then "Email" label (15px medium) + email value (18px bold), then "Plan" label + plan value with "Active" pill badge (use `var(--surface-alt)` background, `var(--radius-full)` border-radius, 15px font). Preserve the daily usage section below as a secondary section. Remove the separate Stat grid boxes.
- [x] T006 [P] [US1] Update AccountStats styles in `apps/web/app/(app)/account/_components/AccountStats.module.css`: Replace `.grid` auto-fit grid with vertical flex layout. Add `.overviewHeading` (20px bold, `var(--color-imperial-blue)`), `.fieldLabel` (15px medium), `.fieldValue` (18px bold), `.activeBadge` (pill with `var(--surface-alt)` background). Keep `.usageSection` styles for daily usage bars. Use design tokens only — no hardcoded hex values.
- [x] T007 [US1] Restructure ProfileClient layout in `apps/web/app/(app)/account/ProfileClient.tsx`: Replace the current vertical `.grid` wrapper with the new `.twoColumn` grid. Left column: single `.leftCard` containing AccountStats (email/plan) and ChannelListSection below it. Right column: `.rightColumn` wrapping SubscriptionSection (which renders BillingCTA). Move sign out button outside and below the `.twoColumn` grid. Update PageHeader title to "Manage your account" and subtitle. Preserve all existing state management, error handling, and channel removal logic.
- [x] T008 [US1] Update channel list display in `apps/web/app/(app)/account/ProfileClient.tsx` ChannelListSection: Match Figma by showing channel name (bold, 18px) and YouTube URL (`youtube.com/channel/...`) on each row. Preserve the existing thumbnail image, remove button, and empty state. Add a "Channels" label heading above the list matching the Figma section label style.

**Checkpoint**: Two-column layout functional with left card (overview + channels) and right card (BillingCTA). Core layout matches Figma.

---

## Phase 4: User Story 2 — See Upgrade CTA on Account Page (Priority: P1)

**Goal**: Verify the reusable UpgradeCard/BillingCTA renders correctly in the right column for both free and Pro users.

**Independent Test**: Navigate to /account as a free user — verify UpgradeCard shows with gradient header, features, pricing, purchase button. Navigate as a Pro user — verify subscription management card shows instead.

### Implementation for User Story 2

- [x] T009 [US2] Verify and adjust right-column rendering in `apps/web/app/(app)/account/ProfileClient.tsx`: Ensure SubscriptionSection renders BillingCTA in the `.rightColumn` wrapper without additional card/section chrome — BillingCTA already provides its own card styling. Remove the `.section` and `.sectionTitle` wrapper from SubscriptionSection since the BillingCTA/UpgradeCard components provide their own visual container. Confirm the component receives correct props from `me.subscription`.
- [x] T010 [US2] Clean up unused CSS classes in `apps/web/app/(app)/account/style.module.css`: Remove `.section` and `.sectionTitle` classes if no longer used after the SubscriptionSection wrapper removal. Verify no other references exist before removing.

**Checkpoint**: Right column displays UpgradeCard (free) or subscription management (Pro) correctly using the shared component.

---

## Phase 5: User Story 3 — Sign Out from Account Page (Priority: P2)

**Goal**: Position the sign out button below the two-column layout, styled intentionally within the page design.

**Independent Test**: Click the sign out button — verify user is signed out and redirected to /.

### Implementation for User Story 3

- [x] T011 [US3] Style sign out button positioning in `apps/web/app/(app)/account/style.module.css`: Update `.signOutBtn` to sit below the `.twoColumn` grid with `margin-top: var(--space-6)`. Keep existing outlined style (transparent background, border, danger-on-hover). Ensure it is left-aligned and visually separated from the card content above.

**Checkpoint**: Sign out button is below the two-column cards, styled consistently, and functional.

---

## Phase 6: User Story 4 — Add a Channel from Account Page (Priority: P3)

**Goal**: Include an "Add Channel" outlined button at the bottom of the channel list in the left card.

**Independent Test**: Click the "Add Channel" button — verify it navigates to the channel connection flow (currently /videos).

### Implementation for User Story 4

- [x] T012 [US4] Add "Add Channel" button to the left card in `apps/web/app/(app)/account/ProfileClient.tsx` ChannelListSection: Add an outlined button below the channel list (or below the empty state) that links to the channel connection flow. Style it as an outlined button matching Figma: 1px `var(--color-imperial-blue)` border, `var(--radius-md)` border-radius, `var(--color-imperial-blue)` text. Use an anchor element to `/videos` (existing channel connection entry point).
- [x] T013 [US4] Add `.addChannelBtn` styles to `apps/web/app/(app)/account/style.module.css`: Outlined button with 1px `var(--color-imperial-blue)` border, `var(--radius-md)` border-radius, `var(--color-imperial-blue)` text, transparent background, hover state, focus-visible outline. Margin-top `var(--space-4)` to separate from channel list.

**Checkpoint**: "Add Channel" button present in left card, links to channel connection flow.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Responsive behavior, edge cases, and final validation

- [x] T014 [P] Verify responsive stacking behavior: confirm that at viewports <768px the two-column grid stacks to single column (left card on top, right card below) in `apps/web/app/(app)/account/style.module.css`. Test at 375px, 768px, and 1200px widths.
- [x] T015 [P] Handle edge case: no connected channels — verify that when `channels` array is empty, the left card shows the empty state message and "Add Channel" button without layout breakage in `apps/web/app/(app)/account/ProfileClient.tsx`.
- [x] T016 [P] Handle edge case: Pro user — verify that the right column shows subscription management (not UpgradeCard) when user has an active Pro subscription, and that left card shows "Pro" plan badge correctly.
- [x] T017 Run `make preflight` and verify all 6 checks pass with no regressions against `.agent/baseline.json`. Fix any build, lint, knip, madge, depcruise, or jscpd issues.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — audit only, no code changes
- **Foundational (Phase 2)**: No code dependencies on Phase 1 (audit is informational)
- **US1 (Phase 3)**: Depends on Phase 2 (needs `.twoColumn` CSS class)
- **US2 (Phase 4)**: Depends on Phase 3 (needs the two-column layout structure in ProfileClient)
- **US3 (Phase 5)**: Depends on Phase 3 (needs sign out button positioned relative to `.twoColumn` grid)
- **US4 (Phase 6)**: Depends on Phase 3 (needs left card and ChannelListSection in place)
- **Polish (Phase 7)**: Depends on Phases 3–6

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational only — core layout refactor
- **US2 (P1)**: Depends on US1 — right column wrapper must exist
- **US3 (P2)**: Depends on US1 — sign out positioning relative to grid
- **US4 (P3)**: Depends on US1 — left card and channel list must exist

### Within Each User Story

- CSS changes before JSX restructuring
- Layout structure before content restructuring
- Core implementation before edge cases

### Parallel Opportunities

- T005 and T006 can run in parallel (different files: `.tsx` and `.module.css`)
- T012 and T013 can run in parallel (different files)
- T014, T015, and T016 can all run in parallel (independent verification tasks)
- After US1 completes, US3 and US4 can run in parallel (modify different parts of the page)

---

## Parallel Example: User Story 1

```bash
# Launch AccountStats restructure and its CSS update in parallel:
Task T005: "Restructure AccountStats component in AccountStats.tsx"
Task T006: "Update AccountStats styles in AccountStats.module.css"

# Then sequentially:
Task T007: "Restructure ProfileClient layout in ProfileClient.tsx"
Task T008: "Update channel list display in ProfileClient.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (audit existing components)
2. Complete Phase 2: Foundational (add CSS grid)
3. Complete Phase 3: User Story 1 (two-column layout with left card + right CTA)
4. **STOP and VALIDATE**: Test the page at /account — verify two-column layout works
5. Run `make preflight` to catch any issues early

### Incremental Delivery

1. Setup + Foundational → Grid CSS ready
2. Add US1 → Two-column layout functional → Validate (MVP!)
3. Add US2 → Right column CTA verified → Validate
4. Add US3 → Sign out button positioned → Validate
5. Add US4 → Add Channel button → Validate
6. Polish → Responsive + edge cases → Final `make preflight`

---

## Notes

- No new components needed — this is a pure layout refactor of existing files
- `UpgradeCard` and `BillingCTA` are reused without modification
- All styles must use CSS variables from `globals.css` — no hardcoded hex values
- Follow 4pt grid spacing (multiples of 4px) per constitution
- Keep files under 150 lines per constitution principle V
- Figma reference: https://www.figma.com/design/FBUmzpPK0YTx1KpkaaMwth/channelboost?node-id=272-2&m=dev

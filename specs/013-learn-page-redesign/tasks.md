# Tasks: Learn Page Redesign

**Input**: Design documents from `/specs/013-learn-page-redesign/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No test tasks — tests not requested. Validation is via `make preflight` and visual verification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup

**Purpose**: Create the shared component files and directory structure

- [x] T001 Create `apps/web/components/marketing/` directory and `MarketingHeroBand.tsx` with component skeleton (named export, server component, `MarketingHeroBandProps` interface with `children`, `iconAlt?`, `className?`)
- [x] T002 Create `apps/web/components/marketing/MarketingHeroBand.module.css` with hero band styles extracted from landing hero pattern in `apps/web/app/globals.css` (gradient band, texture overlay, inner flex layout, icon positioning, responsive breakpoints)

**Checkpoint**: Shared component files exist with correct structure. Not yet used by any page.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Complete the shared `MarketingHeroBand` component so both pages can consume it

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Implement `MarketingHeroBand` in `apps/web/components/marketing/MarketingHeroBand.tsx`: render `<section>` with gradient background via CSS Module class, `<Image>` for `hero-texture.webp` (texture overlay at 30% opacity, multiply blend, vertically flipped), flex inner container with `{children}` on the left and `<Image>` for `landing_icon.svg` (320×287 desktop, 200px mobile) on the right. Use `next/image` with `priority`. Apply `className` prop to outer wrapper if provided.
- [x] T004 Verify `MarketingHeroBand.module.css` uses only CSS variable tokens: `var(--hero-gradient)` or `linear-gradient(165deg, var(--color-hot-rose) 15%, var(--color-cool-sky) 112%)` for gradient, `var(--page-max-width)` for content centering, 4pt-grid spacing. Add responsive rules: icon hidden or stacked below on mobile (<640px), full side-by-side on desktop (≥900px).

**Checkpoint**: `MarketingHeroBand` is a complete, importable server component ready for consumption.

---

## Phase 3: User Story 1 — Visitor Browses the Redesigned Learn Page (Priority: P1) 🎯 MVP

**Goal**: Redesign the `/learn` page layout to match the Figma design while preserving all existing content.

**Independent Test**: Visit `http://localhost:3000/learn` and verify: hero gradient band with icon, bold subtitle, intro paragraph, 2×2 value props with checkmarks, start-here card with pill buttons, 2-column article grid, categories, FAQ, and CTA — all with existing copy intact.

### Implementation for User Story 1

- [x] T005 [US1] Refactor hero section in `apps/web/app/(marketing)/learn/page.tsx`: replace the current `<header className={s.hubHero}>` block with `<MarketingHeroBand>` wrapping the badge text ("ChannelBoost Blog Posts" per Figma) and hero title (`content.hero.title` + accent). Keep the `<h1>` and badge inside children. Import `MarketingHeroBand` from `@/components/marketing/MarketingHeroBand`.
- [x] T006 [US1] Refactor subtitle section in `apps/web/app/(marketing)/learn/page.tsx`: render `content.hero.subtitle` as a bold 22px subtitle below the hero band (outside the gradient), matching Figma's bold subtitle treatment. Use `var(--text-subtitle)` weight 700.
- [x] T007 [US1] Refactor intro + value props in `apps/web/app/(marketing)/learn/page.tsx`: render `content.intro.text` as body paragraph, then render `content.intro.highlights` (4 items) in a 2×2 grid layout with inline SVG checkmark icons (30×30, hot-rose colored) to the left of each highlight text.
- [x] T008 [US1] Update value props styles in `apps/web/app/(marketing)/learn/style.module.css`: replace `.introHighlights` list styles with a 2-column CSS Grid (`grid-template-columns: 1fr 1fr` on desktop, `1fr` on mobile). Each grid item is a flex row with icon + text. Gap and padding on 4pt grid.
- [x] T009 [US1] Refactor start-here section in `apps/web/app/(marketing)/learn/page.tsx`: wrap in a white rounded card (`border-radius: var(--radius-xl)`, `border: 1px solid var(--color-lavender-mist)`, `box-shadow: 0 4px 4px rgba(0,0,0,0.08)`). Change guide links from card layout to inline pill buttons (height 45px, `border: 2px solid var(--color-hot-rose)`, `border-radius: 20px`) with centered description text beneath each.
- [x] T010 [US1] Update start-here styles in `apps/web/app/(marketing)/learn/style.module.css`: replace `.startHereGuides` and `.startHereGuide` styles with card container, pill button layout (flex row, centered, gap 20px), and centered sub-descriptions. Responsive: buttons stack vertically on mobile.
- [x] T011 [US1] Refactor articles grid in `apps/web/app/(marketing)/learn/page.tsx`: keep existing `learnArticles.map()` but ensure each card renders: category tag (pink bg badge `rgba(208,52,135,0.15)`), bold title, description, and a footer row with reading time (40% opacity) and CTA link with arrow icon (underlined).
- [x] T012 [US1] Update articles grid styles in `apps/web/app/(marketing)/learn/style.module.css`: change `.articlesGrid` to 2-column layout on desktop (`grid-template-columns: repeat(2, 1fr)` or `repeat(auto-fit, minmax(400px, 1fr))`). Update `.articleCard` to white rounded card with border, shadow, and 20px radius matching Figma. Single column on mobile (<640px).
- [x] T013 [US1] Remove old hero styles from `apps/web/app/(marketing)/learn/style.module.css`: delete `.hubHero`, `.hubBadge`, `.hubTitle`, `.hubTitleAccent`, `.hubSubtitle` classes that are replaced by the shared `MarketingHeroBand` component. Keep all non-hero section styles.
- [x] T014 [US1] Verify all existing content sections are preserved in `apps/web/app/(marketing)/learn/page.tsx`: categories section, FAQ section (`FaqSection` component), and bottom CTA section must remain below the articles grid with styling consistent with the new design direction. No copy changes.

**Checkpoint**: `/learn` page matches Figma layout with all existing content preserved. Independently testable by visiting the page.

---

## Phase 4: User Story 2 — Shared Hero Component Between Landing and Learn (Priority: P2)

**Goal**: Refactor the Landing page hero to use the same `MarketingHeroBand` component, eliminating hero code duplication.

**Independent Test**: Visit `http://localhost:3000` and verify the Landing page hero looks identical to before the refactor (gradient band, texture, welcome text, h1 title, icon on right).

### Implementation for User Story 2

- [x] T015 [US2] Refactor hero in `apps/web/app/(marketing)/page.tsx`: replace the `<section className="landingHeroBand">` block (lines 32–57) with `<MarketingHeroBand>` wrapping the existing welcome paragraph and `<h1>` title. Remove the inline `<Image>` for texture and icon (now handled by `MarketingHeroBand`).
- [x] T016 [US2] Remove extracted hero band styles from `apps/web/app/globals.css`: delete `.landingHeroBand`, `.landingHeroTexture`, `.landingHeroInner`, `.landingHeroText`, `.landingHeroIcon` classes that are now in `MarketingHeroBand.module.css`. Keep all other landing page styles (`.landingHeroContent`, `.landingValueProp`, `.landingPillars`, etc.).
- [x] T017 [US2] Verify Landing page visual parity: the hero gradient band, texture overlay, welcome text, h1 title, and icon must render identically to the pre-refactor state. The signup card + value prop section below the hero (`.landingHeroContent` with negative margin overlap) must still work correctly.

**Checkpoint**: Both `/` and `/learn` use `MarketingHeroBand`. Landing page is visually unchanged. Shared component confirmed working for both consumers.

---

## Phase 5: User Story 3 — Responsive Layout on Mobile and Tablet (Priority: P2)

**Goal**: Ensure all redesigned sections respond correctly across mobile, tablet, and desktop breakpoints.

**Independent Test**: Resize browser or use device emulation at <640px, 640–900px, and ≥900px. Verify no horizontal overflow, no clipped content, graceful stacking.

### Implementation for User Story 3

- [x] T018 [P] [US3] Add responsive rules to `apps/web/components/marketing/MarketingHeroBand.module.css`: mobile (<640px) — icon stacks below or above title text, title font size reduces; tablet (640–900px) — icon scales to intermediate size; desktop (≥900px) — full side-by-side layout matching Figma.
- [x] T019 [P] [US3] Add responsive rules to `apps/web/app/(marketing)/learn/style.module.css` for value props grid: 1-column on mobile (<640px), 2-column on desktop (≥768px). Ensure checkmark icon + text pairs don't wrap awkwardly.
- [x] T020 [P] [US3] Add responsive rules to `apps/web/app/(marketing)/learn/style.module.css` for start-here card: pill buttons stack vertically on mobile (<640px), card padding reduces on mobile, descriptions center below their buttons.
- [x] T021 [P] [US3] Add responsive rules to `apps/web/app/(marketing)/learn/style.module.css` for article cards: 1-column on mobile (<640px), 2-column on desktop (≥768px). Card padding adjusts for mobile.
- [x] T022 [US3] Test all breakpoints by resizing browser: verify no horizontal scroll at any width from 320px to 1600px, all text readable, tap targets adequate, hero icon appropriately sized/positioned at each breakpoint.

**Checkpoint**: Page is fully responsive and production-ready across all breakpoints.

---

## Phase 6: User Story 4 — Static Page Layout Compatibility (Priority: P1)

**Goal**: Confirm `/learn` continues to work as a static page with `StaticNav` only, no sidebar artifacts.

**Independent Test**: Visit `http://localhost:3000/learn` and confirm only top nav appears, content spans full width, no sidebar or app-shell spacing.

### Implementation for User Story 4

- [x] T023 [US4] Verify `apps/web/app/(marketing)/learn/page.tsx` does not import or reference any sidebar, AppShell, or authenticated layout components. Confirm it renders within the `(marketing)` layout which only provides `StaticNav`.
- [x] T024 [US4] Verify `apps/web/app/(marketing)/learn/style.module.css` `.learnHub` container has no left margin/padding that would suggest sidebar spacing. Content should use `margin: 0 auto` with `max-width: var(--page-max-width)` for centering.

**Checkpoint**: Static page layout confirmed clean — no sidebar, top nav only.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, cleanup, and preflight

- [x] T025 Run `make preflight` from repo root and compare against `.agent/baseline.json`. Fix any regressions in build, lint, knip, madge, depcruise, or jscpd checks.
- [x] T026 Verify no unused CSS classes remain in `apps/web/app/(marketing)/learn/style.module.css` after refactor (knip should catch this). Remove dead classes.
- [x] T027 Verify no unused CSS classes remain in `apps/web/app/globals.css` after hero extraction (knip/jscpd should catch this). Remove dead hero classes.
- [x] T028 Verify SEO metadata and structured data in `apps/web/app/(marketing)/learn/page.tsx` are unchanged: canonical URL, OpenGraph, Twitter cards, CollectionPage schema with ItemList.
- [x] T029 Run `make preflight` final pass — all 6 checks must pass with no regressions vs baseline.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — can start once `MarketingHeroBand` is complete
- **US2 (Phase 4)**: Depends on Phase 2 — can run in PARALLEL with US1 (different file: Landing page.tsx vs Learn page.tsx)
- **US3 (Phase 5)**: Depends on US1 and US2 — responsive polish requires both pages refactored
- **US4 (Phase 6)**: Depends on US1 — quick verification after Learn page refactor
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Depends only on Foundational phase. Can start immediately after Phase 2.
- **US2 (P2)**: Depends only on Foundational phase. Can run in parallel with US1.
- **US3 (P2)**: Depends on US1 + US2 completion (needs both pages refactored to test responsive).
- **US4 (P1)**: Depends on US1 completion. Quick verification task.

### Within Each User Story

- Style changes and component changes for the same section should be done together
- CSS Module changes should accompany their corresponding JSX changes
- Old class cleanup follows new implementation

### Parallel Opportunities

- **T001 + T002**: Component file + CSS file can be created in parallel
- **US1 + US2**: Learn page refactor and Landing page refactor touch different files — can run in parallel after Phase 2
- **T018 + T019 + T020 + T021**: All responsive CSS tasks touch different sections and can run in parallel
- **T023 + T024**: Both are verification tasks that can run in parallel

---

## Parallel Example: US1 + US2 After Foundational Phase

```text
# After Phase 2 (MarketingHeroBand complete), launch in parallel:

# Stream A — Learn Page Redesign (US1):
Task: T005 — Refactor hero in learn/page.tsx
Task: T006 — Refactor subtitle in learn/page.tsx
Task: T007 — Refactor intro + value props in learn/page.tsx
Task: T008 — Update value props styles in learn/style.module.css
...

# Stream B — Landing Page Refactor (US2):
Task: T015 — Refactor hero in (marketing)/page.tsx
Task: T016 — Remove hero styles from globals.css
Task: T017 — Verify landing page visual parity
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T004)
3. Complete Phase 3: US1 — Learn Page Redesign (T005–T014)
4. **STOP and VALIDATE**: Visit `/learn`, verify Figma layout match + content preserved
5. Run `make preflight` — must pass

### Incremental Delivery

1. Setup + Foundational → Shared component ready
2. US1: Learn page redesign → Test independently → Visual match confirmed (MVP!)
3. US2: Landing page refactor → Test independently → No visual regression
4. US3: Responsive polish → Test at all breakpoints → Production-ready
5. US4: Static layout verify → Quick confirmation
6. Polish → `make preflight` clean pass

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All content in `LEARN_INDEX_CONTENT` and `learnArticles` must be preserved verbatim — this is a layout refactor, not a copy rewrite
- Use only CSS variable tokens from the design system — no hardcoded hex values
- All spacing must be 4pt grid multiples
- `MarketingHeroBand` must be a server component (no `'use client'`)
- Run `make preflight` after completing all changes — regressions = task failure

# Tasks: Landing Page Redesign

**Input**: Design documents from `/specs/012-landing-page-redesign/`
**Prerequisites**: plan.md (required), spec.md (required), research.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `apps/web/` (Next.js monorepo)
- CSS: `apps/web/app/globals.css`
- Page: `apps/web/app/(marketing)/page.tsx`
- Assets: `apps/web/public/`

---

## Phase 1: Setup

**Purpose**: Add new design tokens and download required assets before any layout work begins.

- [x] T001 Add `--color-page-bg: #f3f4fb` and `--color-card-border: #e8eafb` CSS variables to `:root` in `apps/web/app/globals.css`. Also add a `--shadow-card: 0 4px 4px rgba(0,0,0,0.08)` token and a `--hero-gradient: linear-gradient(165deg, var(--color-hot-rose) 15%, var(--color-cool-sky) 112%)` token.
- [x] T002 Download the hero texture image from the Figma asset URL (the crowd/city photo used as a gradient overlay). Save as `apps/web/public/hero-texture.webp`. Optimize for web (compress to <100KB). The Figma asset constant is `img21491688691` — fetch from `https://www.figma.com/api/mcp/asset/33b4a664-ae2b-443c-8c70-0a46e0ca1180` and convert to WebP.

**Checkpoint**: Design tokens and assets ready. Layout work can begin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Inspect the Figma design via MCP server and prepare the CSS class structure that all user stories depend on.

**CRITICAL**: The Figma design at `https://www.figma.com/design/FBUmzpPK0YTx1KpkaaMwth/channelboost?node-id=287-115&m=dev` MUST be inspected via the Figma MCP server (`get_design_context` with fileKey `FBUmzpPK0YTx1KpkaaMwth` and nodeId `287:115`) before implementing. Use the screenshot and code output as the source of truth for layout, spacing, and visual hierarchy. Do NOT guess — refer to the Figma output for exact values.

- [x] T003 Inspect the Figma design using the Figma MCP server (`get_design_context` with fileKey `FBUmzpPK0YTx1KpkaaMwth`, nodeId `287:115`). Document the exact layout measurements, spacing values, and visual hierarchy from the Figma output. Use this as reference for all subsequent CSS tasks.
- [x] T004 Set `.landingPage` background to `var(--color-page-bg)` in `apps/web/app/globals.css`. Remove the existing white/default background so the entire page has the light lavender (#f3f4fb) background from the Figma design.

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 — Visitor Sees Redesigned Landing Page (Priority: P1) MVP

**Goal**: Restructure the landing page layout to match the Figma design while preserving all existing marketing copy. This covers the hero section, value proposition, feature cards, "How It Works" section, guides section, FAQ, SEO content, and CTA sections.

**Independent Test**: Navigate to `/` and visually compare against the Figma design screenshot. Verify all existing copy text from the current page is present and unchanged.

### Implementation for User Story 1

- [x] T005 [US1] Refactor the hero section in `apps/web/app/(marketing)/page.tsx`. Replace the current hero layout with:
  - A full-width gradient band container using `--hero-gradient` (~426px min-height on desktop)
  - Inside the gradient band: a texture overlay using `hero-texture.webp` at 30% opacity with `mix-blend-multiply` (flipped vertically via CSS `scaleY(-1)`)
  - Left side: small welcome text ("YouTube Growth Tool for Creators" badge), then the existing H1 title text (preserve exact current copy), positioned over the gradient
  - Remove the existing `.landingBadge`, `.landingSubtitle` placement from the hero — the subtitle moves to the value proposition area below
  - Keep the hero section as a server component (no `'use client'`)

- [x] T006 [US1] Create the signup card overlay component within `apps/web/app/(marketing)/page.tsx` (as a local component, not a separate file). The card:
  - White background, `border-radius: 20px`, `var(--shadow-card)` shadow, `var(--color-card-border)` border
  - Heading: "Start with a free account"
  - Subtitle text (placeholder descriptive text)
  - Three styled input-like elements (name, email, channel URL) — these are presentational only, styled as `var(--color-page-bg)` background with `var(--color-card-border)` border, `border-radius: 8px`, 45px height
  - A "Create Free Account" button styled with `var(--color-imperial-blue)` background, white text, `border-radius: 8px`, that links to the existing signup/login flow (same href as current `HeroStaticCTAs`)
  - Position: overlapping the hero gradient on the left side, extending below the gradient band on desktop. On mobile, stack below the hero title.

- [x] T007 [US1] Create the value proposition area below the hero in `apps/web/app/(marketing)/page.tsx`. This section sits on the right side of the signup card on desktop (or below hero on mobile):
  - Move the existing subtitle text ("Stop guessing what to post...") here
  - Add 3 bullet points with checkmark icons: use existing copy — "Unlimited idea suggestions", "Video analysis with actionable fixes", "Subscriber driver insights"
  - Use `var(--color-imperial-blue)` for text color
  - On desktop: this area sits beside the signup card. On mobile: stacks below the card.

- [x] T008 [US1] Refactor the feature cards section in `apps/web/app/(marketing)/page.tsx` and update CSS in `apps/web/app/globals.css`:
  - Change `.landingPillars` from the current responsive flex grid to a 2-column CSS grid (`grid-template-columns: 1fr 1fr`) with appropriate gap
  - Update `.landingPillar` card styles: white background, `var(--color-card-border)` border, `border-radius: 20px`, `var(--shadow-card)` shadow
  - Update `.landingPillarIcon` to use a 30px colored icon (keep existing SVG icons)
  - Update `.landingPillarTitle` to 23px semibold, `var(--color-imperial-blue)` color
  - Add checkmark icons before each bullet point in `.landingPillarBenefits` list items (use a small SVG checkmark or CSS pseudo-element)
  - Update `.landingPillarLink` to pill-shaped button style: 2px solid `var(--color-imperial-blue)` border, `border-radius: 30px`, `var(--color-imperial-blue)` text, 45px height, centered text, `var(--color-page-bg)` background
  - 5th card (Video Ideas Engine) should be centered when it wraps to its own row
  - Preserve ALL existing feature copy text exactly as-is

- [x] T009 [US1] Refactor the "How It Works" section in `apps/web/app/(marketing)/page.tsx` and update CSS in `apps/web/app/globals.css`:
  - Use `--hero-gradient` background for the full-width gradient band (~473px min-height)
  - Add the same texture overlay treatment (hero-texture.webp, 20% opacity, `mix-blend-multiply`, flipped vertically)
  - Center the section title "How ChannelBoost Works" in white, extrabold, with text shadow
  - Subtitle in white below the title
  - 3 steps in a horizontal row (flex/grid, 3-column on desktop, stack on mobile):
    - Each step has a 76px gradient circle (`--hero-gradient`) containing the number in white extrabold 50px
    - Step title: 23px semibold, white
    - Step description: 15px medium, white, centered, ~300px max-width
  - Preserve ALL existing step copy text exactly

- [x] T010 [US1] Refactor the guides section in `apps/web/app/(marketing)/page.tsx` and update CSS in `apps/web/app/globals.css`:
  - Update `.landingGuidesGrid` to 2-column grid layout
  - Update `.landingGuideCard` to match Figma card style: white background, `var(--color-card-border)` border, `border-radius: 20px`, `var(--shadow-card)` shadow, 200px height
  - Update `.landingGuideTitle` to 18px semibold, `var(--color-imperial-blue)`
  - Update `.landingGuideLink` to include an arrow icon (→) and underline style per Figma
  - Preserve ALL existing guide content and links exactly

- [x] T011 [US1] Update the FAQ section styling in `apps/web/app/globals.css` to match the new page design system:
  - Ensure FAQ cards use the same card style tokens (white bg, card border, rounded corners, shadow) for visual consistency
  - Keep all FAQ content and JSON-LD structured data exactly as-is
  - This section was not in the Figma but should visually harmonize with the new design

- [x] T012 [US1] Update the SEO content section styling in `apps/web/app/globals.css` to harmonize with the new design:
  - Adjust typography and spacing to match the new Figma-derived type scale
  - Keep all SEO content text exactly as-is

- [x] T013 [US1] Update the CTA section at the bottom of the page in `apps/web/app/globals.css`:
  - Use `--hero-gradient` for the gradient background to match the hero and "How It Works" bands
  - Add the texture overlay treatment for consistency
  - Keep all CTA text and button behavior exactly as-is

- [x] T014 [US1] Remove the social proof section from `apps/web/app/(marketing)/page.tsx`. The Figma design does not include the "Trusted by 2,000+ creators" social proof banner. Remove the `.landingSocialProof` section from the page component and its corresponding CSS from `apps/web/app/globals.css`. (The copy is not lost — it can be re-added later if needed.)

- [x] T015 [US1] Clean up unused CSS classes in `apps/web/app/globals.css`. After the refactoring above, remove any `.landing*` CSS classes that are no longer referenced by the page component. Verify with a search across the codebase before removing.

**Checkpoint**: Landing page layout matches the Figma design with all existing copy preserved. Visually compare at desktop width.

---

## Phase 4: User Story 2 — Landing Page Icon and Splash Image Display Correctly (Priority: P1)

**Goal**: Wire in the `landing_icon.svg` and hero texture image so they display at the correct sizes, positions, and visual treatments per the Figma design.

**Independent Test**: Load the landing page, verify `landing_icon.svg` renders in the hero section (right side, ~320px wide) and the hero texture overlay is visible on gradient bands. Check the Network tab for zero 404 errors.

### Implementation for User Story 2

- [x] T016 [US2] Add `landing_icon.svg` to the hero section in `apps/web/app/(marketing)/page.tsx`. Position it on the right side of the hero gradient band using `next/image` or an `<img>` tag:
  - Size: approximately 320×287px (matching Figma proportions)
  - Position: right side of the hero, vertically centered within the gradient band, overlapping or sitting above the gradient
  - On mobile: center the icon above the hero title or hide if it crowds the layout
  - Use `alt="ChannelBoost analytics illustration"` for accessibility
  - Source: `/landing_icon.svg`

- [x] T017 [US2] Verify the hero texture overlay (`hero-texture.webp`) is correctly wired in T005/T009 and renders on both gradient bands (hero and "How It Works"). Confirm:
  - Image loads from `/hero-texture.webp` with no 404
  - Displayed at 30% opacity on hero, 20% opacity on "How It Works"
  - `mix-blend-multiply` blending applied
  - Vertically flipped via CSS `transform: scaleY(-1)`
  - Image covers the full gradient band width
  - Falls back gracefully if image fails to load (gradient still shows)

- [x] T018 [US2] Add CSS for the icon and texture overlay in `apps/web/app/globals.css`:
  - `.landingHeroIcon` — positioned absolute/relative within the hero, right-aligned, sized per Figma, with responsive scaling
  - `.landingHeroTexture` — absolute positioned within gradient bands, full width/height, `mix-blend-multiply`, `opacity: 0.3`, `transform: scaleY(-1)`, `object-fit: cover`
  - Ensure the icon doesn't cause horizontal overflow on any viewport

**Checkpoint**: Both image assets render correctly. No 404 errors. Layout doesn't break if images fail to load.

---

## Phase 5: User Story 3 — Landing Page Renders Responsively (Priority: P2)

**Goal**: Ensure all redesigned sections adapt gracefully across desktop (1440px+), tablet (768px), and mobile (375px) viewports.

**Independent Test**: Resize the browser from 1440px down to 375px. Verify no horizontal scrollbar, no overlapping text, no broken layouts. All content readable and CTAs tappable.

### Implementation for User Story 3

- [x] T019 [US3] Add responsive CSS for the hero section in `apps/web/app/globals.css`:
  - Desktop (768px+): Hero title left, signup card left-overlapping-gradient, icon right, value proposition right of card
  - Tablet (480–768px): Stack hero title, then signup card, then value proposition vertically. Icon scales down or hides.
  - Mobile (<480px): Full-width stacking — title, icon (smaller), card, value proposition. Reduce hero min-height.
  - Ensure gradient band extends full width at all breakpoints

- [x] T020 [US3] Add responsive CSS for feature cards in `apps/web/app/globals.css`:
  - Desktop (768px+): 2-column grid
  - Tablet (480–768px): Single column, full-width cards
  - Mobile (<480px): Single column, full-width cards with reduced padding
  - 5th card: centered on desktop when wrapping, full-width on mobile

- [x] T021 [US3] Add responsive CSS for "How It Works" section in `apps/web/app/globals.css`:
  - Desktop (768px+): 3-column horizontal row of steps
  - Tablet (480–768px): 3-column but tighter spacing
  - Mobile (<480px): Stack steps vertically, each centered
  - Gradient circles scale down slightly on mobile (60px instead of 76px)

- [x] T022 [US3] Add responsive CSS for guides section in `apps/web/app/globals.css`:
  - Desktop (768px+): 2-column grid of guide cards
  - Tablet/Mobile (<768px): Single column, full-width cards
  - Card height: auto on mobile instead of fixed 200px

- [x] T023 [US3] Add responsive CSS for signup card in `apps/web/app/globals.css`:
  - Desktop: ~370px wide, positioned overlapping the hero gradient
  - Tablet: ~340px wide, centered
  - Mobile: Full-width (minus padding), stacks below hero title

- [x] T024 [US3] Add max-width constraint for very wide screens (2560px+) in `apps/web/app/globals.css`:
  - Content areas should be max-width ~1280px (or existing max-width value), centered with auto margins
  - Gradient bands remain full-width (edge-to-edge)
  - Prevent content from stretching too wide on ultrawide monitors

**Checkpoint**: Page renders without layout breakage at 375px, 768px, 1440px, and 2560px.

---

## Phase 6: User Story 4 — Landing Page Uses Static-Page Navigation (Priority: P2)

**Goal**: Confirm the landing page uses the static-page layout (top nav only, no sidebar) and no app-shell artifacts leak through.

**Independent Test**: Load `/` while logged out and logged in. Verify only `StaticNav` is visible — no sidebar, no app-shell wrapper margins.

### Implementation for User Story 4

- [x] T025 [US4] Verify the `(marketing)/layout.tsx` correctly wraps the landing page with `StaticNav` only. Confirm:
  - No sidebar component is imported or rendered
  - No app-shell wrapper (from the `(app)` route group) leaks into the marketing layout
  - The `StaticNav` links ("Learn", "Pricing", "Get Started") match the Figma nav text ("Blog", "Pricing", "Log in") — update the nav link labels if the Figma design uses different text, OR keep existing labels if they are intentionally different from Figma placeholder text. Since this is a copy-preservation task, keep the existing "Learn" / "Pricing" / "Get Started" labels.
  - Page uses full viewport width with no leftover sidebar margins

- [x] T026 [US4] Ensure the `.landingPage` container in `apps/web/app/globals.css` has no leftover padding-left, margin-left, or width constraints that would suggest sidebar spacing. The page content should flow from edge to edge (with gradient bands full-width and content centered within a max-width container).

**Checkpoint**: No sidebar visible. Top nav renders correctly for both logged-in and logged-out visitors.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final quality verification and cleanup

- [x] T027 Run `make preflight` from the repo root. Compare against `.agent/baseline.json`. Fix any regressions before marking complete. Address lint errors, unused imports, dead CSS, or duplication flagged by the 6-check suite.
- [x] T028 Verify all existing landing page copy is preserved by comparing the rendered page text content against the current production page. Check:
  - H1 title text
  - All 5 feature pillar titles, descriptions, and bullet points
  - All 3 "How It Works" step titles and descriptions
  - Guide section title, subtitle, and all guide card titles/descriptions
  - All 10 FAQ questions and answers (including 3 from `HOME_CONTENT.additionalFaq`)
  - SEO content section (title, intro, paragraphs, "Who It's For", "Use Cases", callout)
  - CTA section title and subtitle
- [x] T029 Visual review: compare the rendered landing page at 1440px width against the Figma design screenshot. Check hero layout, feature cards, "How It Works" band, guide cards, and overall spacing/rhythm.
- [x] T030 Performance check: ensure the page still loads fast. No unnecessary client-side JS. Images use appropriate loading attributes (`loading="lazy"` for below-fold images). Hero texture is compressed and efficient.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — core layout work
- **User Story 2 (Phase 4)**: Can start after T005 (hero section structure exists) — wires in image assets
- **User Story 3 (Phase 5)**: Depends on US1 + US2 completion — adds responsive behavior to the new layout
- **User Story 4 (Phase 6)**: Can start after Foundational — mostly verification, independent of other stories
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Core layout — must be done first as US2/US3 build on it
- **User Story 2 (P1)**: Depends on US1's hero structure (T005) being in place
- **User Story 3 (P2)**: Depends on US1 + US2 — adds responsive rules to the completed layout
- **User Story 4 (P2)**: Independent — mostly verification of existing static layout behavior

### Parallel Opportunities

Within Phase 3 (US1):
- T008 (feature cards) and T009 (how it works) and T010 (guides) can run in parallel — they modify different CSS class groups and different JSX sections
- T011, T012, T013 can all run in parallel — they style different sections

Within Phase 5 (US3):
- T019 through T024 can all run in parallel — they add responsive rules for different sections in different media query blocks

US4 (Phase 6) can run in parallel with US3 (Phase 5).

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (tokens + assets)
2. Complete Phase 2: Foundational (Figma inspection + page background)
3. Complete Phase 3: User Story 1 (full layout refactor)
4. **STOP and VALIDATE**: Visually compare against Figma at desktop width
5. The page is usable at this point even without responsive polish

### Incremental Delivery

1. Setup + Foundational → tokens and assets ready
2. Add US1 → layout matches Figma at desktop → Validate
3. Add US2 → icon and texture images wired in → Validate
4. Add US3 → responsive behavior at all viewports → Validate
5. Add US4 → static nav verification → Validate
6. Polish → preflight, copy audit, performance → Ship

---

## Notes

- All copy/content text must be preserved exactly — this is a layout refactor, not a copy rewrite
- Use CSS variables from `:root` — never hardcode hex colors in class rules
- 4pt spacing grid: all margins, padding, and gaps must be multiples of 4px
- Mobile-first CSS: base styles are mobile, enhance at breakpoints
- The page must remain a server component — no `'use client'` directive
- Figma shows placeholder text in feature cards and guides — keep our real copy instead
- The `landing_icon.svg` already exists at `apps/web/public/landing_icon.svg`
- Run `make preflight` as the final gate — regressions = task failure

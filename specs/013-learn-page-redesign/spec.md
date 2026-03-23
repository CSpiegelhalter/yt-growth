# Feature Specification: Learn Page Redesign

**Feature Branch**: `013-learn-page-redesign`
**Created**: 2026-03-20
**Status**: Draft
**Input**: Redesign the /learn page to match a new Figma layout while preserving the current page content/copy. Extract shared base component for Landing and Learn pages.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor Browses the Redesigned Learn Page (Priority: P1)

A visitor navigates to `/learn` and sees the page presented in the new Figma layout: a hero gradient band with texture overlay and the landing icon on the right, a bold subtitle, an intro paragraph, a 2×2 value proposition grid with checkmark icons, a "New to YouTube Growth?" start-here card with pill buttons, and article cards in a 2-column grid. All existing text content is preserved—only the visual presentation and layout structure have changed.

**Why this priority**: This is the core deliverable—the page must render correctly with the new layout and existing content.

**Independent Test**: Can be fully tested by visiting `/learn` in a browser and verifying the layout matches the Figma design while all existing copy remains intact.

**Acceptance Scenarios**:

1. **Given** a visitor on any device, **When** they navigate to `/learn`, **Then** they see the hero band with gradient background, texture overlay, title on the left, and the landing icon on the right—matching the Figma composition.
2. **Given** the redesigned page, **When** the visitor scrolls past the hero, **Then** they see the bold subtitle, intro paragraph, and 4 value propositions displayed in a 2×2 grid with checkmark icons.
3. **Given** the redesigned page, **When** the visitor continues scrolling, **Then** they see a "New to YouTube Growth?" card with three pill-style buttons (Get More Subscribers, Retention Analysis, Channel Audit) and short descriptions beneath each.
4. **Given** the redesigned page, **When** the visitor reaches the articles section, **Then** they see article cards in a 2-column grid, each showing category tag, title, description, reading time, and a linked CTA with arrow icon.
5. **Given** the redesigned page, **When** the visitor compares visible text to the current production `/learn` page, **Then** all existing copy (hero title, subtitle, intro text, highlights, start-here descriptions, article metadata, categories, FAQ, CTA) is present and unchanged.

---

### User Story 2 - Shared Hero Component Between Landing and Learn (Priority: P2)

Both the Landing page and the Learn page use the same visual hero treatment: a gradient band (hot-rose → cool-sky), a texture overlay image, and the `landing_icon.svg` placed on the right. A reusable shared component or pattern is extracted so both pages use the same hero implementation rather than duplicating layout code.

**Why this priority**: Reduces maintenance burden and ensures visual consistency between the two primary marketing pages.

**Independent Test**: Can be tested by verifying both `/` and `/learn` render their hero sections using the same shared component, and that modifying the shared component updates both pages.

**Acceptance Scenarios**:

1. **Given** the Landing page and Learn page, **When** a developer inspects the hero sections, **Then** both pages import and use the same shared hero component or pattern.
2. **Given** the shared hero component, **When** it renders on the Learn page, **Then** it displays the gradient band, texture overlay, and landing icon in positions matching the Figma design (title left, icon right).
3. **Given** the shared hero component, **When** it renders on the Landing page, **Then** existing Landing page hero behavior and content are preserved.

---

### User Story 3 - Responsive Layout on Mobile and Tablet (Priority: P2)

A visitor on a mobile or tablet device navigates to `/learn` and sees the redesigned page gracefully adapted for their screen size. The hero stacks vertically, the 2×2 value props collapse to a single column, the start-here pill buttons stack, and the 2-column article grid becomes single-column.

**Why this priority**: A significant portion of traffic comes from mobile; the redesign must be production-ready across breakpoints.

**Independent Test**: Can be tested by resizing the browser or using device emulation and verifying layout adapts correctly at each breakpoint.

**Acceptance Scenarios**:

1. **Given** a mobile viewport (< 640px), **When** the visitor views `/learn`, **Then** all sections stack into a single column, the icon sits above or below the hero text, and no horizontal scrolling occurs.
2. **Given** a tablet viewport (640px–900px), **When** the visitor views `/learn`, **Then** the article grid shows 1–2 columns and the value props display in a reasonable stacked or 2-column layout.
3. **Given** any viewport width, **When** the visitor views `/learn`, **Then** text remains readable, touch targets are adequately sized, and no content overflows or is clipped.

---

### User Story 4 - Static Page Layout Compatibility (Priority: P1)

The `/learn` page continues to render as a static marketing page: top navigation is visible, there is no left sidebar, and no app-shell spacing artifacts. It fits cleanly within the `(marketing)` route group layout.

**Why this priority**: Breaking the static page layout would affect all marketing pages and navigation.

**Independent Test**: Can be tested by visiting `/learn` and confirming only the `StaticNav` top bar appears, with no sidebar or app-shell wrapper.

**Acceptance Scenarios**:

1. **Given** the `/learn` route, **When** it renders, **Then** the `StaticNav` top navigation appears and no sidebar is present.
2. **Given** the `/learn` route, **When** it renders, **Then** main content spans the full available width below the nav without leftover sidebar spacing or margins.

---

### Edge Cases

- What happens when the page has zero articles (empty `learnArticles` array)? The articles grid section should either not render or show a graceful empty state.
- What happens when the landing icon SVG fails to load? The hero layout should not break; the title area should expand to fill available space.
- What happens when very long article titles or descriptions are present? Cards should handle text overflow gracefully (truncation or wrapping) without breaking the 2-column grid alignment.
- What happens at exactly the breakpoint boundaries (e.g., 640px, 900px)? Layout transitions should be smooth with no visual jumpiness.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The `/learn` page MUST display a hero gradient band matching the Figma design: linear gradient (hot-rose 15% → cool-sky 112%), texture overlay (hero-texture.webp at 30% opacity, multiply blend, vertically flipped), hero title on the left, and `landing_icon.svg` on the right.
- **FR-002**: The `/learn` page MUST display all existing content sections: hero (title + subtitle), intro paragraph, value proposition highlights, "New to YouTube Growth?" start-here section, articles grid, categories, FAQ, and bottom CTA—with all existing copy preserved verbatim.
- **FR-003**: The value proposition highlights MUST render in a 2×2 grid layout with checkmark icons, as shown in the Figma design.
- **FR-004**: The "New to YouTube Growth?" section MUST render as a white rounded card containing a title, description paragraph, three pill-style buttons (with hot-rose border), and a centered description beneath each button.
- **FR-005**: The articles section MUST render as a 2-column grid of white rounded cards, each showing: category tag (with pink background), bold title, description text, reading time (at reduced opacity), and a linked CTA with arrow icon.
- **FR-006**: A reusable shared component or pattern MUST be extracted for the hero gradient band treatment, supporting both the Landing page and Learn page without code duplication.
- **FR-007**: The shared hero component MUST accept configurable content (title, subtitle/badge text, children) while maintaining consistent visual treatment (gradient, texture, icon placement).
- **FR-008**: The `/learn` page MUST render within the `(marketing)` layout with `StaticNav` only—no sidebar, no app-shell wrapper.
- **FR-009**: The `/learn` page MUST be responsive: single-column layout on mobile (< 640px), appropriate intermediate layouts on tablet, and the full Figma layout on desktop (≥ 900px).
- **FR-010**: The Landing page MUST continue to function identically after the shared hero component extraction—no visual or behavioral regressions.
- **FR-011**: The page MUST use `landing_icon.svg` from `/public/landing_icon.svg` and `hero-texture.webp` from `/public/hero-texture.webp`—the same assets already used on the Landing page.

### Assumptions

- The Figma design shows placeholder article content (repeated "Channel Audit" cards); actual implementation will use the real `learnArticles` data with each article's unique title, category, description, and reading time.
- The categories section, FAQ section, and bottom CTA section are not shown in the Figma frame but are present on the current page; they will be retained below the articles grid using styling consistent with the new design direction.
- The Figma shows a 1600px canvas width; the implementation will use the existing `--page-max-width: 1200px` constraint and center content as the current design system does.
- The "ChannelBoost Blog Posts" badge text shown in Figma will be mapped to the existing "Learning Center" badge or updated to match Figma—this is a minor copy decision that follows the Figma as source of truth for presentation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The `/learn` page layout matches the Figma design's visual hierarchy, section arrangement, and spacing when viewed on a desktop-width browser (≥ 1200px).
- **SC-002**: 100% of existing `/learn` page text content is preserved after the redesign—no copy is lost, altered, or removed.
- **SC-003**: Both the Landing page and Learn page hero sections render using the same shared component, with zero visual regressions on the Landing page.
- **SC-004**: The `/learn` page renders correctly across 3 breakpoint ranges (mobile < 640px, tablet 640–900px, desktop ≥ 900px) with no horizontal overflow, clipped content, or broken layouts.
- **SC-005**: The page loads with no increase in Largest Contentful Paint beyond 500ms compared to the current implementation (hero image is already cached/optimized via existing asset pipeline).
- **SC-006**: All existing learn article links, category navigation, FAQ interactions, and CTA buttons remain functional after the redesign.

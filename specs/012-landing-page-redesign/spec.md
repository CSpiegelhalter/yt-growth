# Feature Specification: Landing Page Redesign

**Feature Branch**: `012-landing-page-redesign`
**Created**: 2026-03-19
**Status**: Draft
**Input**: Redesign the Landing page to match a new Figma layout while preserving the current landing-page copy/content. The Figma design is the source of truth for layout, spacing, hierarchy, section arrangement, image placement, and overall visual composition. Existing marketing copy stays unchanged.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor Sees Redesigned Landing Page (Priority: P1)

A first-time visitor navigates to the ChannelBoost landing page and sees the new visual layout with the existing marketing messaging. The page loads with the updated hero composition, section structure, card groupings, image placements, and CTA presentation as defined in the Figma design. All existing copy/content is preserved — only the visual presentation changes.

**Why this priority**: This is the core deliverable. Without the redesigned layout rendering correctly with existing content, no other story matters.

**Independent Test**: Can be tested by navigating to the landing page URL and visually comparing the rendered page against the Figma design reference while verifying all existing copy text is present and unchanged.

**Acceptance Scenarios**:

1. **Given** a visitor on any modern browser, **When** they navigate to the landing page, **Then** they see the new layout matching the Figma design with all existing marketing copy intact.
2. **Given** the landing page is loaded, **When** the visitor scrolls through the page, **Then** sections appear in the order defined by the Figma design with correct spacing and visual hierarchy.
3. **Given** the landing page is loaded, **When** comparing the rendered page to the Figma reference, **Then** the hero composition, section structure, card groupings, and CTA placement match the design intent.

---

### User Story 2 - Landing Page Icon and Splash Image Display Correctly (Priority: P1)

The landing page displays the main icon asset (`landing_icon.svg`) and splash image in the correct positions, sizes, and visual treatment as specified by the Figma design. These assets are production-ready and load without broken references.

**Why this priority**: The icon and splash image are central visual elements in the Figma design. Missing or broken images would undermine the entire redesign.

**Independent Test**: Can be tested by loading the landing page and verifying that the main icon SVG and splash image render at the correct size and position without 404 errors or layout shifts.

**Acceptance Scenarios**:

1. **Given** the landing page loads, **When** the hero/main section renders, **Then** the `landing_icon.svg` displays at the size and position defined by the Figma design.
2. **Given** the landing page loads, **When** the splash image section renders, **Then** the splash image is visible, correctly sized, and positioned per the Figma layout.
3. **Given** a fresh deployment, **When** the landing page loads, **Then** all image assets load successfully with no broken references or 404 errors.

---

### User Story 3 - Landing Page Renders Responsively Across Screen Sizes (Priority: P2)

The redesigned landing page adapts gracefully to different viewport widths (desktop, tablet, mobile). Sections stack and reflow appropriately, images scale correctly, and text remains readable at all breakpoints.

**Why this priority**: A large portion of traffic comes from mobile devices. The page must be usable and visually appealing across screen sizes to maintain conversion rates.

**Independent Test**: Can be tested by resizing the browser window or using device emulation to verify the page at desktop (1440px+), tablet (768px), and mobile (375px) widths.

**Acceptance Scenarios**:

1. **Given** a visitor on a desktop browser (1440px wide), **When** the page loads, **Then** the layout matches the Figma desktop design with full-width sections and side-by-side elements.
2. **Given** a visitor on a tablet (768px wide), **When** the page loads, **Then** sections adapt by stacking or reflowing content gracefully without horizontal overflow.
3. **Given** a visitor on a mobile device (375px wide), **When** the page loads, **Then** all content is readable, images scale to fit, and CTAs remain prominent and tappable.

---

### User Story 4 - Landing Page Uses Static-Page Navigation (Priority: P2)

The landing page renders within the static-page layout shell — showing only the top navigation bar and no app sidebar. There are no leftover app-shell artifacts or sidebar spacing visible to the visitor.

**Why this priority**: Correct navigation context ensures the landing page feels like a marketing/public page rather than an app screen. Incorrect layout would confuse visitors.

**Independent Test**: Can be tested by loading the landing page while logged out and verifying only the static top nav is visible with no sidebar or app-shell elements.

**Acceptance Scenarios**:

1. **Given** a visitor (logged out or logged in), **When** the landing page loads, **Then** only the static top navigation bar is displayed — no sidebar is present.
2. **Given** the landing page is loaded, **When** inspecting the page layout, **Then** there is no leftover sidebar spacing, margin, or app-shell wrapper artifacts.

---

### Edge Cases

- What happens when the splash image fails to load? The layout should not break — a fallback background or graceful degradation should be in place.
- What happens on very wide screens (2560px+)? Content should remain centered and not stretch to fill the full viewport width.
- What happens if `landing_icon.svg` fails to load? The layout should still render correctly without collapsing.
- What happens on very slow connections? The page should render text content first with images loading progressively.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Landing page MUST display all existing marketing copy/content without any text changes or omissions.
- **FR-002**: Landing page layout MUST match the Figma design reference for hero composition, section ordering, card groupings, spacing, and visual hierarchy.
- **FR-003**: Landing page MUST display `landing_icon.svg` as the primary icon/illustration asset, sized and positioned per the Figma design.
- **FR-004**: Landing page MUST include a splash image sourced and positioned per the Figma design, with the asset present in the codebase (not an external URL that could break).
- **FR-005**: Landing page MUST render within the static-page layout shell with only the top navigation bar visible and no app sidebar.
- **FR-006**: Landing page MUST be responsive across desktop (1440px+), tablet (768px), and mobile (375px) viewports.
- **FR-007**: Landing page MUST reuse existing shared components (buttons, cards, navigation, layout primitives) where they fit the Figma design, rather than creating new duplicates.
- **FR-008**: Landing page CTA buttons MUST be present and functional, preserving current click behavior and destinations.
- **FR-009**: Landing page MUST use existing app design tokens (colors, typography, spacing) to maintain consistency with the rest of ChannelBoost.
- **FR-010**: All image assets MUST be locally hosted in the project (no external CDN dependencies for core page assets).

### Key Entities

- **Landing Page**: The public-facing marketing page at the root URL; contains hero, feature sections, CTAs, and footer.
- **Static Page Layout**: The layout shell used by public/marketing pages — includes top nav only, no sidebar.
- **Landing Icon**: The SVG illustration asset (`landing_icon.svg`) used as the primary visual element in the hero/main section.
- **Splash Image**: A photographic or illustrative image used in the hero or feature section as defined by the Figma design.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Landing page layout matches the Figma design reference for all major structural elements (hero, sections, cards, CTAs, images) as verified by visual comparison.
- **SC-002**: 100% of existing landing page marketing copy is preserved verbatim in the redesigned page.
- **SC-003**: Landing page renders without layout breakage or horizontal scrollbar at viewport widths from 375px to 2560px.
- **SC-004**: All image assets (icon, splash) load successfully with zero 404 errors on page load.
- **SC-005**: Landing page loads with no app sidebar visible and uses only the static top navigation, regardless of user authentication state.
- **SC-006**: Page achieves a Lighthouse performance score of 90+ (maintaining current performance baseline).
- **SC-007**: At least 60% of landing page components are reused from existing shared primitives rather than newly created.

## Assumptions

- The Figma design at the provided URL is the authoritative source for layout decisions.
- The existing landing page copy is final and correct — this feature does not involve copywriting.
- The `landing_icon.svg` asset already exists at `apps/web/public/landing_icon.svg` and is ready to use.
- The splash image may need to be sourced/downloaded from the Figma design or created as a new asset.
- The static-page layout and top navigation components already exist and are functional.
- No database changes are required for this feature.
- No new routes are needed — the landing page URL remains the same.

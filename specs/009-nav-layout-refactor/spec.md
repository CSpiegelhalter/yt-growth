# Feature Specification: Navigation & Layout Refactor

**Feature Branch**: `009-nav-layout-refactor`
**Created**: 2026-03-13
**Status**: Draft
**Input**: User description: "Refactor navigation/layout to cleanly separate static-page navigation (top nav only, no sidebar) from app-page navigation (sidebar with new bottom section). Update static-page top nav to marketing-style. Add Channel, Account, Support items to sidebar bottom."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Static Page Visitor Sees Marketing Nav Only (Priority: P1)

A visitor (signed in or not) navigates to the landing page, learn page, or any learn/* article page. They see a clean top navbar with the ChannelBoost logo on the left and Learn, Pricing, and Get Started on the right. There is no left sidebar visible, and the page content fills the full width without leftover sidebar spacing or ghost containers.

**Why this priority**: This is the core layout change. Static pages currently show both a top nav and sidebar, creating a confusing experience for marketing/content visitors. Removing the sidebar and simplifying the top nav is the primary deliverable.

**Independent Test**: Navigate to the landing page, learn page, and any learn/* article page. Verify no sidebar is rendered, no empty sidebar spacing exists, and the top nav shows only logo + Learn/Pricing/Get Started.

**Acceptance Scenarios**:

1. **Given** a user visits the landing page, **When** the page loads, **Then** only the top navbar is visible with ChannelBoost logo (left) and Learn, Pricing, Get Started (right); no left sidebar or sidebar spacing is present.
2. **Given** a user visits the learn page, **When** the page loads, **Then** the same top-nav-only layout is displayed with no sidebar.
3. **Given** a user visits any learn/* article page, **When** the page loads, **Then** the same top-nav-only layout is displayed with no sidebar.
4. **Given** a user is on a static page, **When** they look at the upper-right area of the top nav, **Then** there are no channel/account controls visible -- only Learn, Pricing, and Get Started.

---

### User Story 2 - App User Accesses Sidebar Bottom Items (Priority: P1)

A signed-in user on an app page sees the existing sidebar with three new items at the bottom: Channel, Account, and Support. These are visually separated from the main navigation items and route to the expected destinations.

**Why this priority**: The sidebar bottom section is a key new navigational feature for app users, providing quick access to channel, account/profile, and support/contact functionality.

**Independent Test**: Sign in and navigate to any app page. Verify the sidebar displays Channel, Account, and Support at the bottom, visually separated from main nav items. Click each to confirm routing.

**Acceptance Scenarios**:

1. **Given** a signed-in user is on any app page, **When** they view the sidebar, **Then** Channel, Account, and Support items appear at the bottom, visually separated from the primary navigation.
2. **Given** a signed-in user clicks Channel in the sidebar bottom, **When** the navigation occurs, **Then** they are routed to the channel-related destination.
3. **Given** a signed-in user clicks Account in the sidebar bottom, **When** the navigation occurs, **Then** they are routed to the Profile page.
4. **Given** a signed-in user clicks Support in the sidebar bottom, **When** the navigation occurs, **Then** they are routed to the Contact page.

---

### User Story 3 - Static Page Top Nav Interactions (Priority: P2)

A visitor on any static page can use the top nav to navigate to key marketing destinations. Clicking the logo routes to the landing page. Clicking Learn routes to the learn page. Clicking Pricing routes to the pricing page. Clicking Get Started initiates the signup/onboarding flow.

**Why this priority**: Ensures the marketing top nav is functional and routes correctly, but is secondary to the layout structure changes.

**Independent Test**: On any static page, click each top nav element and verify correct routing behavior.

**Acceptance Scenarios**:

1. **Given** a user is on any static page, **When** they click the ChannelBoost logo, **Then** they are routed to the landing page.
2. **Given** a user is on any static page, **When** they click Learn, **Then** they are routed to the learn page.
3. **Given** a user is on any static page, **When** they click Pricing, **Then** they are routed to the pricing page.
4. **Given** a user is on any static page, **When** they click Get Started, **Then** they are routed to the signup/onboarding flow.

---

### User Story 4 - App Pages Retain Existing Sidebar Behavior (Priority: P2)

Signed-in users on app/product pages continue to see the sidebar with all existing navigation items intact. The sidebar behavior, including any existing expand/collapse or responsive behavior, is preserved.

**Why this priority**: Regression prevention. Ensuring app pages are unaffected by the static-page layout changes is critical but expected to be a natural outcome of a clean layout separation.

**Independent Test**: Navigate to various app pages and verify the sidebar renders with all existing items plus the new bottom section.

**Acceptance Scenarios**:

1. **Given** a signed-in user navigates to an app page, **When** the page loads, **Then** the sidebar is visible with all existing navigation items.
2. **Given** the sidebar is visible on an app page, **When** the user inspects it, **Then** the sidebar's existing expand/collapse and responsive behavior works as before.

---

### Edge Cases

- What happens when a user is signed in but visits a static page (landing, learn, learn/*)? They should still see the static marketing top nav only, with no sidebar.
- What happens when the browser window is narrow/mobile? The static-page top nav and app-page sidebar should each handle responsive behavior appropriately for their context.
- What happens if a new learn/* article is added in the future? It should automatically inherit the static-page layout (no sidebar) without additional configuration.
- What happens if the sidebar bottom items' destination routes don't exist yet (e.g., Contact page)? The links should still be present and route to the intended path; if the page doesn't exist, it should handle gracefully (standard 404 behavior).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Static pages (landing, learn, learn/*) MUST render with only the top navbar and no left sidebar.
- **FR-002**: Static pages MUST NOT have any residual sidebar spacing, layout offsets, or ghost containers.
- **FR-003**: The static-page top navbar MUST display the ChannelBoost logo on the left, linking to the landing page.
- **FR-004**: The static-page top navbar MUST display Learn, Pricing, and Get Started on the right side.
- **FR-005**: Get Started MUST be rendered as a button (not a plain link).
- **FR-006**: Learn and Pricing MUST be rendered as regular navigation links.
- **FR-007**: The static-page top navbar MUST NOT display channel/account controls.
- **FR-008**: App pages MUST continue to render the sidebar with all existing navigation items.
- **FR-009**: The sidebar on app pages MUST include Channel, Account, and Support items at the bottom.
- **FR-010**: Sidebar bottom items MUST be visually separated from the main primary navigation.
- **FR-011**: Channel sidebar item MUST route to the channel-related destination in the app.
- **FR-012**: Account sidebar item MUST route to the Profile page.
- **FR-013**: Support sidebar item MUST route to the Contact page.
- **FR-014**: The layout separation between static and app pages MUST be implemented at the layout level, not via page-specific conditional logic scattered across individual pages.
- **FR-015**: All learn/* article pages MUST automatically inherit the static-page layout without per-page configuration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of static pages (landing, learn, all learn/* articles) render with no sidebar and no residual sidebar spacing.
- **SC-002**: 100% of app pages render with the sidebar including the three new bottom items (Channel, Account, Support).
- **SC-003**: All static-page top nav elements (logo, Learn, Pricing, Get Started) route to their correct destinations on first click.
- **SC-004**: All sidebar bottom items (Channel, Account, Support) route to their correct destinations on first click.
- **SC-005**: Adding a new learn/* article page in the future requires zero navigation/layout configuration -- it inherits the static-page layout automatically.
- **SC-006**: The static vs app navigation distinction is centralized in layout files, not scattered across individual page components.

## Assumptions

- The existing ChannelBoost logo component can be reused in the static-page top nav.
- The existing button and nav link primitives can be reused for Get Started, Learn, and Pricing.
- The Contact page route exists or will be created separately; this feature links to it regardless.
- The Pricing page route exists or will be created separately; this feature links to it regardless.
- The "channel-related destination" for the Channel sidebar item refers to the current primary channel route in the app (e.g., channel profile or channel dashboard).
- Signed-in users visiting static pages see the marketing top nav (not the app nav), consistent with the static page layout.
- Responsive/mobile behavior for the new static-page top nav follows existing responsive patterns in the app.

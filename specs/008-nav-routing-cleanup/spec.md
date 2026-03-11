# Feature Specification: Navigation & Routing Cleanup

**Feature Branch**: `008-nav-routing-cleanup`
**Created**: 2026-03-11
**Status**: Draft
**Input**: Clean up and standardize routing, sidebar behavior, navigation ordering/styling, and crawl/indexing files so the app is fully aligned.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistent Sidebar Navigation (Priority: P1)

A signed-in user sees a left-hand sidebar with exactly six items in a fixed order: Dashboard, Videos, Analyzer, Tags, Keywords, Profile. Each item uses the correct icon, with all icons displayed in Hot Rose and text in Imperial Blue by default, changing to Hot Rose on hover. The sidebar appears consistently on every page when signed in.

**Why this priority**: The sidebar is the primary navigation element. Getting its content, order, and styling right is the foundation for all other navigation behavior.

**Independent Test**: Can be verified by signing in and visually inspecting the sidebar on any page — confirming item order, icon correctness, and color behavior on hover.

**Acceptance Scenarios**:

1. **Given** a signed-in user on any page, **When** the sidebar renders, **Then** it displays exactly six items in order: Dashboard, Videos, Analyzer, Tags, Keywords, Profile.
2. **Given** a signed-in user viewing the sidebar, **When** they look at the icons, **Then** all icons are rendered in Hot Rose color, text labels are Imperial Blue.
3. **Given** a signed-in user viewing the sidebar, **When** they hover over any sidebar item, **Then** the text changes to Hot Rose.
4. **Given** the sidebar is rendered, **When** inspecting the Dashboard item, **Then** it uses the `dashboard.svg` icon.
5. **Given** the sidebar is rendered, **When** inspecting the Analyzer item, **Then** it uses the `analyze.svg` icon.

---

### User Story 2 - Signed-Out Experience on Protected Pages (Priority: P1)

A signed-out user navigating to Dashboard, Videos, or Profile sees only a sign-in component — no sidebar, no empty layout shells, and no redirect. The page renders normally with just the sign-in prompt.

**Why this priority**: This defines the core signed-out behavior and replaces auth-guard redirects, which is a fundamental routing change.

**Independent Test**: Can be tested by visiting `/dashboard`, `/videos`, or `/profile` while signed out and confirming only the sign-in component appears with no sidebar or layout chrome.

**Acceptance Scenarios**:

1. **Given** a signed-out user, **When** they navigate to Dashboard, **Then** they see only the sign-in component with no sidebar or empty layout containers.
2. **Given** a signed-out user, **When** they navigate to Videos, **Then** they see only the sign-in component with no sidebar.
3. **Given** a signed-out user, **When** they navigate to Profile, **Then** they see only the sign-in component with no sidebar.
4. **Given** a signed-out user on Dashboard/Videos/Profile, **When** the page loads, **Then** no redirect occurs — the URL stays the same.

---

### User Story 3 - Sidebar Visibility on Public-Friendly Pages (Priority: P2)

A signed-out user navigating to Tags or Keywords can still see and use the sidebar. These pages remain accessible with full navigation chrome regardless of auth state.

**Why this priority**: Tags and Keywords serve as publicly accessible tools; maintaining sidebar visibility here supports discoverability and user engagement even before sign-in.

**Independent Test**: Can be tested by visiting the Tags or Keywords page while signed out and confirming the sidebar is visible.

**Acceptance Scenarios**:

1. **Given** a signed-out user, **When** they navigate to Tags, **Then** the sidebar is visible with all six navigation items.
2. **Given** a signed-out user, **When** they navigate to Keywords, **Then** the sidebar is visible with all six navigation items.

---

### User Story 4 - No Auth-Guard Redirects (Priority: P1)

No route in the application redirects users based on authentication state. All pages render content directly — either the intended page content (if signed in or on a public page) or a sign-in component (if signed out on a protected page).

**Why this priority**: Removing auth-guard redirects is a prerequisite for the new signed-out experience and eliminates confusing URL changes.

**Independent Test**: Can be tested by visiting every app route while signed out and confirming no redirects occur.

**Acceptance Scenarios**:

1. **Given** a signed-out user, **When** they navigate to any app route, **Then** no redirect to a login page or other route occurs.
2. **Given** any route in the app, **When** inspecting its server/layout code, **Then** no auth-based redirect logic exists.

---

### User Story 5 - Competitors Route Removal (Priority: P2)

The Competitors route is removed from active navigation, routing, and indexing. Users can no longer navigate to it via the sidebar or any in-app link. However, the underlying competitor-analysis components and code are preserved for potential future reuse.

**Why this priority**: Cleaning up stale routes prevents user confusion, but preserving components supports future flexibility.

**Independent Test**: Can be tested by confirming Competitors does not appear in the sidebar and is absent from robots.txt, sitemap, and llms.txt.

**Acceptance Scenarios**:

1. **Given** any user (signed in or out), **When** viewing the sidebar, **Then** Competitors does not appear as a navigation item.
2. **Given** the app's crawl/indexing files, **When** inspecting robots.txt, sitemap, and llms.txt, **Then** no references to the competitors route exist.
3. **Given** the codebase, **When** inspecting competitor-analysis components, **Then** reusable components remain available in the source tree (not hard-deleted).

---

### User Story 6 - Crawl & Indexing File Alignment (Priority: P2)

The robots.txt, llms.txt, and sitemap files accurately reflect the current route structure. They include only routes that exist and are intended to be surfaced, with no stale references to removed routes (e.g., competitors, saved-ideas).

**Why this priority**: Accurate crawl/indexing files prevent search engines and LLM tools from surfacing dead links and maintain SEO health.

**Independent Test**: Can be tested by generating each file and comparing its contents against the actual app routes.

**Acceptance Scenarios**:

1. **Given** the robots.txt file, **When** it is generated, **Then** it does not reference competitors, saved-ideas, or other removed routes.
2. **Given** the sitemap, **When** it is generated, **Then** it includes only current, valid routes and excludes removed ones.
3. **Given** llms.txt, **When** it is generated, **Then** it reflects the current app structure with no stale route references.
4. **Given** all three files, **When** compared against each other, **Then** they present a consistent view of the app's route structure.

---

### Edge Cases

- What happens when a signed-out user deep-links to a specific video detail page (e.g., `/videos/abc123`)? — The sign-in component should appear, consistent with the Videos page behavior.
- What happens when a signed-in user with no channel visits Dashboard? — The page renders normally (channel-level gating is handled by page-level components, not route-level guards).
- What happens if a user bookmarks the old Competitors URL? — The route files/pages still exist in the codebase but are not linked from navigation. The page may still render if the route files are preserved, which is acceptable for backward compatibility.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sidebar MUST display exactly six items in this order: Dashboard, Videos, Analyzer, Tags, Keywords, Profile.
- **FR-002**: Dashboard sidebar item MUST use the `dashboard.svg` icon from `apps/web/public/sidebar/`.
- **FR-003**: Analyzer sidebar item MUST use the `analyze.svg` icon from `apps/web/public/sidebar/`.
- **FR-004**: All sidebar icons MUST be rendered in the app's Hot Rose color at all times.
- **FR-005**: Sidebar text labels MUST default to Imperial Blue color.
- **FR-006**: Sidebar text labels MUST change to Hot Rose color on hover.
- **FR-007**: Sidebar icon and text styling MUST use the app's existing design tokens rather than hardcoded color values.
- **FR-008**: No route in the application MUST perform auth-based redirects.
- **FR-009**: On Dashboard, Videos, and Profile pages, signed-out users MUST see only the sign-in component with no sidebar or layout shell.
- **FR-010**: On Tags and Keywords pages, the sidebar MUST remain visible even when the user is signed out.
- **FR-011**: Sidebar visibility MUST be determined at the layout level: show sidebar if the user is signed in OR the current page is Tags or Keywords.
- **FR-012**: The Competitors route MUST be removed from the sidebar navigation items.
- **FR-013**: The Competitors route MUST be removed from robots.txt, sitemap, and llms.txt.
- **FR-014**: Reusable competitor-analysis components MUST be preserved in the codebase (not hard-deleted).
- **FR-015**: robots.txt MUST reflect only current, valid routes.
- **FR-016**: Sitemap MUST reflect only current, valid routes.
- **FR-017**: llms.txt MUST reflect only current, valid routes.
- **FR-018**: The sign-in component shown on protected pages MUST reuse the existing unified sign-in/access-state component — no duplicate pattern.

### Key Entities

- **Navigation Item**: A sidebar entry consisting of an icon path, label, route path, and display order.
- **Sidebar Visibility Rule**: Logic determining whether the sidebar renders based on auth state and current route.
- **Crawl/Indexing File**: Generated files (robots.txt, sitemap.xml, llms.txt) that describe the app's public route structure to external consumers.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Sidebar displays exactly 6 items in the specified order on every page where it is visible — 100% consistency.
- **SC-002**: Zero auth-based redirects exist anywhere in the application routing code.
- **SC-003**: Signed-out users on Dashboard, Videos, or Profile see only the sign-in component — no sidebar, no empty layout containers, no redirect.
- **SC-004**: Signed-out users on Tags and Keywords see the full sidebar — same experience as signed-in users (minus any user-specific data).
- **SC-005**: robots.txt, sitemap, and llms.txt contain zero references to removed routes (competitors, saved-ideas, etc.).
- **SC-006**: All sidebar icons render in Hot Rose; all sidebar text renders in Imperial Blue by default and Hot Rose on hover — verified visually.
- **SC-007**: Competitor-analysis components remain in the codebase source tree, available for future re-integration.

## Assumptions

- The existing unified sign-in / access-state component (AccessGate or similar) is available and suitable for reuse on Dashboard, Videos, and Profile pages.
- Hot Rose and Imperial Blue are defined as design tokens or CSS custom properties in the app's shared styling system.
- The Analyzer route corresponds to the existing `/analyze` path in the app.
- Keywords corresponds to the existing `/trending` path (or a dedicated keywords route) — this will be confirmed during implementation.
- Competitor route files in the filesystem may be preserved (not deleted) even though they are de-linked from navigation and indexing.
- The `dashboard.svg` and `analyze.svg` icons already exist at the specified paths.

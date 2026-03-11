# Feature Specification: AccessGate Component

**Feature Branch**: `005-access-gate`
**Created**: 2026-03-10
**Status**: Draft
**Input**: Standardize how the app handles pages requiring authentication and/or a connected YouTube account using a single reusable AccessGate wrapper component.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unauthenticated User Sees Sign-In Prompt (Priority: P1)

A visitor who is not logged in navigates to any page that requires authentication (e.g., Dashboard, Videos). Instead of being redirected, the page renders normally but shows a clean, centered prompt asking the user to sign in or sign up.

**Why this priority**: This is the most common gating scenario — every unauthenticated user hits this before anything else. It replaces redirect-based guards, preserving SEO and improving UX.

**Independent Test**: Navigate to any protected page while logged out and verify the sign-in prompt appears instead of a redirect.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user, **When** they navigate to the Dashboard page, **Then** they see a centered sign-in prompt with a clear call-to-action to sign in or sign up.
2. **Given** an unauthenticated user, **When** they navigate to any protected page, **Then** no page content (charts, lists, panels) is visible behind the prompt.
3. **Given** an unauthenticated user, **When** they click the sign-in action, **Then** they are taken to the existing sign-in flow.

---

### User Story 2 - Authenticated User Without YouTube Channel Sees Connect Prompt (Priority: P1)

A logged-in user who has not connected a YouTube channel navigates to a page requiring YouTube data. Instead of seeing broken or empty UI, they see a clean prompt asking them to connect their YouTube channel.

**Why this priority**: Equally critical as Story 1 — this is the second gating state and must work correctly for onboarding to feel seamless.

**Independent Test**: Log in with an account that has no connected YouTube channel, navigate to a protected page, and verify the connect-channel prompt appears.

**Acceptance Scenarios**:

1. **Given** a logged-in user with no connected YouTube channel, **When** they navigate to the Videos page, **Then** they see a centered prompt to connect their YouTube channel.
2. **Given** a logged-in user with no connected YouTube channel, **When** viewing the prompt, **Then** no empty dashboard panels, charts, or video lists are visible behind it.
3. **Given** a logged-in user with no connected YouTube channel, **When** they click the connect action, **Then** they are taken to the existing YouTube channel connection flow.

---

### User Story 3 - Fully Authenticated User Sees Normal Page Content (Priority: P1)

A logged-in user who has a connected YouTube channel navigates to any protected page and sees the full page content as expected. The AccessGate wrapper is invisible to them.

**Why this priority**: This is the happy path — must be seamless with zero visual or performance impact.

**Independent Test**: Log in with a fully set-up account and verify all protected pages render their content normally.

**Acceptance Scenarios**:

1. **Given** a fully authenticated user with a connected YouTube channel, **When** they navigate to the Dashboard, **Then** they see the full dashboard content.
2. **Given** a fully authenticated user, **When** they navigate to any protected page, **Then** there is no flash of the access-state UI before content appears.

---

### User Story 4 - Route Auth Guards Are Removed (Priority: P2)

All existing route-level auth guards and redirect-based authentication checks are removed. Pages always render, and access gating is handled entirely by the AccessGate component.

**Why this priority**: Essential for the new architecture but depends on the AccessGate component existing first.

**Independent Test**: Verify that no protected page triggers a redirect when accessed by an unauthenticated user; instead, the page loads and shows the AccessGate prompt.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user, **When** they navigate directly to a protected page URL, **Then** the page loads (no redirect) and shows the sign-in prompt.
2. **Given** the codebase, **When** audited, **Then** no route-level auth guards or redirect-based checks remain for pages using AccessGate.

---

### User Story 5 - Existing Auth Prompt Components Are Consolidated (Priority: P2)

Any existing components that show login prompts, connect-channel prompts, or similar access-state UI are consolidated into the single AccessGate component. No duplicate systems exist.

**Why this priority**: Prevents maintenance burden and inconsistent UX from parallel systems.

**Independent Test**: Search the codebase for auth prompt components and verify only AccessGate remains.

**Acceptance Scenarios**:

1. **Given** the codebase after refactoring, **When** searched for auth-prompt or connect-channel prompt components, **Then** only the AccessGate component handles these states.
2. **Given** existing pages that used old prompt components, **When** loaded, **Then** they display correctly using AccessGate.

---

### Edge Cases

- What happens when a user's session expires while viewing a protected page? (Assumption: normal session expiry behavior applies — next navigation or API call triggers sign-in prompt)
- What happens when a user disconnects their YouTube channel while on a page requiring it? (Assumption: next page load or navigation shows the connect prompt)
- What happens on pages that only require authentication but NOT a YouTube channel? (Assumption: AccessGate supports a mode where only authentication is required, not YouTube connection)
- What happens if the auth state check is slow to resolve? (Assumption: page shows a loading state or skeleton rather than flashing the wrong state)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a single reusable AccessGate wrapper component that handles all access-state gating.
- **FR-002**: AccessGate MUST detect whether the current user is authenticated and render a sign-in prompt if not.
- **FR-003**: AccessGate MUST detect whether the authenticated user has a connected YouTube channel and render a connect-channel prompt if not.
- **FR-004**: AccessGate MUST render its children (page content) when the user is fully authenticated and has a connected YouTube channel.
- **FR-005**: When showing an access-state prompt, AccessGate MUST replace all page content — no underlying page elements (charts, panels, lists) may be visible.
- **FR-006**: Access-state prompts MUST be horizontally centered and positioned slightly above vertical center of the viewport.
- **FR-007**: The sign-in prompt MUST provide a clear action to navigate to the existing sign-in flow.
- **FR-008**: The connect-channel prompt MUST provide a clear action to navigate to the existing YouTube channel connection flow.
- **FR-009**: All existing route-level auth guards and redirect-based authentication checks MUST be removed from pages that adopt AccessGate.
- **FR-010**: All existing components that duplicate AccessGate functionality (login prompts, connect-channel prompts) MUST be consolidated into AccessGate and removed.
- **FR-011**: AccessGate MUST reuse existing button components, auth utilities, and connection flows — no new parallel systems.
- **FR-012**: AccessGate MUST support an auth-only mode for pages that require login but not a YouTube channel connection.
- **FR-013**: Pages MUST always render (no redirects) — AccessGate determines what the user sees.

### Key Entities

- **AccessState**: The user's current access level — unauthenticated, authenticated-without-channel, or fully-ready.
- **AccessGate**: The wrapper component that evaluates AccessState and renders either a prompt or children.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of previously redirect-guarded pages now render without redirects, using AccessGate instead.
- **SC-002**: Zero duplicate auth-prompt or connect-channel-prompt components exist in the codebase after refactoring.
- **SC-003**: Unauthenticated users see the sign-in prompt on all protected pages within the normal page load time (no additional delay).
- **SC-004**: Authenticated users without a YouTube channel see the connect prompt on all relevant pages within the normal page load time.
- **SC-005**: Fully authenticated users with a connected channel experience zero visual difference — no flash of gating UI.
- **SC-006**: All protected pages use a consistent, uniform AccessGate wrapper pattern.

## Assumptions

- The app already has established sign-in and YouTube channel connection flows that AccessGate can link to.
- Session/auth state is available client-side (via context, hook, or server-side props) without additional infrastructure.
- The existing navigation shell (sidebar, header) continues to render regardless of access state — only page content is gated.
- Pages that are purely marketing/public (e.g., landing page, learn/articles) do NOT use AccessGate.

## Scope Boundaries

### In Scope
- Creating the AccessGate component
- Removing route-level auth guards
- Refactoring all protected pages to use AccessGate
- Consolidating existing auth-prompt and connect-channel-prompt components

### Out of Scope
- Changes to the actual sign-in or YouTube connection flows themselves
- Changes to the navigation shell or layout component
- Adding new authentication methods
- Changes to API-level auth middleware

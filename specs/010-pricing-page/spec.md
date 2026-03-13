# Feature Specification: Pricing Page & Reusable Upgrade Component

**Feature Branch**: `010-pricing-page`
**Created**: 2026-03-13
**Status**: Draft
**Input**: User description: "Build a reusable Pricing page and component with Stripe checkout flow, matching Figma reference"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Authenticated User Purchases Pro Plan (Priority: P1)

A signed-in user on the Free plan visits the Pricing page, sees the Pro plan benefits and price, clicks "Purchase", and is redirected to Stripe Checkout. After completing payment, they are redirected to the Dashboard.

**Why this priority**: This is the core revenue conversion flow. Without a working purchase path for authenticated users, no monetization happens.

**Independent Test**: Can be fully tested by signing in as a Free user, navigating to the Pricing page, clicking Purchase, completing Stripe Checkout (test mode), and verifying redirect to Dashboard.

**Acceptance Scenarios**:

1. **Given** a signed-in user on the Free plan, **When** they visit the Pricing page, **Then** they see the "Upgrade to Pro!" card with features list, price ($12/mo), and a prominent "Purchase" button.
2. **Given** a signed-in Free user on the Pricing page, **When** they click "Purchase", **Then** they are redirected to Stripe Checkout with the correct Pro plan product/price pre-selected.
3. **Given** a user who has completed Stripe Checkout successfully, **When** Stripe redirects them back, **Then** they land on the Dashboard.
4. **Given** a signed-in user who already has an active Pro plan, **When** they visit the Pricing page, **Then** the Purchase button is replaced or disabled with a "Current Plan" indicator.

---

### User Story 2 - Unauthenticated User Purchases Pro Plan (Priority: P1)

A visitor (not signed in) lands on the Pricing page, sees the Pro plan offer, clicks "Purchase", is prompted to sign in first, and after signing in is seamlessly continued into Stripe Checkout.

**Why this priority**: The Pricing page is a public-facing acquisition surface. Unauthenticated visitors must be able to start the purchase flow without a broken handoff.

**Independent Test**: Can be tested by visiting the Pricing page while signed out, clicking Purchase, completing sign-in, and verifying Stripe Checkout opens afterward.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor on the Pricing page, **When** they click "Purchase", **Then** they are redirected to the sign-in flow with a return-to-checkout intent preserved.
2. **Given** a user who just completed sign-in from a purchase intent, **When** sign-in succeeds, **Then** they are automatically redirected to Stripe Checkout (not back to the Pricing page).
3. **Given** a user who abandons sign-in, **When** they return to the Pricing page later, **Then** no stale purchase intent interferes with normal page behavior.

---

### User Story 3 - Account Page Upgrade Prompt for Free Users (Priority: P2)

A signed-in user on the Free plan visits their Account page and sees the same "Upgrade to Pro!" pricing card alongside their account overview, with a working Purchase button.

**Why this priority**: The Account page is a high-intent surface where users are already managing their plan. Showing the upgrade option here captures conversion from users who are already engaged.

**Independent Test**: Can be tested by signing in as a Free user, navigating to the Account page, verifying the pricing card appears, and clicking Purchase to confirm Stripe Checkout opens.

**Acceptance Scenarios**:

1. **Given** a signed-in Free user, **When** they visit the Account page, **Then** they see the "Upgrade to Pro!" pricing card with the same features, price, and design as the Pricing page.
2. **Given** a signed-in Free user on the Account page, **When** they click "Purchase", **Then** they are redirected directly to Stripe Checkout (no sign-in gate needed since they are already authenticated).
3. **Given** a signed-in Pro user, **When** they visit the Account page, **Then** the upgrade pricing card is not shown (or shows current plan status instead).

---

### User Story 4 - Pricing Page Accessible as a Marketing Surface (Priority: P2)

The Pricing page is publicly accessible (no auth required to view) and serves as a marketing/conversion page with clear value proposition, feature list, pricing, and call-to-action.

**Why this priority**: The Pricing page must work as a standalone landing page that can be linked from marketing, blog posts, and external traffic sources.

**Independent Test**: Can be tested by visiting the Pricing page URL directly while signed out and verifying it renders correctly with all content visible.

**Acceptance Scenarios**:

1. **Given** any visitor (signed in or not), **When** they navigate to the Pricing page URL, **Then** the page renders with the full pricing component including header, features, price, and CTA.
2. **Given** the Pricing page, **When** rendered, **Then** it matches the Figma design reference: gradient header (pink-to-blue), feature list with check icons, "$12/mo" price, and dark "Purchase" button.

---

### User Story 5 - Checkout Error Handling (Priority: P3)

If Stripe Checkout session creation fails, the user sees a clear error message and can retry.

**Why this priority**: Edge case handling that prevents users from getting stuck in a broken state.

**Independent Test**: Can be tested by simulating a Stripe API failure and verifying the user sees an actionable error message.

**Acceptance Scenarios**:

1. **Given** a user who clicks "Purchase", **When** Stripe checkout session creation fails, **Then** the user sees a user-friendly error message with an option to retry.
2. **Given** a checkout failure, **When** the user retries, **Then** a new checkout session is attempted.

---

### Edge Cases

- What happens when a user's session expires between clicking "Purchase" and completing sign-in? The sign-in flow should still work normally; the purchase intent callback URL should survive the sign-in redirect.
- How does the system handle Stripe webhook delays where payment succeeds but plan status hasn't updated yet? The post-purchase redirect should land on Dashboard regardless; plan status will update asynchronously via webhook.
- What happens if a user navigates directly to the Stripe success URL without completing payment? The success redirect should verify payment status or gracefully handle this case by landing on Dashboard where actual plan status is shown.
- What if a user already has a Pro plan and visits the Pricing page via a direct/bookmarked link? The pricing card should indicate "Current Plan" status and disable the Purchase button.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render a Pricing page at a public URL accessible to both authenticated and unauthenticated users.
- **FR-002**: System MUST display a pricing card matching the Figma reference design: gradient header, "Upgrade to Pro!" title with sparkle icon, subtitle, five feature items with check-circle icons, "$12/mo" price, and "Purchase" CTA button.
- **FR-003**: The pricing UI MUST be implemented as a single reusable component that can be embedded on both the Pricing page and the Account page.
- **FR-004**: The reusable component MUST accept configuration for whether sign-in gating is required before purchase (Pricing page: yes if unauthenticated; Account page: no, user is always signed in).
- **FR-005**: When an unauthenticated user clicks "Purchase", the system MUST redirect to sign-in with a callback that continues to Stripe Checkout after successful authentication.
- **FR-006**: When an authenticated user clicks "Purchase", the system MUST initiate a Stripe Checkout session and redirect the user to Stripe.
- **FR-007**: After successful Stripe payment, the system MUST redirect the user to the Dashboard.
- **FR-008**: The pricing component MUST visually indicate when the user already has an active Pro plan (e.g., disable Purchase button, show "Current Plan" badge).
- **FR-009**: The system MUST handle Stripe Checkout session creation failures gracefully with a user-facing error message.
- **FR-010**: The pricing component MUST use existing app design tokens, colors, typography, and shared styles rather than hardcoded one-off values.
- **FR-011**: The system MUST reuse existing Stripe checkout/session infrastructure if it already exists in the codebase.
- **FR-012**: The Account page MUST display the pricing component when the signed-in user does not have a Pro plan.

### Key Entities

- **Pro Plan**: The single paid tier offering ($12/mo) that unlocks premium features (unlimited idea suggestions, video analysis with actionable fixes, subscriber driver insights, 3 connected channels, priority support).
- **Purchase Intent**: A transient state that tracks the user's intent to purchase, used to bridge the sign-in-to-checkout handoff for unauthenticated users.
- **Stripe Checkout Session**: A server-created session that represents a single purchase attempt, with success and cancel URLs configured.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can go from viewing the Pricing page to completing Stripe Checkout in under 3 clicks (view page -> Purchase -> complete Stripe payment).
- **SC-002**: Unauthenticated users who click "Purchase" reach Stripe Checkout within 1 additional step (sign-in), with no dead ends or manual re-navigation.
- **SC-003**: The same pricing component renders correctly on both the Pricing page and Account page without code duplication.
- **SC-004**: Post-purchase redirect lands users on the Dashboard 100% of the time for successful payments.
- **SC-005**: The pricing card visually matches the Figma reference design (gradient header, feature list layout, button styling, typography) as verified by visual review.
- **SC-006**: Checkout initiation failures display an actionable error message to the user within 3 seconds.

## Assumptions

- The app uses a single paid tier ("Pro") at $12/mo. No multi-tier or annual pricing is needed for this feature.
- Stripe is already integrated in the codebase for payment processing. Existing checkout infrastructure will be reused/extended.
- Authentication uses next-auth with an existing sign-in flow. The sign-in callback URL mechanism supports return-to-purchase redirects.
- The Figma design at node 272:2 (Frame 31 / Account page mockup) represents the canonical pricing card design to be used across both pages.
- Pro plan status detection logic already exists or can be derived from the user's subscription/payment status in the database.
- The Pricing page will use the marketing layout (not behind the app sidebar layout).
- The Dashboard is the main authenticated landing page where users land after purchase.

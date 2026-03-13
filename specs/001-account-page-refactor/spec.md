# Feature Specification: Account Page Refactor

**Feature Branch**: `001-account-page-refactor`
**Created**: 2026-03-13
**Status**: Draft
**Input**: Refactor Account page to match Figma design with two-column layout, reusable CTA/upgrade component, and sign out button

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Account Overview in Two-Column Layout (Priority: P1)

A signed-in user navigates to the Account page and sees a clean two-column layout: their account information on the left and an upgrade CTA on the right. The left card displays their email, current plan with status badge, and connected channels. The page title reads "Manage your account" with a descriptive subtitle.

**Why this priority**: This is the core experience — users must be able to view their account details in the new layout. Without this, the page serves no purpose.

**Independent Test**: Can be fully tested by navigating to /account as a signed-in user and verifying that email, plan, and channel information display correctly in a left-side card alongside the right-side CTA.

**Acceptance Scenarios**:

1. **Given** a signed-in user on any plan, **When** they navigate to the Account page, **Then** they see a page title "Manage your account", a left card with their email/plan/channels, and a right card with the upgrade CTA.
2. **Given** a signed-in user with a Free plan, **When** they view the left card, **Then** they see "Free" with an "Active" status badge next to their plan.
3. **Given** a signed-in user with connected channels, **When** they view the left card, **Then** each connected channel displays its name, YouTube URL, and a settings/manage icon.

---

### User Story 2 - See Upgrade CTA on Account Page (Priority: P1)

A free-tier user sees the reusable upgrade/pricing CTA on the right side of the Account page. The CTA shows a gradient header with "Upgrade to Pro!", a list of Pro features with check icons, pricing information, and a purchase/upgrade button. This is the same CTA component used on the Pricing page and other upgrade surfaces.

**Why this priority**: The upgrade CTA on the Account page is a key conversion surface. Reusing the shared component ensures consistency and avoids duplication.

**Independent Test**: Can be tested by navigating to /account as a free-tier user and verifying the right-side CTA displays with the correct content, feature list, pricing, and a working purchase button.

**Acceptance Scenarios**:

1. **Given** a free-tier user, **When** they view the Account page, **Then** the right card displays the "Upgrade to Pro!" CTA with a gradient header, feature checklist, pricing, and purchase button.
2. **Given** a Pro user, **When** they view the Account page, **Then** the right card reflects their current Pro status appropriately (e.g., shows current plan confirmation or manage subscription instead of upgrade prompt).
3. **Given** any user, **When** they view the Account page CTA, **Then** it renders the same shared CTA component used on other upgrade surfaces — not a one-off implementation.

---

### User Story 3 - Sign Out from Account Page (Priority: P2)

A signed-in user can sign out from the Account page. The sign out button is positioned below the two-column card layout and feels intentional within the overall page design.

**Why this priority**: Sign out is essential functionality that must be preserved from the current page, but it is secondary to the main layout and content goals of this refactor.

**Independent Test**: Can be tested by clicking the sign out button on the Account page and verifying the user is signed out and redirected appropriately.

**Acceptance Scenarios**:

1. **Given** a signed-in user on the Account page, **When** they click the sign out button below the two cards, **Then** they are signed out and redirected to the landing/login page.
2. **Given** a signed-in user, **When** they view the Account page, **Then** the sign out button is visible below the main two-column content area and styled consistently with the app's button patterns.

---

### User Story 4 - Add a Channel from Account Page (Priority: P3)

A user can initiate adding a new YouTube channel from the Account page. The left card includes an "Add Channel" outlined button below the channel list.

**Why this priority**: Channel management is a secondary action on this page. The primary goal is displaying existing account info and the upgrade CTA.

**Independent Test**: Can be tested by clicking the "Add Channel" button and verifying it initiates the channel connection flow.

**Acceptance Scenarios**:

1. **Given** a signed-in user on the Account page, **When** they click "Add Channel", **Then** the channel connection/addition flow is initiated.

---

### Edge Cases

- What happens when a user has no connected channels? The channels section should show an empty state or just the "Add Channel" button.
- What happens when a user is already on the Pro plan? The right-side CTA should reflect their current subscription status rather than prompting an upgrade.
- What happens on narrow/mobile viewports? The two-column layout should stack vertically (left card on top, right card below) to remain usable.
- What happens if the user's session expires while on the Account page? Standard auth redirect behavior should apply.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Account page MUST display a two-column layout with account information on the left and the upgrade CTA on the right, matching the Figma reference design.
- **FR-002**: The left card MUST display the user's email address, current plan with active status badge, and list of connected channels with names and YouTube URLs.
- **FR-003**: The right card MUST use the shared/reusable CTA/pricing/upgrade component — the same architecture used on the Pricing page.
- **FR-004**: The right-side CTA MUST display a gradient header, "Upgrade to Pro!" title, feature checklist with check icons, pricing, and a purchase/upgrade button for non-Pro users.
- **FR-005**: A sign out button MUST be present below the two-column card layout, styled consistently with existing button patterns.
- **FR-006**: The left card MUST include an "Add Channel" outlined button below the channel list.
- **FR-007**: Each connected channel row MUST display the channel name (bold), YouTube URL, and a settings/manage icon.
- **FR-008**: The page MUST preserve all meaningful existing account functionality from the current implementation during the refactor.
- **FR-009**: The two-column layout MUST be responsive — stacking vertically on narrow viewports.
- **FR-010**: The right-side CTA component MUST adapt its display based on the user's subscription status (upgrade prompt for free users, plan confirmation for Pro users) via props/configuration, not a separate component.

### Key Entities

- **User Account**: The signed-in user's profile — email, subscription plan, active status.
- **Subscription Plan**: The user's current plan (Free or Pro), including status and associated features.
- **Connected Channel**: A YouTube channel linked to the user's account — channel name, YouTube URL, and management actions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The Account page layout matches the Figma reference with two equal-width cards side by side, consistent spacing, and proper visual hierarchy.
- **SC-002**: The upgrade CTA on the Account page is rendered by the same shared component used on the Pricing page — no duplicate CTA implementations exist.
- **SC-003**: All existing account functionality (view email, view plan, view channels, sign out) remains functional after the refactor.
- **SC-004**: The page renders correctly on viewports from 768px to 1920px wide without layout breakage.
- **SC-005**: Users can complete the sign out action from the Account page in under 2 clicks.

## Assumptions

- The existing reusable CTA/pricing/upgrade component from the Pricing page work is available and can accept props to adapt for the Account page context.
- The current Account page already has sign out functionality that can be preserved.
- Channel data (name, URL) is available from the existing data layer (Prisma/session).
- The Figma design's color tokens (#222a68 primary, #e8eafb border, #f3f4fb background) align with existing app design tokens or can be mapped to them.
- "Add Channel" triggers an existing channel connection flow rather than requiring new functionality.

## Figma Reference

- **File**: `FBUmzpPK0YTx1KpkaaMwth`
- **Node**: `272:2`
- **URL**: https://www.figma.com/design/FBUmzpPK0YTx1KpkaaMwth/channelboost?node-id=272-2&m=dev

### Key Design Details from Figma

- **Page title**: "Manage your account" (26px bold, #222a68) with subtitle (15px medium)
- **Left card**: White background, 1px #e8eafb border, 20px border-radius, subtle box-shadow. Contains "Overview" heading, Email/Plan/Channels sections.
- **Right card**: White background, 2px #222a68 border, 20px border-radius, subtle box-shadow. Gradient header (pink-to-blue, ~167deg), feature list with check icons, pricing, purchase button.
- **Plan badge**: "Active" pill with #f3f4fb background, 20px border-radius
- **Add Channel button**: Outlined, 1px #3e457b border, 8px border-radius
- **Purchase button**: Solid #222a68 background, white text, 8px border-radius
- **Card dimensions**: Both cards ~545px wide, ~486px tall, with ~20px gap between them
- **Sign out button**: Below the two-column card area

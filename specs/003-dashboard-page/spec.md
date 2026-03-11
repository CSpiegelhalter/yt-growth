# Feature Specification: Dashboard Page

**Feature Branch**: `003-dashboard-page`
**Created**: 2026-03-09
**Status**: Draft
**Input**: User description: "Build Dashboard page with overview chart, video suggestions panel, SEO-safe auth prompt, and sitemap updates per Figma design"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Logged-in Creator Views Dashboard (Priority: P1)

A logged-in creator navigates to the app and lands on the Dashboard as the first page. They see a two-panel layout: an overview chart on the left showing their channel performance, and a Video Suggestions panel on the right with personalized video ideas. The Dashboard gives them an at-a-glance summary of how their channel is doing and what to create next.

**Why this priority**: The Dashboard is the primary entry point for the entire app. It combines the creator's most important signals — channel health and next-action suggestions — into a single view. Without this, creators must navigate between separate pages to get oriented.

**Independent Test**: Can be fully tested by logging in, verifying the Dashboard loads as the first nav item, displaying channel overview data and 4 suggestion cards (1 explainer + 3 video ideas).

**Acceptance Scenarios**:

1. **Given** a logged-in creator with an active channel, **When** they open the app, **Then** the Dashboard is the first page in the sidebar and displays the overview chart and Video Suggestions panel side by side.
2. **Given** a logged-in creator on the Dashboard, **When** the page loads, **Then** the overview chart shows their channel performance metrics for the default period.
3. **Given** a logged-in creator on the Dashboard, **When** the page loads, **Then** the Video Suggestions panel shows 1 "Our suggestion engine" explainer card followed by 3 personalized video idea cards.

---

### User Story 2 - Creator Interacts with Video Idea Cards (Priority: P1)

A creator sees 3 video idea cards on the Dashboard. Each card represents a tailored suggestion based on their profile, recent videos, and trending data. Each card has 3 actions: "Use this idea," "Save for later," and "Not a fit." The creator can act on each idea directly from the Dashboard.

**Why this priority**: The suggestion cards are the core value proposition of the Dashboard. Without actionable ideas, the page is just a passive analytics view. The actions make the suggestions useful and create engagement loops.

**Independent Test**: Can be tested by verifying that 3 video idea cards render with meaningful content, and that each card's 3 action buttons trigger the expected behavior (e.g., navigating to idea creation, saving to bookmarks, dismissing).

**Acceptance Scenarios**:

1. **Given** a creator viewing the Dashboard, **When** they see a video idea card, **Then** it displays a title, brief description, and 3 action icons (Use this idea, Save for later, Not a fit).
2. **Given** a creator viewing a video idea card, **When** they click "Use this idea," **Then** the idea is forwarded to the idea creation flow for further development.
3. **Given** a creator viewing a video idea card, **When** they click "Save for later," **Then** the idea is saved to their bookmarks/saved ideas for future reference.
4. **Given** a creator viewing a video idea card, **When** they click "Not a fit," **Then** the idea is dismissed and visually removed or marked as dismissed.

---

### User Story 3 - Logged-out User Sees Dashboard with Sign-in Prompt (Priority: P2)

A logged-out user or search crawler visits the Dashboard page. The page renders with placeholder/demo content and a non-blocking sign-in/sign-up prompt overlay or banner. The page is fully indexable by search engines and does not redirect away. The sign-in prompt is a reusable component that can be used on other pages.

**Why this priority**: SEO discoverability and a frictionless logged-out experience are important for growth, but secondary to the core logged-in experience. The reusable auth prompt component has value beyond this page.

**Independent Test**: Can be tested by visiting the Dashboard URL while logged out, verifying the page renders (not redirected), checking that a sign-in/sign-up prompt is visible but non-blocking, and validating the page source is crawlable.

**Acceptance Scenarios**:

1. **Given** a logged-out user, **When** they visit the Dashboard URL, **Then** the page renders with visible content (not a blank page or redirect).
2. **Given** a logged-out user on the Dashboard, **When** the page loads, **Then** a sign-in/sign-up prompt is visible but does not block page content from rendering.
3. **Given** a search engine crawler, **When** it accesses the Dashboard URL, **Then** the page is indexable with meaningful content in the HTML.

---

### User Story 4 - Dashboard Appears in Navigation as First Item (Priority: P2)

The Dashboard is added as the first item in the left sidebar navigation, above all existing items (Videos, Ideas, Goals, etc.). The navigation ordering is clean and consistent across desktop and mobile views.

**Why this priority**: Navigation placement determines discoverability. Making Dashboard first ensures creators see it as the primary landing experience.

**Independent Test**: Can be tested by logging in and verifying the sidebar shows "Dashboard" as the first nav item on both desktop and mobile.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they view the sidebar, **Then** "Dashboard" appears as the first navigation item above "Videos."
2. **Given** a mobile user, **When** they open the navigation drawer, **Then** "Dashboard" appears first in the list.

---

### User Story 5 - Dashboard Is Discoverable by Search Engines and AI Agents (Priority: P3)

The Dashboard page is included in the sitemap, allowed in robots.txt, and referenced in llm.txt so that search engines and AI agents can discover and index it.

**Why this priority**: SEO and AI discoverability support long-term growth but are lower priority than core functionality.

**Independent Test**: Can be tested by checking robots.txt allows the Dashboard path, sitemap.xml includes the Dashboard URL, and llm.txt references it.

**Acceptance Scenarios**:

1. **Given** the robots.txt, **When** a crawler checks permissions, **Then** the Dashboard path is not disallowed.
2. **Given** the sitemap.xml, **When** a search engine fetches it, **Then** the Dashboard URL is listed with appropriate priority.
3. **Given** the llm.txt, **When** an AI agent fetches it, **Then** the Dashboard is referenced as a key app page.

---

### Edge Cases

- What happens when the creator has no channel connected yet? The Dashboard should show an empty/onboarding state for the overview chart and generic (non-personalized) suggestion cards.
- What happens when suggestion generation fails or returns no results? The Dashboard should show a graceful fallback (e.g., "We're generating ideas for you" or static placeholder cards).
- What happens when the overview data API is slow or unavailable? The overview chart should show a loading skeleton, then an error state with retry if the request fails.
- What happens on narrow screens? The two-panel layout should stack vertically (overview on top, suggestions below) for mobile viewports.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST render the Dashboard as the default first page in the app sidebar navigation, above all existing items.
- **FR-002**: System MUST display a channel overview chart on the left side of the Dashboard, reusing the existing overview analytics functionality.
- **FR-003**: System MUST display a Video Suggestions panel on the right side of the Dashboard containing exactly 4 cards: 1 "Our suggestion engine" explainer card and 3 video idea cards.
- **FR-004**: The "Our suggestion engine" card MUST briefly explain the suggestion feature in concise copy, visually consistent with the idea cards in height rhythm.
- **FR-005**: Each video idea card MUST display a title, brief description, and 3 action buttons: "Use this idea," "Save for later," and "Not a fit."
- **FR-006**: The "Use this idea" action MUST forward the idea to the existing idea creation flow.
- **FR-007**: The "Save for later" action MUST persist the idea to the user's saved ideas.
- **FR-008**: The "Not a fit" action MUST persistently dismiss the idea so it does not resurface on future page loads.
- **FR-009**: Video idea generation MUST draw from available creator context: user profile data, recent videos, trending data, and any other creator signals available in the codebase.
- **FR-010**: The suggestion architecture MUST be extensible so that additional input sources can be added without rewriting the feature.
- **FR-016**: System MUST maintain exactly 3 active video ideas at all times. When an idea is dismissed or used, a replacement MUST be generated immediately to backfill the slot.
- **FR-011**: System MUST render the Dashboard page at `/dashboard` as a standalone route (outside the authenticated app route group), accessible to both logged-in and logged-out users without redirecting or blocking.
- **FR-012**: System MUST display a reusable, non-blocking sign-in/sign-up prompt for logged-out users that can be used on other pages.
- **FR-013**: The Dashboard page MUST be included in sitemap.xml, allowed in robots.txt, and referenced in llm.txt.
- **FR-014**: The Dashboard layout MUST match the Figma design, including spacing, iconography, and card layout, as inspected via the Figma MCP server.
- **FR-015**: The overview chart panel MUST be refactored/extracted from the existing implementation so it can be shared between the Videos page and the Dashboard without code duplication.

### Key Entities

- **VideoIdea**: A persisted suggested video concept with a title, description, source signals (what data informed it), and status (active, saved, dismissed). Stored in the database when generated; dismissed ideas do not resurface.
- **SuggestionContext**: The aggregated creator context used as input for idea generation — includes profile data, recent video data, trending data, and extensible metadata slots.
- **IdeaAction**: An interaction taken on a video idea card (use, save, dismiss) with associated timestamp and user reference. Persisted durably across sessions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Logged-in creators see the Dashboard as the first page within 2 seconds of app load.
- **SC-002**: The Dashboard displays 4 suggestion cards (1 explainer + 3 ideas) on every page load for creators with connected channels.
- **SC-003**: Each video idea card's 3 actions (use, save, dismiss) successfully complete their intended operation on first click.
- **SC-004**: Logged-out users can view the Dashboard page without being redirected, and the page renders meaningful content within 3 seconds.
- **SC-005**: The Dashboard page appears in sitemap.xml and is not blocked by robots.txt.
- **SC-006**: The reusable auth prompt component can be dropped into any page with no more than a single component import.
- **SC-007**: The overview chart panel is shared between Dashboard and Videos page with no duplicated rendering logic.

## Clarifications

### Session 2026-03-09

- Q: What URL path should the Dashboard live at? → A: `/dashboard` — standalone route outside the `(app)` group, accessible to both logged-in and logged-out users.
- Q: Are video idea suggestions persisted or generated on-the-fly? → A: Persisted — ideas are generated and stored in the database. Save/dismiss actions are durable across sessions, and dismissed ideas do not resurface.
- Q: When should new ideas be generated to replace dismissed/used ones? → A: Immediately backfill — when an idea is dismissed or used, a replacement is generated so the Dashboard always shows exactly 3 active ideas.

## Assumptions

- The existing overview panel API (`/api/me/channels/{channelId}/overview`) will continue to serve the data needed for the Dashboard overview chart without modification.
- The existing saved ideas functionality can be reused for the "Save for later" action on video idea cards.
- Video idea generation will initially use a deterministic or LLM-based approach leveraging data already available in the codebase (profile, videos, trends), without requiring new external API integrations.
- The Figma design at the referenced node provides sufficient detail for layout, spacing, iconography, and card design.
- The "Use this idea" action will navigate to or pre-fill the existing idea creation flow rather than creating a new standalone flow.

## Dependencies

- Figma MCP server access for design inspection during implementation.
- Existing overview panel and its API endpoint.
- Existing saved ideas feature for the "Save for later" action.
- Existing idea creation flow for the "Use this idea" action.

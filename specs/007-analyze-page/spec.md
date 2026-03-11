# Feature Specification: Analyze Page

**Feature Branch**: `007-analyze-page`
**Created**: 2026-03-10
**Status**: Draft
**Input**: User description: "Build a new Analyze page with two-state same-page flow for YouTube video analysis"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Submit a Video URL for Analysis (Priority: P1)

A user navigates to the Analyzer page, pastes a YouTube video URL into the input field, and clicks "Analyze." The page transitions from the input state to a loading state, then to the analyzed results view — all on the same page without navigation.

**Why this priority**: This is the core interaction loop. Without it, the page has no function.

**Independent Test**: Can be fully tested by pasting a valid YouTube URL, clicking Analyze, and verifying the page switches to show analysis results with a back button.

**Acceptance Scenarios**:

1. **Given** the user is on the Analyzer page in the input state, **When** they paste a valid YouTube URL and click "Analyze," **Then** the page shows a loading indicator and transitions to the analyzed results view on the same page.
2. **Given** the user is on the Analyzer page, **When** they paste an invalid URL and click "Analyze," **Then** the page displays a clear error message and remains in the input state.
3. **Given** the user is on the Analyzer page, **When** they submit a URL for a video that cannot be analyzed (private, deleted, etc.), **Then** the page displays an appropriate error message.

---

### User Story 2 - View Actionable Analysis Results (Priority: P1)

After analysis completes, the user sees a results view containing the video thumbnail, title, stats (views, likes, comments, publish date), and multiple collapsible report sections — all framed around what the user can learn and apply to their own channel.

**Why this priority**: The results view is the primary value delivery. Users come to this page to get actionable intelligence.

**Independent Test**: Can be tested by analyzing any public YouTube video and verifying all expected sections appear with actionable framing (e.g., "how you can improve" language, not just raw data).

**Acceptance Scenarios**:

1. **Given** analysis has completed, **When** the results view loads, **Then** the user sees the video thumbnail, title, publish date, view count, like count, and comment count.
2. **Given** analysis has completed, **When** the user scrolls through the results, **Then** they see report sections including "Ways to Outperform," "What's Driving Performance," and "Portable Patterns" — each framed as guidance for the user's own channel.
3. **Given** a report section is displayed, **When** the user clicks the section header, **Then** the section collapses or expands (matching the existing collapsible behavior on the Videos page).

---

### User Story 3 - Navigate Back to Input State (Priority: P1)

After viewing results, the user clicks a back button to return to the input state so they can analyze a different video.

**Why this priority**: Essential for the two-state same-page model. Without back navigation, the user must reload the page.

**Independent Test**: Can be tested by analyzing a video, clicking the back button, and verifying the input state reappears with an empty or pre-filled URL field.

**Acceptance Scenarios**:

1. **Given** the user is viewing analysis results, **When** they click the back button, **Then** the page transitions back to the input state.
2. **Given** the user returned to the input state, **When** they paste a new URL and click "Analyze," **Then** a new analysis is performed and new results are displayed.

---

### User Story 4 - View Truncated Comment Analysis (Priority: P2)

The results view includes a comment analysis section that shows top comments and sentiment data. Comments are truncated so they remain readable without dominating the page layout.

**Why this priority**: Comment analysis adds significant value but is secondary to the core report sections. Truncation is important for page density and scannability.

**Independent Test**: Can be tested by analyzing a video with comments and verifying comments are displayed in a truncated, readable format with sentiment context.

**Acceptance Scenarios**:

1. **Given** analysis results are displayed for a video with comments, **When** the user views the comment analysis section, **Then** individual comments are truncated to a readable preview length with a visual indicator that more text exists.
2. **Given** a truncated comment is displayed, **When** the user wants to see the full text, **Then** they can expand the comment to read it in full.
3. **Given** a video has no comments or comments are unavailable, **When** the results load, **Then** the comment section displays an appropriate empty/unavailable state.

---

### User Story 5 - Receive Search & Keyword Enrichment Guidance (Priority: P3)

Where available, the analysis is enriched with search demand context, keyword opportunity data, and topic trend signals from external data sources. This enrichment helps the user understand what content opportunities exist around the analyzed video's topic.

**Why this priority**: Enrichment adds depth but is supplementary. The page must be fully functional without it — enrichment data should enhance, not gate, the experience.

**Independent Test**: Can be tested by analyzing a video on a popular topic and verifying that search/keyword context appears where relevant, or that the page degrades gracefully when enrichment data is unavailable.

**Acceptance Scenarios**:

1. **Given** enrichment data is available for the analyzed video's topic, **When** results are displayed, **Then** the user sees contextual guidance such as keyword opportunities, related search demand, or trending angles they could pursue.
2. **Given** enrichment data is unavailable or the API fails, **When** results are displayed, **Then** the page functions normally without enrichment — no errors, no empty enrichment sections.

---

### Edge Cases

- What happens when the user pastes a YouTube Shorts URL? (Should be handled the same as a regular video URL.)
- What happens when the user pastes a playlist URL? (Should show an error: "Please paste a single video URL, not a playlist.")
- What happens when analysis takes longer than expected? (Loading state should persist with no timeout for at least 60 seconds before showing a timeout message.)
- What happens when the user's session expires mid-analysis? (Should redirect to login or show a session-expired message.)
- What happens when the analyzed video has no transcript available? (Report sections that depend on transcript should show a graceful fallback message, not break the page.)
- What happens when the user navigates away and comes back via browser history? (The page should return to the input state — analysis results are not persisted in the URL.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a single-page Analyzer experience with two visual states: input state and results state.
- **FR-002**: System MUST accept a YouTube video URL in the input state and validate it before submission (youtube.com, youtu.be, m.youtube.com domains).
- **FR-003**: System MUST display a loading/analyzing indicator after the user submits a valid URL.
- **FR-004**: System MUST transition to the results state on the same page after analysis completes — no route navigation.
- **FR-005**: System MUST display a back button in the results state that returns the user to the input state.
- **FR-006**: Results MUST include: video thumbnail, video title, publish date, view count, like count, and comment count.
- **FR-007**: Results MUST include collapsible report sections for "Ways to Outperform," "What's Driving Performance," and "Portable Patterns."
- **FR-008**: Collapsible sections MUST behave consistently with the existing collapsible report sections on the Videos page.
- **FR-009**: Results MUST include a comment analysis section with truncated comment previews.
- **FR-010**: Truncated comments MUST be expandable so the user can read the full text.
- **FR-011**: All report sections MUST be framed around actionable guidance for the user's own channel — not just raw analysis of the target video.
- **FR-012**: System MUST display clear, specific error messages for invalid URLs, failed analyses, and unavailable data.
- **FR-013**: System SHOULD enrich analysis with search demand, keyword opportunity, and topic trend data from external sources where available.
- **FR-014**: Enrichment data MUST be optional — the page MUST function fully without it, with no visible errors or empty sections if enrichment fails.
- **FR-015**: The Analyzer page MUST reuse existing analysis, report, and collapsible components from the competitor/video analysis experience where applicable — not duplicate them.

### Key Entities

- **Analyzed Video**: The target YouTube video submitted by the user — includes metadata (title, thumbnail URL, publish date, stats) and analysis results (report sections, comment analysis, enrichment data).
- **Report Section**: A collapsible unit of analysis (e.g., "Ways to Outperform") containing actionable guidance text, optional keyword chips, and optional CTA buttons.
- **Comment Analysis**: A collection of top comments with sentiment data, truncated for display, expandable for full reading.
- **Enrichment Context**: Optional search/keyword/trend data from external sources that augments the base analysis with opportunity signals.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can submit a YouTube URL and see analysis results within the same page in under 30 seconds for typical videos.
- **SC-002**: 100% of report sections are collapsible and expand/collapse consistently with existing Videos page behavior.
- **SC-003**: Truncated comments display no more than 3 lines of text by default, with a clear expand affordance.
- **SC-004**: The back button returns the user to the input state in under 1 second with no page reload.
- **SC-005**: All analysis text is framed as actionable guidance (uses "you/your" language, suggests next steps, compares to user's channel where possible).
- **SC-006**: The page degrades gracefully when enrichment data, transcript, or comments are unavailable — no broken UI, no empty labeled sections.
- **SC-007**: Zero new duplicate analysis/report components — existing patterns are reused or refactored.

## Assumptions

- The Analyzer page requires authentication (it lives within the authenticated app shell, not the marketing site).
- The existing competitor video analysis logic can be adapted to work for arbitrary video URLs (not just pre-registered competitor videos).
- Comment truncation uses a line-clamp approach (3 lines) rather than character count, for consistent visual density across varying comment lengths.
- The nav item for this page is labeled "Analyzer" and appears in the sidebar navigation.
- Enrichment via DataForSEO (keyword research, trends, competitive context) is prioritized over SerpAPI (which is currently used only for transcript extraction and will continue in that role).
- Analysis results are ephemeral — not persisted to the database in this version. Saved analyses may be added in a future iteration.

## Design References

- **Input State**: [Figma node 221:365](https://www.figma.com/design/FBUmzpPK0YTx1KpkaaMwth/channelboost?node-id=221-365&m=dev) — White card centered on page with "Enter Video Information" heading, URL label, text input (placeholder: "youtube.com/v=..."), and action button. Card has rounded corners, subtle shadow, and border.
- **Analyzed Results View**: [Figma node 117:162](https://www.figma.com/design/FBUmzpPK0YTx1KpkaaMwth/channelboost?node-id=117-162&m=dev) — Full-width white content area with video thumbnail+stats header, followed by vertically stacked collapsible sections. Expanded sections show a rotated chevron icon, body text with actionable guidance, keyword chips with "Add" buttons, and CTA action buttons. Collapsed sections show a right-facing chevron and section title only.

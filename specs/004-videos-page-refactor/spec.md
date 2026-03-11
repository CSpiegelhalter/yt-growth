# Feature Specification: Videos Page Refactor

**Feature Branch**: `004-videos-page-refactor`
**Created**: 2026-03-10
**Status**: Draft
**Input**: Refactor Videos page into Published and Planned tabs matching Figma designs, preserving existing analysis functionality and adding AI-assisted idea generation.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Published Videos and View Analysis (Priority: P1)

A creator navigates to the Videos page and sees the Published tab selected by default. The left panel shows a scrollable list of their published videos (thumbnail icon, title, publish date, view count). Clicking a video highlights it with a pink border and loads the existing video analysis experience in the right panel, including metric pills, insights, and the "Get the full report" button. The full report streaming flow works exactly as it does today.

**Why this priority**: This is the existing core functionality. Preserving it without regression is the highest priority since creators already depend on it daily.

**Independent Test**: Can be fully tested by navigating to Videos, clicking a published video, and verifying the analysis panel renders with metrics, insights, and full report access.

**Acceptance Scenarios**:

1. **Given** a creator with published videos, **When** they navigate to /videos, **Then** the Published tab is active by default and their videos appear in the left list ordered by publish date (newest first).
2. **Given** the Published tab is active, **When** the user clicks a video in the list, **Then** the right panel shows the video's title, thumbnail with duration overlay, stats (posted date, views, likes, comments), metric pills ("Going well" / "Needs work"), and the "Get the full report" button.
3. **Given** a selected video in the Published tab, **When** the user clicks "Get the full report", **Then** the streaming full report loads with all existing sections (video audit, discoverability, retention, reach, hook analysis).
4. **Given** no video is selected, **When** the Published tab is active, **Then** the right panel shows the channel overview (chart + metric pills + actionable insights).

---

### User Story 2 - Switch Between Published and Planned Tabs (Priority: P1)

A creator clicks the tab toggle at the top of the left panel to switch between Published and Planned views. The toggle uses a pill-style design with the active tab having a dark navy background (#222a68) and white text, while the inactive tab has a light background (#f3f4fb) with muted text (30% opacity).

**Why this priority**: Tab switching is the navigational backbone of the refactored page. Without it, the Planned experience is unreachable.

**Independent Test**: Can be tested by clicking between tabs and verifying the left and right panels update accordingly.

**Acceptance Scenarios**:

1. **Given** the Videos page is loaded, **When** the user clicks "Planned", **Then** the left panel switches to show the planned ideas list and the right panel shows the appropriate content (empty state or selected idea editor).
2. **Given** the Planned tab is active, **When** the user clicks "Published", **Then** the left panel returns to the published video list and the right panel shows the overview or last-selected video.
3. **Given** a tab switch occurs, **When** switching back, **Then** the previous selection state within each tab is preserved (e.g., selected video remains selected).

---

### User Story 3 - Start a New Video Idea (Priority: P2)

On the Planned tab, the top of the left panel features a prominent "Start a new idea" card with a plus icon and helper text. Clicking it opens the idea editor in the right panel, titled "New Video Draft" with a "Discard" link at the top right. A "Create faster with help" info banner with a sparkle icon appears at the top of the form, encouraging AI assistance.

**Why this priority**: Creating new ideas is the primary action for the Planned tab and the gateway to the AI-assisted workflow.

**Independent Test**: Can be tested by clicking "Start a new idea", verifying the editor loads, filling in fields, and saving.

**Acceptance Scenarios**:

1. **Given** the Planned tab is active, **When** the user clicks "Start a new idea", **Then** the right panel shows the "New Video Draft" form with all fields: Quick video summary (150 char limit with counter), Video Title, Script (multi-line), Description, Tags, and Post date.
2. **Given** the new idea form is open, **When** the user fills in a summary and title and clicks "Save Idea", **Then** the idea is persisted and appears in the left panel's idea list.
3. **Given** the new idea form is open, **When** the user clicks "Discard", **Then** the form is cleared and the right panel returns to the empty state or last-selected idea.
4. **Given** the new idea form is open, **When** the user types in Quick video summary, **Then** a character counter shows current/150 and prevents exceeding the limit.

---

### User Story 4 - View and Edit an Existing Planned Idea (Priority: P2)

The left panel lists saved ideas with their title and "Planned for MM/DD" date. Clicking an idea opens the editor in the right panel pre-filled with all saved field values, allowing the user to modify any field and re-save.

**Why this priority**: Creators need to iterate on ideas over time. Viewing and editing saved ideas is essential for the workshopping workflow.

**Independent Test**: Can be tested by creating an idea, clicking it in the list, modifying a field, and saving to verify changes persist.

**Acceptance Scenarios**:

1. **Given** the Planned tab with saved ideas, **When** the user clicks an idea in the list, **Then** the right panel shows the editor pre-filled with the idea's saved field values.
2. **Given** an idea is open for editing, **When** the user modifies a field and saves, **Then** the changes are persisted and the list item updates to reflect any title change.
3. **Given** the planned ideas list, **When** there are no saved ideas, **Then** a thoughtful empty state message appears below the "Start a new idea" card.

---

### User Story 5 - AI-Assisted Field Generation (Priority: P3)

Each editable field in the idea editor (except Quick video summary) has a "Suggest" button with a sparkle icon. Clicking "Suggest" triggers AI generation for that specific field, using the creator's channel context, past video performance, trending topics, and any content already entered in other fields. The result populates the field, which the user can then edit further.

**Why this priority**: AI generation differentiates this from a simple note-taking form and delivers real value, but the manual editing flow must work first.

**Independent Test**: Can be tested by entering a summary, clicking "Suggest" on Video Title, and verifying a contextually relevant title appears in the field.

**Acceptance Scenarios**:

1. **Given** an idea form with summary text entered, **When** the user clicks "Suggest" on Video Title, **Then** the system generates a title using available context signals and populates the field.
2. **Given** a "Suggest" action is in progress, **When** generation is running, **Then** the Suggest button shows a loading indicator and the field is not editable until generation completes.
3. **Given** AI generation completes, **When** the field is populated, **Then** the user can freely edit the generated content before saving.
4. **Given** AI generation fails, **When** an error occurs, **Then** the user sees an inline error message near the field with the option to retry.
5. **Given** multiple fields need generation, **When** the creator wants all fields filled, **Then** the "Create faster with help" banner or a future "Generate All" action can trigger bulk generation.

---

### User Story 6 - Mobile Responsive Experience (Priority: P3)

On mobile, the split panel layout collapses to show either the left panel (list) or the right panel (detail/editor), with a back button to return to the list. Tab switching remains accessible. The experience mirrors the existing mobile pattern already implemented in the SplitPanel component.

**Why this priority**: Mobile responsiveness is important but can leverage the existing SplitPanel responsive behavior with minimal changes.

**Independent Test**: Can be tested by resizing the browser to mobile width and verifying single-panel display with back navigation.

**Acceptance Scenarios**:

1. **Given** a mobile viewport, **When** the user selects a video or idea, **Then** only the right panel is visible with a back button to return to the list.
2. **Given** a mobile viewport with the list visible, **When** the user switches tabs, **Then** the list updates to the selected tab's content.

---

### Edge Cases

- What happens when the user has no published videos? The Published tab shows an empty state encouraging them to connect their channel or publish their first video.
- What happens when the user has no planned ideas? The Planned tab shows only the "Start a new idea" card with an empty state message below it.
- What happens when the user navigates away while editing an unsaved idea? Unsaved changes are lost; no unsaved-changes guard for MVP (can be added later).
- What happens when AI generation is slow or times out? Show a loading state on the Suggest button; after 30 seconds, show a timeout message with retry option.
- What happens when the user clicks "Start a new idea" while already editing an unsaved idea? The form resets to a blank state; no confirmation dialog for MVP.
- What happens when saved ideas exceed the visible area? The left panel scrolls independently with a fade gradient at the bottom (matching Figma).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a pill-style tab toggle (Published / Planned) at the top of the left panel.
- **FR-002**: Published tab MUST be the default active tab on page load.
- **FR-003**: Published tab left panel MUST show the user's videos as cards with thumbnail icon, title, publish date, and view count, ordered by publish date descending.
- **FR-004**: Published tab MUST preserve the existing video analysis right panel experience (metric pills, insights, full report) without behavioral regressions.
- **FR-005**: Published tab right panel MUST show the channel overview when no video is selected.
- **FR-006**: Planned tab left panel MUST show a "Start a new idea" card at the top, followed by a scrollable list of saved ideas.
- **FR-007**: Each saved idea card MUST display the idea title and planned post date (formatted as "Planned for MM/DD").
- **FR-008**: The idea editor right panel MUST include fields: Quick video summary (150 char limit with counter), Video Title, Script (multi-line textarea), Description, Tags, and Post date.
- **FR-009**: Each editor field (except summary) MUST have a "Suggest" button that triggers AI-assisted generation for that field.
- **FR-010**: The "Suggest" action MUST use available context signals (past videos, channel context, trending topics) to generate field content.
- **FR-011**: System MUST persist saved ideas with all field values, supporting create, read, and update operations.
- **FR-012**: The idea editor MUST show a "Save Idea" button and a "Discard" link.
- **FR-013**: The left panel MUST show a bottom fade gradient when content overflows.
- **FR-014**: Selected items in either tab MUST have a visible selected state (pink/magenta border per Figma: #ca1f7b).
- **FR-015**: The "Start a new idea" card MUST show a plus icon and descriptive helper text.
- **FR-016**: The right panel MUST show a "Create faster with help" info banner with sparkle icon when starting a new idea.

### Key Entities

- **VideoIdea**: A planned/workshopped video concept. Key attributes: summary (max 150 chars), title, script, description, tags (list), planned post date, status, creation date, last modified date. Belongs to a channel and user.
- **GenerationContext**: The assembled context signals (past videos, channel info, trends, competitor data) used as input for AI field generation. Extensible to include new signal sources over time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can switch between Published and Planned tabs in under 200ms perceived transition time.
- **SC-002**: All existing video analysis functionality (metric pills, insights, full report streaming) works identically after refactor with zero behavioral regressions.
- **SC-003**: Users can create, save, and re-edit a planned video idea within a single session.
- **SC-004**: AI field suggestion returns a result within 10 seconds for any individual field.
- **SC-005**: The Videos page layout matches the Figma design specifications for both tabs (spacing, proportions, card structure, typography hierarchy).
- **SC-006**: The page renders correctly on both desktop (>=768px) and mobile viewports.

## Assumptions

- The existing SplitPanel layout component can be extended to support tab-switching without a full rewrite.
- The existing VideoSuggestion Prisma model and suggestions infrastructure can be adapted or extended for planned ideas, rather than creating an entirely new model from scratch.
- AI generation for individual fields will reuse the existing OpenAI integration, with a prompt structure that accepts assembled context and a target field.
- The Fustat font referenced in Figma is mapped to the project's existing font stack.
- No offline/draft auto-save is needed for MVP; ideas are only persisted on explicit "Save Idea" action.
- Tags are stored as a list (JSON array or comma-separated); no tag autocomplete or taxonomy needed for MVP.
- Post date is a simple date input, not a full scheduling/publishing system.
- The "Create faster with help" banner is informational only for MVP; a "Generate All" bulk action is a future enhancement.

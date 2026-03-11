# Feature Specification: Creator Profile Builder

**Feature Branch**: `006-creator-profile`
**Created**: 2026-03-10
**Status**: Draft
**Input**: Refactor Profile page into a multi-tab creator intelligence form for strategic creator-profile building with progressive save, competitors/inspiration capture, and LLM-prompt-ready data collection.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fill Out Channel Identity & Content Strategy (Priority: P1)

A creator navigates to the Profile page and sees a multi-tab form organized by strategic topic. They start on the "Overview" tab, which captures channel identity basics — what their channel is about, what topics they cover, what they want to be known for, and their content style preferences. They fill out fields progressively, and each field auto-saves on blur/change so nothing is lost.

**Why this priority**: The identity and content strategy data is the foundation for all downstream LLM prompt enrichment. Without it, idea generation, title suggestions, and script guidance have no creator context.

**Independent Test**: Navigate to Profile, fill out 3-4 fields on the Overview tab, refresh the page, and confirm all data persists.

**Acceptance Scenarios**:

1. **Given** a logged-in creator with a connected channel, **When** they navigate to Profile, **Then** they see a multi-tab form with the "Overview" tab active by default, containing channel identity and content strategy questions.
2. **Given** a creator filling out a text field, **When** they blur the field or stop typing for ~1.5s, **Then** the field auto-saves and a brief "Saved" indicator appears.
3. **Given** a creator who has previously filled out some fields, **When** they return to Profile, **Then** all previously saved data is pre-populated.

---

### User Story 2 - Define New Idea Guidance Preferences (Priority: P1)

A creator switches to the "New idea guidance" tab and answers targeted questions that tell our system what kinds of video ideas to generate. Questions cover topics they want to lean into, topics to avoid, content formats they prefer, and what their ideal video looks like. Some questions have a "Suggest" button that will later trigger AI-assisted suggestions.

**Why this priority**: Idea generation is the most frequent AI-powered feature. These answers directly shape prompt inputs for video idea pipelines.

**Independent Test**: Switch to the "New idea guidance" tab, fill out all fields, refresh, and confirm persistence. Verify the "Suggest" button is present (even if non-functional initially).

**Acceptance Scenarios**:

1. **Given** a creator on the Profile page, **When** they click the "New idea guidance" tab, **Then** they see questions about video topics, content preferences, and idea direction.
2. **Given** a question with a "Suggest" button, **When** the creator clicks "Suggest", **Then** the system shows a placeholder or future-ready interaction (non-blocking for MVP).
3. **Given** a creator filling out a textarea field, **When** they type and pause, **Then** the content auto-saves.

---

### User Story 3 - Add Competitors & Inspiration (Priority: P1)

A creator switches to the "Competitors" tab and adds channels they're inspired by at different levels: channels close to their size, aspirational channels, and niche heroes. For each, they provide a YouTube channel URL and describe what they admire. The system displays added competitors as card tiles.

**Why this priority**: Competitor data enables competitor-aware recommendations, differentiation suggestions, and positioning guidance — all high-value AI outputs.

**Independent Test**: Go to the Competitors tab, add 2 competitor URLs with descriptions, refresh, and verify they persist and display as cards.

**Acceptance Scenarios**:

1. **Given** a creator on the Competitors tab, **When** they see the form, **Then** there are sections for "Inspired by (close to your size)", "Inspired by (aspirational)", and "Niche hero" with URL inputs and description areas.
2. **Given** a creator entering a YouTube channel URL, **When** they submit it, **Then** the competitor is saved and appears as a card tile with the channel name.
3. **Given** multiple competitors added, **When** the creator views the section, **Then** competitors display as horizontal card tiles (up to 3 per row) with channel name and category label.

---

### User Story 4 - Configure Script, Tag & Description Guidance (Priority: P2)

A creator fills out the "Script guidance", "Tag guidance", and "Description guidance" tabs with preferences that shape how our AI generates scripts, tags, and descriptions. These capture tone, structure preferences, keyword focus, and stylistic choices.

**Why this priority**: These are secondary prompt enrichment layers. They refine AI output quality but are less critical than the core identity and idea data.

**Independent Test**: Fill out fields on each of the three guidance tabs, refresh, confirm persistence.

**Acceptance Scenarios**:

1. **Given** a creator on "Script guidance", **When** they fill out tone/structure preferences, **Then** the data auto-saves.
2. **Given** a creator on "Tag guidance", **When** they specify keyword focus areas and tag style, **Then** the data auto-saves.
3. **Given** a creator on "Description guidance", **When** they set description format preferences, **Then** the data auto-saves.

---

### User Story 5 - View Section Completeness Hints (Priority: P3)

A creator sees an info banner at the top of each tab section that encourages them to complete the section. The banner explains why completing these fields matters for better AI suggestions. This is a precursor to full profile completeness scoring.

**Why this priority**: Drives higher form completion rates. The data structure supports future completeness scoring, but the full scoring system is out of scope.

**Independent Test**: Visit each tab and verify the info banner is displayed with contextual messaging. Dismiss the banner and verify it doesn't reappear.

**Acceptance Scenarios**:

1. **Given** a creator viewing any tab, **When** the section has unfilled fields, **Then** an info banner appears saying "These sections are important to complete" with a brief explanation of why.
2. **Given** a creator dismissing the banner, **When** they click the close icon, **Then** the banner hides and stays hidden for that tab.

---

### Edge Cases

- What happens when the user has no connected channel? Profile should still be accessible but show a prompt to connect a channel first for channel-specific questions.
- What happens when the API save fails? Show an inline error and retry automatically on next blur. Do not lose the user's typed content.
- What happens when fields contain very long text? Apply reasonable max-length limits (e.g., 2000 chars for textareas, 500 for single-line inputs).
- What happens when the user pastes an invalid YouTube URL in the competitors section? Show inline validation feedback.
- What happens on slow connections? The auto-save should debounce properly and show a saving indicator so the user knows their data is being persisted.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the Profile page as a multi-tab form with tabs: Overview, New idea guidance, Script guidance, Tag guidance, Description guidance, Competitors.
- **FR-002**: System MUST auto-save each field when the user blurs or after a debounce period (~1.5s of inactivity), with a visual "Saved" indicator.
- **FR-003**: System MUST pre-populate all fields with previously saved data on page load.
- **FR-004**: System MUST store creator profile data in a structured JSON format on the Channel model, organized by section/tab for easy completeness scoring.
- **FR-005**: System MUST provide a "Suggest" affordance next to applicable questions (initially non-functional or placeholder, ready for future AI integration).
- **FR-006**: System MUST validate YouTube channel URLs in the Competitors tab before saving.
- **FR-007**: System MUST display competitors as horizontal card tiles showing channel name and category.
- **FR-008**: System MUST show a dismissible info banner at the top of each tab encouraging completion.
- **FR-009**: System MUST match the Figma design for layout: page title + subtitle at top, vertical tab list on left side of content area, white rounded card container for active tab content.
- **FR-010**: System MUST support both single-line text inputs and multi-line textareas depending on the question type.
- **FR-011**: System MUST group profile data by section so future completeness scoring can calculate progress per tab.
- **FR-012**: System MUST gracefully handle save failures with inline error messages and automatic retry on next interaction.

### Key Entities

- **CreatorProfile**: A structured JSON object stored on the Channel, containing sections: `overview`, `ideaGuidance`, `scriptGuidance`, `tagGuidance`, `descriptionGuidance`, `competitors`. Each section contains keyed question-answer pairs. This structure enables per-section completeness scoring and targeted LLM prompt assembly.
- **Competitor Entry**: A sub-entity within the competitors section containing: `channelUrl`, `channelName`, `category` (close-to-size | aspirational | niche-hero), `whatYouAdmire` (free text), and optional `whatToAvoid` (free text).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Creators can complete any single profile tab in under 5 minutes.
- **SC-002**: 100% of filled fields persist across page refreshes without data loss.
- **SC-003**: Auto-save triggers within 2 seconds of user stopping input, with visible confirmation.
- **SC-004**: Profile data is structured so that any section's completeness percentage can be calculated by counting filled vs. total fields in that section.
- **SC-005**: At least 3 competitor entries can be stored per category (close-to-size, aspirational, niche-hero).
- **SC-006**: The profile page layout matches the Figma reference designs for tab navigation, card container, question layout, input styling, and competitor card tiles.
- **SC-007**: All stored profile answers are directly usable as LLM prompt context without transformation — field names and values are self-descriptive and prompt-ready.

## Assumptions

- The existing Channel model in Prisma can accommodate a JSON field for storing creator profile data (no schema migration needed if using an existing JSON column, or a single new JSON column added).
- The "Suggest" buttons are rendered as UI affordances for future AI integration; they do not need to be functional for the initial release.
- The tab structure follows the Figma design exactly: Overview, New idea guidance, Script guidance, Tag guidance, Description guidance, Competitors.
- Progressive save uses the existing API pattern (PATCH to a channel endpoint) rather than introducing new infrastructure.
- The info banner dismiss state can be stored in localStorage rather than the database.

## Question Strategy per Tab

### Overview Tab
1. **Channel description** (textarea): "In 2-3 sentences, describe what your channel is about and who it's for."
2. **Core topics** (tag input): "What are the main topics you cover or want to cover?"
3. **Known for** (text): "What do you want your channel to be known for?"
4. **Content style mix** (multi-select chips): "What best describes your content style?" — Options: Educational, Entertaining, Opinion/Commentary, Storytelling, Tutorial, Review, Documentary, Vlog, News/Updates.
5. **Creator strengths** (multi-select chips): "What are your biggest strengths as a creator?" — Options: On-camera presence, Editing, Storytelling, Research, Humor, Teaching, Visual design, Writing, Interviewing.

### New Idea Guidance Tab
1. **Topics to lean into** (textarea): "What topics do you want to make more videos about? Be specific."
2. **Topics to avoid** (textarea): "What topics or content types do you NOT want to make?"
3. **Ideal video description** (textarea): "Describe your ideal video — what does it look like, feel like, and accomplish?"
4. **Content format preferences** (multi-select chips): "What video formats work best for you?" — Options: Long-form, Shorts, List/Ranking, How-to, Deep dive, Reaction, Challenge, Interview, Behind-the-scenes.
5. **Viewer feeling** (text): "What should viewers feel after watching your content?"

### Script Guidance Tab
1. **Tone** (select): "What tone should scripts use?" — Options: Casual & conversational, Professional & authoritative, Energetic & enthusiastic, Calm & thoughtful, Humorous & witty, Direct & no-nonsense.
2. **Script structure preference** (textarea): "How do you like to structure your videos? (e.g., hook > story > lesson > CTA)"
3. **Phrases or style notes** (textarea): "Any catchphrases, recurring segments, or stylistic notes our AI should know about?"
4. **Things to never include** (textarea): "Anything scripts should never contain? (e.g., clickbait, profanity, specific phrases)"

### Tag Guidance Tab
1. **Primary keywords** (tag input): "What keywords are most important for your channel's discoverability?"
2. **Niche terms** (tag input): "Any niche-specific terms or jargon your audience searches for?"
3. **Tag style preference** (select): "How specific should tags be?" — Options: Broad & general, Niche & specific, Mix of both.

### Description Guidance Tab
1. **Description format** (textarea): "How do you like your video descriptions structured? (e.g., summary > timestamps > links > social)"
2. **Standard links/CTAs** (textarea): "What links, calls-to-action, or standard text should appear in every description?"
3. **SEO priority** (select): "How important is SEO in your descriptions?" — Options: Very important (keyword-rich), Moderate (natural with some keywords), Minimal (conversational, no keyword focus).

### Competitors Tab
1. **Close-to-size inspiration** (repeatable entry): "Who inspires you that's close to your channel size?" — Channel URL + "What do you admire about their content?" (textarea)
2. **Aspirational inspiration** (repeatable entry): "Who inspires you at a larger scale?" — Channel URL + "What do you want to emulate from them?" (textarea)
3. **Niche hero** (repeatable entry): "Who is the top creator in your niche?" — Channel URL + "What makes them the best in this space?" (textarea)
4. **Differentiation** (textarea): "What should make your channel clearly different from all of them?"

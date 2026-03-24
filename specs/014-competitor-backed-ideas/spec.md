# Feature Specification: Competitor-Backed Ideas

**Feature Branch**: `014-competitor-backed-ideas`
**Created**: 2026-03-23
**Status**: Draft
**Input**: Refactor competitor intelligence into the engine behind the video ideas workflow — shifting from generic AI suggestions and disconnected competitor pages to competitor-backed, evidence-grounded idea generation with source provenance and a cohesive discover → adapt → plan workflow.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Competitor-Backed Dashboard Suggestions (Priority: P1)

A creator opens their dashboard and sees video idea suggestions. Instead of generic AI brainstorming, each suggestion is grounded in real competitor signals — showing what's working in their niche, why it's performing, and how the creator could adapt it for their own channel. The suggestion cards display source evidence: the competitor video(s) that inspired the idea, the pattern observed, and a suggested angle for adaptation.

**Why this priority**: This is the core value shift. Without competitor-backed suggestions on the dashboard, the product still feels like generic AI brainstorming. This single change transforms the sticky sell from "AI ideas" to "intelligence-backed strategy."

**Independent Test**: Can be fully tested by loading the dashboard for a channel that has competitor data available — suggestions should display source evidence (competitor video titles, channels, patterns) rather than just title + description.

**Acceptance Scenarios**:

1. **Given** a creator with a channel profile and competitor data in their niche, **When** they view the dashboard, **Then** suggestion cards show: title, description, source competitor video(s), observed pattern, why it's performing, and a suggested adaptation angle.
2. **Given** a creator whose niche has no competitor data yet, **When** they view the dashboard, **Then** the system falls back to profile-based suggestions (current behavior) with a prompt to run competitor research to unlock richer ideas.
3. **Given** a suggestion card with source evidence, **When** the creator reads the card, **Then** they can clearly distinguish what came from competitor intelligence vs. what is the AI's recommended adaptation.

---

### User Story 2 - Source-Preserving Idea Actions (Priority: P1)

When a creator acts on a suggestion — "Use this idea," "Save for later," or "Not a fit" — the source provenance travels with it. If they choose "Use this idea," a planned idea is created that retains the originating competitor video(s), channel(s), detected pattern, rationale, and adaptation notes. Saved ideas also preserve this context. Dismissed ideas optionally inform future filtering.

**Why this priority**: Without provenance preservation, the competitor-backed suggestions lose their value the moment the user acts on them. The planned idea editor becomes a dead-end that forgets where the idea came from.

**Independent Test**: Can be tested by clicking "Use this idea" on a competitor-backed suggestion and verifying the resulting planned idea retains all source metadata (visible in the idea editor).

**Acceptance Scenarios**:

1. **Given** a competitor-backed suggestion, **When** the creator clicks "Use this idea," **Then** a new planned idea is created with source competitor video IDs, channel IDs, detected pattern, performance rationale, and adaptation notes preserved.
2. **Given** a competitor-backed suggestion, **When** the creator clicks "Save for later," **Then** the saved suggestion retains all source/provenance data for later retrieval.
3. **Given** a planned idea with source provenance, **When** the creator opens it in the idea editor, **Then** the source context is visible (not hidden in raw JSON) — they can see which competitor videos inspired this idea.

---

### User Story 3 - View Source / Analyze Source Workflow (Priority: P2)

From any idea card (dashboard suggestion or planned idea), a creator can inspect the source competitor video(s) behind it. They can view the source video's key stats and analysis, then open a deeper analysis using the existing competitor video analysis system. This connects ideas back to their evidence and lets creators go deeper before committing.

**Why this priority**: This bridges competitor intelligence and idea generation into one connected flow. Without it, ideas feel like claims without evidence.

**Independent Test**: Can be tested by clicking "View source" on an idea card, verifying it shows the source competitor video details, and then clicking through to the full competitor video analysis page.

**Acceptance Scenarios**:

1. **Given** an idea card with one or more source competitor videos, **When** the creator clicks "View source," **Then** a panel or modal displays the source video(s) with title, thumbnail, key stats (views, views/day, engagement), and the observed pattern.
2. **Given** the source view is open, **When** the creator clicks "Analyze source," **Then** they are taken to the existing competitor video analysis view for that video (reusing the current deep-dive system).
3. **Given** an idea card with no source competitor videos (profile-only suggestion), **When** the creator views the card, **Then** the "View source" option is absent or shows "Generated from your channel profile" instead.

---

### User Story 4 - Make My Version Flow (Priority: P2)

After viewing or analyzing a source competitor video, the creator can click "Make my version" to create a new planned idea pre-populated with adaptation context. The new idea includes the source video reference, the observed pattern, and a suggested angle — giving the creator a head start on workshopping their own take.

**Why this priority**: This completes the discover → analyze → adapt loop. Without it, creators see what's working but have no guided path to turn that insight into their own content plan.

**Independent Test**: Can be tested by navigating to a competitor video analysis, clicking "Make my version," and verifying a new planned idea is created with source context and adaptation guidance pre-filled.

**Acceptance Scenarios**:

1. **Given** a creator is viewing a competitor video analysis, **When** they click "Make my version," **Then** a new planned idea is created with: source video reference, source channel, detected pattern, and a suggested adaptation angle pre-filled in the summary/notes.
2. **Given** the new idea is created from "Make my version," **When** the creator opens the idea editor, **Then** all source provenance is visible and the AI field suggestions (title, script, description, tags) use the source context to generate more targeted outputs.
3. **Given** a creator triggers "Make my version" from a suggestion card's source view, **When** the idea is created, **Then** it behaves identically to triggering it from the competitor video analysis page.

---

### User Story 5 - Competitor-Backed Idea Generation on Demand (Priority: P2)

A creator can intentionally trigger idea generation from competitor signals — e.g., "Find ideas from my niche" or "Generate ideas from what's working right now." The system combines competitor video data, channel profile, and available signals to produce a batch of grounded suggestions. This replaces or augments the current auto-generation flow with an explicit, user-initiated path.

**Why this priority**: The auto-generated dashboard suggestions cover passive discovery. This covers active exploration — when a creator sits down to brainstorm and wants competitor-intelligence-backed ideas on demand.

**Independent Test**: Can be tested by triggering on-demand generation and verifying the returned ideas include source competitor references and are meaningfully different from generic AI suggestions.

**Acceptance Scenarios**:

1. **Given** a creator with competitor data in their niche, **When** they trigger on-demand idea generation from the dashboard or planned ideas tab, **Then** the system returns ideas backed by specific competitor videos with source evidence for each.
2. **Given** the generation is triggered, **When** ideas are returned, **Then** each idea includes: title, description, source video(s), observed pattern, performance rationale, and suggested adaptation — matching the structure of dashboard suggestions.
3. **Given** a creator with no competitor data, **When** they trigger on-demand generation, **Then** the system prompts them to run a competitor search first or falls back to profile-based generation with a note explaining richer ideas require competitor data.

---

### User Story 6 - De-emphasize Standalone Competitor Search (Priority: P3)

The competitor search page shifts from being a primary standalone destination to a supporting utility. The primary path to competitor insights flows through dashboard ideas, planned ideas, and the "View source / Analyze source" workflows. The competitor search functionality is preserved for power users and direct access, but it is no longer the main entry point for competitor intelligence.

**Why this priority**: This is a navigation/UX de-emphasis, not a functional removal. The core value is already delivered by P1/P2 stories. This story ensures the product feels like one connected system rather than disconnected pages.

**Independent Test**: Can be tested by verifying the competitor search page still works but is accessed as a utility (e.g., from a secondary nav position or from within the ideas flow) rather than as a primary navigation destination.

**Acceptance Scenarios**:

1. **Given** the refactored product, **When** a creator navigates the primary interface, **Then** competitor intelligence surfaces primarily through idea suggestions, source views, and analysis links — not through a standalone "Competitors" nav item.
2. **Given** a creator needs to run a fresh competitor search, **When** they look for the search functionality, **Then** it remains accessible (e.g., via the Analyzer page, a secondary menu, or a link within the ideas flow) but is not the primary navigation path.
3. **Given** the existing competitor search and analysis components, **When** this story is implemented, **Then** all reusable components are preserved intact — only routing and navigation emphasis changes.

---

### Edge Cases

- What happens when a competitor video referenced by an idea is deleted or becomes unavailable on YouTube? The idea should retain its stored metadata (title, stats snapshot) and gracefully indicate the source video is no longer available rather than breaking.
- What happens when a creator has no channel profile set up? Competitor-backed generation requires at least a niche signal. The system should prompt the creator to complete their channel profile before generating competitor-backed ideas, falling back to a helpful empty state.
- What happens when competitor data is stale (e.g., weeks old)? Ideas should display when the source data was captured. A freshness indicator or "refresh" option could be added in a future iteration.
- What happens when a creator dismisses all suggestions? The system should generate a new batch. Dismissal metadata (source video, pattern) is stored for future filtering but does not actively influence generation in this iteration.
- What happens when a planned idea's source context is very large (many source videos)? The UI should handle 1-5 source videos gracefully, with a "show more" pattern if needed. The data model should support an arbitrary number.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The suggestion generation system MUST incorporate competitor video data (titles, performance metrics, patterns) alongside channel profile context when generating dashboard suggestions.
- **FR-002**: Each generated suggestion MUST include structured source provenance: source competitor video ID(s), source channel ID(s), observed pattern description, performance rationale, and suggested adaptation angle.
- **FR-003**: Suggestion cards on the dashboard MUST visually surface source evidence — at minimum: source video title(s), source channel name(s), and the observed pattern.
- **FR-004**: The "Use this idea" action MUST create a planned idea that retains all source provenance metadata from the originating suggestion.
- **FR-005**: The "Save for later" action MUST preserve all source provenance metadata on the saved suggestion.
- **FR-006**: Planned ideas MUST support storing and displaying source provenance: originating competitor video(s), channel(s), detected pattern, performance rationale, and adaptation notes.
- **FR-007**: Idea cards (both suggestions and planned ideas) MUST support a "View source" interaction that shows the source competitor video(s) with title, thumbnail, key stats, and the observed pattern.
- **FR-008**: From the source view, users MUST be able to navigate to the full competitor video analysis (reusing the existing analysis system).
- **FR-009**: A "Make my version" action MUST be available from source views and competitor video analysis pages, creating a new planned idea with source context pre-populated.
- **FR-010**: Users MUST be able to trigger on-demand competitor-backed idea generation, producing ideas grounded in competitor signals for their niche.
- **FR-011**: When competitor data is unavailable for a channel's niche, the system MUST fall back gracefully to profile-based suggestion generation and communicate the limitation to the user.
- **FR-012**: The suggestion generation prompt MUST be refactored to accept competitor video data as input and produce source-attributed ideas as output. Competitor data MUST be sourced from cached prior search results (CompetitorVideo records and cached search responses) — no live YouTube API calls during generation.
- **FR-013**: The existing competitor search and video analysis functionality MUST remain operational and accessible, even if de-emphasized in navigation.
- **FR-014**: AI-assisted field suggestions (title, script, description, tags) for planned ideas with source provenance MUST use the source context to produce more targeted outputs.
- **FR-015**: The idea data model MUST be extensible to support future enrichments: multiple source videos per idea, confidence scores, freshness signals, watchlist triggers, and scheduling.
- **FR-016**: When a suggestion is dismissed ("Not a fit"), the system MUST store dismissal metadata (source video IDs, pattern) alongside the dismissed status for future filtering use, but MUST NOT actively filter future suggestions based on dismissals in this iteration.

### Key Entities

- **VideoSuggestion (extended)**: A system-generated idea suggestion. Existing entity extended with structured source provenance — source competitor video references, observed patterns, performance rationale, and adaptation angle. Currently stores flat sourceContext; needs structured competitor-backed fields.
- **VideoIdea (extended)**: A user's planned/workshopped video concept. Extended to retain source provenance when created from a competitor-backed suggestion or "Make my version" action. Currently has no provenance fields.
- **SourceProvenance (new concept)**: The structured evidence behind an idea — which competitor videos inspired it, from which channels, what pattern was detected, why it's performing, and how to adapt it. Embedded within suggestions and ideas rather than stored as a separate entity.
- **CompetitorVideo (existing)**: A competitor's video with cached analysis. Already exists; now also serves as the source reference for idea provenance.
- **ChannelProfile (existing)**: The creator's channel context. Already used for suggestion generation; continues to serve as the user-context half of the generation input alongside competitor signals.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 80% or more of dashboard suggestions display at least one source competitor video reference (for channels with competitor data available).
- **SC-002**: When a user clicks "Use this idea," the resulting planned idea retains all source provenance fields — verifiable by opening the idea and confirming source video(s), pattern, and rationale are visible.
- **SC-003**: Users can navigate from an idea card to the source competitor video analysis in 2 clicks or fewer (View source → Analyze source).
- **SC-004**: Users can go from a competitor video analysis to a new planned idea with source context in 1 click ("Make my version").
- **SC-005**: On-demand idea generation returns ideas with source evidence within 15 seconds for a niche with existing competitor data.
- **SC-006**: The existing competitor search and video analysis pages remain fully functional after the refactor — no regressions in competitor intelligence capabilities.
- **SC-007**: Creators report that ideas feel more credible and actionable compared to generic suggestions (qualitative — validated via user feedback).
- **SC-008**: The complete workflow (see idea → view source → analyze → make my version → workshop in editor) is completable end-to-end without leaving the app or losing context.

## Clarifications

### Session 2026-03-23

- Q: Should suggestion generation use cached competitor data or trigger fresh searches? → A: Use cached competitor data only (from prior searches). No live YouTube API calls during generation.
- Q: Where should on-demand competitor-backed idea generation be triggered? → A: Both dashboard and planned ideas tab.
- Q: Should "Not a fit" dismissals actively filter future suggestions? → A: Store dismissal metadata (source video, pattern) but do not actively filter yet. Preserve data for future filtering.

## Assumptions

- Competitor video data is available for most active niches through the existing competitor search system. If a niche has no competitor data, the system gracefully degrades to profile-based suggestions.
- The existing `CompetitorVideo` records (with cached analysis) can serve as source references for idea provenance without requiring additional YouTube API calls at suggestion-display time — stored metadata (title, stats, analysis) is sufficient.
- Source provenance is stored as structured JSON within existing tables (VideoSuggestion.sourceContext, VideoIdea fields) rather than as a separate relational entity, keeping the architecture simple and extensible.
- The LLM prompt for suggestion generation can be refactored to accept competitor video data as context and produce source-attributed outputs without a fundamental change in the generation pipeline architecture.
- Navigation changes (de-emphasizing competitor search) are limited to sidebar/menu positioning — no routes or pages are removed, preserving deep links and existing user flows.

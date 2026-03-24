# Feature Specification: Competitor Engine Refactor

**Feature Branch**: `015-competitor-engine-refactor`
**Created**: 2026-03-23
**Status**: Draft
**Input**: Refactor ChannelBoost so competitor intelligence becomes an invisible engine behind ideas, analysis, and planning — not a separate destination users have to figure out on their own.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Evidence-Backed Dashboard Ideas (Priority: P1)

A creator opens the Dashboard and sees 3 actionable video ideas. Each idea card shows a title, short summary, compact source evidence (e.g. "Inspired by [video title] by [creator] — 450K views"), a one-line explanation of why it works, and a one-line adaptation angle for their channel. The user can act immediately: "Use this idea", "Save for later", "Not a fit", or "View source". Ideas feel grounded and trustworthy without requiring any prior competitor setup.

**Why this priority**: The Dashboard is the primary discovery surface. If this doesn't work, nothing else matters. Users must feel the app understands their niche and gives them actionable, evidence-backed ideas on every visit.

**Independent Test**: Can be tested by loading the Dashboard with a user who has profile data. Verify 3 idea cards render with title, summary, evidence strip, why-it-works line, adaptation angle, and all 4 action buttons.

**Acceptance Scenarios**:

1. **Given** a user with a completed profile and saved competitors, **When** they open the Dashboard, **Then** they see exactly 3 idea cards with title, summary, compact evidence strip, why-it-works sentence, your-angle sentence, and action buttons (Use this idea, Save for later, Not a fit, View source).
2. **Given** a user with a completed profile but no saved competitors, **When** they open the Dashboard, **Then** they see 3 profile-based idea cards (evidence strip may be absent or show "Based on your niche" instead of a specific source).
3. **Given** a free-tier user, **When** they view idea cards, **Then** they see 2-3 usable ideas with light evidence and a subtle CTA to unlock deeper competitor-backed insights — no aggressive banners or popups.
4. **Given** a Pro user, **When** they view idea cards, **Then** they see full evidence including source video title, creator name, and performance metrics, plus all actions including View source.

---

### User Story 2 - Inline Assisted Competitor Discovery (Priority: P1)

When a user has weak or missing competitor context, the Dashboard shows a compact inline discovery step inside the suggestions area: "Want smarter ideas? We found channels in your niche. Pick up to 3 to power better suggestions." Candidate channels appear as small selectable cards showing channel name, niche match, size range, and match reason. The user can select, refresh matches, or search manually as a secondary action. After selection, competitors disappear into the engine and power all future suggestions silently.

**Why this priority**: Without competitor context, the engine can't produce its best ideas. Discovery must happen inline, not on a separate page — otherwise users never complete setup.

**Independent Test**: Can be tested by creating a user with profile data but no saved competitors. Load Dashboard and verify the inline discovery prompt appears with candidate channels.

**Acceptance Scenarios**:

1. **Given** a user with profile data but no saved competitors, **When** they open the Dashboard, **Then** the suggestions area shows a compact inline competitor discovery step with auto-suggested candidate channels.
2. **Given** the inline discovery is shown, **When** the user selects 1-3 channels and confirms, **Then** those channels are saved as competitors, the discovery prompt disappears, and new competitor-backed ideas begin generating.
3. **Given** the inline discovery is shown, **When** the user clicks "Refresh matches", **Then** new candidate channels are suggested.
4. **Given** the inline discovery is shown, **When** the user clicks "Search manually", **Then** they can search for and add a specific channel without leaving the Dashboard.
5. **Given** a user who already has saved competitors, **When** they open the Dashboard, **Then** no discovery prompt is shown — competitors silently power the suggestions.

---

### User Story 3 - View Source Side Panel (Priority: P2)

When a user clicks "View source" on an idea card, a lightweight side panel or modal opens without navigating away. It shows the source video thumbnail, title, channel name, performance metrics (views, velocity, engagement signal), and 3 concise bullets: why it likely worked, what pattern it used, and what the user could borrow. Actions at the bottom: "Analyze source" (opens deeper analysis) and "Make my version" (creates a planned idea).

**Why this priority**: View source is the key trust-building interaction. Users need to quickly verify the evidence behind an idea without losing context. This is the bridge between discovery and action.

**Independent Test**: Can be tested by clicking "View source" on any idea card with source provenance. Verify the panel opens in-context with the expected content and actions.

**Acceptance Scenarios**:

1. **Given** a Pro user viewing an idea card with source provenance, **When** they click "View source", **Then** a side panel opens showing thumbnail, title, channel, metrics, and 3 insight bullets without navigating away from the Dashboard.
2. **Given** the source panel is open, **When** the user clicks "Make my version", **Then** a planned idea is created with pre-filled title, summary, tags, adaptation notes, and source provenance — and they're taken to the idea editor.
3. **Given** the source panel is open, **When** the user clicks "Analyze source", **Then** the deeper analysis flow opens for that video.
4. **Given** a free-tier user, **When** they click "View source", **Then** they see a preview of the source panel with key details blurred/locked and a subtle CTA to upgrade.

---

### User Story 4 - Make My Version to Planned Idea with Provenance (Priority: P2)

When a user clicks "Make my version" (from a source panel, idea card, or analysis page), the system creates a planned idea pre-filled with: title draft, summary, tags, description, adaptation notes, and full source provenance (source video, source channel, detected pattern/theme, why it was suggested). The user lands in the idea editor with all context intact. The provenance is permanently stored — it never disappears when the idea is saved or edited.

**Why this priority**: Converting insight to action is the core value loop. Without provenance persistence, saved ideas become dead text notes and lose the context that made them valuable.

**Independent Test**: Can be tested by clicking "Make my version" from any surface. Verify the planned idea is created with all pre-filled fields and that source provenance is visible in the idea editor and persists after saving.

**Acceptance Scenarios**:

1. **Given** a user clicks "Make my version" from the source panel, **When** the planned idea is created, **Then** it contains pre-filled title, summary, tags, description, adaptation notes, and source metadata (video title, channel, pattern, rationale).
2. **Given** a planned idea with source provenance, **When** the user edits and saves the idea, **Then** the source provenance is retained and visible in the idea detail view.
3. **Given** a planned idea with source provenance, **When** the user views the idea later, **Then** they can see where it came from (source video, channel, pattern) and why it was suggested.

---

### User Story 5 - Analyze Page Integration (Priority: P2)

The Analyze page feeds the same competitor-backed system. When a user analyzes a source video (from View source or directly), the analysis emphasizes actionable insights: ways to outperform, portable patterns, title patterns, audience signals, comment themes, and remix/adaptation ideas — all framed around what THIS user should do. From the analysis page, the user can: save the source as a competitor signal, follow that creator / mark as inspiration, generate ideas from the detected pattern, or create a planned idea directly.

**Why this priority**: Analysis without action is a dead end. Connecting the Analyze page to the same engine ensures every research moment can convert into a planned idea or competitor signal.

**Independent Test**: Can be tested by navigating to the Analyze page for a video. Verify actionable analysis sections render and that "Save as inspiration", "Generate ideas from this", and "Make my version" actions work.

**Acceptance Scenarios**:

1. **Given** a user opens the analysis for a source video, **When** the analysis loads, **Then** it shows sections focused on the user's channel: ways to outperform, portable patterns, title patterns, audience signals, and adaptation ideas.
2. **Given** a user is on the analysis page, **When** they click "Save as inspiration", **Then** the source channel is saved to their competitor/inspiration list.
3. **Given** a user is on the analysis page, **When** they click "Make my version", **Then** a planned idea is created with provenance from the analyzed video.
4. **Given** a user is on the analysis page, **When** they click "Generate ideas from this pattern", **Then** new ideas are generated based on the detected pattern and added to their suggestions.

---

### User Story 6 - Secondary Competitor Management (Priority: P3)

Power users can manage their saved competitors from a secondary surface (within Profile or a dedicated settings section). They can view saved competitors, remove ones they no longer want, add competitors manually, refresh auto-suggested matches, and mark a competitor as "inspiration" vs "direct competitor". This surface is accessible but not prominent — it's for refinement, not for primary discovery.

**Why this priority**: Users need control over their competitor set, but this is a maintenance task, not a primary workflow. It should exist but not dominate.

**Independent Test**: Can be tested by navigating to the competitor management surface. Verify CRUD operations on saved competitors work correctly.

**Acceptance Scenarios**:

1. **Given** a user with saved competitors, **When** they navigate to competitor management, **Then** they see a list of their saved competitors with channel name, type (inspiration/direct), and options to remove or edit.
2. **Given** a user on the management surface, **When** they remove a competitor, **Then** it is removed from their saved set and future suggestions no longer use it.
3. **Given** a user on the management surface, **When** they click "Add competitor", **Then** they can search for and add a channel manually.
4. **Given** a user on the management surface, **When** they toggle a competitor between "inspiration" and "direct competitor", **Then** the system adjusts how it uses that channel in future suggestions.
5. **Given** a user on the management surface, **When** they click "Refresh suggestions", **Then** new auto-detected competitor candidates appear based on their current profile and activity.

---

### User Story 7 - Profile Seeding for Competitor Context (Priority: P3)

The Profile page collects competitor-relevant seed signals: who inspires the user, channels they admire, channels closest to what they want to become, what they want to do differently, and what size channels they want to compete with. This data feeds the discovery engine but is not the only source of truth — the engine continues enriching competitor context from dashboard interactions and analysis activity over time.

**Why this priority**: Profile seeding improves initial competitor suggestions, but the system must work even with partial profile data. This is a quality amplifier, not a gating requirement.

**Independent Test**: Can be tested by filling in profile competitor fields and verifying that subsequent competitor discovery suggestions improve in relevance.

**Acceptance Scenarios**:

1. **Given** a user is editing their profile, **When** they reach the competitor/inspiration section, **Then** they see fields for: channels that inspire them, channels closest to their goals, what they admire, what they'd do differently, and preferred competitor size range.
2. **Given** a user saves profile competitor data, **When** the discovery engine runs, **Then** auto-suggested competitors are more relevant to the user's stated preferences.
3. **Given** a user has no profile competitor data, **When** the discovery engine runs, **Then** it still suggests candidates based on the user's video titles, descriptions, and niche signals — profile data is optional, not required.

---

### User Story 8 - Free vs Pro Value-First Gating (Priority: P3)

Free-tier users see 2-3 usable ideas with light evidence that ideas are grounded in real data. Deeper competitor details (full source panel, analysis, make-my-version) are partially locked with subtle, desire-building CTAs like "See why these ideas are working" or "Unlock competitor-backed insights". Pro users get full evidence visibility, View source, Analyze source, Make my version, and richer provenance. No aggressive banners, popups, or stacked CTAs.

**Why this priority**: The gating model determines conversion. Getting this wrong (too aggressive or too generous) directly impacts revenue and user trust.

**Independent Test**: Can be tested by viewing the Dashboard as a free user and as a Pro user. Verify that free users see usable ideas with subtle upgrade prompts, and Pro users see full functionality.

**Acceptance Scenarios**:

1. **Given** a free-tier user, **When** they view the Dashboard, **Then** they see 2-3 usable idea cards with titles, summaries, and light evidence — no content is fully hidden.
2. **Given** a free-tier user, **When** they try to access View source or Make my version, **Then** they see a subtle inline CTA to upgrade — not a modal popup or aggressive banner.
3. **Given** a Pro user, **When** they view the Dashboard, **Then** they see full evidence, all actions, and complete source provenance on every idea card.
4. **Given** any user, **When** they view the Dashboard, **Then** there is at most one subtle upgrade CTA visible at a time — no stacked or competing CTAs.

---

### Edge Cases

- **No competitor matches available**: System shows profile-based ideas and a message like "We couldn't find strong matches yet — your ideas are based on your profile. Add competitors manually or check back later."
- **Competitor discovery fails (API/network error)**: Inline error with retry button — never silently fall back to profile-only when the user explicitly requested competitor-backed ideas.
- **User removes all saved competitors**: System gracefully degrades to profile-based ideas and re-shows the inline discovery prompt.
- **User is brand new with no profile data**: System shows generic starter ideas and guides the user to complete their profile for better suggestions.
- **Suggested competitors are too broad or too large**: Auto-detection logic prioritizes channels slightly ahead of the user and in the same niche; avoids giant celebrity channels unless topically relevant.
- **User changes their mind about a saved competitor**: Management surface supports removal and replacement at any time.
- **User marks a channel as inspiration but not a direct competitor**: System uses inspiration channels differently — for pattern detection but not for direct competitive positioning.
- **Partial profile data with weak discovery signals**: System does its best with available signals; does not block the experience waiting for complete data.
- **Explicit competitor-backed action fails**: Show clear inline error and retry path — do NOT silently downgrade to profile-only mode (fallbacks are for absent prerequisites, not for failed explicit actions).
- **Source video becomes unavailable**: Provenance metadata is retained even if the source video is deleted; "View source" shows a "Video no longer available" state rather than breaking.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST generate and display exactly 3 idea cards on the Dashboard, each with title, summary, evidence strip, why-it-works sentence, your-angle sentence, and action buttons.
- **FR-002**: System MUST auto-detect and suggest competitor candidates based on user profile signals, video titles/descriptions, topical overlap, audience intent overlap, and size banding (preferring direct peers and slightly-larger aspirational peers over giant outlier channels).
- **FR-003**: System MUST display inline competitor discovery on the Dashboard when the user has no saved competitors, allowing selection of up to 3 channels without leaving the page.
- **FR-004**: System MUST persist saved competitors and use them silently to power dashboard suggestions, analyze-page recommendations, and planned ideas — without requiring repeated user action.
- **FR-005**: System MUST provide a "View source" action that opens a side panel/modal showing source video thumbnail, title, channel, performance metrics, and 3 insight bullets, without navigating away from the current page.
- **FR-006**: System MUST provide a "Make my version" action that creates a planned idea pre-filled with title draft, summary, tags, description, adaptation notes, and source provenance.
- **FR-007**: System MUST permanently retain source provenance on planned ideas: source video, source channel, detected pattern/theme, adaptation notes, and why it was suggested.
- **FR-008**: System MUST integrate the Analyze page with the competitor engine, allowing users to save sources as competitor signals, generate ideas from detected patterns, and create planned ideas from analysis.
- **FR-009**: System MUST provide a secondary management surface for saved competitors with add, remove, edit type (inspiration/direct), refresh suggestions, and manual search capabilities.
- **FR-010**: System MUST collect competitor-relevant seed data on the Profile page (inspirations, aspirational channels, preferences) and feed it to the discovery engine without making it the sole source of truth.
- **FR-011**: System MUST differentiate Free vs Pro access: free users see 2-3 usable ideas with light evidence; Pro users see full evidence, View source, Analyze source, Make my version, and complete provenance.
- **FR-012**: System MUST show clear inline errors with retry options when an explicit competitor-backed action fails — never silently downgrade to profile-only fallback for failed explicit actions.
- **FR-013**: System MUST reuse and refactor existing suggestion generation, planned ideas, analyze page, and competitor search systems — not build parallel duplicate systems.
- **FR-014**: System MUST store competitor context in a way that supports future watchlist/alert functionality (saved competitors, source provenance, monitoring timestamps).

### Key Entities

- **SavedCompetitor**: A channel the user has selected or confirmed as relevant. Attributes: channel reference, type (inspiration/direct competitor), source of discovery (auto-suggested/manual/profile/analysis), date added, active status. Supports future watchlist fields.
- **CompetitorCandidate**: A system-suggested channel not yet confirmed by the user. Attributes: channel reference, match reason, match score, niche overlap signals, size metrics.
- **IdeaProvenance**: Source context attached to a video idea. Attributes: source video reference, source channel reference, detected pattern/theme, why suggested, adaptation rationale. Immutable once created.
- **VideoIdea** (extended): Existing planned idea entity, extended with an optional provenance reference linking back to the source evidence.
- **ChannelProfile** (extended): Existing profile entity, extended with competitor seed fields: inspirations, aspirational channels, competitor size preference, differentiation notes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users who engage with the Dashboard see evidence-backed idea cards on every visit — 100% of Dashboard loads for users with profile data show 3 idea cards with at minimum a title, summary, and action buttons.
- **SC-002**: At least 60% of users who see the inline competitor discovery prompt select at least one competitor within their first 3 Dashboard visits.
- **SC-003**: Users can go from seeing an idea to having a fully pre-filled planned idea in under 3 clicks (idea card → View source → Make my version, or idea card → Use this idea).
- **SC-004**: Source provenance is retained on 100% of planned ideas that originated from a competitor-backed suggestion — no provenance data is lost on save, edit, or status change.
- **SC-005**: Free-tier users see at most 1 subtle upgrade CTA on the Dashboard at any time — zero modal popups or stacked banners.
- **SC-006**: The product uses a single unified suggestion generation system — no parallel or duplicate idea generation pipelines exist after the refactor.
- **SC-007**: Users with saved competitors receive more relevant suggestions (measured by higher Use/Save rate and lower Not-a-fit rate) compared to users with profile-only context.
- **SC-008**: Competitor management actions (add, remove, edit type) complete successfully and reflect in next suggestion generation within one refresh cycle.

# Research: Competitor-Backed Ideas

**Branch**: `014-competitor-backed-ideas` | **Date**: 2026-03-23

## Decision 1: How to Source Competitor Videos for Suggestion Generation

**Decision**: Query cached search results from `YouTubeSearchCache` (kind=`"comp_search"`) using the channel's niche queries as lookup keys. Fall back to querying `CompetitorVideo` records by channelId if no cached search exists.

**Rationale**: The search cache already contains niche-filtered, stats-enriched `CompetitorVideoResult[]` with derived metrics (viewsPerDay, engagement). This is the richest pre-computed dataset. The `CompetitorVideo` table serves as a secondary source with analysisJson for deeper context. No live YouTube API calls needed — per clarification, cached data only.

**Alternatives considered**:
- Live search per generation: Rejected (slow, API-heavy, violates clarification).
- Query CompetitorVideo table only: Viable but lacks the curated niche-relevance of search results. Used as fallback.
- Store a separate "competitor pool" table: Over-engineering for this iteration.

## Decision 2: SourceProvenance Data Shape

**Decision**: Define a `SourceProvenance` TypeScript type stored as JSON in both `VideoSuggestion.sourceContext` (extend existing JSON shape) and a new `VideoIdea.sourceProvenanceJson` TEXT column. The shape is:

```typescript
type SourceProvenance = {
  sourceVideos: Array<{
    videoId: string;
    title: string;
    channelId: string;
    channelTitle: string;
    thumbnailUrl: string | null;
    stats: { viewCount: number; viewsPerDay: number };
    publishedAt: string;
  }>;
  pattern: string;           // What pattern was observed
  rationale: string;         // Why it's performing
  adaptationAngle: string;   // How to adapt for user's channel
};
```

**Rationale**: Embedding a snapshot of source video metadata (not just IDs) ensures provenance is self-contained — the idea card can render source evidence without additional DB lookups. The CompetitorVideo record may be updated or expire, but the provenance snapshot remains stable.

**Alternatives considered**:
- Store only videoIds and join at read time: Fragile — CompetitorVideo records can be updated/deleted. Requires extra queries on every idea read.
- Separate SourceProvenance relational table: Over-engineering for JSON-shaped, read-heavy data that doesn't need relational queries.
- Extend existing `sourceContext` field only: VideoSuggestion already has sourceContext, but VideoIdea has nothing. Need a new field on VideoIdea regardless.

## Decision 3: VideoIdea Schema Extension

**Decision**: Add a single `sourceProvenanceJson` TEXT column to the `VideoIdea` Prisma model. Nullable (null = no provenance, e.g., manually created ideas). Parsed as `SourceProvenance | null` in application code.

**Rationale**: Matches the existing pattern of `ChannelProfile.inputJson` and `ChannelProfile.aiProfileJson` — TEXT columns storing typed JSON. Keeps the schema change minimal (one column). Nullable preserves backward compatibility with existing ideas.

**Alternatives considered**:
- Multiple typed columns (sourceVideoIds, pattern, rationale): More queryable but rigid. Provenance is read-heavy display data, not queried by individual fields.
- JSON column type: Prisma's Json type would work too, but TEXT matches the existing project pattern.

## Decision 4: Extending buildContext for Competitor Data

**Decision**: Create a new `buildCompetitorBackedContext` function that wraps the existing `buildContext` and adds competitor video data. Returns an extended type `CompetitorBackedContext` that includes the original `SuggestionContext` plus `competitorVideos: CompetitorVideoForContext[]`.

**Rationale**: Preserves the existing `buildContext` function unchanged (other code depends on it). The new function composes on top. When no competitor data is available, it returns `competitorVideos: []` and the generation falls back to profile-only mode.

**Alternatives considered**:
- Modify buildContext directly: Risk breaking existing callers. The current function is also used by suggestField.
- Pass competitor data as a separate parameter to generateSuggestions: Cleaner separation but means two context-building paths. The composed approach is simpler.

## Decision 5: LLM Prompt Refactoring for Source Attribution

**Decision**: Extend the suggestion generation prompt to include a `COMPETITOR VIDEOS` section with top-performing videos from the niche. Modify the JSON response schema to require `sourceVideoIds`, `pattern`, `rationale`, and `adaptationAngle` per suggestion alongside the existing `title` and `description`.

**Rationale**: The LLM already receives structured context and returns structured JSON. Adding competitor videos as context and requiring attribution fields in the output is a natural extension of the existing pattern.

**Alternatives considered**:
- Two-pass generation (extract patterns first, then generate ideas): Higher quality but doubles LLM cost and latency. Can be explored in a future iteration.
- Post-hoc attribution (generate ideas, then match to sources): Unreliable — the LLM may generate ideas not actually grounded in any source.

## Decision 6: Competitor Video Selection Strategy

**Decision**: Select the top 10 competitor videos by `viewsPerDay` from the most recent cached search results for the channel's niche. If multiple cached searches exist, use the most recent non-expired one.

**Rationale**: viewsPerDay is the strongest signal for "what's working right now." 10 videos provides enough variety without overwhelming the LLM context. The existing search cache sorts by this metric already.

**Alternatives considered**:
- Random sample: Loses the "what's working" signal.
- All cached videos: Too many for LLM context window.
- Weighted by recency + performance: More sophisticated but marginal improvement over top-by-viewsPerDay for v1.

## Decision 7: View Source UI Pattern

**Decision**: Use an expandable inline panel on the idea card (not a modal). Clicking "View source" expands the card to show source video thumbnails, titles, stats, and the observed pattern. "Analyze source" links to the existing `/competitors/video/[videoId]` page.

**Rationale**: Inline expansion keeps the user in context without a jarring modal. The existing competitor video detail page already provides the deep-dive analysis — no need to rebuild it.

**Alternatives considered**:
- Modal/dialog: More disruptive, harder to compare multiple ideas.
- Separate page: Too much navigation for a quick "show me the evidence" interaction.
- Slide-over panel: Viable but more complex to implement. Inline expansion is simpler.

## Decision 8: "Make My Version" Implementation

**Decision**: Add a "Make my version" button to both the source view panel on idea cards AND the competitor video detail page header. Both trigger the same action: POST to create a new VideoIdea with sourceProvenanceJson pre-populated from the competitor video data, then navigate to the idea editor.

**Rationale**: Reuses the existing `createIdea` API endpoint with the new sourceProvenanceJson field. The idea editor already handles new ideas — it just needs to display the provenance section.

**Alternatives considered**:
- New dedicated API endpoint: Unnecessary — createIdea already handles idea creation.
- Client-side only (pre-fill form without saving): Loses the source context if user navigates away.

## Decision 9: On-Demand Generation Entry Points

**Decision**: Add a "Find ideas from my niche" button in two locations per clarification: (1) below the suggestion cards on the dashboard, (2) in the planned ideas tab header area. Both call the same generation endpoint. Generated ideas appear as new suggestion cards (dashboard) or are directly added to the ideas list (planned tab).

**Rationale**: Dashboard button refreshes/augments the passive suggestions. Planned tab button serves the active brainstorming use case. Same backend, different presentation.

**Alternatives considered**:
- Single location: Clarification explicitly chose both.
- Inline in suggestion engine card: Too subtle — users won't discover it.

## Decision 10: Navigation De-emphasis

**Decision**: The `/competitors` page is not in the primary nav (confirmed — it's already absent from `primaryNavItems` in nav-config.ts). The Analyzer page at `/analyze` remains in primary nav. No navigation changes needed — competitor search is already accessed via direct URL or in-app links, not primary nav.

**Rationale**: The current nav already doesn't prominently feature competitor search. The refactor adds competitor intelligence flow through the ideas system, which is the desired outcome. The `/competitors` route remains functional for direct access.

**Alternatives considered**:
- Remove /competitors route entirely: Violates FR-013 (must remain operational).
- Add a "Research" nav item: Scope creep — not needed when the flow goes through ideas.

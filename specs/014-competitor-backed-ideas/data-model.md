# Data Model: Competitor-Backed Ideas

**Branch**: `014-competitor-backed-ideas` | **Date**: 2026-03-23

## Entity Changes

### VideoIdea (extended)

**New field:**

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| sourceProvenanceJson | TEXT | Yes | null | JSON-serialized SourceProvenance. Null for manually created ideas. |

**Existing fields** (unchanged): id, userId, channelId, summary, title, script, description, tags, postDate, status, createdAt, updatedAt.

**Migration**: Add column with `ALTER TABLE "VideoIdea" ADD COLUMN "sourceProvenanceJson" TEXT;` — nullable, no backfill needed.

---

### VideoSuggestion (extended shape in sourceContext)

**No schema change.** The existing `sourceContext` JSON column already stores arbitrary JSON. The application-level shape is extended from `SuggestionContext` to `CompetitorBackedSuggestionContext` which includes competitor provenance fields.

**Existing shape** (`SuggestionContext`):
```
{ channelNiche, contentPillars, targetAudience, recentVideoTitles, recentVideoPerformance, trendingTopics }
```

**Extended shape** (`CompetitorBackedSuggestionContext`):
```
{
  ...SuggestionContext,
  provenance: SourceProvenance | null,
  generationMode: "profile_only" | "competitor_backed"
}
```

Old suggestions remain valid — `provenance: null` and `generationMode` absent are treated as `"profile_only"`.

---

### CompetitorVideo (unchanged)

No schema changes. Existing records serve as the source reference. Provenance snapshots copy relevant fields at generation time.

---

### ChannelProfile (unchanged)

No schema changes. Continues to provide channel context for generation.

---

## New Types

### SourceProvenance

Embedded JSON structure within VideoSuggestion.sourceContext and VideoIdea.sourceProvenanceJson.

```
SourceProvenance {
  sourceVideos: SourceVideoSnapshot[]   // 1-5 competitor videos that inspired the idea
  pattern: string                       // What pattern was observed (e.g., "listicle format with personal story hook")
  rationale: string                     // Why it's performing (e.g., "high engagement from comment-driven curiosity")
  adaptationAngle: string              // How to adapt for user's channel
}
```

### SourceVideoSnapshot

Frozen copy of competitor video metadata at generation time.

```
SourceVideoSnapshot {
  videoId: string                      // YouTube video ID (links to CompetitorVideo if still cached)
  title: string                        // Video title at time of generation
  channelId: string                    // YouTube channel ID
  channelTitle: string                 // Channel name at time of generation
  thumbnailUrl: string | null          // Thumbnail URL
  stats: {
    viewCount: number                  // View count at time of generation
    viewsPerDay: number                // Derived metric at time of generation
  }
  publishedAt: string                  // ISO date string
}
```

### CompetitorBackedSuggestionContext

Extended suggestion context that includes competitor provenance.

```
CompetitorBackedSuggestionContext extends SuggestionContext {
  provenance: SourceProvenance | null  // null when no competitor data available
  generationMode: "profile_only" | "competitor_backed"
}
```

### CompetitorVideoForContext

Lightweight competitor video data used as LLM input during generation.

```
CompetitorVideoForContext {
  videoId: string
  title: string
  channelTitle: string
  viewCount: number
  viewsPerDay: number
  publishedAt: string
  durationSec: number | null
  tags: string[]
}
```

## State Transitions

### VideoSuggestion Status (unchanged)

```
active → saved    (user clicks "Save for later")
active → used     (user clicks "Use this idea")
active → dismissed (user clicks "Not a fit")
```

All transitions preserve sourceContext including provenance.

### VideoIdea Status (unchanged)

```
draft → planned   (user updates status)
```

sourceProvenanceJson is set at creation time (from suggestion action or "Make my version") and remains immutable through status transitions.

## Validation Rules

- `SourceProvenance.sourceVideos` must contain 1-5 entries when present.
- `SourceProvenance.pattern`, `rationale`, and `adaptationAngle` must be non-empty strings when provenance is present.
- `VideoIdea.sourceProvenanceJson` must parse as valid `SourceProvenance` or be null.
- `CompetitorBackedSuggestionContext.generationMode` must be one of `"profile_only"` or `"competitor_backed"`.
- Backward compatibility: suggestions without `provenance` or `generationMode` in sourceContext are treated as `profile_only`.

## Indexes

No new indexes required. VideoIdea queries are already indexed by (userId, channelId, status) and (userId, createdAt). The sourceProvenanceJson field is not queried directly — it's read-only display data.

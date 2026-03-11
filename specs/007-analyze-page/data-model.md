# Data Model: Analyze Page

## Overview

The Analyze page does **not** introduce new database entities or schema changes. It reuses the existing `CompetitorVideoAnalysis` data structure from the competitors feature domain. Analysis results are ephemeral (held in client state, not persisted).

## Key Data Structures

### PageState (Client-Side State Machine)

The Analyze page client component manages a discriminated union state:

| State | Fields | Description |
|-------|--------|-------------|
| `input` | (none) | Initial state — URL input visible |
| `loading` | (none) | Analysis in progress — loading indicator shown |
| `results` | `data: CompetitorVideoAnalysis` | Analysis complete — results view shown |
| `error` | `message: string` | Analysis failed — error message shown |

**Transitions**:
- `input` → `loading` (user submits valid URL)
- `loading` → `results` (API returns success)
- `loading` → `error` (API returns error or timeout)
- `results` → `input` (user clicks back button)
- `error` → `input` (user clicks back/retry)

### CompetitorVideoAnalysis (Reused — No Changes)

Source: `@/types/api` → `CompetitorVideoAnalysis`

Key nested structures consumed by the Analyze page:

| Field | Type | Used For |
|-------|------|----------|
| `video` | `CompetitorVideo` | Thumbnail, title, channel, publish date, stats |
| `analysis.whyItsWorking` | `string[]` | "What's Driving Performance" collapsible section |
| `analysis.themesToRemix` | `Array<{theme, why}>` | "Portable Patterns" collapsible section |
| `analysis.remixIdeasForYou` | `Array<{title, hook, overlayText, angle}>` | "Make Your Better Version" collapsible section |
| `analysis.titlePatterns` | `string[]` | "Title Patterns" collapsible section |
| `comments` | `CompetitorCommentsAnalysis` | Comment analysis with truncation |
| `comments.topComments` | `Array<{text, likeCount}>` | Individual truncated comment cards |
| `comments.sentiment` | `{positive, negative, neutral}` | Sentiment summary |
| `comments.themes` | `Array<{theme, count, examples}>` | Comment themes |
| `comments.viewerAskedFor` | `string[]` | "Ways to Outperform" (follow-up recs) |
| `comments.viewerLoved` | `string[]` | "Ways to Outperform" (content recs) |
| `strategicInsights` | object | Competition difficulty, timing, engagement benchmarks |
| `publicSignals` | `CompetitorPublicSignals` | Video age, velocity metrics |
| `tags` | `string[]` | Video tags (if available) |
| `dataLimitations` | `{whatWeCanKnow, whatWeCantKnow}` | Transparency about data limits |

### AnalyzeRequest (API Input)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | `string` | Yes | YouTube video URL |

The API route extracts the `videoId` from the URL and delegates to the existing `analyzeVideo` use-case.

### AnalyzeResponse (API Output)

The API returns `CompetitorVideoAnalysis` directly (same shape as `/api/competitors/video/[videoId]`).

## Entities Not Modified

- No Prisma schema changes
- No new database tables
- No modifications to existing `CompetitorVideo`, `CompetitorVideoAnalysis`, or related types
- Analysis caching continues to work through the existing competitor pipeline cache layer

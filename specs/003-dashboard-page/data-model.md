# Data Model: Dashboard Page

**Branch**: `003-dashboard-page` | **Date**: 2026-03-09

## New Entities

### VideoSuggestion

System-generated video idea surfaced on the Dashboard. Persisted when generated; tracks lifecycle through user interaction.

| Field | Type | Constraints | Description |
| ----- | ---- | ----------- | ----------- |
| id | UUID | PK, auto-generated | Unique suggestion identifier |
| userId | Int | FK → User.id, required | Owner of this suggestion |
| channelId | Int | FK → Channel.id, required | Channel this suggestion targets |
| title | String | max 500 chars, required | Suggested video title |
| description | String | text, required | Brief description of the video idea |
| sourceContext | JSON | required | Signals that informed this suggestion (profile data, video performance, trends) |
| status | String | enum: active/saved/dismissed/used, default: active | Current lifecycle state |
| generatedAt | DateTime | auto, required | When the suggestion was created |
| actedAt | DateTime | nullable | When the user took action (save/dismiss/use) |
| createdAt | DateTime | auto | Record creation timestamp |
| updatedAt | DateTime | auto | Record update timestamp |

**Indexes**:
- `(userId, channelId, status)` — primary query: fetch active suggestions for a channel
- `(userId, generatedAt DESC)` — history/audit query

**Unique constraints**:
- None strictly required (system can generate similar titles over time)

**Relationships**:
- Belongs to `User` (required)
- Belongs to `Channel` (required)

### State Transitions

```
[generated] → active
active → saved       (user clicks "Save for later")
active → dismissed   (user clicks "Not a fit")
active → used        (user clicks "Use this idea")
```

- `saved` suggestions appear in saved ideas (may be copied to SavedIdea table or queried directly)
- `dismissed` suggestions never resurface for this user+channel
- `used` suggestions are forwarded to the idea creation flow
- When a suggestion leaves `active`, the system generates a replacement to maintain exactly 3 active per channel

## Existing Entities (Referenced, Not Modified)

### SavedIdea (existing)

Used by the "Save for later" action. When a VideoSuggestion is saved, a corresponding SavedIdea record is created with the suggestion data mapped to SavedIdea fields.

| Field | Mapping from VideoSuggestion |
| ----- | ---------------------------- |
| ideaId | VideoSuggestion.id |
| title | VideoSuggestion.title |
| ideaJson | Constructed from suggestion data |
| status | "saved" |

### Channel (existing)

Provides creator context for suggestion generation: niche, audience, content pillars via `ChannelProfile`.

### Video + VideoMetrics (existing)

Provides recent video performance data as input signal for suggestion generation.

### ChannelProfile (existing)

Provides niche, target audience, and content strategy data for contextual suggestions.

## SuggestionContext (Value Object, not persisted separately)

Aggregated input for the suggestion generation function. Stored as JSON in `VideoSuggestion.sourceContext` for auditability.

| Field | Source | Description |
| ----- | ------ | ----------- |
| channelNiche | ChannelProfile | Creator's content niche |
| contentPillars | ChannelProfile | Main content themes |
| targetAudience | ChannelProfile | Audience demographics/interests |
| recentVideoTitles | Video (last 10) | Titles of recent uploads |
| recentVideoPerformance | VideoMetrics | Views, engagement, retention summaries |
| trendingTopics | Trending data (if available) | Relevant trending signals |

This structure is extensible: new fields can be added to SuggestionContext without schema migration (stored as JSON).

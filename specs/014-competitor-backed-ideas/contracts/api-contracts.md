# API Contracts: Competitor-Backed Ideas

**Branch**: `014-competitor-backed-ideas` | **Date**: 2026-03-23

## Modified Endpoints

### GET /api/me/channels/[channelId]/suggestions

**Change**: Response shape extended. Each suggestion's `sourceContext` now optionally includes `provenance` and `generationMode`.

**Response** (unchanged wrapper, extended inner shape):
```json
{
  "suggestions": [
    {
      "id": "uuid",
      "title": "string (max 500)",
      "description": "string",
      "sourceContext": {
        "channelNiche": "string | null",
        "contentPillars": ["string"],
        "targetAudience": "string | null",
        "recentVideoTitles": ["string"],
        "recentVideoPerformance": [{ "title": "string", "views": 0, "likes": 0, "comments": 0, "avgViewPercentage": 0 }],
        "trendingTopics": ["string"],
        "provenance": {
          "sourceVideos": [
            {
              "videoId": "string",
              "title": "string",
              "channelId": "string",
              "channelTitle": "string",
              "thumbnailUrl": "string | null",
              "stats": { "viewCount": 0, "viewsPerDay": 0 },
              "publishedAt": "ISO string"
            }
          ],
          "pattern": "string",
          "rationale": "string",
          "adaptationAngle": "string"
        },
        "generationMode": "competitor_backed | profile_only"
      },
      "status": "active | saved | dismissed | used",
      "generatedAt": "ISO string"
    }
  ]
}
```

**Backward compatibility**: `provenance` may be `null` or absent for older suggestions. `generationMode` may be absent (treat as `"profile_only"`).

---

### POST /api/me/channels/[channelId]/suggestions/[suggestionId]/action

**Change**: When action is `"use"` or `"save"`, the created VideoIdea now includes `sourceProvenanceJson` copied from the suggestion's provenance.

**Request** (unchanged):
```json
{ "action": "save | dismiss | use" }
```

**Response** (extended):
```json
{
  "suggestion": { "id": "uuid", "status": "saved | dismissed | used" },
  "replacement": { "...VideoSuggestion" },
  "videoIdeaId": "uuid | undefined",
  "ideaFlowUrl": "string | undefined"
}
```

No request-side changes. The provenance transfer happens server-side.

---

### POST /api/me/channels/[channelId]/ideas

**Change**: Accepts optional `sourceProvenanceJson` in request body.

**Request** (extended):
```json
{
  "summary": "string (required, max 150)",
  "title": "string | undefined",
  "script": "string | undefined",
  "description": "string | undefined",
  "tags": ["string"] | undefined,
  "postDate": "YYYY-MM-DD | undefined",
  "sourceProvenanceJson": "string (JSON) | undefined"
}
```

**Response** (extended):
```json
{
  "id": "uuid",
  "channelId": 0,
  "summary": "string",
  "title": "string | null",
  "script": "string | null",
  "description": "string | null",
  "tags": ["string"],
  "postDate": "string | null",
  "status": "draft",
  "sourceProvenanceJson": "string (JSON) | null",
  "createdAt": "ISO string",
  "updatedAt": "ISO string"
}
```

---

### GET /api/me/channels/[channelId]/ideas and GET /api/me/channels/[channelId]/ideas/[ideaId]

**Change**: Response now includes `sourceProvenanceJson` field.

**Response item** (extended):
```json
{
  "id": "uuid",
  "channelId": 0,
  "summary": "string",
  "title": "string | null",
  "script": "string | null",
  "description": "string | null",
  "tags": ["string"],
  "postDate": "string | null",
  "status": "draft | planned",
  "sourceProvenanceJson": "string (JSON) | null",
  "createdAt": "ISO string",
  "updatedAt": "ISO string"
}
```

---

### POST /api/me/channels/[channelId]/ideas/suggest

**Change**: When the idea has source provenance, the field suggestion prompt includes source context for more targeted generation.

**Request** (unchanged):
```json
{
  "field": "title | script | description | tags | postDate",
  "currentIdea": { "summary": "string", "title": "string | null", "..." }
}
```

**Response** (unchanged):
```json
{ "field": "string", "value": "string" }
```

No contract change — the improvement is internal to the prompt construction.

## New Endpoints

### POST /api/me/channels/[channelId]/suggestions/generate

**Purpose**: On-demand competitor-backed idea generation. Triggered from dashboard or planned ideas tab.

**Request**:
```json
{
  "count": 3
}
```

**Response**:
```json
{
  "suggestions": ["...VideoSuggestion[]"],
  "generationMode": "competitor_backed | profile_only",
  "competitorDataAvailable": true
}
```

**Behavior**:
- Builds competitor-backed context from cached search data.
- If no cached competitor data exists, falls back to profile-only generation.
- Returns `competitorDataAvailable: false` when fallback occurs so the UI can show an appropriate message.
- Replaces any existing active suggestions with the newly generated batch.

**Auth**: Required (session).
**Rate limit**: Same as existing suggestion generation (reuse `competitorFeed` or create dedicated limiter).

## Unchanged Endpoints

- `POST /api/competitors/search` — Competitor search remains fully operational.
- `GET /api/competitors/video/[videoId]` — Competitor video analysis remains fully operational.
- `POST /api/analyze` — Quick analyze remains fully operational.
- `PATCH /api/me/channels/[channelId]/ideas/[ideaId]` — Update idea; sourceProvenanceJson is not updatable via PATCH (immutable after creation).
- `DELETE /api/me/channels/[channelId]/ideas/[ideaId]` — Delete idea; no changes.

# API Contract: POST /api/analyze

## Overview

Accepts a YouTube video URL, extracts the video ID, and returns a full video analysis. This endpoint wraps the existing competitor video analysis pipeline for use by the Analyze page.

## Request

**Method**: `POST`
**Path**: `/api/analyze`
**Auth**: Required (session cookie)
**Entitlement**: `competitor_video_analysis` (shared daily quota with competitor video detail)
**Rate Limit**: `analyzeVideo` operation, keyed by userId

### Request Body

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `url` | `string` | Yes | Must be a valid YouTube URL (youtube.com, youtu.be, m.youtube.com). Must contain an extractable video ID. Must not be a playlist URL. |

### Supported URL Formats

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://www.youtube.com/shorts/VIDEO_ID`
- `https://m.youtube.com/watch?v=VIDEO_ID`
- `https://www.youtube.com/embed/VIDEO_ID`

## Response

### 200 OK

Returns `CompetitorVideoAnalysis` (same shape as `GET /api/competitors/video/[videoId]`).

Key fields:
```json
{
  "video": {
    "videoId": "string",
    "title": "string",
    "channelTitle": "string",
    "channelUrl": "string",
    "videoUrl": "string",
    "thumbnailUrl": "string",
    "publishedAt": "string (ISO 8601)",
    "durationSec": "number",
    "stats": {
      "viewCount": "number",
      "likeCount": "number | null",
      "commentCount": "number | null"
    },
    "derived": {
      "viewsPerDay": "number"
    }
  },
  "analysis": {
    "whatItsAbout": "string",
    "whyItsWorking": ["string"],
    "themesToRemix": [{ "theme": "string", "why": "string" }],
    "titlePatterns": ["string"],
    "remixIdeasForYou": [{ "title": "string", "hook": "string", "overlayText": "string", "angle": "string" }]
  },
  "comments": {
    "topComments": [{ "text": "string", "likeCount": "number" }],
    "sentiment": { "positive": "number", "negative": "number", "neutral": "number" },
    "themes": [{ "theme": "string", "count": "number", "examples": ["string"] }],
    "viewerAskedFor": ["string"],
    "viewerLoved": ["string"],
    "hookInspiration": ["string"],
    "commentsDisabled": "boolean"
  },
  "tags": ["string"],
  "strategicInsights": { "..." },
  "publicSignals": { "..." },
  "dataLimitations": {
    "whatWeCanKnow": ["string"],
    "whatWeCantKnow": ["string"]
  }
}
```

### Error Responses

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_INPUT` | Invalid URL format or missing video ID |
| 400 | `INVALID_INPUT` | Playlist URL (not a single video) |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 404 | `NOT_FOUND` | Video not found (private, deleted, etc.) |
| 429 | `RATE_LIMITED` | Too many requests |
| 429 | `ENTITLEMENT_EXCEEDED` | Daily analysis quota exceeded |
| 500 | `EXTERNAL_FAILURE` | YouTube API or LLM error |
| 504 | `TIMEOUT` | Analysis took too long |

Error shape:
```json
{
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

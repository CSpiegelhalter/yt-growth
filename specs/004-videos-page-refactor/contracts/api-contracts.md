# API Contracts: Videos Page Refactor

**Feature**: 004-videos-page-refactor
**Date**: 2026-03-10

All endpoints require authentication (NextAuth session). Channel ownership is verified via middleware.

---

## GET /api/me/channels/{channelId}/ideas

List all video ideas for a channel.

**Parameters**:
- `channelId` (path, required): Channel ID

**Query Parameters**:
- `status` (optional): Filter by status (`draft`, `planned`). Default: all statuses.

**Response 200**:
```json
{
  "ideas": [
    {
      "id": "uuid",
      "channelId": 123,
      "summary": "A tech review video about...",
      "title": "Best Keyboards of 2026",
      "script": null,
      "description": null,
      "tags": ["keyboards", "tech review"],
      "postDate": "2026-04-15",
      "status": "draft",
      "createdAt": "2026-03-10T00:00:00Z",
      "updatedAt": "2026-03-10T00:00:00Z"
    }
  ]
}
```

**Response 401**: Unauthorized
**Response 404**: Channel not found or not owned by user

---

## POST /api/me/channels/{channelId}/ideas

Create a new video idea.

**Parameters**:
- `channelId` (path, required): Channel ID

**Request Body**:
```json
{
  "summary": "A tech review video of a new keyboard",
  "title": "Best Keyboards of 2026",
  "script": null,
  "description": null,
  "tags": ["keyboards"],
  "postDate": "2026-04-15"
}
```

**Required fields**: `summary` (1-150 chars)
**Optional fields**: `title`, `script`, `description`, `tags`, `postDate`

**Response 201**:
```json
{
  "idea": { /* VideoIdea object */ }
}
```

**Response 400**: Validation error
**Response 401**: Unauthorized

---

## GET /api/me/channels/{channelId}/ideas/{ideaId}

Get a single video idea.

**Parameters**:
- `channelId` (path, required): Channel ID
- `ideaId` (path, required): Idea UUID

**Response 200**:
```json
{
  "idea": { /* VideoIdea object */ }
}
```

**Response 404**: Idea not found

---

## PATCH /api/me/channels/{channelId}/ideas/{ideaId}

Update a video idea. Only provided fields are updated.

**Parameters**:
- `channelId` (path, required): Channel ID
- `ideaId` (path, required): Idea UUID

**Request Body** (all fields optional):
```json
{
  "summary": "Updated summary",
  "title": "Updated title",
  "script": "Full script content...",
  "description": "YouTube description...",
  "tags": ["tag1", "tag2"],
  "postDate": "2026-05-01",
  "status": "planned"
}
```

**Response 200**:
```json
{
  "idea": { /* Updated VideoIdea object */ }
}
```

**Response 400**: Validation error
**Response 404**: Idea not found

---

## DELETE /api/me/channels/{channelId}/ideas/{ideaId}

Delete a video idea.

**Parameters**:
- `channelId` (path, required): Channel ID
- `ideaId` (path, required): Idea UUID

**Response 204**: No content (success)
**Response 404**: Idea not found

---

## POST /api/me/channels/{channelId}/ideas/suggest

AI-assisted field generation for a video idea.

**Parameters**:
- `channelId` (path, required): Channel ID

**Request Body**:
```json
{
  "field": "title",
  "currentIdea": {
    "summary": "A tech review video about the new mechanical keyboard",
    "title": null,
    "script": null,
    "description": null,
    "tags": [],
    "postDate": null
  }
}
```

**Allowed `field` values**: `title`, `script`, `description`, `tags`, `postDate`

**Response 200**:
```json
{
  "field": "title",
  "value": "I Tested Every Mechanical Keyboard So You Don't Have To"
}
```

For `tags`, the `value` is a JSON-encoded string array:
```json
{
  "field": "tags",
  "value": "[\"mechanical keyboard\", \"tech review\", \"keyboard comparison\"]"
}
```

**Response 400**: Validation error (invalid field, missing summary)
**Response 401**: Unauthorized
**Response 500**: AI generation failure (retryable)

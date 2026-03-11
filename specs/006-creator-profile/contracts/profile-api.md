# API Contract: Channel Profile

## PUT /api/me/channels/[channelId]/profile

Updates the creator profile for a channel. Existing endpoint — schema is expanded.

### Request

```
PUT /api/me/channels/:channelId/profile
Content-Type: application/json
Authorization: session cookie (next-auth)
```

**Body**:
```json
{
  "input": {
    "description": "string (required, 10-2000 chars)",
    "categories": ["string"] ,
    "customCategory": "string (optional, max 100)",
    "formats": ["string"],
    "audience": "string (optional, max 500)",
    "tone": ["string"],
    "examples": ["string (max 200)"],
    "goals": ["string"],
    "overview": {
      "channelDescription": "string (max 2000)",
      "coreTopics": ["string (max 100)"],
      "knownFor": "string (max 500)",
      "contentStyles": ["string"],
      "creatorStrengths": ["string"]
    },
    "ideaGuidance": {
      "topicsToLeanInto": "string (max 2000)",
      "topicsToAvoid": "string (max 2000)",
      "idealVideo": "string (max 2000)",
      "formatPreferences": ["string"],
      "viewerFeeling": "string (max 500)"
    },
    "scriptGuidance": {
      "tone": "string",
      "structurePreference": "string (max 2000)",
      "styleNotes": "string (max 2000)",
      "neverInclude": "string (max 2000)"
    },
    "tagGuidance": {
      "primaryKeywords": ["string (max 100)"],
      "nicheTerms": ["string (max 100)"],
      "tagStylePreference": "string"
    },
    "descriptionGuidance": {
      "descriptionFormat": "string (max 2000)",
      "standardLinks": "string (max 2000)",
      "seoPriority": "string"
    },
    "competitors": {
      "closeToSize": [
        { "channelUrl": "string", "channelName": "string (max 200)", "whatYouAdmire": "string (max 1000)" }
      ],
      "aspirational": [
        { "channelUrl": "string", "channelName": "string (max 200)", "whatYouAdmire": "string (max 1000)" }
      ],
      "nicheHero": [
        { "channelUrl": "string", "channelName": "string (max 200)", "whatYouAdmire": "string (max 1000)" }
      ],
      "differentiation": "string (max 2000)"
    }
  }
}
```

All section objects are optional. The `description` and `categories` fields remain required for backward compatibility with the AI generation pipeline.

### Response (200 OK)

```json
{
  "profile": {
    "id": "uuid",
    "channelId": 123,
    "input": { "...same shape as request input..." },
    "inputHash": "sha256-hex-string",
    "aiProfile": null,
    "lastGeneratedAt": null,
    "createdAt": "2026-03-10T00:00:00.000Z",
    "updatedAt": "2026-03-10T00:00:00.000Z"
  },
  "message": "Profile updated"
}
```

### Error Responses

| Status | Body | When |
|--------|------|------|
| 400 | `{ "error": "Validation error", "details": [...] }` | Invalid input shape or constraints |
| 401 | `{ "error": "Authentication required" }` | No valid session |
| 403 | `{ "error": "Not authorized" }` | Channel doesn't belong to user |
| 404 | `{ "error": "Channel not found" }` | Invalid channelId |

## GET /api/me/channels/[channelId]/profile

Fetches the creator profile for a channel. No changes to existing contract.

### Response (200 OK)

```json
{
  "profile": {
    "id": "uuid",
    "channelId": 123,
    "input": { "...ChannelProfileInput..." },
    "inputHash": "sha256-hex-string",
    "aiProfile": { "...ChannelProfileAI or null..." },
    "lastGeneratedAt": "2026-03-10T00:00:00.000Z",
    "createdAt": "2026-03-10T00:00:00.000Z",
    "updatedAt": "2026-03-10T00:00:00.000Z"
  }
}
```

### Response (200 OK, no profile yet)

```json
{
  "profile": null
}
```

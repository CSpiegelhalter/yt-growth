# API Contracts: Dashboard Page

**Branch**: `003-dashboard-page` | **Date**: 2026-03-09

## New Endpoints

### GET /api/me/channels/[channelId]/suggestions

Fetch active video suggestions for the Dashboard.

**Auth**: Required (withAuth)
**Validation**: channelId path param (withValidation)

**Response 200**:
```json
{
  "suggestions": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "sourceContext": { "channelNiche": "...", "recentVideoTitles": [...] },
      "status": "active",
      "generatedAt": "ISO8601"
    }
  ],
  "total": 3
}
```

**Response 404**: Channel not found
**Response 401**: Not authenticated

**Behavior**:
- Returns up to 3 suggestions with status `active` for the given channel.
- If fewer than 3 active suggestions exist, generates new ones to fill the gap before responding.
- First-time call for a channel triggers initial generation of 3 suggestions.

---

### POST /api/me/channels/[channelId]/suggestions/[suggestionId]/action

Perform an action on a video suggestion.

**Auth**: Required (withAuth)
**Validation**: channelId + suggestionId path params, action body (withValidation)

**Request Body**:
```json
{
  "action": "save" | "dismiss" | "use"
}
```

**Response 200 (action: save)**:
```json
{
  "success": true,
  "suggestion": { "id": "uuid", "status": "saved" },
  "savedIdeaId": "uuid",
  "replacement": {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "sourceContext": {},
    "status": "active",
    "generatedAt": "ISO8601"
  }
}
```

**Response 200 (action: dismiss)**:
```json
{
  "success": true,
  "suggestion": { "id": "uuid", "status": "dismissed" },
  "replacement": {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "sourceContext": {},
    "status": "active",
    "generatedAt": "ISO8601"
  }
}
```

**Response 200 (action: use)**:
```json
{
  "success": true,
  "suggestion": { "id": "uuid", "status": "used" },
  "ideaFlowUrl": "/ideas?seed=uuid",
  "replacement": {
    "id": "uuid",
    "title": "string",
    "description": "string",
    "sourceContext": {},
    "status": "active",
    "generatedAt": "ISO8601"
  }
}
```

**Response 404**: Suggestion not found
**Response 400**: Invalid action
**Response 401**: Not authenticated

**Behavior**:
- Updates the suggestion status to the corresponding terminal state.
- For `save`: also creates a SavedIdea record.
- For `use`: returns URL to pre-populate the idea creation flow.
- Always generates and returns a replacement suggestion to maintain 3 active.

## Existing Endpoints (Reused, Not Modified)

### GET /api/me/channels/[channelId]/overview

Used by the OverviewPanel component on the Dashboard. No changes needed.

### POST /api/me/saved-ideas

Used indirectly by the suggestion action endpoint when `action: save`. The suggestion action handler calls the `saveIdea` use-case internally.

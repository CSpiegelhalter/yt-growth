# Data Model: Profile Completion Popup

## Existing Entities (No Changes)

### ChannelProfile (Prisma)
Already exists. No schema changes required.

```
ChannelProfile {
  id: UUID (PK)
  channelId: Int (unique FK → Channel)
  inputJson: Text                    // ChannelProfileInput serialized as JSON
  inputHash: VarChar(64)
  aiProfileJson: Text?
  lastGeneratedAt: DateTime?
  createdAt: DateTime
  updatedAt: DateTime
}
```

### ChannelProfileInput (TypeScript — from inputJson)
Already defined in `lib/features/channels/schemas.ts`. Relevant sections:

```typescript
{
  overview: {
    channelDescription: string
    coreTopics: string[]
    knownFor: string
    contentStyles: string[]
    creatorStrengths: string[]
  }
  ideaGuidance: {
    topicsToLeanInto: string
    topicsToAvoid: string
    idealVideo: string
    formatPreferences: string[]
    viewerFeeling: string
  }
  scriptGuidance: {
    tone: string
    structurePreference: string
    styleNotes: string
    neverInclude: string
  }
  tagGuidance: {
    primaryKeywords: string[]
    nicheTerms: string[]
    tagStylePreference: string
  }
  descriptionGuidance: {
    descriptionFormat: string
    standardLinks: string
    seoPriority: string
  }
  competitors: {
    closeToSize: CompetitorEntry[]
    aspirational: CompetitorEntry[]
    nicheHero: CompetitorEntry[]
    differentiation: string
  }
}
```

## New Types (Client-Side Only)

### ProfileSectionCompletion

Maps each profile tab to its completion status:

```typescript
type ProfileSectionCompletion = {
  sectionId: ProfileTabId       // "overview" | "idea-guidance" | etc.
  label: string                 // "Overview" | "New idea guidance" | etc.
  isComplete: boolean
  href: string                  // Link to profile section (e.g., "/channel-profile?tab=overview")
}
```

### DismissalEnvelope (localStorage)

Stored under key `dismissable:{popupId}`:

```typescript
type DismissalEnvelope = {
  value: true
  timestamp: number             // Date.now() when dismissed
}
```

TTL is passed to the `useLocalStorage` hook, which handles expiry check on read.

### First-Visit Flag (localStorage)

Stored under key `dashboard-visited:{channelId}`:

```typescript
// Simple boolean — stored as JSON `true`
```

## Section-to-Tab Mapping

| Checklist Label | ProfileTabId | Section Key in ChannelProfileInput |
|----------------|--------------|-----------------------------------|
| Overview | `overview` | `overview` |
| New idea guidance | `idea-guidance` | `ideaGuidance` |
| Script guidance | `script-guidance` | `scriptGuidance` |
| Tag guidance | `tag-guidance` | `tagGuidance` |
| Description guidance | `description-guidance` | `descriptionGuidance` |
| Competitors | `competitors` | `competitors` |

Source of truth: `PROFILE_TABS` constant in `lib/features/channels/types.ts`.

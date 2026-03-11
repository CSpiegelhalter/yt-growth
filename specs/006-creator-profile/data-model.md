# Data Model: Creator Profile Builder

## Existing Model (No Migration Required)

The `ChannelProfile` Prisma model already exists with the following schema:

```prisma
model ChannelProfile {
  id              String    @id @default(uuid())
  channelId       Int       @unique
  inputJson       String    @db.Text    // Stores ChannelProfileInput as JSON string
  inputHash       String    @db.VarChar(64)
  aiProfileJson   String?   @db.Text    // AI-generated structured profile
  lastGeneratedAt DateTime?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  channel         Channel   @relation(fields: [channelId], references: [id], onDelete: Cascade)
}
```

**No database migration needed.** The `inputJson` TEXT field stores arbitrary JSON. The schema expansion happens at the Zod validation layer only.

## Expanded ChannelProfileInput Schema

### Top-Level Shape

```typescript
{
  // ── Legacy fields (backward compatible) ──
  description: string;          // Required, min 10 chars
  categories: string[];         // Required, 1-5 items
  customCategory?: string;
  formats?: string[];
  audience?: string;
  tone?: string[];
  examples?: string[];
  goals?: string[];

  // ── New section-grouped fields ──
  overview?: OverviewSection;
  ideaGuidance?: IdeaGuidanceSection;
  scriptGuidance?: ScriptGuidanceSection;
  tagGuidance?: TagGuidanceSection;
  descriptionGuidance?: DescriptionGuidanceSection;
  competitors?: CompetitorsSection;
}
```

### Section Schemas

#### OverviewSection
| Field | Type | Constraints | Prompt Purpose |
|-------|------|-------------|----------------|
| channelDescription | string | max 2000 | Core context for all generation prompts |
| coreTopics | string[] | max 20 items, max 100 chars each | Topic seeding for idea generation |
| knownFor | string | max 500 | Brand positioning in prompts |
| contentStyles | string[] | from predefined list | Style constraints for generation |
| creatorStrengths | string[] | from predefined list | Lean into strengths in suggestions |

#### IdeaGuidanceSection
| Field | Type | Constraints | Prompt Purpose |
|-------|------|-------------|----------------|
| topicsToLeanInto | string | max 2000 | Positive topic constraints |
| topicsToAvoid | string | max 2000 | Negative topic constraints |
| idealVideo | string | max 2000 | Ideal output description for generation |
| formatPreferences | string[] | from predefined list | Format filtering for ideas |
| viewerFeeling | string | max 500 | Emotional target for content |

#### ScriptGuidanceSection
| Field | Type | Constraints | Prompt Purpose |
|-------|------|-------------|----------------|
| tone | string | from predefined list | System prompt tone parameter |
| structurePreference | string | max 2000 | Script structure template |
| styleNotes | string | max 2000 | Custom style instructions |
| neverInclude | string | max 2000 | Negative constraints for scripts |

#### TagGuidanceSection
| Field | Type | Constraints | Prompt Purpose |
|-------|------|-------------|----------------|
| primaryKeywords | string[] | max 30 items, max 100 chars each | Tag generation seed keywords |
| nicheTerms | string[] | max 30 items, max 100 chars each | Niche-specific vocabulary |
| tagStylePreference | string | from predefined list | Tag specificity parameter |

#### DescriptionGuidanceSection
| Field | Type | Constraints | Prompt Purpose |
|-------|------|-------------|----------------|
| descriptionFormat | string | max 2000 | Description structure template |
| standardLinks | string | max 2000 | Boilerplate for descriptions |
| seoPriority | string | from predefined list | SEO weighting parameter |

#### CompetitorsSection
| Field | Type | Constraints | Prompt Purpose |
|-------|------|-------------|----------------|
| closeToSize | CompetitorEntry[] | max 3 | Peer-level competitor context |
| aspirational | CompetitorEntry[] | max 3 | Aspirational competitor context |
| nicheHero | CompetitorEntry[] | max 3 | Niche leader context |
| differentiation | string | max 2000 | Differentiation instructions for all prompts |

#### CompetitorEntry
| Field | Type | Constraints | Prompt Purpose |
|-------|------|-------------|----------------|
| channelUrl | string | valid YouTube URL | Competitor identification |
| channelName | string | max 200 | Display name in cards + prompt context |
| whatYouAdmire | string | max 1000 | What to learn from in prompts |

## Predefined Option Lists

### Content Styles
Educational, Entertaining, Opinion/Commentary, Storytelling, Tutorial, Review, Documentary, Vlog, News/Updates

### Creator Strengths
On-camera presence, Editing, Storytelling, Research, Humor, Teaching, Visual design, Writing, Interviewing

### Format Preferences
Long-form, Shorts, List/Ranking, How-to, Deep dive, Reaction, Challenge, Interview, Behind-the-scenes

### Script Tones
Casual & conversational, Professional & authoritative, Energetic & enthusiastic, Calm & thoughtful, Humorous & witty, Direct & no-nonsense

### Tag Style Preferences
Broad & general, Niche & specific, Mix of both

### SEO Priorities
Very important (keyword-rich), Moderate (natural with some keywords), Minimal (conversational)

## Profile Completeness Readiness

Each section maps to a completeness check:

```typescript
type SectionCompleteness = {
  section: string;
  totalFields: number;
  filledFields: number;
  percentage: number;
};
```

A field is "filled" if:
- String: non-empty after trim
- Array: length > 0
- CompetitorEntry[]: at least 1 entry with channelUrl filled

This enables future per-tab progress bars and overall profile completeness scoring.

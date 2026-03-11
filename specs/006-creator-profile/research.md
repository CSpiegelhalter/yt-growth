# Research: Creator Profile Builder

## R1: Existing ChannelProfile Infrastructure

**Decision**: Extend the existing `ChannelProfile` model and `ChannelProfileInput` schema rather than creating new models.

**Rationale**: The system already has:
- `ChannelProfile` Prisma model with `inputJson` (TEXT) and `aiProfileJson` (TEXT) fields
- API routes at `/api/me/channels/[channelId]/profile` (GET + PUT) and `/profile/generate` (POST)
- `useChannelProfile` hook with `saveProfile()`, `generateAI()`, `refresh()`, `clearError()`
- `ChannelProfileInputSchema` Zod schema with description, categories, formats, audience, tone, examples, goals
- Hash-based cache invalidation for AI regeneration

The `inputJson` TEXT field stores a JSON string, so the schema can be expanded freely without a database migration. The existing API route already accepts `{ input: ChannelProfileInput }` and serializes to JSON.

**Alternatives considered**:
- New `CreatorProfile` table: Rejected — duplicates existing infrastructure, requires migration, complicates channel relationship
- Multiple JSON columns per section: Rejected — unnecessary schema change, `inputJson` handles arbitrary JSON

## R2: Progressive Auto-Save Pattern

**Decision**: Debounced auto-save per field using the existing `useChannelProfile.saveProfile()`, triggered on blur and after 1.5s of inactivity.

**Rationale**: The existing hook sends the full `ChannelProfileInput` on save. For progressive save:
1. Client holds full form state in a single `useState<ChannelProfileInput>`
2. On field change, update local state immediately
3. Debounce calls to `saveProfile(fullInput)` — sends entire object, server replaces `inputJson`
4. Show "Saving..." / "Saved" indicator per-field or globally

This avoids partial updates (which would require PATCH semantics and merge logic) while still feeling progressive to the user.

**Alternatives considered**:
- Per-field PATCH API: Rejected — over-engineered, requires JSON merge logic on server, no benefit since the full object is small (<10KB)
- Form library (react-hook-form): Rejected — adds dependency, existing pattern works well, constitution favors minimalism

## R3: Tab Navigation Pattern

**Decision**: Client-side tab state using `useState` with URL hash sync for deep-linking.

**Rationale**: The Figma design shows a vertical tab list on the left with a white card content area on the right. Tabs are:
1. Overview
2. New idea guidance
3. Script guidance
4. Tag guidance
5. Description guidance
6. Competitors

Tab switching is purely client-side (no route changes). All tab data loads from the same `ChannelProfile.inputJson`. URL hash (e.g., `#competitors`) enables deep-linking.

**Alternatives considered**:
- Separate routes per tab: Rejected — unnecessary route proliferation, all data comes from one source
- Search params for tab: Viable but hash is simpler and doesn't trigger server navigation

## R4: Schema Expansion Strategy

**Decision**: Expand `ChannelProfileInputSchema` with optional section objects. Keep backward-compatible with existing data.

**Rationale**: Current schema has flat fields (description, categories, formats, audience, tone, examples, goals). New schema adds section-grouped fields:

```typescript
// New sections added alongside existing fields for backward compatibility
overview: { channelDescription, coreTopics[], knownFor, contentStyles[], creatorStrengths[] }
ideaGuidance: { topicsToLeanInto, topicsToAvoid, idealVideo, formatPreferences[], viewerFeeling }
scriptGuidance: { tone, structurePreference, styleNotes, neverInclude }
tagGuidance: { primaryKeywords[], nicheTerms[], tagStylePreference }
descriptionGuidance: { descriptionFormat, standardLinks, seoPriority }
competitors: { closeToSize[], aspirational[], nicheHero[], differentiation }
```

All new fields are optional so existing saved profiles don't break validation. The old flat fields (description, categories, etc.) are preserved for backward compatibility with the AI generation pipeline.

**Alternatives considered**:
- Replace all old fields: Rejected — breaks existing AI profile generation, requires updating `generateProfile` use-case simultaneously
- Separate validation schema per tab: Rejected — complicates the single-save-object pattern

## R5: Competitor Entry Data Shape

**Decision**: Competitor entries stored as arrays of objects within the `competitors` section, each with `channelUrl`, `channelName`, `whatYouAdmire`, and optional metadata.

**Rationale**: The Figma shows three competitor tiers (close-to-size, aspirational, niche-hero), each with:
- A question heading with sparkle icon
- Description text
- Channel URL input
- Card tiles showing saved competitors (name + category label + suggest icon)

Each tier stores up to 3 entries. The `channelName` is extracted from the URL or entered manually. Card tiles in the Figma show a bold label ("Casual") + channel name ("mkbhd") + suggest icon — these map to the category tier label and channel name.

**Alternatives considered**:
- Flat list with category field: Viable but less structured for per-tier display logic
- Separate model for competitors: Rejected — over-engineered for <9 entries, JSON is sufficient

## R6: "Suggest" Button Behavior

**Decision**: Render "Suggest" buttons as non-functional affordances in MVP. Wire them to a future `onSuggest(fieldKey)` callback.

**Rationale**: The Figma shows a sparkle icon + "Suggest" text next to many question labels. The spec states these should be "initially non-functional or placeholder, ready for future AI integration." Implementing them as buttons with a `disabled` or no-op handler keeps the UI ready without building the AI suggestion pipeline now.

**Alternatives considered**:
- Hide suggest buttons entirely: Rejected — Figma shows them, and they communicate the product vision to users
- Build suggestion pipeline: Out of scope per spec

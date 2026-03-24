# Tasks: Competitor-Backed Ideas

**Input**: Design documents from `/specs/014-competitor-backed-ideas/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api-contracts.md

**Tests**: Not explicitly requested — test tasks omitted. Validation via `make preflight` and manual quickstart.md walkthrough.

**Organization**: Tasks grouped by user story. US1+US2 are both P1 but share foundational data model work extracted into Phase 2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Schema migration and project structure for the new provenance field.

- [x] T001 Add `sourceProvenanceJson` TEXT nullable column to VideoIdea model in `apps/web/prisma/schema.prisma`
- [x] T002 Run Prisma migration to apply the new column: `cd apps/web && bunx prisma migrate dev --name add-source-provenance-to-video-idea`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types, schemas, and the competitor-backed context builder that all user stories depend on.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 [P] Define `SourceVideoSnapshot`, `SourceProvenance`, `CompetitorBackedSuggestionContext`, and `CompetitorVideoForContext` types in `apps/web/lib/features/suggestions/types.ts` — extend existing types file per data-model.md shapes. Add `generationMode` field to context type. Ensure backward compat: old suggestions without `provenance` parse as `profile_only`.
- [x] T004 [P] Add `SourceProvenanceSchema` Zod validator in `apps/web/lib/features/suggestions/schemas.ts` — validate sourceVideos array (1-5 items), non-empty pattern/rationale/adaptationAngle strings.
- [x] T005 [P] Extend `VideoIdea` type with `sourceProvenanceJson: string | null` in `apps/web/lib/features/video-ideas/types.ts`. Update the type's toDomain mapper to include the new field.
- [x] T006 [P] Add `sourceProvenanceJson` as optional string to the create idea Zod schema in `apps/web/lib/features/video-ideas/schemas.ts`.
- [x] T007 Create `buildCompetitorBackedContext` use-case in `apps/web/lib/features/suggestions/use-cases/buildCompetitorBackedContext.ts` — wraps existing `buildContext()`, then queries `YouTubeSearchCache` for cached competitor search results matching the channel's niche queries from `ChannelNiche.queriesJson`. Selects top 10 videos by viewsPerDay. Returns `CompetitorBackedSuggestionContext` with `competitorVideos[]` populated (or empty array if no cached data). Falls back gracefully when no cache exists.
- [x] T008 [P] Create reusable `SourceVideoCard` component in `apps/web/components/features/ideas/source-video-card.tsx` — renders a compact card for a `SourceVideoSnapshot`: thumbnail, title, channel name, views, views/day, published date. Uses CSS Modules, design system variables, 4pt grid spacing. Clicking the card does nothing (parent handles navigation). Keep under 80 lines.

**Checkpoint**: Foundation ready — shared types, schemas, context builder, and reusable UI component available for all user stories.

---

## Phase 3: User Story 1 — Competitor-Backed Dashboard Suggestions (Priority: P1) MVP

**Goal**: Dashboard suggestions are generated from cached competitor video data with source evidence visible on each card.

**Independent Test**: Load dashboard for a channel with prior competitor search data. Suggestion cards should show source video titles, channel names, observed pattern, and adaptation angle — not just title + description.

### Implementation for User Story 1

- [x] T009 [US1] Refactor `generateSuggestions` in `apps/web/lib/features/suggestions/use-cases/generateSuggestions.ts` — accept `CompetitorBackedSuggestionContext` (superset of `SuggestionContext`). When `competitorVideos` is non-empty: add a `COMPETITOR VIDEOS` section to the user prompt listing each video (title, channel, views, viewsPerDay, published date). Modify the required JSON response schema to include `sourceVideoIds: string[]`, `pattern: string`, `rationale: string`, `adaptationAngle: string` per suggestion. Store the full `CompetitorBackedSuggestionContext` (including `provenance` assembled from LLM output + matched video snapshots) in `sourceContext`. When `competitorVideos` is empty: use existing prompt (profile-only mode), store `generationMode: "profile_only"`.
- [x] T010 [US1] Update `GET /api/me/channels/[channelId]/suggestions` route in `apps/web/app/api/me/channels/[channelId]/suggestions/route.ts` — replace `buildContext()` call with `buildCompetitorBackedContext()` when auto-generating missing suggestions. Pass the extended context to `generateSuggestions()`.
- [x] T011 [US1] Extend `VideoIdeaCard` in `apps/web/app/(app)/dashboard/components/video-idea-card.tsx` — when `suggestion.sourceContext.provenance` exists, render a source evidence section below the description: show "Based on" label, first source video title + channel name, observed pattern text, and adaptation angle. Use existing card styling patterns. Keep the three action buttons unchanged.
- [x] T012 [US1] Add fallback indicator to `VideoIdeaCard` — when `suggestion.sourceContext.generationMode` is absent or `"profile_only"`, show a subtle "Generated from your channel profile" label instead of source evidence. Add a prompt: "Run competitor research to unlock richer ideas" with link to `/analyze`.
- [x] T013 [US1] Add styles for source evidence display in `apps/web/app/(app)/dashboard/components/video-idea-card.module.css` (or co-located CSS module) — source section with muted background, 4pt grid spacing, thumbnail + text layout for source video reference.

**Checkpoint**: Dashboard suggestions now show competitor-backed evidence. Channels without competitor data see profile-only suggestions with a prompt to research.

---

## Phase 4: User Story 2 — Source-Preserving Idea Actions (Priority: P1)

**Goal**: "Use this idea" and "Save for later" preserve source provenance. Planned ideas display their source context in the editor.

**Independent Test**: Click "Use this idea" on a competitor-backed suggestion. Open the resulting planned idea in the editor. Source videos, pattern, and rationale should be visible.

### Implementation for User Story 2

- [x] T014 [US2] Update `actOnSuggestion` in `apps/web/lib/features/suggestions/use-cases/actOnSuggestion.ts` — when creating a VideoIdea from a suggestion (action = "use" or "save"), extract `provenance` from `suggestion.sourceContext` and pass it as `sourceProvenanceJson` (JSON-stringified) to the idea creation call.
- [x] T015 [US2] Update `createIdea` use-case in `apps/web/lib/features/video-ideas/use-cases/createIdea.ts` — accept optional `sourceProvenanceJson` parameter. Store it in the new database column. Validate with Zod schema if provided.
- [x] T016 [US2] Update ideas `POST` route in `apps/web/app/api/me/channels/[channelId]/ideas/route.ts` — accept `sourceProvenanceJson` in request body, pass to `createIdea`. Update `GET` handler to include `sourceProvenanceJson` in response.
- [x] T017 [US2] Update ideas `GET` route for single idea in `apps/web/app/api/me/channels/[channelId]/ideas/[ideaId]/route.ts` — include `sourceProvenanceJson` in response.
- [x] T018 [US2] Create `IdeaSourceSection` component in `apps/web/app/(app)/videos/components/IdeaSourceSection.tsx` — accepts parsed `SourceProvenance | null`. When non-null: renders a "Source Intelligence" section with `SourceVideoCard` for each source video, pattern text, rationale, and adaptation angle. When null: renders nothing. Uses CSS Modules, keeps under 100 lines.
- [x] T019 [US2] Integrate `IdeaSourceSection` into `IdeaEditorPanel` in `apps/web/app/(app)/videos/components/IdeaEditorPanel.tsx` — parse `idea.sourceProvenanceJson` and render `IdeaSourceSection` above the form fields (below header, before summary input). Pass parsed provenance.
- [x] T020 [US2] Update `actOnSuggestion` to store dismissal metadata — when action is `"dismiss"`, ensure the full `sourceContext` (including provenance with source video IDs and pattern) is preserved on the dismissed suggestion record for future filtering use per FR-016.

**Checkpoint**: Ideas created from suggestions retain full provenance. The idea editor displays source context. Dismissals store metadata.

---

## Phase 5: User Story 3 — View Source / Analyze Source Workflow (Priority: P2)

**Goal**: Users can expand any idea card to see source video details and navigate to the full competitor video analysis.

**Independent Test**: Click "View source" on a competitor-backed suggestion card. Source video details expand inline. Click "Analyze source" to navigate to `/competitors/video/[videoId]`.

### Implementation for User Story 3

- [x] T021 [US3] Create `SourcePanel` component in `apps/web/app/(app)/dashboard/components/source-panel.tsx` — expandable inline panel rendering `SourceVideoCard` for each source video in the provenance, plus the pattern and rationale text. Include an "Analyze source" link per video that navigates to `/competitors/video/[videoId]?channelId={channelId}`. Uses CSS Modules. Keep under 100 lines.
- [x] T022 [US3] Add "View source" toggle to `VideoIdeaCard` in `apps/web/app/(app)/dashboard/components/video-idea-card.tsx` — when provenance exists, add a "View source" button below the source evidence summary. Clicking toggles the `SourcePanel` expansion inline (local state). When provenance is null (profile-only), do not show the button.
- [x] T023 [US3] Wire `SourcePanel` state in `dashboard-client.tsx` at `apps/web/app/(app)/dashboard/components/dashboard-client.tsx` — pass the active channel ID to SourcePanel for building the analyze link. No other wiring needed (SourcePanel is self-contained within the card).
- [x] T024 [US3] Add "View source" capability to planned ideas list — in `apps/web/app/(app)/videos/components/IdeaListItem.tsx`, if the idea has `sourceProvenanceJson`, show a small source indicator icon. The full source view is already in `IdeaSourceSection` in the editor (US2).

**Checkpoint**: Users can inspect source evidence from both dashboard suggestions and planned ideas, and navigate to full competitor analysis.

---

## Phase 6: User Story 4 — Make My Version Flow (Priority: P2)

**Goal**: Users can create a new planned idea with source context from a competitor video analysis page or from a source panel.

**Independent Test**: Navigate to a competitor video analysis page. Click "Make my version." Verify a new planned idea is created with source provenance pre-populated and the idea editor opens.

### Implementation for User Story 4

- [x] T025 [US4] Add "Make my version" button to `VideoDetailShell` in `apps/web/app/(app)/competitors/video/[videoId]/_components/VideoDetailShell.tsx` — render a prominent button in the header area. On click, POST to `/api/me/channels/[channelId]/ideas` with `summary` derived from the video analysis (adaptation angle or remix idea), and `sourceProvenanceJson` built from the current `CompetitorVideoAnalysis` data (video ID, title, channel, stats, pattern from `analysis.whyItsWorking`). Navigate to `/videos?tab=planned&channelId={channelId}&ideaId={newIdeaId}` on success.
- [x] T026 [US4] Add "Make my version" button to `SourcePanel` in `apps/web/app/(app)/dashboard/components/source-panel.tsx` — on click, POST to create idea endpoint with provenance from the suggestion's source data. Navigate to idea editor. Reuse the same creation logic as T025.
- [x] T027 [US4] Update `suggestField` in `apps/web/lib/features/video-ideas/use-cases/suggestField.ts` — when the idea has `sourceProvenanceJson`, parse it and include source context in the field suggestion prompt: add a `SOURCE CONTEXT` section with the source video title, pattern, rationale, and adaptation angle. This makes AI-generated titles, scripts, descriptions, and tags more targeted to the source material.

**Checkpoint**: Users can go from competitor analysis → new idea with context, and from suggestion source panel → new idea. Field suggestions leverage source context.

---

## Phase 7: User Story 5 — On-Demand Competitor-Backed Generation (Priority: P2)

**Goal**: Users can explicitly trigger competitor-backed idea generation from dashboard and planned ideas tab.

**Independent Test**: Click "Find ideas from my niche" on the dashboard. New competitor-backed suggestions appear. Repeat from planned ideas tab.

### Implementation for User Story 5

- [x] T028 [US5] Create `POST /api/me/channels/[channelId]/suggestions/generate` route in `apps/web/app/api/me/channels/[channelId]/suggestions/generate/route.ts` — accepts `{ count: number }` body (default 3). Calls `buildCompetitorBackedContext()` then `generateSuggestions()`. Returns `{ suggestions, generationMode, competitorDataAvailable }`. Uses existing auth and rate limiting patterns.
- [x] T029 [US5] Add "Find ideas from my niche" button to `SuggestionPanel` in `apps/web/app/(app)/dashboard/components/suggestion-panel.tsx` — render below suggestion cards. On click, calls the generate endpoint via `dashboard-client` handler. Shows loading state during generation.
- [x] T030 [US5] Wire on-demand generation in `dashboard-client.tsx` at `apps/web/app/(app)/dashboard/components/dashboard-client.tsx` — add `handleGenerate()` that POSTs to the generate endpoint, replaces current suggestions with the response, and handles error/loading states.
- [x] T031 [US5] Add "Find ideas from my niche" button to `PlannedTabContent` in `apps/web/app/(app)/videos/components/PlannedTabContent.tsx` — render in the left panel header area. On click, calls the generate endpoint. Generated ideas are added to the ideas list as new draft ideas (POST each to the ideas endpoint with provenance). Show loading state.
- [x] T032 [US5] Handle no-competitor-data state — when `competitorDataAvailable` is false in the generate response, show a message: "No competitor data found for your niche. Run a competitor search first to unlock competitor-backed ideas." with a link to `/analyze`. Apply to both dashboard and planned ideas entry points.

**Checkpoint**: Users can trigger on-demand generation from two locations. No-data state is handled gracefully.

---

## Phase 8: User Story 6 — De-emphasize Standalone Competitor Search (Priority: P3)

**Goal**: Competitor intelligence flows primarily through the ideas system. Standalone search remains accessible but is not the primary entry point.

**Independent Test**: Verify `/competitors` page still works. Verify it is not in primary navigation. Verify ideas flow surfaces competitor links contextually.

### Implementation for User Story 6

- [x] T033 [US6] Verify `/competitors` route is not in `primaryNavItems` in `apps/web/lib/shared/nav-config.ts` — confirm no nav changes needed (competitors is already absent from primary nav per research). Document this verification.
- [x] T034 [US6] Add contextual "Research more competitors" link in the fallback state (profile-only suggestions on dashboard) — ensure the link in T012 points to `/analyze` and uses clear copy encouraging the user to run competitor research to improve their ideas.
- [x] T035 [US6] Verify all existing competitor routes remain functional — manually confirm `/competitors` search page, `/competitors/video/[videoId]` detail page, and `/analyze` page work without regressions after all changes.

**Checkpoint**: Competitor search is preserved but the primary value flows through ideas. No routes removed.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Validation, cleanup, and quality assurance across all stories.

- [x] T036 Run `make preflight` and fix any regressions against `.agent/baseline.json`
- [x] T037 Validate end-to-end workflow per `quickstart.md`: competitor search → dashboard suggestions with evidence → use idea → editor with provenance → view source → analyze → make my version → field suggestions with context
- [x] T038 Review all new/modified files for constitution compliance: hexagonal architecture (no forbidden imports), design system (CSS variables, 4pt grid), code minimalism (< 150 lines per file, named exports only)
- [x] T039 Verify backward compatibility: existing suggestions without provenance render correctly, existing ideas without sourceProvenanceJson work in editor, no breaking changes to existing API consumers

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (migration must run first)
- **US1 (Phase 3)**: Depends on Phase 2 (needs types + context builder)
- **US2 (Phase 4)**: Depends on Phase 2 (needs types + schemas). Can run in parallel with US1 but benefits from US1 being done first (suggestions need to produce provenance before actions can preserve it).
- **US3 (Phase 5)**: Depends on US1 (needs provenance-bearing suggestion cards to add View Source to)
- **US4 (Phase 6)**: Depends on US2 (needs idea creation with provenance to work). Can run in parallel with US3.
- **US5 (Phase 7)**: Depends on Phase 2 only (generation endpoint is independent). Can run in parallel with US3/US4.
- **US6 (Phase 8)**: No code dependencies. Can run anytime after Phase 2.
- **Polish (Phase 9)**: Depends on all phases complete.

### Recommended Execution Order (Single Developer)

```
Phase 1 → Phase 2 → US1 → US2 → US3 + US4 (parallel) → US5 → US6 → Polish
```

### Parallel Opportunities

```
Phase 2: T003 + T004 + T005 + T006 + T008 (all different files)
US1 + US5: Can overlap — US5 endpoint reuses same context builder
US3 + US4: Can overlap — different UI surfaces
US6: Can run anytime after Phase 2
```

---

## Parallel Example: Phase 2 (Foundational)

```bash
# All different files, can run in parallel:
Task: T003 "Define SourceProvenance types in suggestions/types.ts"
Task: T004 "Add SourceProvenance Zod schema in suggestions/schemas.ts"
Task: T005 "Extend VideoIdea type in video-ideas/types.ts"
Task: T006 "Add sourceProvenanceJson to create schema in video-ideas/schemas.ts"
Task: T008 "Create SourceVideoCard component in components/features/ideas/"
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Schema migration
2. Complete Phase 2: Types, schemas, context builder, reusable component
3. Complete Phase 3: US1 — Competitor-backed dashboard suggestions
4. **STOP and VALIDATE**: Dashboard shows competitor-backed suggestions with source evidence
5. This alone delivers the core value shift from generic → evidence-backed ideas

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Competitor-backed suggestions visible (MVP!)
3. US2 → Provenance preserved when acting on suggestions
4. US3 → View source / analyze source flow works
5. US4 → Make my version flow works
6. US5 → On-demand generation available
7. US6 → Navigation polish
8. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No test tasks generated (not requested). Validation via `make preflight` + quickstart.md
- sourceProvenanceJson is immutable after creation (not updatable via PATCH)
- All competitor data is from cache — no live YouTube API calls during generation
- Backward compatibility is critical: old suggestions/ideas without provenance must still work

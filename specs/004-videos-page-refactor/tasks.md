# Tasks: Videos Page Refactor

**Input**: Design documents from `/specs/004-videos-page-refactor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contracts.md

**Tests**: Not explicitly requested — test tasks omitted. Validation via `make preflight`.

**Organization**: Tasks grouped by user story. US1+US2 combined (both P1, tightly coupled). US3+US4 combined (both P2, share all components).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Paths relative to `apps/web/`

---

## Phase 1: Setup

**Purpose**: Database model and feature domain scaffolding

- [X] T001 Add `VideoIdea` model to `apps/web/prisma/schema.prisma` with fields per data-model.md (id, userId, channelId, summary, title, script, description, tags, postDate, status, createdAt, updatedAt). Add `videoIdeas VideoIdea[]` relation to User and Channel models. Add indexes.
- [X] T002 Generate and apply Prisma migration: `bunx prisma migrate dev --name add_video_ideas` then `bunx prisma generate`
- [X] T003 [P] Create `apps/web/lib/features/video-ideas/types.ts` with domain types: `VideoIdeaStatus`, `VideoIdea`, `CreateIdeaInput`, `UpdateIdeaInput`, `SuggestableField`, `SuggestFieldInput`, `SuggestFieldResult` per data-model.md
- [X] T004 [P] Create `apps/web/lib/features/video-ideas/schemas.ts` with Zod schemas: `IdeaParamsSchema`, `IdeaDetailParamsSchema`, `CreateIdeaBodySchema`, `UpdateIdeaBodySchema`, `SuggestFieldBodySchema` per data-model.md
- [X] T005 [P] Create `apps/web/lib/features/video-ideas/errors.ts` with `VideoIdeaError` extending `DomainError` from `@/lib/shared/errors`. Include error codes: `NOT_FOUND`, `VALIDATION_FAILED`, `GENERATION_FAILED`.
- [X] T006 Create `apps/web/lib/features/video-ideas/index.ts` barrel file exporting types, schemas, errors, and use-cases (add use-case exports as they are created in Phase 2)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: CRUD use-cases and API routes that all UI stories depend on

**CRITICAL**: No UI work can begin until this phase is complete

### Use-Cases

- [X] T007 [P] Create `apps/web/lib/features/video-ideas/use-cases/createIdea.ts` — accepts `CreateIdeaInput`, persists via Prisma, returns `VideoIdea`. Transform tags array to JSON string for storage, parse back on return.
- [X] T008 [P] Create `apps/web/lib/features/video-ideas/use-cases/listIdeas.ts` — accepts userId + channelId + optional status filter, returns `VideoIdea[]` ordered by createdAt desc. Parse tags JSON string back to array.
- [X] T009 [P] Create `apps/web/lib/features/video-ideas/use-cases/getIdea.ts` — accepts userId + ideaId, returns `VideoIdea` or throws `NOT_FOUND` error.
- [X] T010 [P] Create `apps/web/lib/features/video-ideas/use-cases/updateIdea.ts` — accepts ideaId + userId + `UpdateIdeaInput`, partial update via Prisma, returns updated `VideoIdea`. Transform tags if provided.
- [X] T011 [P] Create `apps/web/lib/features/video-ideas/use-cases/deleteIdea.ts` — accepts ideaId + userId, deletes via Prisma, throws `NOT_FOUND` if missing.

### API Routes

- [X] T012 Create `apps/web/app/api/me/channels/[channelId]/ideas/route.ts` — GET handler (list ideas using `listIdeas`) and POST handler (create idea using `createIdea`). Use `createApiRoute()` middleware, `withValidation()` for schemas, `toApiError()` for error mapping. Follow existing suggestions route pattern.
- [X] T013 Create `apps/web/app/api/me/channels/[channelId]/ideas/[ideaId]/route.ts` — GET (getIdea), PATCH (updateIdea), DELETE (deleteIdea) handlers. Same middleware pattern as T012.
- [X] T014 Update `apps/web/lib/features/video-ideas/index.ts` barrel to export all use-cases and schemas created in T007-T013

**Checkpoint**: CRUD API is functional. Can test via curl/Postman: POST to create an idea, GET to list, PATCH to update, DELETE to remove.

---

## Phase 3: User Story 1 + User Story 2 — Published Tab & Tab Switching (Priority: P1) MVP

**Goal**: Add pill-style tab toggle to Videos page. Published tab works identically to current behavior (zero regressions). Switching to Planned tab shows placeholder content. Tab state preserved across switches.

**Independent Test**: Navigate to /videos → Published tab active with existing video list → click video → analysis panel works → click "Planned" → left panel changes → click "Published" → previous video still selected → full report still accessible.

### Implementation

- [X] T015 [P] [US1+US2] Create `apps/web/app/videos/components/TabToggle.tsx` — pill-style toggle with "Published" and "Planned" buttons. Active tab: `var(--color-imperial-blue)` background, white text. Inactive: `var(--color-lavender-mist)` background, muted text (30% opacity). Rounded pill shape (20px border-radius), 42px height. Props: `activeTab: "published" | "planned"`, `onTabChange: (tab) => void`. Named export only.
- [X] T016 [P] [US1+US2] Create `apps/web/app/videos/components/tab-toggle.module.css` — styles for tab toggle per Figma: container with `var(--color-lavender-mist)` background, rounded-20px, active pill with `var(--color-imperial-blue)` background. Typography: Fustat Bold, 24px, 0.72px tracking.
- [X] T017 [US1+US2] Refactor `apps/web/app/videos/components/SplitPanel.tsx` — add `tab` prop (`"published" | "planned"`), add `PlannedIdeasList`-related props for planned tab (ideas, selectedIdeaId, onSelectIdea, onNewIdea). Render `TabToggle` at top of left panel. When `tab === "published"`: render existing `VideoList` in left, existing `OverviewPanel`/`VideoDetailPanel` in right (unchanged). When `tab === "planned"`: render planned content placeholder in left panel (will be replaced in Phase 4). Keep under 150 lines by delegating to sub-components.
- [X] T018 [US1+US2] Refactor `apps/web/app/videos/DashboardClient.tsx` — add `tab` state (`"published" | "planned"`, default "published"). Add `selectedIdeaId` state for planned tab. Pass `tab` and `onTabChange` to SplitPanel. Preserve existing `selectedVideoId` state independently of tab switches. When tab changes, keep each tab's selection state.
- [X] T019 [US1+US2] Update `apps/web/app/videos/style.module.css` — add styles for tab container positioning within left panel header. Ensure tab toggle sits above the list content with proper spacing (16px padding).
- [X] T020 [US1+US2] Run `make preflight` and verify zero regressions. Published tab must render identically to pre-refactor. Tab toggle must be visible and switch state.

**Checkpoint**: Published tab works exactly as before with new tab toggle visible. Clicking "Planned" switches the tab (shows placeholder). Clicking back to "Published" restores previous state. Full report and all analysis features work. `make preflight` passes.

---

## Phase 4: User Story 3 + User Story 4 — Create & Edit Planned Ideas (Priority: P2)

**Goal**: Planned tab shows a list of saved ideas with "Start a new idea" card at top. Clicking "Start a new idea" opens the editor form. Clicking an existing idea opens it for editing. Save persists to database.

**Independent Test**: Switch to Planned tab → see "Start a new idea" card → click it → editor form appears with all 6 fields → fill summary + title → click "Save Idea" → idea appears in left list → click the idea → editor shows saved values → edit title → save → list updates.

### Implementation

- [X] T021 [P] [US3+US4] Create `apps/web/app/videos/components/NewIdeaCard.tsx` — card with plus icon and helper text ("Start a new idea" title, descriptive subtitle). Selected state: `var(--color-hot-rose)` border. Background: white with `var(--color-lavender-mist)` border. Plus icon at left. Props: `selected: boolean`, `onClick: () => void`. Named export.
- [X] T022 [P] [US3+US4] Create `apps/web/app/videos/components/IdeaListItem.tsx` — card showing idea title and "Planned for MM/DD" date. Selected state: `var(--color-hot-rose)` 2px border. Unselected: `var(--color-lavender-mist)` border. Video play icon at left (matching Published tab card pattern). Props: `idea: VideoIdea`, `selected: boolean`, `onClick: () => void`. Named export.
- [X] T023 [P] [US3+US4] Create `apps/web/app/videos/components/IdeaFormField.tsx` — reusable field component: label row with field name (left) and optional "Suggest" button with sparkle icon (right), input or textarea below, optional character counter. Props: `label: string`, `value: string`, `onChange: (value) => void`, `multiline?: boolean`, `maxLength?: number`, `onSuggest?: () => void`, `suggestLoading?: boolean`, `suggestError?: string | null`, `placeholder?: string`. Use existing `Input` component from `@/components/ui` where possible. Named export.
- [X] T024 [P] [US3+US4] Create `apps/web/app/videos/components/AiHelpBanner.tsx` — info banner: sparkle icon, "Create faster with help" title, description text, info icon at right. Background: `var(--color-lavender-mist)`, rounded-20px. Named export.
- [X] T025 [US3+US4] Create `apps/web/app/videos/components/IdeaEditorPanel.tsx` — right panel for creating/editing ideas. Header: "New Video Draft" title (or idea title if editing) with "Discard" link at top-right. Below header: `AiHelpBanner`. Then 6 `IdeaFormField` instances: Quick video summary (maxLength=150, no suggest), Video Title, Script (multiline), Description, Tags, Post date. "Save Idea" button (navy, rounded-8px) positioned after summary field per Figma. Manages form state via `useState`. On save: calls POST (new) or PATCH (edit) API. Props: `channelId: string`, `idea: VideoIdea | null` (null = new), `onSave: (idea: VideoIdea) => void`, `onDiscard: () => void`. Named export. Keep under 150 lines by using IdeaFormField.
- [X] T026 [US3+US4] Create `apps/web/app/videos/components/idea-editor-panel.module.css` — styles for editor panel: header with title + discard link (flex row, space-between), form fields with proper spacing (gap-24 between sections per Figma), input fields with `var(--color-lavender-mist)` background and `var(--color-imperial-blue)` border (1px solid #9ea3cc), rounded-8px, 51px height for inputs / 151px for script textarea / 66px for summary. Save button: `var(--color-imperial-blue)` bg, white text, rounded-8px, 35px height.
- [X] T027 [US3+US4] Create `apps/web/app/videos/components/PlannedIdeasList.tsx` — left panel content for Planned tab. Renders `NewIdeaCard` at top, then scrollable list of `IdeaListItem` components. Empty state message when no ideas exist (below NewIdeaCard). Bottom fade gradient matching Figma. Props: `ideas: VideoIdea[]`, `selectedIdeaId: string | null`, `isNewIdeaSelected: boolean`, `onSelectIdea: (id: string) => void`, `onNewIdea: () => void`, `loading: boolean`. Named export.
- [X] T028 [US3+US4] Create `apps/web/app/videos/components/planned-ideas-list.module.css` — styles for ideas list: scrollable container, card spacing (gap-16 per Figma pattern), bottom fade gradient (`linear-gradient(transparent, white)` 60px height), empty state text styling.
- [X] T029 [US3+US4] Create `apps/web/app/videos/useVideoIdeas.ts` — hook for fetching and managing planned ideas. Fetches from GET `/api/me/channels/{channelId}/ideas` on mount. Exposes: `ideas`, `loading`, `error`, `createIdea(input)`, `updateIdea(id, input)`, `deleteIdea(id)`, `refetch()`. Auto-refetch after create/update/delete. Follow existing `useVideoLoader` pattern with `useState` + `useEffect`.
- [X] T030 [US3+US4] Update `apps/web/app/videos/components/SplitPanel.tsx` — replace planned tab placeholder with actual components. Left panel: render `PlannedIdeasList` when `tab === "planned"`. Right panel: render `IdeaEditorPanel` when planned tab has a selection (new or existing idea), or empty state when nothing selected.
- [X] T031 [US3+US4] Update `apps/web/app/videos/DashboardClient.tsx` — integrate `useVideoIdeas` hook. Pass ideas data, selection handlers, and CRUD callbacks down to SplitPanel for planned tab. Handle `isNewIdea` state (true when "Start a new idea" is clicked, false when an existing idea is selected). Wire save/discard callbacks.
- [X] T032 [US3+US4] Run `make preflight` and verify zero regressions. Both tabs must work. Creating and editing ideas must persist via API.

**Checkpoint**: Full Planned tab experience works. Can create ideas, see them in list, click to edit, save changes. Published tab still works perfectly. `make preflight` passes.

---

## Phase 5: User Story 5 — AI-Assisted Field Generation (Priority: P3)

**Goal**: Each field in the idea editor (except summary) has a "Suggest" button that triggers AI generation using channel context. Generated content populates the field for user editing.

**Independent Test**: Open idea editor → enter a summary → click "Suggest" on Video Title → loading indicator shows → title field populates with AI-generated text → can edit the generated text → save works.

### Implementation

- [X] T033 [P] [US5] Create `apps/web/lib/features/video-ideas/use-cases/suggestField.ts` — accepts `SuggestFieldInput`, calls `buildContext()` from `@/lib/features/suggestions` to assemble channel context, then calls `callLLM()` with field-specific prompt. System prompt varies by target field (title: catchy YouTube title, script: engaging script outline, description: SEO-optimized description, tags: relevant keyword tags, postDate: optimal posting date). Include current idea state in user prompt so generation is contextual. Returns `SuggestFieldResult`. Use `responseFormat: "json_object"` for structured output.
- [X] T034 [P] [US5] Create `apps/web/app/api/me/channels/[channelId]/ideas/suggest/route.ts` — POST handler using `suggestField` use-case. Validate with `SuggestFieldBodySchema`. Return `{ field, value }`. Handle generation errors with 500 + retryable flag.
- [X] T035 [US5] Update `apps/web/lib/features/video-ideas/index.ts` — export `suggestField` use-case and `SuggestFieldBodySchema`
- [X] T036 [US5] Update `apps/web/app/videos/components/IdeaEditorPanel.tsx` — wire "Suggest" buttons on each field (except summary) to call POST `/api/me/channels/{channelId}/ideas/suggest` with field name and current form state. Track per-field loading state. On success, update the field value. On error, show inline error with retry. Disable field during generation.
- [X] T037 [US5] Run `make preflight` and verify zero regressions. AI suggest must work for all 5 suggestable fields. Published tab unaffected.

**Checkpoint**: AI suggest works for title, script, description, tags, and postDate fields. Loading states show during generation. Errors display with retry option. `make preflight` passes.

---

## Phase 6: User Story 6 — Mobile Responsive (Priority: P3)

**Goal**: The Planned tab works on mobile viewports using the existing SplitPanel responsive pattern (show list OR detail, not both).

**Independent Test**: Resize to <768px → see tab toggle + list → click "Start a new idea" → only editor visible with back button → click back → list returns.

### Implementation

- [X] T038 [US6] Update `apps/web/app/videos/components/SplitPanel.tsx` — ensure the existing `showDetail` / mobile toggle logic works for the Planned tab. When a planned idea or "new idea" is selected on mobile, show only the right panel (IdeaEditorPanel) with back button. Back button clears selection and returns to list. Tab toggle remains visible on mobile list view.
- [X] T039 [US6] Update `apps/web/app/videos/components/tab-toggle.module.css` — ensure tab toggle is touch-friendly on mobile (min 44px tap targets) and doesn't overflow on narrow viewports.
- [X] T040 [US6] Run `make preflight` and verify zero regressions.

**Checkpoint**: Both tabs work on mobile. Published tab mobile behavior unchanged. Planned tab follows same list↔detail toggle pattern. `make preflight` passes.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Empty states, loading states, edge cases, final verification

- [X] T041 [P] Add thoughtful empty state to Planned tab in `apps/web/app/videos/components/PlannedIdeasList.tsx` — show message like "No ideas yet. Start planning your next video!" below the NewIdeaCard when ideas list is empty. Use `EmptyState` component from `@/components/ui` if appropriate.
- [X] T042 [P] Add loading skeleton to `apps/web/app/videos/components/PlannedIdeasList.tsx` — show skeleton cards while ideas are loading (use `Skeleton` from `@/components/ui`).
- [X] T043 [P] Add error state to `apps/web/app/videos/components/PlannedIdeasList.tsx` — show error message with retry button if ideas fetch fails. Use `ErrorBanner` from `@/components/ui`.
- [X] T044 [P] Add loading state to `apps/web/app/videos/components/IdeaEditorPanel.tsx` — disable "Save Idea" button and show spinner while save is in progress. Show success feedback after save completes.
- [X] T045 Verify Figma alignment — review both tab layouts against Figma screenshots. Check: card spacing (118px height per video card, 20px border-radius), panel proportions (left 357px, right 645px on desktop), tab toggle dimensions (42px height, 20px radius), font sizes (heading 20px, body 15px, tab 24px), color usage (all via CSS variables, no hardcoded hex).
- [X] T046 Run final `make preflight` — verify zero regressions against baseline. Output comparison table. Fix any issues.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (Prisma model must exist for use-cases)
- **Phase 3 (US1+US2)**: Depends on Phase 1 only (tab toggle is UI-only, no API dependency)
- **Phase 4 (US3+US4)**: Depends on Phase 2 (needs CRUD API) AND Phase 3 (needs tab/SplitPanel refactor)
- **Phase 5 (US5)**: Depends on Phase 4 (needs editor panel to wire suggest buttons into)
- **Phase 6 (US6)**: Depends on Phase 4 (needs planned tab UI to test mobile)
- **Phase 7 (Polish)**: Depends on Phases 3-6

### User Story Dependencies

- **US1+US2 (P1)**: Independent — only needs Phase 1 setup
- **US3+US4 (P2)**: Depends on US1+US2 (needs tab infrastructure) + Phase 2 (needs API)
- **US5 (P3)**: Depends on US3+US4 (needs editor panel)
- **US6 (P3)**: Depends on US3+US4 (needs planned tab UI)

### Parallel Opportunities

**Phase 1**: T003, T004, T005 can all run in parallel (different files)
**Phase 2**: T007, T008, T009, T010, T011 can all run in parallel (different use-case files)
**Phase 3**: T015, T016 can run in parallel with each other (component + stylesheet)
**Phase 4**: T021, T022, T023, T024 can all run in parallel (independent components)
**Phase 5**: T033, T034 can run in parallel (use-case + route in different files)
**Phase 7**: T041, T042, T043, T044 can all run in parallel (different components/concerns)

---

## Parallel Example: Phase 2 (Foundational)

```text
# All use-cases can be written simultaneously (different files, no interdependency):
Task T007: createIdea.ts
Task T008: listIdeas.ts
Task T009: getIdea.ts
Task T010: updateIdea.ts
Task T011: deleteIdea.ts

# Then sequentially (depends on use-cases):
Task T012: ideas/route.ts (GET + POST)
Task T013: ideas/[ideaId]/route.ts (GET + PATCH + DELETE)
```

## Parallel Example: Phase 4 (Planned Tab UI)

```text
# All leaf components can be built simultaneously:
Task T021: NewIdeaCard.tsx
Task T022: IdeaListItem.tsx
Task T023: IdeaFormField.tsx
Task T024: AiHelpBanner.tsx

# Then compose into containers (depends on leaf components):
Task T025: IdeaEditorPanel.tsx (uses IdeaFormField, AiHelpBanner)
Task T027: PlannedIdeasList.tsx (uses NewIdeaCard, IdeaListItem)

# Then integrate into page (depends on containers):
Task T030: SplitPanel.tsx update
Task T031: DashboardClient.tsx update
```

---

## Implementation Strategy

### MVP First (Phase 1 + 2 + 3 = US1+US2 Only)

1. Complete Phase 1: Setup (Prisma model, types, schemas)
2. Complete Phase 2: Foundational (CRUD use-cases, API routes)
3. Complete Phase 3: US1+US2 (Tab toggle, SplitPanel refactor)
4. **STOP and VALIDATE**: Published tab works identically. Tab toggle visible and switches. `make preflight` passes.
5. This is a shippable increment — existing users see no regressions, new tab UI is present.

### Incremental Delivery

1. Phase 1+2+3 → Tab toggle + Published tab working (MVP)
2. Phase 4 → Planned tab with create/edit ideas (major value add)
3. Phase 5 → AI suggest for fields (differentiation feature)
4. Phase 6 → Mobile responsive for planned tab
5. Phase 7 → Polish, empty states, loading states
6. Each phase is independently shippable and testable

---

## Notes

- All tasks follow verified-change workflow: `make preflight` at each checkpoint
- Use CSS variables exclusively — never hardcode hex values
- Follow hexagonal architecture: use-cases in `lib/features/`, routes in `app/api/`
- One component per file, <150 lines, named exports only
- Reuse existing UI components (`Input`, `Button`, `Skeleton`, `EmptyState`, `ErrorBanner`, `Tag`)
- Reuse `buildContext()` from suggestions feature for AI generation context
- Reuse `callLLM()` from `lib/llm.ts` for AI generation

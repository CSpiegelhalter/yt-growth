# Tasks: Creator Profile Builder

**Input**: Design documents from `/specs/006-creator-profile/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/profile-api.md

**Tests**: Not requested in the feature specification. No test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `apps/web/` (Next.js App Router monorepo)
- **Domain logic**: `apps/web/lib/features/channels/`
- **Page**: `apps/web/app/(app)/channel-profile/`
- **Components**: `apps/web/app/(app)/channel-profile/_components/`
- **Hooks**: `apps/web/lib/hooks/`
- **UI**: `apps/web/components/ui/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Expand schemas, types, and constants to support the multi-tab profile form

- [x] T001 Expand `ChannelProfileInputSchema` in `apps/web/lib/features/channels/schemas.ts` — add optional section objects (`overview`, `ideaGuidance`, `scriptGuidance`, `tagGuidance`, `descriptionGuidance`, `competitors`) with all sub-field schemas per data-model.md. Add `CompetitorEntrySchema` for channel URL, name, and admiration text. Keep existing flat fields (description, categories, etc.) required for backward compatibility.
- [x] T002 Expand types and constants in `apps/web/lib/features/channels/types.ts` — add `CONTENT_STYLES`, `CREATOR_STRENGTHS`, `FORMAT_PREFERENCES`, `SCRIPT_TONES`, `TAG_STYLE_PREFERENCES`, `SEO_PRIORITIES` constant arrays. Update `DEFAULT_PROFILE_INPUT` with empty section defaults. Add `CompetitorEntry` type export.
- [x] T003 Update `useChannelProfile` hook in `apps/web/lib/hooks/use-channel-profile.ts` — add a `debouncedSave` method that debounces `saveProfile()` at 1500ms. Expose `debouncedSave`, `lastSaveStatus` (idle/saving/saved/error), and a `cancelPendingSave` cleanup. Keep existing `saveProfile` for immediate saves.

**Checkpoint**: Schema, types, and hook are ready. Existing functionality unbroken.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared UI components that all tabs will use

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 [P] Create `ProfileTabNav` component in `apps/web/app/(app)/channel-profile/_components/ProfileTabNav.tsx` + `ProfileTabNav.module.css` — vertical tab list matching Figma (tab labels: Overview, New idea guidance, Script guidance, Tag guidance, Description guidance, Competitors). Active tab has dark pill background with white text. Props: `tabs`, `activeTab`, `onTabChange`. Use CSS variables for colors (`--color-imperial-blue` for active pill, `--color-imperial-blue` at 80% opacity for inactive text). Follow 4pt grid spacing.
- [x] T005 [P] Create `ProfileQuestionField` component in `apps/web/app/(app)/channel-profile/_components/ProfileQuestionField.tsx` + `ProfileQuestionField.module.css` — reusable question row with bold label, optional "Suggest" button (sparkle icon + "Suggest" text, right-aligned), and a slot for the input element (children). Props: `label`, `showSuggest?`, `onSuggest?`, `children`. Match Figma: label is 18px bold `--color-imperial-blue`, suggest button is 15px medium with sparkle icon.
- [x] T006 [P] Create `ProfileInfoBanner` component in `apps/web/app/(app)/channel-profile/_components/ProfileInfoBanner.tsx` + `ProfileInfoBanner.module.css` — dismissible info banner matching Figma (rounded-20px light background, sparkle icon, bold title "These sections are important to complete", description text, close icon button). Props: `title`, `description`, `onDismiss`. Dismiss state stored in localStorage keyed by tab name.
- [x] T007 [P] Extract `ChipGroup` from `apps/web/app/(app)/channel-profile/_components/ProfileEditor.tsx` into a shared component at `apps/web/app/(app)/channel-profile/_components/ChipGroup.tsx` — reuse the existing `ChipGroup` sub-component pattern (toggle chips with `aria-pressed`, selected state styling). Props: `options`, `selected`, `onToggle`, `disabled?`, `ariaLabel`. Style with CSS Module using existing chip patterns from ProfileEditor.module.css.

**Checkpoint**: Foundation ready — tab navigation, question fields, info banner, and chip group are available for all tab components.

---

## Phase 3: User Story 1 - Fill Out Channel Identity & Content Strategy (Priority: P1) MVP

**Goal**: Creator can fill out the Overview tab with channel identity questions and see data persist across refreshes.

**Independent Test**: Navigate to `/channel-profile?channelId=X`, fill out 3-4 fields on Overview tab, refresh page, confirm data persists.

### Implementation for User Story 1

- [x] T008 [US1] Create `OverviewTab` component in `apps/web/app/(app)/channel-profile/_components/OverviewTab.tsx` — render 5 question fields using `ProfileQuestionField`: (1) Channel description (textarea, max 2000), (2) Core topics (tag-style text input where user types and presses Enter to add chips, max 20), (3) Known for (single-line input, max 500), (4) Content styles (ChipGroup with `CONTENT_STYLES` options), (5) Creator strengths (ChipGroup with `CREATOR_STRENGTHS` options). Each field calls `onFieldChange(sectionKey, fieldKey, value)` on change. Include `ProfileInfoBanner` at top with message about why completing this section improves AI suggestions.
- [x] T009 [US1] Refactor `ChannelProfileClient` in `apps/web/app/(app)/channel-profile/ChannelProfileClient.tsx` — replace current single-form layout with tabbed layout: page title "Profile" + subtitle at top, `ProfileTabNav` on left, white rounded card container on right showing active tab content. Manage tab state with `useState` + URL hash sync. Wire `debouncedSave` from updated hook to tab `onFieldChange` callbacks. Show global "Saved" / "Saving..." indicator. Remove old `ProfileEditor` import and usage.
- [x] T010 [US1] Update page styles in `apps/web/app/(app)/channel-profile/style.module.css` — refactor to match Figma layout: flex row with tab nav on left (fixed width ~230px), content card on right (white background, 20px border-radius, shadow `0px 4px 4px rgba(0,0,0,0.08)`, border `1px solid var(--color-border)`). Page header spans full width above. Use CSS variables and 4pt grid. Remove old header/editor/AI-summary styles.
- [x] T011 [US1] Create shared tab content styles in `apps/web/app/(app)/channel-profile/_components/tab-content.module.css` — common styles for all tab interiors: section spacing (var(--space-lg) gap), input fields (rounded-8px, light bg `var(--color-surface-2)`, border `1px solid var(--color-border)`, 51px height for single-line, 151px for textarea), placeholder styling (30% opacity). Match Figma input appearance.

**Checkpoint**: Overview tab is fully functional with auto-save. Creator can fill out channel identity and see it persist.

---

## Phase 4: User Story 2 - Define New Idea Guidance Preferences (Priority: P1)

**Goal**: Creator can switch to "New idea guidance" tab and fill out questions about video idea preferences.

**Independent Test**: Switch to "New idea guidance" tab, fill out all fields, refresh, confirm persistence. Verify "Suggest" buttons are visible.

### Implementation for User Story 2

- [x] T012 [P] [US2] Create `IdeaGuidanceTab` component in `apps/web/app/(app)/channel-profile/_components/IdeaGuidanceTab.tsx` — render 5 question fields using `ProfileQuestionField` with `showSuggest={true}`: (1) Topics to lean into (textarea, max 2000, placeholder: "e.g., budget travel tips, hidden gems in Europe..."), (2) Topics to avoid (textarea, max 2000), (3) Ideal video description (textarea, max 2000), (4) Content format preferences (ChipGroup with `FORMAT_PREFERENCES` options), (5) Viewer feeling (single-line input, max 500). Each field triggers `onFieldChange`. Include `ProfileInfoBanner` with idea-specific encouragement text.
- [x] T013 [US2] Wire `IdeaGuidanceTab` into `ChannelProfileClient` tab rendering — add case for "New idea guidance" tab in the tab content switch. Ensure `onFieldChange` updates the `ideaGuidance` section of the profile input and triggers debounced save.

**Checkpoint**: New idea guidance tab works with auto-save. "Suggest" buttons render as non-functional affordances.

---

## Phase 5: User Story 3 - Add Competitors & Inspiration (Priority: P1)

**Goal**: Creator can add competitor channels at three tiers (close-to-size, aspirational, niche-hero) with URLs and descriptions, displayed as card tiles.

**Independent Test**: Go to Competitors tab, add 2 competitor URLs with descriptions, refresh, verify persistence and card tile display.

### Implementation for User Story 3

- [x] T014 [P] [US3] Create `CompetitorCard` component in `apps/web/app/(app)/channel-profile/_components/CompetitorCard.tsx` + `CompetitorCard.module.css` — card tile matching Figma: rounded-20px light background, bold category label (e.g., "Casual"), channel name below, suggest/edit icon top-right. Props: `entry: CompetitorEntry`, `categoryLabel`, `onRemove?`, `onSuggest?`. Cards display in a horizontal row (3 per row, flex-wrap). Dimensions ~185px wide, 113px tall per Figma.
- [x] T015 [US3] Create `CompetitorsTab` component in `apps/web/app/(app)/channel-profile/_components/CompetitorsTab.tsx` — render three competitor sections matching Figma: (1) "Who are you inspired by but is close to you in size" with sparkle icon, description text, Channel URL input, and row of `CompetitorCard` tiles for saved entries; (2) same structure for aspirational; (3) "Who is your niche hero" section. Each section has "Channel URL" label with optional "Suggest" button, URL input field (placeholder: "youtube.com/channelURL"), and a "What do you admire?" textarea. Below each section, show saved competitors as `CompetitorCard` tiles (max 3). Add (4) "Differentiation" textarea at the bottom: "What should make your channel clearly different from all of them?" Validate YouTube URLs on blur (basic pattern match). Trigger `onFieldChange` for the `competitors` section.
- [x] T016 [US3] Wire `CompetitorsTab` into `ChannelProfileClient` tab rendering — add case for "Competitors" tab. Ensure competitor additions/removals update the `competitors` section and trigger debounced save.

**Checkpoint**: Competitors tab works with URL input, card tiles, and auto-save across all three tiers.

---

## Phase 6: User Story 4 - Configure Script, Tag & Description Guidance (Priority: P2)

**Goal**: Creator can fill out script, tag, and description guidance preferences across three tabs.

**Independent Test**: Fill out fields on each of the three guidance tabs, refresh, confirm persistence.

### Implementation for User Story 4

- [x] T017 [P] [US4] Create `ScriptGuidanceTab` component in `apps/web/app/(app)/channel-profile/_components/ScriptGuidanceTab.tsx` — render 4 question fields using `ProfileQuestionField` with `showSuggest={true}`: (1) Tone (select dropdown with `SCRIPT_TONES` options), (2) Script structure preference (textarea, max 2000, placeholder: "e.g., hook > story > lesson > CTA"), (3) Phrases or style notes (textarea, max 2000), (4) Things to never include (textarea, max 2000). Each field triggers `onFieldChange` for the `scriptGuidance` section.
- [x] T018 [P] [US4] Create `TagGuidanceTab` component in `apps/web/app/(app)/channel-profile/_components/TagGuidanceTab.tsx` — render 3 question fields: (1) Primary keywords (tag-style text input, max 30 items), (2) Niche terms (tag-style text input, max 30 items), (3) Tag style preference (select dropdown with `TAG_STYLE_PREFERENCES` options). Each field triggers `onFieldChange` for the `tagGuidance` section.
- [x] T019 [P] [US4] Create `DescriptionGuidanceTab` component in `apps/web/app/(app)/channel-profile/_components/DescriptionGuidanceTab.tsx` — render 3 question fields: (1) Description format (textarea, max 2000, placeholder: "e.g., summary > timestamps > links > social"), (2) Standard links/CTAs (textarea, max 2000), (3) SEO priority (select dropdown with `SEO_PRIORITIES` options). Each field triggers `onFieldChange` for the `descriptionGuidance` section.
- [x] T020 [US4] Wire all three guidance tabs into `ChannelProfileClient` tab rendering — add cases for "Script guidance", "Tag guidance", and "Description guidance" tabs. Ensure each triggers debounced save for its respective section.

**Checkpoint**: All six tabs are functional with auto-save.

---

## Phase 7: User Story 5 - View Section Completeness Hints (Priority: P3)

**Goal**: Each tab shows a contextual info banner encouraging the creator to complete that section.

**Independent Test**: Visit each tab, verify info banner appears with tab-specific messaging. Dismiss and verify it stays hidden.

### Implementation for User Story 5

- [x] T021 [US5] Add tab-specific info banner content to each tab component — update `OverviewTab`, `IdeaGuidanceTab`, `ScriptGuidanceTab`, `TagGuidanceTab`, `DescriptionGuidanceTab`, and `CompetitorsTab` to pass unique `title` and `description` props to `ProfileInfoBanner`. Each banner should explain why completing that specific section improves AI suggestions (e.g., Overview: "helps us understand your channel identity", Competitors: "enables competitor-aware recommendations"). Use localStorage key pattern `profile-banner-dismissed-{tabId}` for persistence.

**Checkpoint**: All tabs show contextual completeness hints. Dismissing persists across sessions.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, accessibility, and verification

- [x] T022 [P] Delete old `ProfileEditor` component at `apps/web/app/(app)/channel-profile/_components/ProfileEditor.tsx` and `ProfileEditor.module.css` — replaced by individual tab components.
- [x] T023 [P] Add keyboard navigation to `ProfileTabNav` — arrow keys to move between tabs, Enter/Space to select. Ensure focus management when switching tabs (focus moves to first input in new tab content).
- [x] T024 [P] Add responsive styles for mobile — collapse tab nav to horizontal scrollable pills at `< 768px` width. Stack content below tabs. Adjust card container to full-width on mobile.
- [x] T025 Run `make preflight` and fix any regressions — build, lint, knip, madge, depcruise, jscpd must all pass against `.agent/baseline.json`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Phase 2 completion
  - US1 (Phase 3): Must complete first — establishes the tabbed layout shell
  - US2 (Phase 4): Depends on US1 (needs tab shell wired)
  - US3 (Phase 5): Depends on US1 (needs tab shell wired)
  - US4 (Phase 6): Depends on US1 (needs tab shell wired)
  - US5 (Phase 7): Depends on US1-US4 (adds banners to existing tabs)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — establishes tabbed layout, MUST complete before other stories
- **US2 (P1)**: After US1 — can run in parallel with US3, US4 once tab shell exists
- **US3 (P1)**: After US1 — can run in parallel with US2, US4 once tab shell exists
- **US4 (P2)**: After US1 — can run in parallel with US2, US3 once tab shell exists
- **US5 (P3)**: After US1-US4 — adds banners to all existing tabs

### Within Each User Story

- Tab component creation before wiring into ChannelProfileClient
- Schema/type changes (Phase 1) before any tab implementation

### Parallel Opportunities

- T004, T005, T006, T007 can all run in parallel (Phase 2 — different files)
- T012 (IdeaGuidanceTab) can run in parallel with T014 (CompetitorCard) once US1 shell is done
- T017, T018, T019 can all run in parallel (Phase 6 — different tab files)
- T022, T023, T024 can all run in parallel (Phase 8 — different concerns)

---

## Parallel Example: Phase 2 (Foundational)

```text
# Launch all foundational components together:
Task T004: "Create ProfileTabNav in _components/ProfileTabNav.tsx"
Task T005: "Create ProfileQuestionField in _components/ProfileQuestionField.tsx"
Task T006: "Create ProfileInfoBanner in _components/ProfileInfoBanner.tsx"
Task T007: "Extract ChipGroup into _components/ChipGroup.tsx"
```

## Parallel Example: Phase 6 (User Story 4)

```text
# Launch all three guidance tabs together:
Task T017: "Create ScriptGuidanceTab in _components/ScriptGuidanceTab.tsx"
Task T018: "Create TagGuidanceTab in _components/TagGuidanceTab.tsx"
Task T019: "Create DescriptionGuidanceTab in _components/DescriptionGuidanceTab.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T007)
3. Complete Phase 3: User Story 1 (T008-T011)
4. **STOP and VALIDATE**: Navigate to channel-profile, fill Overview tab, refresh, confirm persistence
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational -> Foundation ready
2. Add US1 (Overview tab) -> Test independently -> Deploy (MVP!)
3. Add US2 (Idea guidance) + US3 (Competitors) in parallel -> Test independently -> Deploy
4. Add US4 (Script/Tag/Description guidance) -> Test independently -> Deploy
5. Add US5 (Completeness hints) -> Test -> Deploy
6. Polish (cleanup, a11y, responsive) -> Final deploy

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- No database migration required — `inputJson` TEXT stores expanded JSON
- Existing flat fields preserved for backward compatibility with AI generation pipeline
- "Suggest" buttons are non-functional affordances in this release
- Run `make preflight` after each phase to catch regressions early

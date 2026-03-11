# Tasks: Analyze Page

**Input**: Design documents from `/specs/007-analyze-page/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/analyze-api.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story. US1 (Submit URL), US2 (View Results), and US3 (Back Navigation) are combined into a single P1 phase because they form one inseparable interaction flow.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

All paths relative to `apps/web/` within the monorepo.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extract shared utilities and add navigation entry — prerequisites for all user stories

- [X] T001 [P] Extract shared YouTube URL validation and videoId extraction to `apps/web/lib/shared/youtube-url.ts` — export `validateYouTubeUrl(url: string): string | null` (returns error message or null) and `extractVideoId(url: string): string | null` (returns videoId or null). Support youtube.com/watch?v=, youtu.be/, youtube.com/shorts/, m.youtube.com/watch?v=, youtube.com/embed/ formats. Detect and reject playlist URLs. Reference existing validation in `apps/web/app/(marketing)/tags/TagExtractorClient.tsx` lines 45-68.

- [X] T002 Refactor Tags page to use shared URL validation — update `apps/web/app/(marketing)/tags/TagExtractorClient.tsx` to import `validateYouTubeUrl` from `@/lib/shared/youtube-url` instead of inline `validateUrl`. Remove the inline function.

- [X] T003 [P] Add "Analyzer" nav item to `apps/web/lib/shared/nav-config.ts` — insert into `primaryNavItems` array after "keywords" entry. Use `id: "analyzer"`, `label: "Analyzer"`, `href: "/analyze"`, `icon: "search"`, `channelScoped: false`, `match: (pathname) => pathname === "/analyze"`. Also add a fallback title case in `getPageTitle()` for `/analyze`.

**Checkpoint**: Shared utilities ready, nav item visible in sidebar.

---

## Phase 2: Foundational (API Route)

**Purpose**: The API endpoint that all client-side user stories depend on

**CRITICAL**: Must complete before any UI work begins

- [X] T004 Create Zod validation schema in `apps/web/lib/features/competitors/schemas.ts` — add `AnalyzeUrlSchema` that validates `{ url: z.string().url() }` with a `.refine()` that checks the URL is a valid YouTube URL using `validateYouTubeUrl` from `@/lib/shared/youtube-url` and that `extractVideoId` returns a non-null value. Also reject playlist URLs.

- [X] T005 Create POST API route at `apps/web/app/api/analyze/route.ts` — follow the pattern in `apps/web/app/api/competitors/video/[videoId]/route.ts`. Use `createApiRoute`, `withAuth({ mode: "required" })`, `withRateLimit({ operation: "analyzeVideo" })`, `withValidation({ body: AnalyzeUrlSchema })`. Extract videoId from the validated URL using `extractVideoId`. Get `channelId` from the user's active channel via bootstrap. Call `analyzeVideo({ userId, channelId, videoId, includeMoreFromChannel: false })`. Return `jsonOk(result)`. Handle errors: missing channel → 400, CompetitorError → map to appropriate HTTP status.

**Checkpoint**: `POST /api/analyze` returns `CompetitorVideoAnalysis` for a valid YouTube URL.

---

## Phase 3: User Stories 1+2+3 — Core Two-State Page (Priority: P1) MVP

**Goal**: User can paste a YouTube URL, click Analyze, see results with collapsible sections, and navigate back to input state — all on one page.

**Independent Test**: Paste a valid YouTube URL → click Analyze → see video header + collapsible sections → click back → return to input state.

### Implementation for User Stories 1+2+3

- [X] T006 [P] [US1] Create server page component at `apps/web/app/(app)/analyze/page.tsx` — thin async server component. Set `export const dynamic = "force-dynamic"`. Generate metadata (title: "Analyzer | ChannelBoost", robots: noindex). Call `getAppBootstrapOptional()`. Wrap content in `<AccessGate bootstrap={bootstrap}>`. Render `<AnalyzeClient activeChannelId={bootstrap?.activeChannelId ?? null} />`.

- [X] T007 [P] [US1] Create page styles at `apps/web/app/(app)/analyze/style.module.css` — mobile-first CSS Modules. Include styles for: `.page` (max-width, padding per design system), `.inputCard` (white background, rounded-20px corners, shadow, border per Figma 221:365), `.inputCardTitle` (20px bold), `.urlLabel` (18px bold), `.urlInput` (background lavender-mist, border, rounded-8px, 51px height), `.analyzeBtn` (imperial-blue background, white text, rounded-8px), `.backLink` (styled like competitor page back link), `.resultsContainer`, `.loadingState`, `.errorState`. Use CSS variables only (--color-imperial-blue, --color-lavender-mist, etc.). All spacing multiples of 4.

- [X] T008 [US1] Create client state machine component at `apps/web/app/(app)/analyze/AnalyzeClient.tsx` — `"use client"` component. Props: `{ activeChannelId: string | null }`. Manage `PageState` discriminated union: `{ view: "input" } | { view: "loading" } | { view: "results"; data: CompetitorVideoAnalysis } | { view: "error"; message: string }`. On submit: validate URL client-side with `validateYouTubeUrl`, set loading, POST to `/api/analyze` with `{ url }` using `apiFetchJson`, transition to results or error. Render `<AnalyzeInput>` for input/error states, loading spinner for loading state, `<AnalyzeResults>` for results state. Import from `@/lib/client/api` for `apiFetchJson` and `isApiClientError`.

- [X] T009 [P] [US1] Create URL input component at `apps/web/app/(app)/analyze/_components/AnalyzeInput.tsx` — matches Figma 221:365 input state. Props: `{ url: string; setUrl: (v: string) => void; loading: boolean; error: string | null; onSubmit: (e: React.FormEvent) => void }`. Render white card with "Enter Video Information" heading, "URL" label, text input (placeholder: "youtube.com/v=..."), "Analyze" button (disabled during loading, shows spinner). Error message below input. Use page styles from `style.module.css`. Follow `apps/web/app/(marketing)/tags/TagsInput.tsx` pattern for accessibility (aria-invalid, aria-describedby).

- [X] T010 [P] [US2] Create video header component at `apps/web/app/(app)/analyze/_components/VideoHeader.tsx` — matches Figma 117:162 top section. Props: `{ video: CompetitorVideoAnalysis["video"]; ageDays: number }`. Render thumbnail (228x130px, rounded-8px via next/image), title (16px bold), publish date, view count, like count, comment count. Reuse `formatCompact` and `formatDate` helpers — extract them from `apps/web/app/(app)/competitors/video/[videoId]/_components/VideoDetailShell.tsx` or duplicate minimally (they're 10-line pure functions). Use `formatDurationBadge` from `@/lib/competitor-utils`.

- [X] T011 [P] [US2] Create collapsible analysis section wrapper at `apps/web/app/(app)/analyze/_components/AnalysisSection.tsx` — thin wrapper around `ReportAccordion` from `@/app/videos/components/full-report/ui/ReportAccordion`. Props: `{ title: string; defaultOpen?: boolean; children: ReactNode }`. Always uses `variant="section"`. Provides consistent section styling for the Analyze page.

- [X] T012 [US2] Create results container at `apps/web/app/(app)/analyze/_components/AnalyzeResults.tsx` — matches Figma 117:162 layout. Props: `{ data: CompetitorVideoAnalysis; onBack: () => void }`. Render: (1) back button "← Analyze another video", (2) `<VideoHeader>` with video data + ageDays from publicSignals, (3) Tags section if tags exist (reuse `TagsSection` from `apps/web/app/(app)/competitors/video/[videoId]/_components/InteractiveHeaderClient.tsx`), (4) "Ways to Outperform" in `<AnalysisSection>` (reuse `WaysToOutperform` from InteractiveHeaderClient), (5) "What's Driving Performance" in `<AnalysisSection>` with `filterObviousInsights` applied (max 4 cards), (6) "Portable Patterns" in `<AnalysisSection>` (max 3 theme cards), (7) "Title Patterns" in `<AnalysisSection>` (max 3), (8) "Make Your Better Version" in `<AnalysisSection>` (max 3 remix cards), (9) Data Limitations if present. Reuse `generateWaysToOutperform` from VideoDetailShell. All section text must use actionable "you/your" framing.

- [X] T013 [US3] Wire back navigation in `apps/web/app/(app)/analyze/AnalyzeClient.tsx` — ensure back button in `AnalyzeResults` calls `onBack` which sets state to `{ view: "input" }`. Clear previous URL or keep it pre-filled. Scroll to top on state transition.

**Checkpoint**: Full P1 flow works — paste URL → analyze → see collapsible results → back to input. All report sections are collapsible via ReportAccordion.

---

## Phase 4: User Story 4 — Truncated Comment Analysis (Priority: P2)

**Goal**: Comment analysis section with 3-line truncated comments, sentiment bar, and expand/collapse per comment.

**Independent Test**: Analyze a video with comments → see truncated comment cards (3 lines max) → click to expand → see full text.

### Implementation for User Story 4

- [X] T014 [P] [US4] Add comment truncation styles to `apps/web/app/(app)/analyze/style.module.css` — add `.commentCard`, `.commentText` (with `-webkit-line-clamp: 3`, `overflow: hidden`, `display: -webkit-box`), `.commentTextExpanded` (no clamp), `.commentToggle` (subtle "Show more" / "Show less" link), `.commentAuthor`, `.commentLikes`, `.sentimentBar` (flex row with colored segments), `.commentThemes` (pill chips). Follow design system spacing (4pt grid).

- [X] T015 [US4] Create comment analysis component at `apps/web/app/(app)/analyze/_components/CommentAnalysis.tsx` — `"use client"` component. Props: `{ comments: CompetitorCommentsAnalysis }`. Render: (1) sentiment bar (positive/neutral/negative percentage bar), (2) recurring themes as chips, (3) top comments list (max 6 initially, "Show more" to reveal rest). Each comment card: author name, like count, truncated text (3-line CSS clamp), "Show more"/"Show less" toggle (useState per comment via Set of expanded IDs). Handle `commentsDisabled` state with message. Handle empty comments gracefully (don't render section).

- [X] T016 [US4] Integrate CommentAnalysis into AnalyzeResults — update `apps/web/app/(app)/analyze/_components/AnalyzeResults.tsx` to render `<CommentAnalysis>` inside an `<AnalysisSection title="Comment Analysis">` between Tags and Ways to Outperform. Only render if `data.comments` exists and `!data.comments.commentsDisabled`. Show "Comments are disabled" message if `commentsDisabled` is true.

**Checkpoint**: Comments display truncated with expand/collapse, sentiment bar, and themes. Graceful handling of disabled/missing comments.

---

## Phase 5: User Story 5 — Search & Keyword Enrichment (Priority: P3)

**Goal**: Surface existing DataForSEO enrichment data (competition difficulty, timing, engagement benchmarks) with actionable framing.

**Independent Test**: Analyze a video → see enrichment sections (if data available) → verify they don't appear when data is missing.

### Implementation for User Story 5

- [X] T017 [P] [US5] Add enrichment styles to `apps/web/app/(app)/analyze/style.module.css` — add `.enrichmentCard`, `.difficultyBadge` (color-coded by Easy/Medium/Hard/Very Hard), `.timingInsight`, `.engagementRow`, `.benchmarkLabel`, `.benchmarkValue`, `.verdictBadge`. Use design system colors and 4pt spacing.

- [X] T018 [US5] Create enrichment section component at `apps/web/app/(app)/analyze/_components/EnrichmentSection.tsx` — Props: `{ strategicInsights: CompetitorVideoAnalysis["strategicInsights"]; publicSignals: CompetitorVideoAnalysis["publicSignals"] }`. Render inside an `<AnalysisSection title="Strategic Insights">`: (1) Competition difficulty score + reasons, (2) Posting timing insight, (3) Engagement benchmarks (like rate, comment rate with verdicts), (4) Opportunity score if available. All text framed as "what this means for you." Render nothing if `strategicInsights` is undefined/null — no empty section.

- [X] T019 [US5] Integrate EnrichmentSection into AnalyzeResults — update `apps/web/app/(app)/analyze/_components/AnalyzeResults.tsx` to render `<EnrichmentSection>` after "Make Your Better Version" section. Only render if `data.strategicInsights` exists. Enrichment is optional — page fully functional without it.

**Checkpoint**: Enrichment data renders when available, is invisible when absent. No broken UI in either case.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, accessibility, and quality gates

- [X] T020 Add loading state UI to `apps/web/app/(app)/analyze/AnalyzeClient.tsx` — show a meaningful loading indicator during analysis (not just a spinner). Include: "Analyzing video..." message, animated skeleton or progress hint. Style in `style.module.css`.

- [X] T021 Add error state handling to `apps/web/app/(app)/analyze/AnalyzeClient.tsx` — map API error codes to user-friendly messages: INVALID_INPUT → "Please enter a valid YouTube video URL", NOT_FOUND → "This video couldn't be found. It may be private or deleted.", RATE_LIMITED → "You've reached your analysis limit. Please try again later.", ENTITLEMENT_EXCEEDED → "You've used all your daily analyses. Upgrade for more.", TIMEOUT → "Analysis took too long. Please try again.", default → "Something went wrong. Please try again." Include a "Try Again" button that returns to input state.

- [X] T022 Handle edge cases in `apps/web/lib/shared/youtube-url.ts` — ensure playlist URLs (containing `list=`) return an error "Please paste a single video URL, not a playlist." Ensure Shorts URLs extract videoId correctly. Ensure URLs with extra query params still extract videoId.

- [X] T023 Add `generateMetadata` SEO to `apps/web/app/(app)/analyze/page.tsx` — set noindex/nofollow (authenticated page), unique title and description.

- [X] T024 Run `make preflight` and fix any regressions — all 6 checks (build, lint, knip, madge, depcruise, jscpd) must pass against `.agent/baseline.json`. Fix any issues found.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on T001 (shared youtube-url utility)
- **US1+2+3 (Phase 3)**: Depends on Phase 2 (API route must exist for client to call)
- **US4 (Phase 4)**: Depends on T012 (AnalyzeResults must exist to integrate into)
- **US5 (Phase 5)**: Depends on T012 (AnalyzeResults must exist to integrate into)
- **Polish (Phase 6)**: Depends on Phase 3 (core page must exist)

### User Story Dependencies

- **US1+2+3 (P1)**: Depends on Phase 2. Core flow — must complete first.
- **US4 (P2)**: Depends on US1+2+3 (needs AnalyzeResults container). Can run in parallel with US5.
- **US5 (P3)**: Depends on US1+2+3 (needs AnalyzeResults container). Can run in parallel with US4.

### Within Phase 3

- T006 (page.tsx) and T007 (styles) can run in parallel
- T009 (AnalyzeInput) and T010 (VideoHeader) and T011 (AnalysisSection) can run in parallel
- T008 (AnalyzeClient) depends on T009 (needs AnalyzeInput component)
- T012 (AnalyzeResults) depends on T010, T011 (needs VideoHeader and AnalysisSection)
- T013 (back navigation) depends on T008 and T012

### Parallel Opportunities

```text
# Phase 1 parallel:
T001 (youtube-url.ts) || T003 (nav-config.ts)

# Phase 3 parallel — scaffold layer:
T006 (page.tsx) || T007 (style.module.css)

# Phase 3 parallel — component layer:
T009 (AnalyzeInput) || T010 (VideoHeader) || T011 (AnalysisSection)

# Phase 4+5 parallel:
T014+T015+T016 (comments) || T017+T018+T019 (enrichment)
```

---

## Implementation Strategy

### MVP First (Phase 1 + 2 + 3 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: API Route (T004-T005)
3. Complete Phase 3: Core Page (T006-T013)
4. **STOP and VALIDATE**: Analyze a real video, verify collapsible sections, verify back navigation
5. Deploy/demo — page is fully functional for core use case

### Incremental Delivery

1. Setup + API Route → Foundation ready
2. Add Core Page (US1+2+3) → **MVP — deployable** (has all P1 stories)
3. Add Comment Truncation (US4) → Enhanced comment display
4. Add Enrichment Rendering (US5) → Full strategic context
5. Polish → Edge cases, loading/error states, preflight pass

### Parallel Team Strategy

With 2 developers after Phase 2:
- Developer A: Phase 3 (core page)
- Developer B: Phase 4 + 5 (comments + enrichment, after T012 exists)

---

## Notes

- No new database schema — analysis pipeline is fully reused
- `ReportAccordion` is imported directly from `app/videos/components/full-report/ui/`
- `TagsSection`, `WaysToOutperform` are imported from competitor video `InteractiveHeaderClient.tsx`
- DataForSEO enrichment surfaces automatically through existing `analyzeVideo` pipeline
- The `analyzeVideo` use-case requires `channelId` — API route must resolve this from the user's active channel
- All CSS must use design system variables (no hardcoded colors/sizes)
- Run `make preflight` as final task — regressions are blockers

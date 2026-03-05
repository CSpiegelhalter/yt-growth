# Tasks: Video Insights & Full Report Performance Optimization

**Input**: Design documents from `/specs/002-video-perf-optimization/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested — test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo**: `apps/web/` for Next.js app
- Prisma schema: `apps/web/prisma/schema.prisma`
- Features: `apps/web/lib/features/<domain>/use-cases/`
- Adapters: `apps/web/lib/adapters/<provider>/`
- Ports: `apps/web/lib/ports/`
- Routes: `apps/web/app/api/me/channels/[channelId]/videos/[videoId]/`

---

## Phase 1: Setup (Schema & Migration)

**Purpose**: Add the 3 new Prisma models and run migration so all subsequent tasks can use them.

- [x] T001 Add `TranscriptCache` model to `apps/web/prisma/schema.prisma` per data-model.md: fields `id` (UUID PK), `videoId` (VARCHAR(32), unique), `rawSegments` (JSON), `fullText` (TEXT), `transcriptHash` (VARCHAR(64)), `analysisJson` (JSON nullable), `analysisHash` (VARCHAR(64) nullable), `fetchedAt` (TIMESTAMPTZ), `expiresAt` (TIMESTAMPTZ), `createdAt`, `updatedAt`. Index on `expiresAt`.
- [x] T002 Add `FullReportSectionCache` model to `apps/web/prisma/schema.prisma` per data-model.md: fields `id` (UUID PK), `videoId` (VARCHAR(32)), `sectionKey` (VARCHAR(32)), `contentHash` (VARCHAR(64)), `sectionData` (JSON), `cachedUntil` (TIMESTAMPTZ), `createdAt`, `updatedAt`. Unique constraint on `(videoId, sectionKey)`. Indexes on `cachedUntil` and `videoId`.
- [x] T003 Add `ReportGenerationLock` model to `apps/web/prisma/schema.prisma` per data-model.md: fields `id` (UUID PK), `videoId` (VARCHAR(32), unique), `startedAt` (TIMESTAMPTZ), `expiresAt` (TIMESTAMPTZ).
- [x] T004 Generate and run Prisma migration via `make db-migrate` to apply the 3 new models. Verify migration succeeds and `bun prisma generate` updates the client.
- [x] T005 Run `make preflight` to verify schema changes introduce no regressions.

---

## Phase 2: Foundational (Shared Optimizations)

**Purpose**: Parallelization and cache-routing fixes that benefit BOTH user stories. Must complete before story work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T006 Parallelize queries in `apps/web/lib/server/video-insight-context.ts`: After Query 1 (channel ownership) resolves, run Query 2 (`ownedVideoInsightsCache.findFirst`) and Query 3 (`video.findFirst`) in parallel via `Promise.all`. Check Q2's early-exit condition (no `derivedJson`) after both resolve. Per research.md R5.
- [x] T007 Deduplicate SERP call in `apps/web/lib/features/video-insights/use-cases/fetchCompetitiveContext.ts`: Refactor so `fetchSearchRankings` returns its SERP results, then pass the `searchTerms[0]` SERP result to `fetchSimilarVideos` instead of making a duplicate `port.getYouTubeSerp` call. Per research.md R4.
- [x] T008 Route competitive context SERP calls through `KeywordCache` in `apps/web/lib/features/video-insights/use-cases/fetchCompetitiveContext.ts`: Use `getCachedResponse`/`setCachedResponse` from `apps/web/lib/adapters/dataforseo/cache.ts` (via the `DataForSeoPort`) for all SERP and trends calls, matching the pattern used by keyword research use-cases. Per research.md R3. Note: T007 must complete before T008 (same file).
- [x] T009 Run `make preflight` to verify foundational changes introduce no regressions.

**Checkpoint**: `resolveInsightContext` is faster, competitive context calls are cached and deduplicated. All routes benefit.

---

## Phase 3: User Story 1 — Fast Video Insights Loading (Priority: P1) 🎯 MVP

**Goal**: Video insights (analytics + summary) load responsively. Cold cache <5s to first meaningful content, cached <1s. Analytics display immediately while summary continues loading.

**Independent Test**: Select a video, measure time-to-first-meaningful-content. Verify analytics data appears before summary completes. Select the same video again, verify near-instant cached load.

### Implementation for User Story 1

- [x] T010 [US1] Parallelize analytics and summary fetches in `apps/web/app/videos/components/useVideoInsights.ts`: Currently calls `/insights/analytics` then `/insights/summary` sequentially. Fire both requests concurrently via `Promise.all`. Display analytics data immediately when it resolves (don't wait for summary). Update state progressively — show analytics first, then summary when ready. This addresses US1 acceptance scenario 3 (progressive display of intermediate data).
- [x] T011 [US1] Run `make preflight` to verify US1 changes introduce no regressions.

**Checkpoint**: Insights load progressively (analytics first, summary second). Combined with Phase 2 parallelized queries and cached competitive context, cold-cache insights should be noticeably faster. Cached insights near-instant.

---

## Phase 4: User Story 2 — Fast Full Report Generation (Priority: P1)

**Goal**: Full report sections are cached per-section with 24h TTL. Cache hits serve instantly. Partial hits regenerate only missing sections. Transcript fetching and analysis are cached (7-day). Concurrent requests are deduplicated.

**Independent Test**: Generate a full report, measure time. Generate the same report again, verify <2s load. Change video title, regenerate, verify content-hash invalidation triggers fresh generation.

### Implementation for User Story 2

- [x] T012 [P] [US2] Add transcript cache read to SerpAPI adapter in `apps/web/lib/adapters/serpapi/client.ts`: Before calling SerpAPI, check `TranscriptCache` for a non-expired row matching `videoId`. On cache hit, return cached `rawSegments`/`fullText` without hitting SerpAPI. On miss, fetch from SerpAPI then upsert into `TranscriptCache` with 7-day expiry and computed `transcriptHash`.
- [x] T013 [P] [US2] Extend `SerpApiPort` interface in `apps/web/lib/ports/SerpApiPort.ts`: Add `getCachedTranscript(videoId: string)` and `cacheTranscript(videoId: string, data: TranscriptData)` method signatures so the adapter cache logic is accessed through the port.
- [x] T014 [US2] Cache transcript analysis results in `apps/web/lib/features/transcript-analysis/use-cases/run-transcript-analysis.ts`: Before running the chunk-analyze-synthesize pipeline, check `TranscriptCache.analysisJson` where `analysisHash` matches `SHA256(transcriptHash + videoTitle)`. On hit, return cached analysis. On miss, run the pipeline then write `analysisJson` and `analysisHash` back to `TranscriptCache`. Per research.md R1.
- [x] T015 [US2] Add section cache lookup to `apps/web/lib/features/full-report/use-cases/stream-full-report.ts`: Before running synthesis, query `FullReportSectionCache` for all 5 section keys where `videoId` matches, `cachedUntil > now`, and `contentHash` matches current video metadata hash (use `hashVideoContent` from the existing summary cache logic). Separate sections into cached vs uncached lists.
- [x] T016 [US2] Implement cache-hit fast path in `apps/web/lib/features/full-report/use-cases/stream-full-report.ts`: For cached sections, emit NDJSON `section` events immediately without LLM calls. For uncached sections only, run the existing `gatherReportData` + synthesis pipeline. On full cache hit (all 5 sections cached), skip `gathering`/`synthesizing` phases entirely — emit all section events then `done`.
- [x] T017 [US2] Write section results to cache in `apps/web/lib/features/full-report/use-cases/stream-full-report.ts`: After each section completes synthesis successfully, upsert into `FullReportSectionCache` with `videoId`, `sectionKey`, `contentHash`, `sectionData`, and `cachedUntil = now + 24h`. Use fire-and-forget (don't await the upsert — don't block the stream).
- [x] T018 [P] [US2] Add in-memory request deduplication to `apps/web/app/api/me/channels/[channelId]/videos/[videoId]/full-report/route.ts`: Create a module-level `Map<string, Promise<Response>>` keyed on `videoId`. If a generation is already in-flight for this `videoId`, await the existing promise instead of starting a new one. Clean up the map entry when the promise resolves. Per research.md R6.
- [x] T019 [US2] Add database-level generation lock using `ReportGenerationLock` model in `apps/web/lib/features/full-report/use-cases/stream-full-report.ts`: Before starting generation, attempt to insert a lock row (videoId, startedAt, expiresAt = now+5min). If insert fails (unique constraint), check if existing lock is stale (expiresAt < now) — if stale, overwrite; if fresh, return early or wait. Delete lock on completion (success or failure). Per research.md R6. Note: must run after T015-T017 (same file).
- [x] T020 [US2] Integrate transcript cache with `apps/web/lib/features/full-report/use-cases/gather-report-data.ts`: In `fetchTranscriptAnalysis`, use the cached transcript (from T012) and cached analysis (from T014) so the gather phase skips SerpAPI and LLM calls when cache is warm. The existing `Promise.all` structure in `gatherReportData` is preserved — only the transcript branch short-circuits on cache hit.
- [x] T021 [US2] Run `make preflight` to verify US2 changes introduce no regressions.

**Checkpoint**: Full reports are cached per-section (24h). Transcript fetching and analysis are cached (7-day). Cache hits serve in <2s. Concurrent requests are deduplicated. Partial hits regenerate only missing sections.

---

## Phase 5: User Story 3 — Resilient Loading with Clear Progress (Priority: P2)

**Goal**: Failed sections show per-section retry. External service failures don't block the entire report. Progress indicators reflect actual state.

**Independent Test**: Generate a report. If any section errors, verify it shows a retry button. Clicking retry re-attempts only that section.

### Implementation for User Story 3

- [x] T022 [US3] Add `retryable` flag to error NDJSON events in `apps/web/lib/features/full-report/use-cases/stream-full-report.ts`: When a section synthesis fails due to an external service error (DataForSEO timeout, SerpAPI failure, LLM error), emit `{"type":"error","key":"<sectionKey>","error":"<message>","retryable":true}` instead of the current error event. Per contracts/full-report-cache-api.md.
- [x] T023 [P] [US3] Update `apps/web/app/videos/components/full-report/full-report-types.ts`: Add `retryable?: boolean` to the `SectionState` error type so the reducer can store the retryable flag per section.
- [x] T024 [US3] Update reducer in `apps/web/app/videos/components/full-report/use-full-report.ts`: Handle the new `retryable` field in `sectionError` actions. Store `retryable` in the section state so UI components can read it.
- [x] T025 [P] [US3] Add per-section retry support to `apps/web/app/videos/components/full-report/SectionError.tsx`: Accept an `onRetry` callback prop. When `retryable` is true, render a "Retry" button that calls `onRetry(sectionKey)`. Style using existing design system patterns (button styles from `components/ui`).
- [x] T026 [P] [US3] Add per-section retry API endpoint or query parameter to `apps/web/app/api/me/channels/[channelId]/videos/[videoId]/full-report/route.ts`: Accept an optional `sections` query parameter (comma-separated section keys). When present, only regenerate the specified sections (skip cache lookup, force fresh generation for those keys only). Return NDJSON stream with only the requested sections.
- [x] T027 [US3] Wire per-section retry in `apps/web/app/videos/components/full-report/use-full-report.ts`: Add a `retrySection(key: ReportSectionKey)` function that POSTs to `/full-report?sections=<key>` and dispatches the result into the existing reducer, replacing only the retried section's state.
- [x] T028 [US3] Run `make preflight` to verify US3 changes introduce no regressions.

**Checkpoint**: Failed sections show retry buttons. Retry re-attempts only the failed section. External service failures never block the entire report.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup across all stories.

- [ ] T029 Verify full cold-cache flow end-to-end: select a video with no cached data, confirm insights appear within ~5s (SC-001), generate full report, confirm first section within ~8s (SC-003).
- [ ] T030 Verify full warm-cache flow end-to-end: select a previously viewed video, confirm insights load <1s (SC-002), generate a previously generated report, confirm all sections load <2s (SC-004).
- [ ] T031 Verify content-hash invalidation: change a video's title in the database, regenerate report, confirm stale cache is bypassed and fresh sections are generated.
- [ ] T032 Verify progress feedback timing (SC-006): During cold-cache full report generation, confirm that the first phase status event (`gathering`) arrives within 2 seconds of clicking generate. Verify the phase transitions (`gathering` → `synthesizing` → `done`) update the UI meaningfully. If the existing `FullReportLoading` component doesn't surface phase names, update it to display the current phase text.
- [x] T033 Run final `make preflight` and verify zero regressions against `.agent/baseline.json`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T004 migration must complete)
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **User Story 2 (Phase 4)**: Depends on Phase 2 completion. Can start in parallel with US1.
- **User Story 3 (Phase 5)**: Depends on Phase 4 (builds on full-report streaming infrastructure)
- **Polish (Phase 6)**: Depends on all story phases complete

### User Story Dependencies

- **US1 (P1)**: Independent after Phase 2. Delivers progressive insights loading.
- **US2 (P1)**: Independent after Phase 2. Delivers cached transcripts, cached report sections, request dedup.
- **US3 (P2)**: Depends on US2 (builds on the full-report streaming and section error infrastructure).

### Within Each User Story

- Schema models available from Phase 1
- Cache reads before cache writes (read logic informs write logic)
- Backend changes before frontend changes
- `make preflight` as final task in each phase

### Parallel Opportunities

- T001, T002, T003 can run in parallel (different models in same file — but careful of merge conflicts; recommend sequential for schema.prisma)
- T006, T007 can run in parallel (different files). T008 must follow T007 (same file).
- T012, T013 can run in parallel (different files)
- T015, T018 can run in parallel (different files). T019 must follow T015-T017 (same file as T015-T017).
- T023, T025, T026 can run in parallel (different files)
- US1 (Phase 3) and US2 (Phase 4) can run in parallel after Phase 2

---

## Parallel Example: Phase 2 (Foundational)

```bash
# These touch different files and can run simultaneously:
Task T006: "Parallelize queries in apps/web/lib/server/video-insight-context.ts"
Task T007: "Deduplicate SERP call in apps/web/lib/features/video-insights/use-cases/fetchCompetitiveContext.ts"
# T008 must follow T007 (same file)
```

## Parallel Example: User Story 2

```bash
# These touch different files and can start in parallel:
Task T012: "Transcript cache read in apps/web/lib/adapters/serpapi/client.ts"
Task T013: "Extend SerpApiPort in apps/web/lib/ports/SerpApiPort.ts"
Task T018: "In-memory request dedup in full-report/route.ts"

# These must run sequentially (same file: stream-full-report.ts):
Task T015 → T016 → T017 → T019
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Schema + Migration (T001-T005)
2. Complete Phase 2: Foundational parallelization + cache routing (T006-T009)
3. Complete Phase 3: US1 progressive insights loading (T010-T011)
4. **STOP and VALIDATE**: Test insights loading — analytics should appear before summary, noticeably faster
5. Deploy if ready — this alone delivers significant perceived performance improvement

### Incremental Delivery

1. Setup + Foundational → Foundation ready (parallelized queries, cached SERP)
2. Add US1 → Test independently → Deploy (progressive insights loading)
3. Add US2 → Test independently → Deploy (cached full reports, cached transcripts, request dedup)
4. Add US3 → Test independently → Deploy (per-section retry, graceful degradation)
5. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All cache writes are fire-and-forget (don't block the response stream)
- Content hash function (`hashVideoContent`) is reused from existing summary cache — do not duplicate

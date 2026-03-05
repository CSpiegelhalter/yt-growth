# Feature Specification: Video Insights & Full Report Performance Optimization

**Feature Branch**: `002-video-perf-optimization`
**Created**: 2026-03-04
**Status**: Draft
**Input**: User description: "Video insights and full report on the videos page take too long to load. Multiple sequential API calls, no caching on full reports, and redundant data fetching make the experience unacceptable for production."

## Clarifications

### Session 2026-03-04

- Q: Should the report cache be per-user or shared across all users viewing the same video? → A: Shared cache — any user viewing the same video gets the same cached report.
- Q: How long should cached full report sections remain valid? → A: 24 hours — matches existing analytics cache TTL for consistency. Content-hash invalidation handles mid-TTL data changes.
- Q: When an external service is unavailable during report generation, how should affected sections be handled? → A: Skip and show partial — complete all sections that don't depend on the failed service, mark others as unavailable with a per-section retry option.
- Q: How long should cached transcript data (raw text + analysis) remain valid? → A: 7 days — transcripts rarely change, and this is the most expensive sub-pipeline.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fast Video Insights Loading (Priority: P1)

When a user selects a video on the videos page, the video insights (analytics + summary) load quickly enough that the user perceives the experience as responsive, even on the first uncached load.

**Why this priority**: Video insights are the first thing users see when selecting a video. Slow loading here creates the strongest negative first impression and affects every single user interaction.

**Independent Test**: Can be tested by selecting any video and measuring time-to-first-meaningful-content for the insights panel. Delivers immediate value by making the most common user action feel fast.

**Acceptance Scenarios**:

1. **Given** a user selects a video with no cached data, **When** insights begin loading, **Then** the user sees meaningful content (analytics data) within a few seconds, not left staring at a blank loading state for an extended period.
2. **Given** a user selects a video that was recently viewed (within 24 hours), **When** insights load, **Then** cached results appear near-instantly with no perceptible delay.
3. **Given** the insights panel is loading, **When** intermediate data becomes available, **Then** it is displayed progressively rather than waiting for all data to arrive.

---

### User Story 2 - Fast Full Report Generation (Priority: P1)

When a user generates a full report for a video, sections appear incrementally as they complete. Previously generated reports load instantly without re-running all computations.

**Why this priority**: The full report is the most expensive operation and currently re-runs everything from scratch every time, making it the worst offender for perceived slowness. Caching and parallelization here have the highest impact.

**Independent Test**: Can be tested by generating a full report and measuring time-to-first-section and total completion time. Also tested by generating the same report twice and verifying the second load is near-instant.

**Acceptance Scenarios**:

1. **Given** a user generates a full report for a video, **When** the first section completes processing, **Then** it appears on screen immediately without waiting for all other sections.
2. **Given** a user has previously generated a full report for a video (and the video data hasn't changed), **When** they open the report again, **Then** the cached report loads near-instantly.
3. **Given** a full report is being generated, **When** one section fails, **Then** other sections continue processing and display successfully, and only the failed section shows an error.
4. **Given** a long video with a lengthy transcript, **When** a full report is generated, **Then** the total generation time is noticeably shorter than the current experience.

---

### User Story 3 - Resilient Loading with Clear Progress (Priority: P2)

Users always understand what is happening during data loading. If something takes longer than expected or fails, they receive clear feedback and can take action.

**Why this priority**: Even with performance improvements, some operations will still take time (LLM calls, external APIs). Good progress indication makes acceptable wait times feel shorter and gives users confidence the system is working.

**Independent Test**: Can be tested by observing the UI during report generation — progress indicators should update meaningfully, and error states should offer retry options.

**Acceptance Scenarios**:

1. **Given** a full report is generating, **When** the system progresses through phases (gathering data, analyzing, synthesizing), **Then** the user sees a meaningful progress indicator that reflects actual progress.
2. **Given** an external service (search rankings, transcript provider) is unavailable, **When** the system encounters the failure, **Then** it skips affected sections, completes all independent sections, and marks failed sections as unavailable with a per-section retry option.

---

### Edge Cases

- What happens when a user navigates away from a video mid-report-generation and returns? The previously generated sections should still be available if cached.
- What happens when the cached data has expired but the underlying video data hasn't changed? The system should detect unchanged content and short-circuit expensive recomputation where possible.
- What happens when multiple users request the same report for the same video simultaneously? Only one computation should run; others should wait for and share the result.
- What happens when the video transcript is unavailable (private, no captions)? Report sections that don't depend on the transcript should still generate successfully.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST cache full report results so that previously generated reports can be served without re-running computations.
- **FR-002**: The system MUST parallelize independent data-fetching operations that are currently running sequentially (e.g., the shared pre-flight database queries).
- **FR-003**: The system MUST cache transcript data so that repeated report generations for the same video do not re-fetch and re-process the transcript.
- **FR-004**: The system MUST serve cached report sections individually, allowing partial cache hits (e.g., if 3 of 5 sections are cached, serve those immediately and only regenerate the remaining 2).
- **FR-005**: The system MUST continue processing remaining report sections when one section fails, rather than aborting the entire report.
- **FR-006**: The system MUST provide progressive loading — displaying completed sections as they finish rather than waiting for all sections to complete.
- **FR-007**: The system MUST deduplicate concurrent requests for the same video's report, ensuring only one computation runs while others wait for its result.
- **FR-008**: The system MUST use a content-based cache invalidation strategy (content hash) so that caches are only invalidated when the underlying data actually changes, not purely on time-based expiry.
- **FR-009**: When an external service dependency fails, the system MUST skip affected report sections, complete all independent sections, and present failed sections as unavailable with a per-section retry option — never blocking the entire report.

### Key Entities

- **Report Cache**: Stores completed full report sections per video in a shared cache (not per-user), keyed by video ID and content hash. Contains individual section data, generation timestamp, and 24-hour expiry (matching analytics cache TTL). Any user viewing the same video receives the same cached report.
- **Transcript Cache**: Stores fetched and processed transcript data per video, keyed by video ID. Contains raw transcript text, chunked segments, and analysis results. 7-day expiry (transcripts rarely change).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users see the first piece of meaningful insight content within 5 seconds of selecting a video (cold cache), down from the current 10-30+ seconds.
- **SC-002**: Cached video insights (summary + analytics) load in under 1 second.
- **SC-003**: The first section of a full report appears within 8 seconds of generation start (cold cache).
- **SC-004**: A previously generated full report loads in under 2 seconds on subsequent views.
- **SC-005**: Full report total generation time is reduced by at least 40% compared to the current implementation.
- **SC-006**: Users always see progress feedback within 2 seconds of initiating any loading operation — no extended blank or frozen states.

## Assumptions

- The existing streaming (NDJSON) infrastructure for full reports is sound and should be preserved — the optimization focus is on reducing what needs to be streamed, not changing the streaming mechanism.
- YouTube Analytics API call latency is largely outside our control; the focus is on parallelizing calls and caching results rather than reducing individual call times.
- LLM call latency is variable and outside our control; the focus is on reducing the number of LLM calls through caching and avoiding redundant calls.
- The current 24-hour TTL on analytics cache is appropriate and does not need to change.
- Database storage costs for caching report sections and transcripts are acceptable given the performance gains.

# Research: Video Insights & Full Report Performance Optimization

**Branch**: `002-video-perf-optimization` | **Date**: 2026-03-04

## R1: Transcript Caching Strategy

**Decision**: Cache raw transcript data in a new `TranscriptCache` Prisma model keyed on `videoId`. Cache transcript analysis results (chunk analyses + synthesized report) in the same model as a separate JSON field keyed on `videoId + transcriptHash`.

**Rationale**: The transcript fetch (SerpAPI) and analysis pipeline (N+1 LLM calls) are the single most expensive sub-pipeline in the full report. Transcripts rarely change (only if creator re-uploads captions). A 7-day TTL with content-hash invalidation eliminates the deepest serial chain on repeat requests.

**Alternatives considered**:
- Reuse `OwnedVideoInsightsCache` by adding fields → rejected because that model is per-user-channel-video-range and transcript cache should be shared globally per video.
- In-memory cache (Map) → rejected because server restarts lose the cache and Vercel serverless functions don't share memory.
- Redis/external cache → rejected as over-engineering; Postgres is already the storage layer and latency is acceptable for cache reads.

## R2: Full Report Section Caching Strategy

**Decision**: Cache each of the 5 report sections independently in a new `FullReportSectionCache` Prisma model keyed on `videoId + sectionKey + contentHash`. Shared across all users (not per-user).

**Rationale**: Per-section caching enables partial cache hits (FR-004). If 3 of 5 sections are cached, only 2 need regeneration. The content hash is derived from the same `hashVideoContent` function used by the existing summary cache, ensuring consistency. 24-hour TTL matches the analytics cache.

**Alternatives considered**:
- Single monolithic report cache (all-or-nothing) → rejected because it doesn't support partial hits and requires full regeneration if any input changes.
- Store in `OwnedVideoInsightsCache` → rejected because report cache is shared (not per-user) and the model's unique key includes `userId`.

## R3: Competitive Context Cache Gap

**Decision**: Route `fetchCompetitiveContext` SERP calls through the existing `KeywordCache` infrastructure via the `DataForSeoPort`, matching the pattern already used by the keyword research use-cases.

**Rationale**: The `KeywordCache` model already exists with proper TTLs (1-day SERP, 7-day keywords) and the `getCachedResponse`/`setCachedResponse` helpers are battle-tested. The full-report and summary routes currently bypass this cache entirely, hitting DataForSEO live on every request. Routing through the cache eliminates redundant SERP calls across both the insights summary and full report paths.

**Alternatives considered**:
- Separate cache model for competitive context → rejected as duplicating existing infrastructure.
- Cache at the adapter level → rejected because the adapter is a thin HTTP client; caching belongs at the use-case/port boundary per hexagonal architecture.

## R4: SERP Call Deduplication Within Request

**Decision**: In `fetchCompetitiveContext`, pass the SERP result from `fetchSearchRankings[0]` to `fetchSimilarVideos` instead of making a duplicate call for the same keyword.

**Rationale**: `fetchSimilarVideos` calls `port.getYouTubeSerp` for `searchTerms[0]` — the exact same keyword already fetched by `fetchSearchRankings`. This is a pure waste of one DataForSEO API call per request. Sharing the result eliminates the duplication with minimal code change.

**Alternatives considered**:
- Request-scoped memoization on the port → over-engineering for a single known duplicate.

## R5: `resolveInsightContext` Parallelization

**Decision**: After Query 1 (channel ownership) resolves, run Query 2 (insights cache read) and Query 3 (video publish date) in parallel via `Promise.all`.

**Rationale**: Q2 and Q3 both depend only on `channel.id` from Q1. They are currently sequential, adding unnecessary latency. The early-exit guard on Q2 (returns 400 if no `derivedJson`) is handled by checking the result after both resolve.

**Alternatives considered**:
- Collapse into a single SQL query with a join → rejected because the queries hit different models with different selection needs, and Prisma doesn't support this cleanly.

## R6: Request Deduplication for Concurrent Full Reports

**Decision**: Use an in-memory `Map<string, Promise<void>>` in the full-report route handler to deduplicate concurrent requests for the same `videoId`. If a generation is already in-flight, subsequent requests subscribe to the same stream.

**Rationale**: FR-007 requires that only one computation runs for concurrent requests. An in-memory Map is sufficient because: (a) requests for the same video hit the same serverless instance in practice, and (b) the `ReportGenerationLock` Prisma model provides a fallback for multi-instance scenarios.

**Alternatives considered**:
- Database-only locking (advisory locks) → adds complexity and latency; the in-memory approach handles the common case.
- Redis pub/sub → over-engineering for the current scale.

## R7: Frontend Cache-Hit Handling

**Decision**: When the full-report POST endpoint detects a complete cache hit, return all cached sections as NDJSON events immediately (no streaming delay). The `use-full-report.ts` hook already handles rapid section events correctly via the reducer.

**Rationale**: No frontend changes needed for the fast path — the existing NDJSON stream reader and reducer dispatch sections as they arrive. A cache hit simply means all events arrive in rapid succession. The only UI change needed is adding per-section retry support to `SectionError.tsx` for the graceful degradation requirement (FR-009).

**Alternatives considered**:
- Return a different response format (JSON array) for cache hits → rejected because it would require branching logic in the frontend hook and complicate the contract.

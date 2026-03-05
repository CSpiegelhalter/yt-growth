# Quickstart: Video Insights & Full Report Performance Optimization

**Branch**: `002-video-perf-optimization` | **Date**: 2026-03-04

## Prerequisites

- Bun installed
- Database running (`make db-up`)
- Environment variables configured (see `env.example` at repo root)

## Setup

```bash
# Switch to feature branch
git checkout 002-video-perf-optimization

# Install dependencies
bun install

# Run database migration (after schema changes)
make db-migrate

# Start dev server
make dev
```

## Testing the Changes

### 1. Verify cold-cache performance

1. Open the videos page (`/videos`)
2. Select a video that hasn't been viewed recently
3. Observe: insights should begin appearing within ~5 seconds
4. Click "Generate Full Report"
5. Observe: first section should appear within ~8 seconds

### 2. Verify cache hits

1. After a full report has generated, navigate away from the video
2. Return to the same video
3. Click "Generate Full Report" again
4. Observe: all sections should appear within ~2 seconds (cache hit)

### 3. Verify partial degradation

1. Generate a full report for any video
2. If a section shows an error, verify it has a "Retry" button
3. Clicking retry should re-attempt only that section, not the entire report

### 4. Verify pre-flight

```bash
make preflight
```

All 6 checks must pass with no regressions against `.agent/baseline.json`.

## Key Files Modified

| File | Change |
|------|--------|
| `prisma/schema.prisma` | +3 new cache models |
| `lib/server/video-insight-context.ts` | Parallelize Q2+Q3 |
| `lib/features/full-report/use-cases/stream-full-report.ts` | Section cache + request dedup |
| `lib/features/full-report/use-cases/gather-report-data.ts` | Transcript cache integration |
| `lib/features/transcript-analysis/use-cases/run-transcript-analysis.ts` | Cache analysis results |
| `lib/features/video-insights/use-cases/fetchCompetitiveContext.ts` | Route through KeywordCache, dedup SERP |
| `app/api/.../full-report/route.ts` | Cache-hit fast path |
| `app/videos/components/full-report/use-full-report.ts` | Handle cached responses |
| `app/videos/components/full-report/SectionError.tsx` | Per-section retry |

## Architecture Notes

- All cache models are in Postgres via Prisma (no external cache service)
- Transcript cache: 7-day TTL, shared globally per `videoId`
- Report section cache: 24-hour TTL, shared globally per `videoId + sectionKey`
- Content-hash invalidation ensures stale data is never served even within TTL
- In-memory request deduplication prevents concurrent duplicate computations
- Existing NDJSON streaming contract is fully preserved

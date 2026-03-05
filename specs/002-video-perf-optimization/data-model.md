# Data Model: Video Insights & Full Report Performance Optimization

**Branch**: `002-video-perf-optimization` | **Date**: 2026-03-04

## New Models

### TranscriptCache

Stores raw transcript data and LLM analysis results per video. Shared globally (not per-user).

| Field | Type | Description |
|-------|------|-------------|
| id | UUID (PK) | Auto-generated |
| videoId | VARCHAR(32) | YouTube video ID (unique key) |
| rawSegments | JSON | Raw transcript segments from SerpAPI |
| fullText | TEXT | Concatenated transcript text |
| transcriptHash | VARCHAR(64) | SHA256 of `fullText` for invalidation |
| analysisJson | JSON (nullable) | Chunk analyses + synthesized report output |
| analysisHash | VARCHAR(64, nullable) | Hash of inputs to analysis (transcriptHash + videoTitle) |
| fetchedAt | TIMESTAMPTZ | When transcript was fetched |
| expiresAt | TIMESTAMPTZ | `fetchedAt + 7 days` |
| createdAt | TIMESTAMPTZ | Auto |
| updatedAt | TIMESTAMPTZ | Auto |

**Unique constraint**: `(videoId)`
**Indexes**: `(expiresAt)` for cleanup queries

**Lifecycle**:
- Created on first transcript fetch for a video
- `rawSegments`/`fullText`/`transcriptHash` updated if re-fetched after expiry
- `analysisJson` populated after transcript analysis completes
- `analysisJson` invalidated (set null) if `transcriptHash` changes (new transcript content)
- Rows with `expiresAt < now` are eligible for cleanup (lazy or scheduled)

### FullReportSectionCache

Stores individual report sections. Shared globally (not per-user). One row per video per section.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID (PK) | Auto-generated |
| videoId | VARCHAR(32) | YouTube video ID |
| sectionKey | VARCHAR(32) | One of: `videoAudit`, `discoverability`, `promotionPlaybook`, `retention`, `hookAnalysis` |
| contentHash | VARCHAR(64) | SHA256 of video metadata (title+desc+tags+duration+category) — same as `OwnedVideoInsightsCache.contentHash` |
| sectionData | JSON | The section's output data |
| cachedUntil | TIMESTAMPTZ | `now + 24 hours` |
| createdAt | TIMESTAMPTZ | Auto |
| updatedAt | TIMESTAMPTZ | Auto |

**Unique constraint**: `(videoId, sectionKey)`
**Indexes**: `(cachedUntil)` for cleanup, `(videoId)` for bulk lookups

**Lifecycle**:
- Created when a section completes during report generation
- Cache hit: `cachedUntil > now` AND `contentHash` matches current video metadata
- Cache miss: either expired or content hash differs → regenerate section
- On regeneration, `upsert` replaces the existing row

### ReportGenerationLock

Lightweight lock to prevent duplicate concurrent report generations across server instances.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID (PK) | Auto-generated |
| videoId | VARCHAR(32) | YouTube video ID |
| startedAt | TIMESTAMPTZ | When generation started |
| expiresAt | TIMESTAMPTZ | `startedAt + 5 minutes` (stale lock timeout) |

**Unique constraint**: `(videoId)`

**Lifecycle**:
- Created when report generation starts (insert, not upsert)
- Deleted when generation completes (success or failure)
- Stale locks (`expiresAt < now`) are ignored/overwritten by new requests

## Existing Models (no changes)

### OwnedVideoInsightsCache (reference)

Already caches analytics `derivedJson` (24h TTL) and summary `llmJson` (content-hash + TTL). No modifications needed — the full-report pipeline reads `derivedJson` as input only.

### KeywordCache (reference)

Already caches DataForSEO SERP/trends responses (1-day SERP, 7-day keywords). No schema changes — the optimization is routing full-report competitive context calls through this existing cache via the `DataForSeoPort`.

## Relationships

```
Video (YouTube) ──1:1──> TranscriptCache
                ──1:5──> FullReportSectionCache (one per sectionKey)
                ──0:1──> ReportGenerationLock (transient, during generation only)
                ──1:N──> OwnedVideoInsightsCache (per user+channel+range, existing)
```

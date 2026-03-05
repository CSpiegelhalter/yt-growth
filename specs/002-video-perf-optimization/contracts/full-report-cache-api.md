# Contract: Full Report API (Cache-Enhanced)

**Branch**: `002-video-perf-optimization` | **Date**: 2026-03-04

## POST `/api/me/channels/{channelId}/videos/{videoId}/full-report`

The existing endpoint contract is preserved. The response format (NDJSON stream) is unchanged. The only behavioral difference is **speed** — cached sections are emitted immediately rather than after LLM processing.

### Request (unchanged)

```
POST /api/me/channels/{channelId}/videos/{videoId}/full-report
Content-Type: application/json

{
  "range": "28d"
}
```

### Response: NDJSON Stream (unchanged format, new behavior)

Content-Type: `application/x-ndjson`

Each line is a JSON object with a `type` discriminator:

```jsonl
{"type":"status","phase":"gathering"}
{"type":"section","key":"videoAudit","data":{...}}
{"type":"section","key":"discoverability","data":{...}}
{"type":"status","phase":"synthesizing"}
{"type":"section","key":"promotionPlaybook","data":{...}}
{"type":"section","key":"retention","data":{...}}
{"type":"section","key":"hookAnalysis","data":{...}}
{"type":"done"}
```

**New behavior with caching**:
- **Full cache hit**: All 5 section events emitted immediately (no `gathering`/`synthesizing` phases — goes straight to section events then `done`). Total response time <2s.
- **Partial cache hit**: Cached sections emitted immediately, then `gathering` phase starts for uncached sections only. Uncached sections stream in as they complete.
- **Cache miss**: Identical to current behavior — full `gathering` → `synthesizing` → `done` flow.

**New error event** (per FR-009):

```jsonl
{"type":"error","key":"discoverability","error":"External service unavailable","retryable":true}
```

The `retryable: true` flag indicates the frontend should show a retry button for this specific section.

### Section Keys

| Key | Depends on | Cacheable |
|-----|-----------|-----------|
| `videoAudit` | Analytics derived data only (deterministic) | Yes |
| `discoverability` | Gathered data + LLM synthesis | Yes |
| `promotionPlaybook` | Gathered data + LLM synthesis | Yes |
| `retention` | Gathered data + LLM synthesis | Yes |
| `hookAnalysis` | Gathered data + LLM synthesis | Yes |

### Cache Invalidation

Cache is invalidated when `contentHash` (SHA256 of title + description + tags + duration + category) differs from the stored hash. This is the same hash function used by `OwnedVideoInsightsCache`.

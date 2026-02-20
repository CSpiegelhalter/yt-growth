# Refactor Log

> Tracks consolidation work from DUPLICATE_LOGIC_REPORT.md.

---

## Cluster 1 — Duration Formatting

**Date:** 2026-02-20

### Canonical implementations

| Symbol | File | Signature |
|--------|------|-----------|
| `formatDuration` | `lib/competitor-utils.ts` | `(seconds: number) => string` — human-readable (`"1h 2m"`, `"5s"`, `"—"` for invalid) |
| `formatDurationBadge` | `lib/competitor-utils.ts` | `(seconds: number) => string` — colon format (`"1:02:03"`, `"3:05"`, `"—"` for invalid) |
| `shortFormBadge` (renamed) | `lib/video-tools.ts` | `(durationSec: number \| null) => string \| null` — `"Short"` for ≤60s, else `null` |

### What changed

1. **`app/(app)/video/[videoId]/components/helpers.ts`** — Replaced local `formatDuration` body with `export { formatDuration } from "@/lib/competitor-utils"`. Behavior delta: canonical omits trailing zero-components (`"1h"` instead of `"1h 0m"`), which is an improvement.

2. **`lib/video-tools.ts`** — Renamed `formatDurationBadge` → `shortFormBadge`. This function had completely different semantics (returns `"Short"` label, not colon format) so the rename avoids name collision with the canonical `formatDurationBadge` in `competitor-utils.ts`.

3. **`app/dashboard/DashboardClient.tsx`** — Updated import and call site: `formatDurationBadge` → `shortFormBadge`.

4. **`app/(app)/competitors/video/[videoId]/_components/VideoDetailShell.tsx`** — Removed local `formatDuration` (colon format), replaced with `import { formatDurationBadge } from "@/lib/competitor-utils"`. Behavior is identical (colon format `"H:MM:SS"` / `"M:SS"`).

5. **`app/(app)/subscriber-insights/SubscriberInsightsClient.tsx`** — Removed local `formatDuration` (colon format without hour support), replaced with `import { formatDurationBadge } from "@/lib/competitor-utils"`. Behavior delta: canonical adds hour support (was missing before).

### Deleted

No files deleted. Duplicate function bodies were replaced in-place with imports from canonical sources.

### Behavior notes

- `formatDuration` guards: `seconds < 0 || !isFinite → "—"`. The old `helpers.ts` version lacked this guard; callers are now safer.
- `formatDurationBadge` (colon format) is unchanged in `competitor-utils.ts`.
- `shortFormBadge` is an exact rename of the old `video-tools.ts` `formatDurationBadge` — no logic change.

### Verification

```
bun run typecheck  ✓ (clean)
bun run test:unit  ✓ (657 pass, 0 fail)
bun run lint       ✓ (4 pre-existing warnings, 0 new)
bunx knip          ✓ (pre-existing issues only, 0 new)
```

---

## Cluster 2 — Days Since Publish

**Date:** 2026-02-20

### Canonical implementation

| Symbol | File | Signature |
|--------|------|-----------|
| `daysSince` | `lib/youtube/utils.ts` | `(isoDate: string \| null, nowMs?: number) => number` — returns 0 for null, otherwise max(1, floor(diff/86400000)) |

### What changed

1. **`lib/youtube/utils.ts`** — Widened `daysSince` signature from `string` to `string | null`. Returns `0` for null (matches `daysSincePublish` behavior). Existing callers pass non-null strings, so no behavior change for them.

2. **`lib/video-tools.ts`** — `daysSincePublish` now delegates to `daysSince` from `lib/youtube/utils`. Exported name preserved for backward compatibility. Behavior is identical.

3. **`lib/competitor-search/utils.ts`** — `calculateDerivedMetrics` now imports and uses `daysSince` instead of inlining the same computation. Behavior is identical.

### Not touched (deferred)

Inline `daysSince` computations in `response.ts`, `badges/compute.ts`, and `subscriber-audit/route.ts` have subtle differences (different `now` sources, different null fallbacks). These are better addressed in Cluster 8 (Video Metric Computation).

### Deleted

No exports deleted. `daysSincePublish` remains as a thin wrapper.

### Verification

```
bun run typecheck  ✓ (clean)
bun run test:unit  ✓ (657 pass, 0 fail)
```

---

## Cluster 3 — Subscriber Conversion Rate

**Date:** 2026-02-20

### Canonical implementation

| Symbol | File | Signature |
|--------|------|-----------|
| `calcSubsPerThousandViews` | `lib/video-tools.ts` | `(subsGained: number \| null \| undefined, views: number) => number \| null` |

### What changed

1. **`lib/video-tools.ts`** — Hardened guard from `views === 0` to `views <= 0` to match retention.ts defensive behavior for negative views.

2. **`subscriber-audit/route.ts`** — Switched import from `@/lib/retention` to `@/lib/video-tools`. Applied `?? 0` and `Math.round(x * 100) / 100` at both call sites to preserve the 2-decimal rounding the retention.ts version provided.

### Deleted

| File | Proof |
|------|-------|
| `lib/retention.ts` | `rg -n '@/lib/retention' apps/web` → 0 results; single-function file |
| `lib/__tests__/retention.test.ts` | Only imported from deleted `retention.ts`; `video-tools.test.ts` already covers `calcSubsPerThousandViews` |

### Behavior notes

- Response shape preserved: `subsPerThousand` and `avgSubsPerThousand` in subscriber-audit response still return rounded `number` (not `null`) because all call sites have `views > 0` guards upstream.
- The `views <= 0` guard change affects no real callers (views are always non-negative from YouTube API).

### Verification

```
bun run typecheck  ✓ (clean)
bun run test:unit  ✓ (653 pass, 0 fail — 4 fewer from deleted retention.test.ts)
rg 'retention.ts' → 0 references
```

---

## Cluster 4 — YouTube Video ID Parsing

**Date:** 2026-02-20

### Canonical implementation

| Symbol | File | Signature |
|--------|------|-----------|
| `parseYouTubeVideoId` | `lib/youtube-video-id.ts` | `(url: string) => string \| null` — handles bare IDs, www.youtu.be, all URL formats |
| `validateYouTubeUrl` | `app/(app)/competitors/utils.ts` | `(url: string) => { isValid, videoId, error }` — UX wrapper with specific error messages, now delegates parsing to `parseYouTubeVideoId` |

### What changed

1. **`lib/competitor-search/niche-inference.ts`** — Replaced `validateAndExtractVideoId` import with `parseYouTubeVideoId` from `@/lib/youtube-video-id`.

2. **`app/api/competitors/search/route.ts`** — Same migration. Added direct import of `parseYouTubeVideoId`.

3. **`lib/competitor-search/index.ts`** — Removed re-export of `validateAndExtractVideoId`.

4. **`lib/competitor-search/utils.ts`** — Deleted the `validateAndExtractVideoId` function (49 lines removed).

5. **`app/(app)/competitors/utils.ts`** — Refactored `validateYouTubeUrl` to delegate parsing to `parseYouTubeVideoId` while preserving all error messages. Also gains `www.youtu.be` host support from the canonical parser.

6. **`tests/unit/competitor-search.test.ts`** — Migrated `validateAndExtractVideoId` tests to use `parseYouTubeVideoId`.

### Deleted

| Symbol | Proof |
|--------|-------|
| `validateAndExtractVideoId` from `competitor-search/utils.ts` | `rg 'validateAndExtractVideoId' apps/web` → 0 functional refs (only test description string) |

### Verification

```
bun run typecheck  ✓ (clean)
bun run test:unit  ✓ (653 pass, 0 fail)
rg 'validateAndExtractVideoId' → 0 functional refs
```

---

## Cluster 5 — Cache Key / Hash Generation

**Date:** 2026-02-20

### Canonical implementations

| Symbol | File | Purpose |
|--------|------|---------|
| `stableHash(data)` | `lib/stable-hash.ts` (NEW) | Object → sort keys → JSON.stringify → SHA-256 → hex(32) |
| `sha256Short(input)` | `lib/stable-hash.ts` (NEW) | String → SHA-256 → hex(32) |

### What changed

1. **NEW `lib/stable-hash.ts`** — Extracted shared hashing primitives: `stableHash` (for objects, recursively sorts keys) and `sha256Short` (for pre-formatted strings). Both produce 32-char hex output.

2. **`lib/content-hash.ts`** — All three functions (`hashVideoContent`, `hashSubscriberAuditContent`, `hashCommentsContent`) now use `stableHash` / `sha256Short` instead of inline `createHash` calls. Removed `import { createHash }`.

3. **`lib/dataforseo/utils.ts`** — `generateRequestHash` now uses `stableHash`. Hash output changed from 64 chars to 32 chars (one-time cache invalidation, per report recommendation). Removed `import { createHash }`.

4. **`lib/competitor-search/utils.ts`** — `makeCacheKey` now uses `stableHash`. Removed the redundant `sortObjectKeys` helper (19 lines) and `import crypto`. Key sorting is now handled by `stableHash` internally.

5. **`lib/channel-profile/utils.ts`** — `computeProfileInputHash` switched from MD5 to SHA-256 via `stableHash`. Removed `import crypto`. One-time cache invalidation (per report: "no callers depending on specific hash algorithm").

6. **`tests/unit/dataforseo.test.ts`** — Updated test to expect 32-char hex instead of 64-char.

### Not touched

- `hashNicheForLogging` (djb2 non-crypto hash for logging, different purpose)
- `generateVideoIdeasCacheKey` (delegates to `generateRequestHash`, automatically gets the improvement)

### Behavior notes

- Hash output length changed for `generateRequestHash` (64 → 32 chars) and `computeProfileInputHash` (32 MD5 → 32 SHA-256). This causes one-time cache misses that self-heal on next fetch.
- `stableHash` sorts keys recursively, so object property order no longer affects hash output — more stable.

### Verification

```
bun run typecheck  ✓ (clean)
bun run test:unit  ✓ (653 pass, 0 fail)
```

---

## Cluster 6 — Cache Read/Write Pairs

**Date:** 2026-02-20

### Status: DEFERRED

The report recommended extracting a generic `CacheService<T>` abstraction from multiple Prisma-based cache modules. After exploration, the cache modules use heterogeneous Prisma models, different cache key structures, varying TTL mechanisms (some expiry-based, some stale-while-revalidate), and different error handling strategies. Consolidating these without changing caching semantics is high risk and low ROI. Deferring to a future iteration when the caching layer is better understood or simplified.

---

## Cluster 7 — Rate Limiting

**Date:** 2026-02-20

### What changed

The `RateLimiter` class in `lib/dataforseo/utils.ts` (50 lines) was **dead code** — defined but never instantiated or referenced in any production code. The report recommended consolidating it with `lib/rate-limit.ts:checkRateLimit`, but since it had zero callers, the correct action was deletion.

### Deleted

| Symbol | Proof |
|--------|-------|
| `RateLimiter` class from `lib/dataforseo/utils.ts` | `rg 'RateLimiter' apps/web --type ts` → only definition + test; 0 production callers |
| `RateLimiter` tests from `tests/unit/dataforseo.test.ts` | Tests exercised dead code only |

### Behavior notes

- No runtime behavior change. The class was never used.
- `lib/rate-limit.ts:checkRateLimit` remains the sole rate-limiting mechanism in the codebase.

### Verification

```
bun run typecheck  ✓ (clean)
bun run test:unit  ✓ (650 pass, 0 fail — 3 fewer from deleted RateLimiter tests)
```

---

## Cluster 8 — Video Metric Computation

**Date:** 2026-02-20

### Analysis

The four metric computation functions (`computeMetrics`, `calculateDerivedMetrics`, `computePublicSignals`, `computeDerivedMetrics`) share a core of `viewsPerDay` and `engagementRate` calculations but diverge significantly:

- `viewsPerDay` differs in rounding (some round, some don't), minimum days (0.5 vs 1), and denominator source (daysSincePublish vs daysInRange from analytics period).
- `engagementRate` differs in included signals (some include shares) and output scale (ratio vs percentage).

Forcing these into shared helpers would require behavior changes. Instead, the consolidation focuses on eliminating the duplicated **daysSince date math** (4 inline copies of the same formula) with the canonical `daysSince` from `lib/youtube/utils.ts`.

### What changed

1. **`lib/competitor-utils.ts:computePublicSignals`** — Replaced 5 lines of inline date math (`new Date()`, `Math.max(1, Math.floor(...))`) with `daysSince(input.publishedAt)`. The `videoAgeDays` return value is preserved.

2. **`lib/competitors/video-detail/response.ts:buildVideoObject`** — Replaced 4 lines of inline date math with `daysSince(videoDetails.publishedAt, now.getTime())`. Uses the `nowMs` parameter since this function receives `now: Date` externally.

3. **`lib/badges/compute.ts:getViewsPerDay`** — Replaced 3 lines of inline date math with `daysSince(video.publishedAt)`.

4. **`subscriber-audit/route.ts`** — Replaced 7 lines of inline date math with `daysSince(v.publishedAt.toISOString(), now.getTime())`. Preserves the null fallback (`: 1`) since `daysSince(null)` returns `0` which would cause division by zero.

### Not touched

- **`lib/video-tools.ts:computeMetrics`** — Already delegates to `calcViewsPerDay` which calls `daysSincePublish` which calls `daysSince`. No duplication.
- **`lib/competitor-search/utils.ts:calculateDerivedMetrics`** — Already uses `daysSince` (consolidated in Cluster 2).
- **`lib/owned-video-math.ts:computeDerivedMetrics`** — Uses `daysInRange` from analytics period, not `daysSincePublish`. Different concept entirely.
- Creating `lib/metrics-core.ts` was deemed unnecessary since `lib/video-tools.ts` already exports `calcViewsPerDay`, `calcEngagementRate`, etc. and `daysSince` lives in `lib/youtube/utils.ts`.

### Behavior notes

- All four inline implementations computed exactly `Math.max(1, Math.floor(ms / 86_400_000))`, which is identical to `daysSince`.
- No rounding, caching, or response shape changes.

### Verification

```
bun run typecheck  ✓ (clean)
bun run test:unit  ✓ (650 pass, 0 fail)
```

---

## Cluster 9 — Comments Fetching

**Date:** 2026-02-20

### Status: DEFERRED

`fetchVideoComments` (data-api.ts) catches all errors and returns them as `{ error: string }` in the result object. `fetchOwnedVideoComments` (youtube-analytics.ts) must re-throw `GoogleTokenRefreshError` to trigger re-auth prompts in the UI. If the owned version delegates to `fetchVideoComments`, the `GoogleTokenRefreshError` would be swallowed by the catch-all, breaking the auth reconnect flow. The shared code (URL building + response mapping) is ~10 lines; the bulk of each function is error handling, which fundamentally differs.

---

## Cluster 10 — Text Sanitization

**Date:** 2026-02-20

### Status: DEFERRED

The report stated these functions share "overlapping logic (trim, whitespace normalize, length cap)" but they serve different purposes: `sanitizeNicheText` does whitespace normalization + truncation for search/cache keys; `sanitizeUserText` does XSS prevention (script removal, HTML encoding) with no trimming or truncation. Zero overlapping operations.

---

## Cluster 11 — Active Channel Resolution

**Date:** 2026-02-20

### Status: DEFERRED

The shared logic between server and client `resolveActiveChannelId` is a single `channels.some(c => c.channel_id === id)` check. The server module has `next/navigation` and React `cache` imports (server-only), while the client module uses `localStorage`. Extracting a shared module would require a new file for one line of deduplication.

---

## Cluster 12 — Subscription / Plan Checking

**Date:** 2026-02-20

### Status: DEFERRED

`hasActiveSubscription` considers `cancelAt` (takes min of `cancelAt` and `currentPeriodEnd`) and falls back to checking `status` (active/trialing/past_due). `getPlanFromSubscription` only checks `currentPeriodEnd` and `isActive`. Different business logic — consolidating would change entitlement behavior.

---

## Cluster 13 — Error Classes / Mappers

**Date:** 2026-02-20

### Status: DEFERRED

Only 1 of 10 `VideoDetailError` codes maps directly to `ApiErrorCode`. Making `VideoDetailError` extend `ApiError` would require either adding domain-specific codes to `ApiErrorCode` (polluting the shared type) or losing error specificity in catch blocks. The existing `toApiError` mapper already handles the conversion when needed.

---

## Cluster 14 — Video Sorting

**Date:** 2026-02-20

### Status: NO ACTION (per report)

Report explicitly recommends no consolidation: "the type divergence justifies separate functions."

---

## Cluster 15 — localStorage Persistence

**Date:** 2026-02-20

### What changed

1. **`lib/video-tools.ts`** — `loadVideoToolsState` and `saveVideoToolsState` now use `safeGetItem`/`safeSetItem` from `@/lib/storage/safeLocalStorage` instead of raw `localStorage` calls with manual `typeof window === "undefined"` checks.

### Notes

- The report recommended using `getJSON`/`setJSON`, but those prepend a `"cb_thumbnails_"` prefix which would change storage keys and break existing user data. Using `safeGetItem`/`safeSetItem` (no prefix) provides SSR safety + error handling while preserving key compatibility.
- The `JSON.parse` try-catch remains in `loadVideoToolsState` since `safeGetItem` only handles string access errors, not parse errors.

### Behavior notes

- No behavior change. Same storage keys, same data format, same SSR guard (just via `isLocalStorageAvailable()` instead of `typeof window`).

### Verification

```
bun run typecheck  ✓ (clean)
bun run test:unit  ✓ (650 pass, 0 fail)
```

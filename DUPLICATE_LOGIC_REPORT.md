# Duplicate Logic Report

> Generated 2026-02-20.  READ-ONLY analysis — no code was modified.

## Methodology

1. Inventoried **109 `.ts` files** under `apps/web/lib/`, plus `components/**/helpers.ts`, `app/**/utils.ts`, `app/**/helpers.ts`, and `app/**/serverFetch.ts`.
2. Built function cards (name, path, purpose, I/O, side effects, error handling) for **200+ exported symbols**.
3. Clustered by **semantic intent** (what the function *does*, not what it's named).
4. Verified inbound references with `rg -c '<symbol>' apps/web --glob '*.{ts,tsx}'`.

---

## Cluster 1 — Duration Formatting

| Member | Path | Refs (files) |
|--------|------|-------------|
| `formatDuration` | `lib/competitor-utils.ts` | ~10 |
| `formatDuration` | `app/(app)/video/[videoId]/components/helpers.ts` | ~3 |
| `formatDurationBadge` | `lib/competitor-utils.ts` | ~4 |
| `formatDurationBadge` | `lib/video-tools.ts` | ~3 |

**Differences:**
- `competitor-utils.ts` version: robust guard (`< 0 || !isFinite → "—"`), omits trailing zero components (`1h` instead of `1h 0m`).
- `helpers.ts` version: simpler, no guard for negative/non-finite, always includes sub-components.
- `formatDurationBadge` in `competitor-utils.ts`: returns `"H:MM:SS"` / `"M:SS"` colon format.
- `formatDurationBadge` in `video-tools.ts`: completely different — returns `"Short"` label for ≤60s, else `null`. Same name, different semantics.

**Recommendation:** Keep `competitor-utils.ts` `formatDuration` as canonical (better guards). Have `helpers.ts` import it. Rename `video-tools.ts` `formatDurationBadge` to `contentTypeLabel` or similar to avoid name collision.

**Risk:** Low — the two `formatDuration` functions produce nearly identical output for valid inputs.

**Verification commands:**
```
rg -c 'formatDuration' apps/web --glob '*.{ts,tsx}'
rg -c 'formatDurationBadge' apps/web --glob '*.{ts,tsx}'
```

---

## Cluster 2 — Days Since Publish

| Member | Path | Refs (files) |
|--------|------|-------------|
| `daysSince` | `lib/youtube/utils.ts` | ~3 |
| `daysSincePublish` | `lib/video-tools.ts` | ~9 |

**Differences:**
- `daysSince(isoDate, nowMs?)` — accepts optional `nowMs` for testability, returns `max(1, floor)`.
- `daysSincePublish(publishedAt: string | null)` — accepts nullable string, returns `0` for null, otherwise `max(1, floor)`.

Both compute `Math.max(1, Math.floor((now - published) / 86400000))` for valid dates. The `competitor-search/utils.ts:calculateDerivedMetrics` also inlines the same computation.

**Recommendation:** Consolidate into a single `daysSince(isoDate: string | null, nowMs?: number): number` in `lib/youtube/utils.ts`. Have `video-tools.ts` and `competitor-search/utils.ts` import it.

**Risk:** Low — pure math, easy to verify.

**Verification commands:**
```
rg -c 'daysSince\b' apps/web --glob '*.{ts,tsx}'
rg -c 'daysSincePublish' apps/web --glob '*.{ts,tsx}'
```

---

## Cluster 3 — Subscriber Conversion Rate

| Member | Path | Refs (files) |
|--------|------|-------------|
| `calcSubsPerThousandViews` | `lib/retention.ts` | ~3 (+ 10 test refs) |
| `calcSubsPerThousandViews` | `lib/video-tools.ts` | ~4 (+ 7 test refs) |

**Differences:**
- `retention.ts`: `(number, number) → number` — rounds to 2 decimal places, returns `0` for `views <= 0`.
- `video-tools.ts`: `(number | null | undefined, number) → number | null` — returns `null` if `subsGained` is nullish or `views === 0`; no rounding.

Same formula: `(subsGained / views) * 1000`, but different null handling and rounding.

**Recommendation:** Merge into `video-tools.ts` version (wider signature). Add rounding option or apply rounding at display layer. Delete `lib/retention.ts` (single-function file).

**Risk:** Low — callers already handle null.

**Verification commands:**
```
rg -c 'calcSubsPerThousandViews' apps/web --glob '*.{ts,tsx}'
```

---

## Cluster 4 — YouTube Video ID Parsing

| Member | Path | Refs (files) |
|--------|------|-------------|
| `parseYouTubeVideoId` | `lib/youtube-video-id.ts` | ~5 |
| `validateAndExtractVideoId` | `lib/competitor-search/utils.ts` | ~5 |
| `validateYouTubeUrl` | `app/(app)/competitors/utils.ts` | ~3 |

**Differences:**
- `parseYouTubeVideoId`: most complete — handles bare 11-char IDs, `www.youtu.be`, all path formats. Returns `string | null`.
- `validateAndExtractVideoId`: nearly identical logic, slightly fewer host variants (missing `www.youtu.be`). Returns `string | null`.
- `validateYouTubeUrl`: returns `{ isValid, videoId, error }` result object — extra validation UX layer (empty = valid). Subset of URL patterns.

All three parse the same URL patterns with trivially different host lists and return shapes.

**Recommendation:** Use `parseYouTubeVideoId` as canonical parser. `validateYouTubeUrl` wraps it to add UX result shape. Delete `validateAndExtractVideoId`.

**Risk:** Low — replace 5 call sites.

**Verification commands:**
```
rg -c 'parseYouTubeVideoId' apps/web --glob '*.{ts,tsx}'
rg -c 'validateAndExtractVideoId' apps/web --glob '*.{ts,tsx}'
rg -c 'validateYouTubeUrl' apps/web --glob '*.{ts,tsx}'
```

---

## Cluster 5 — Cache Key / Hash Generation

| Member | Path | Refs (files) |
|--------|------|-------------|
| `generateRequestHash` | `lib/dataforseo/utils.ts` | ~3 (+ 17 test) |
| `hashVideoContent` | `lib/content-hash.ts` | ~3 |
| `hashCommentsContent` | `lib/content-hash.ts` | ~2 |
| `hashSubscriberAuditContent` | `lib/content-hash.ts` | ~2 |
| `computeProfileInputHash` | `lib/channel-profile/utils.ts` | ~4 (+ 10 test) |
| `makeCacheKey` | `lib/competitor-search/utils.ts` | ~4 (+ 14 test) |
| `generateVideoIdeasCacheKey` | `lib/dataforseo/cache.ts` | ~2 |
| `hashNicheForLogging` | `lib/competitor-search/utils.ts` | ~1 |

**Differences:**
- All follow the pattern: normalize input → `JSON.stringify` → `createHash('sha256').update().digest('hex').slice(0, 32)`.
- Exception: `computeProfileInputHash` uses MD5 instead of SHA-256.
- Exception: `hashNicheForLogging` uses a simple djb2-style hash (non-crypto).
- Domain-specific normalization differs (tag sorting, case folding, etc.).

**Recommendation:** Extract a shared `stableHash(data: unknown): string` helper that handles `JSON.stringify(sortKeys(data)) → sha256 → hex.slice(0,32)`. Each domain function becomes a thin wrapper that normalizes then calls `stableHash`. This reduces boilerplate and ensures consistent algorithm choice.

**Risk:** Low — all functions are pure with no callers depending on the specific hash algorithm.

**Verification commands:**
```
rg -c 'generateRequestHash' apps/web --glob '*.{ts,tsx}'
rg -c 'hashVideoContent' apps/web --glob '*.{ts,tsx}'
rg -c 'makeCacheKey' apps/web --glob '*.{ts,tsx}'
rg -c 'computeProfileInputHash' apps/web --glob '*.{ts,tsx}'
rg -c 'generateVideoIdeasCacheKey' apps/web --glob '*.{ts,tsx}'
```

---

## Cluster 6 — Cache Read/Write Pairs (Prisma-backed)

| Member | Path | Refs (files) |
|--------|------|-------------|
| `getCachedResponse` / `setCachedResponse` | `lib/dataforseo/cache.ts` | ~3 / ~4 |
| `getCachedVideoIdeas` / `setCachedVideoIdeas` | `lib/dataforseo/cache.ts` | ~2 / ~1 |
| `getCachedSearchResults` / `setCachedSearchResults` | `lib/competitor-search/cache.ts` | ~3 / ~3 |
| `getCache` / `setCache` | `lib/youtube/cache.ts` | ~2 / ~2 |
| `readCachesParallel` / `saveAnalysisCache` / `saveCommentsCache` | `lib/competitors/video-detail/cache.ts` | ~1 / ~1 / ~1 |

**Differences:**
- All use Prisma upsert/findFirst with a hash key + TTL expiry check.
- DataForSEO cache uses `DataForSeoCacheEntry` model, competitor search uses `CompetitorSearchCache`, YouTube uses `YouTubeSearchCache`, video-detail uses `CompetitorVideo` + `CompetitorComments`.
- Error handling varies: YouTube cache swallows errors; DataForSEO cache throws; competitor search logs warnings.

**Recommendation:** Consider a generic `CacheService<T>` abstraction:
```ts
interface CacheService<T> {
  get(key: string): Promise<T | null>;
  set(key: string, data: T, ttlMs: number): Promise<void>;
}
```
Each domain instantiates with its Prisma model. This would eliminate ~60% of the cache boilerplate. However, the different Prisma models make this a medium-effort refactor.

**Risk:** Medium — touching multiple Prisma models and their callers; needs careful migration.

**Verification commands:**
```
rg -c 'getCachedResponse' apps/web --glob '*.{ts,tsx}'
rg -c 'getCachedSearchResults' apps/web --glob '*.{ts,tsx}'
rg -c 'getCache\b' apps/web/lib/youtube --glob '*.{ts,tsx}'
```

---

## Cluster 7 — Rate Limiting

| Member | Path | Refs (files) |
|--------|------|-------------|
| `checkRateLimit` + `RATE_LIMITS` | `lib/rate-limit.ts` | ~13 / ~15 |
| `RateLimiter` class | `lib/dataforseo/utils.ts` | ~3 |

**Differences:**
- `checkRateLimit`: in-memory Map with periodic cleanup, key-based, returns `{ allowed, remaining, resetAt }`.
- `RateLimiter`: in-memory sliding window (timestamp array), instance-based, returns `boolean`.
- Both are in-process only (no Redis/distributed).

**Recommendation:** Migrate `RateLimiter` callers to use `checkRateLimit` with a new `RATE_LIMITS.dataforseo_api` entry. Delete the class.

**Risk:** Low — `RateLimiter` has only 3 file references.

**Verification commands:**
```
rg -c 'checkRateLimit' apps/web --glob '*.{ts,tsx}'
rg -c 'RateLimiter' apps/web --glob '*.{ts,tsx}'
```

---

## Cluster 8 — Video Metric Computation

| Member | Path | Refs (files) |
|--------|------|-------------|
| `computeMetrics` | `lib/video-tools.ts` | ~2 |
| `calculateDerivedMetrics` | `lib/competitor-search/utils.ts` | ~3 |
| `computePublicSignals` | `lib/competitor-utils.ts` | ~3 |
| `computeDerivedMetrics` | `lib/owned-video-math.ts` | ~2 |

**Differences:**
- `computeMetrics` (video-tools): for dashboard/owned videos. Computes likeRate, viewsPerDay, daysSincePublish, commentRate, engagementRate, subsPerThousandViews, retentionPercent, watchTimeMinutes, contentType.
- `calculateDerivedMetrics` (competitor-search): for competitor videos. Computes viewsPerDay, daysSincePublished, engagementPerView.
- `computePublicSignals` (competitor-utils): for competitor detail. Computes title analysis, duration bucket, chapter detection, hashtag analysis, engagement outlier, external links.
- `computeDerivedMetrics` (owned-video-math): for owned video insights. Computes extensive metrics from Analytics API data (CTR, retention, subscriber rate, etc.).

All share a core of `viewsPerDay` and `engagementRate` calculations, but diverge significantly in scope.

**Recommendation:** Extract shared micro-helpers (`viewsPerDay`, `engagementRate`, `daysSincePublish`) into a `lib/metrics-core.ts` module. Each domain module composes these into its own shape. This avoids duplicating the arithmetic while respecting the different output types.

**Risk:** Medium — four callers with different shapes; requires careful type alignment.

**Verification commands:**
```
rg -c 'computeMetrics' apps/web --glob '*.{ts,tsx}'
rg -c 'calculateDerivedMetrics' apps/web --glob '*.{ts,tsx}'
rg -c 'computePublicSignals' apps/web --glob '*.{ts,tsx}'
rg -c 'computeDerivedMetrics' apps/web --glob '*.{ts,tsx}'
```

---

## Cluster 9 — Comments Fetching

| Member | Path | Refs (files) |
|--------|------|-------------|
| `fetchVideoComments` | `lib/youtube/data-api.ts` | ~5 |
| `fetchOwnedVideoComments` | `lib/youtube-analytics.ts` | ~2 |
| `fetchCommentsWithTimeout` | `lib/competitors/video-detail/youtube.ts` | ~3 |

**Differences:**
- `fetchVideoComments` (data-api): canonical YouTube API call via `youtubeFetch`. Returns `FetchCommentsResult` with `commentsDisabled` flag. Handles quota/scope errors.
- `fetchOwnedVideoComments` (youtube-analytics): uses `googleFetchWithAutoRefresh` directly (bypasses `youtubeFetch`). Returns `VideoComment[]`. Handles `GoogleTokenRefreshError`. Different comment shape (simpler).
- `fetchCommentsWithTimeout` (video-detail): wraps `fetchVideoComments` with `withTimeoutOptional`. Returns `CommentsResult | null`.

`fetchOwnedVideoComments` duplicates the HTTP call logic instead of delegating to `fetchVideoComments`.

**Recommendation:** Refactor `fetchOwnedVideoComments` to call `fetchVideoComments` internally and map the result. This removes the duplicate HTTP/error-handling code.

**Risk:** Low — both call the same YouTube API endpoint.

**Verification commands:**
```
rg -c 'fetchVideoComments' apps/web --glob '*.{ts,tsx}'
rg -c 'fetchOwnedVideoComments' apps/web --glob '*.{ts,tsx}'
rg -c 'fetchCommentsWithTimeout' apps/web --glob '*.{ts,tsx}'
```

---

## Cluster 10 — Text Sanitization

| Member | Path | Refs (files) |
|--------|------|-------------|
| `sanitizeNicheText` | `lib/competitor-search/utils.ts` | ~4 |
| `sanitizeUserText` | `lib/channel-profile/utils.ts` | ~3 |

**Differences:**
- `sanitizeNicheText`: strips control chars, normalizes whitespace, trims to 500 chars.
- `sanitizeUserText`: strips `<script>` tags, HTML tags, trims to 1000 chars, normalizes whitespace.

Both sanitize user-input text with overlapping logic (trim, whitespace normalize, length cap). `sanitizeUserText` is stricter (HTML stripping).

**Recommendation:** Extract a base `sanitizeText(text: string, opts: { maxLen: number; stripHtml?: boolean }): string`. Both callers become thin wrappers.

**Risk:** Low — pure functions, easy to test.

**Verification commands:**
```
rg -c 'sanitizeNicheText' apps/web --glob '*.{ts,tsx}'
rg -c 'sanitizeUserText' apps/web --glob '*.{ts,tsx}'
```

---

## Cluster 11 — Active Channel Resolution

| Member | Path | Refs (files) |
|--------|------|-------------|
| `resolveActiveChannelId` | `lib/server/bootstrap.ts` | ~4 |
| `resolveActiveChannelId` | `lib/use-sync-active-channel.ts` | ~3 (+ 14 test) |

**Differences:**
- **Server version** (`bootstrap.ts`): accepts `Channel[]` + searchParams. Uses URL param or falls back to first channel. Pure function (no localStorage).
- **Client version** (`use-sync-active-channel.ts`): accepts `Array<{ channel_id: string }>` + urlChannelId + initialActiveChannelId. Checks URL → localStorage → server initial → first channel.

Both select an active channel from a list with priority-based fallback. The client version has extra localStorage fallback the server version cannot use.

**Recommendation:** Extract a shared `pickActiveChannel(channels, preferred?: string): string | null` pure function. Server uses `preferred = searchParams.channelId`. Client wraps it with localStorage logic.

**Risk:** Low — well-tested.

**Verification commands:**
```
rg -c 'resolveActiveChannelId' apps/web --glob '*.{ts,tsx}'
```

---

## Cluster 12 — Subscription / Plan Checking

| Member | Path | Refs (files) |
|--------|------|-------------|
| `getPlanFromSubscription` | `lib/entitlements.ts` | ~7 |
| `getSubscriptionStatus` | `lib/stripe.ts` | ~7 |
| `hasActiveSubscription` | `lib/user.ts` | ~7 |
| `checkEntitlement` | `lib/with-entitlements.ts` | ~6 |

**Differences:**
- `getPlanFromSubscription`: pure function, maps subscription object → `"FREE"` / `"PRO"`.
- `getSubscriptionStatus`: DB call, returns full status object with self-healing.
- `hasActiveSubscription`: pure function, checks `isActive && plan !== 'free' && !expired`.
- `checkEntitlement`: orchestrator — calls `getCurrentUserWithSubscription` → `getPlanFromSubscription` → `featureLocked`/`checkAndIncrement`.

These are layered, not duplicated. `hasActiveSubscription` and `getPlanFromSubscription` overlap slightly — both determine "is this a paying user?" from a subscription object.

**Recommendation:** `hasActiveSubscription` can be expressed as `getPlanFromSubscription(sub) !== "FREE"`. Consolidate into entitlements module to reduce surface area.

**Risk:** Low — simple boolean logic.

**Verification commands:**
```
rg -c 'getPlanFromSubscription' apps/web --glob '*.{ts,tsx}'
rg -c 'hasActiveSubscription' apps/web --glob '*.{ts,tsx}'
```

---

## Cluster 13 — Error Classes / Mappers

| Member | Path | Refs (files) |
|--------|------|-------------|
| `ApiError` | `lib/api/errors.ts` | ~30 |
| `VideoDetailError` | `lib/competitors/video-detail/types.ts` | ~6 |
| `TimeoutError` | `lib/competitors/video-detail/timeout.ts` | ~3 |
| `GoogleTokenRefreshError` | `lib/google-tokens.ts` | ~4 |
| `toApiError` | `lib/api/errors.ts` | ~2 |
| `mapDataForSEOError` | `lib/dataforseo/index.ts` | ~4 |

**Differences:**
- `ApiError`: canonical app-wide error class with `code`, `status`, `message`, `details`.
- `VideoDetailError`: domain-specific error with `code` (enum), `statusCode`, `details`.
- `TimeoutError`: extends Error with `operation` and `timeoutMs`.
- `GoogleTokenRefreshError`: extends Error with `code: "TOKEN_REFRESH_FAILED"`.
- `toApiError`: normalizes any error → `ApiError`.
- `mapDataForSEOError`: maps `DataForSEOError` → `ApiError`.

`VideoDetailError` is structurally similar to `ApiError` but uses its own enum codes instead of `ApiErrorCode`.

**Recommendation:** Have `VideoDetailError` extend `ApiError` (add a `domain` field if needed). This makes `toApiError` handle it natively. Keep `TimeoutError` and `GoogleTokenRefreshError` as-is — they carry specialized data.

**Risk:** Medium — `VideoDetailError` is caught by type in 6 files; need to update catch blocks.

**Verification commands:**
```
rg -c 'ApiError' apps/web --glob '*.{ts,tsx}'
rg -c 'VideoDetailError' apps/web --glob '*.{ts,tsx}'
rg -c 'toApiError' apps/web --glob '*.{ts,tsx}'
```

---

## Cluster 14 — Video Sorting

| Member | Path | Refs (files) |
|--------|------|-------------|
| `sortVideos` | `lib/video-tools.ts` | ~3 (+ 10 test) |
| `sortVideos` | `lib/competitor-search/utils.ts` | ~3 (+ 7 test) |

**Differences:**
- `video-tools.ts` version: sorts `VideoWithMetrics[]` by `SortKey` (12 options including CTR, retention, subs).
- `competitor-search/utils.ts` version: sorts `CompetitorVideoResult[]` by `SortOption` (4 options: viewsPerDay, totalViews, newest, engagement).

Different input types and sort option enums. Conceptually similar (sort videos by metric) but operate on incompatible data shapes.

**Recommendation:** No consolidation needed — the type divergence justifies separate functions. Document the naming collision in code comments to prevent future confusion.

**Risk:** N/A.

**Verification commands:**
```
rg -c 'sortVideos' apps/web --glob '*.{ts,tsx}'
```

---

## Cluster 15 — localStorage Persistence

| Member | Path | Refs (files) |
|--------|------|-------------|
| `getJSON` / `setJSON` | `lib/storage/safeLocalStorage.ts` | ~3 each |
| `getJSONWithExpiry` / `setJSONWithExpiry` | `lib/storage/safeLocalStorage.ts` | (internal) |
| `safeGetItem` / `safeSetItem` | `lib/storage/safeLocalStorage.ts` | ~4 each |
| `usePersistentState` | `lib/hooks/usePersistentState.ts` | ~2 |
| `loadVideoToolsState` / `saveVideoToolsState` | `lib/video-tools.ts` | ~2 each |

**Differences:**
- `safeLocalStorage` module: comprehensive, safe wrappers around `localStorage`/`sessionStorage` with error handling, JSON parsing, TTL expiry, prefixed keys.
- `usePersistentState`: React hook built on `getJSON`/`setJSON` — adds hydration safety.
- `loadVideoToolsState`/`saveVideoToolsState`: manual JSON parse/stringify with `localStorage.getItem`/`setItem` — duplicates `getJSON`/`setJSON` logic without the safety.

**Recommendation:** Refactor `loadVideoToolsState`/`saveVideoToolsState` to use `getJSON`/`setJSON` from `safeLocalStorage`. This gains error handling and consistency for free.

**Risk:** Low — drop-in replacement.

**Verification commands:**
```
rg -c 'loadVideoToolsState' apps/web --glob '*.{ts,tsx}'
rg -c 'saveVideoToolsState' apps/web --glob '*.{ts,tsx}'
rg -c 'getJSON\b' apps/web --glob '*.{ts,tsx}'
```

---

## Dead Cluster Candidates

These members have very low reference counts and may be candidates for deletion.

| Symbol | Path | Non-test Refs | Notes |
|--------|------|--------------|-------|
| `useSyncActiveChannelIdToLocalStorage` | `lib/use-sync-active-channel.ts` | 3 | Marked deprecated; `useSyncActiveChannel` is the replacement. 3 client files still reference it. |
| `hashNicheForLogging` | `lib/competitor-search/utils.ts` | ~1 | Only referenced in its own file. Appears unused externally. |

**Verification commands:**
```
rg -c 'useSyncActiveChannelIdToLocalStorage' apps/web --glob '*.{ts,tsx}'
rg -c 'hashNicheForLogging' apps/web --glob '*.{ts,tsx}'
```

---

## Priority Summary

| # | Cluster | Effort | Risk | Impact |
|---|---------|--------|------|--------|
| 1 | YouTube Video ID Parsing (Cluster 4) | Low | Low | Removes 2 redundant parsers |
| 2 | Days Since Publish (Cluster 2) | Low | Low | Eliminates inline duplication in 3 modules |
| 3 | Subscriber Conversion (Cluster 3) | Low | Low | Deletes single-function file |
| 4 | Duration Formatting (Cluster 1) | Low | Low | Single canonical source |
| 5 | Text Sanitization (Cluster 10) | Low | Low | Shared base sanitizer |
| 6 | localStorage Persistence (Cluster 15) | Low | Low | Use existing safe wrappers |
| 7 | Rate Limiting (Cluster 7) | Low | Low | Delete redundant class |
| 8 | Active Channel Resolution (Cluster 11) | Low | Low | Shared core logic |
| 9 | Subscription Checking (Cluster 12) | Low | Low | Express `hasActiveSubscription` via `getPlanFromSubscription` |
| 10 | Cache Key Hashing (Cluster 5) | Low | Low | Shared `stableHash` utility |
| 11 | Comments Fetching (Cluster 9) | Med | Low | Delegate to canonical fetcher |
| 12 | Metric Computation (Cluster 8) | Med | Med | Extract shared micro-helpers |
| 13 | Error Classes (Cluster 13) | Med | Med | Unify `VideoDetailError` into `ApiError` |
| 14 | Cache Read/Write (Cluster 6) | Med | Med | Generic `CacheService<T>` |

Items 1–10 are safe, low-effort wins that can be done in small PRs.
Items 11–14 require more careful migration and testing.

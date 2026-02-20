# Refactoring Prompts — Domain-Driven Architecture Migration

These are copy-paste prompts for Cursor Agent. Execute them **in order**.
Each prompt is a self-contained task. After each prompt completes, verify the
pre-flight checks pass before moving to the next.

> **Pre-flight after every prompt:**
> ```
> bun run build && bun run lint && bunx madge --circular --extensions ts,tsx,js,jsx apps/web/app apps/web/lib
> ```

---

## Phase 0 — Shared Foundation

Move pure utilities into `lib/shared/` so every later phase can import from a
stable location.

---

### Prompt 0.1 — Move pure utilities to `lib/shared/`

```
Move the following pure utility files from `apps/web/lib/` into `apps/web/lib/shared/`.
These files have zero business logic — they're leaf-level utilities.

Files to move:
- `lib/format.ts` → `lib/shared/format.ts`
- `lib/crypto.ts` → `lib/shared/crypto.ts`
- `lib/stable-hash.ts` → `lib/shared/stable-hash.ts`
- `lib/content-hash.ts` → `lib/shared/content-hash.ts`
- `lib/logger.ts` → `lib/shared/logger.ts`
- `lib/youtube-video-id.ts` → `lib/shared/youtube-video-id.ts`
- `lib/seo.ts` → `lib/shared/seo.ts`

For each file:
1. Move the file to its new location.
2. Leave a re-export barrel at the OLD path so existing imports don't break:
   ```ts
   export * from "@/lib/shared/<filename>";
   ```
3. Update any imports within the moved file itself if needed (they should have
   no upward imports — if they do, that's a bug to fix).

After all moves, run `bun run build && bun run lint` to verify nothing broke.
Do NOT update consumers yet — the re-export barrels handle backward compat.
Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 0.2 — Move config files to `lib/shared/`

```
Move the following config/constant files from `apps/web/lib/` into
`apps/web/lib/shared/`.

Files to move:
- `lib/brand.ts` → `lib/shared/brand.ts`
- `lib/product.ts` → `lib/shared/product.ts`
- `lib/feature-flags.ts` → `lib/shared/feature-flags.ts`
- `lib/llms.ts` → `lib/shared/llms.ts`

For each file:
1. Move the file to its new location.
2. Leave a re-export barrel at the OLD path:
   ```ts
   export * from "@/lib/shared/<filename>";
   ```
3. If any moved file imports from another moved file, update the import to the
   new `lib/shared/` path.
4. `feature-flags.ts` uses Prisma — that's acceptable for shared config that
   multiple domains need. Keep it in shared.

Run `bun run build && bun run lint` to verify.
Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 0.3 — Move rate-limit and nav-config to proper locations

```
Move these utility files:
- `lib/rate-limit.ts` → `lib/shared/rate-limit.ts` (used by multiple domains)
- `lib/nav-config.ts` → `lib/shared/nav-config.ts` (shared navigation config)
- `lib/nav-config.server.ts` → `lib/server/nav-config.server.ts` (server-only variant)

For each:
1. Move the file.
2. Leave a re-export barrel at the old path.
3. Update internal cross-references if the moved files import each other.

Run `bun run build && bun run lint` to verify.
Follow the Verified-Change Workflow and output the summary table.
```

---

## Phase 1 — Port Interfaces (Contracts)

Define TypeScript interfaces in `lib/ports/` for every external I/O boundary.
Ports are pure types — no runtime code. Features will depend on these; adapters
will implement them.

---

### Prompt 1.1 — YouTube port interface

```
Create a YouTube port interface at `apps/web/lib/ports/YouTubePort.ts`.

Study the current YouTube adapter code in `apps/web/lib/youtube/` (especially
`data-api.ts`, `analytics-api.ts`, `index.ts`, and `types.ts`) to understand
what operations exist.

The port should define interfaces for the operations that features need:
- Searching channels
- Fetching channel details
- Fetching video details (single + batch)
- Fetching video statistics
- Listing channel videos
- Fetching analytics data (retention, traffic sources, demographics)
- Fetching comments

Guidelines:
- Use domain-friendly names, not YouTube API names.
- Input/output types should be domain types, not raw YouTube API shapes.
- Define the types inline in the port file or in a companion types file.
- Keep it as a TypeScript interface (not a class).
- Export a single `YouTubePort` interface.
- This file must NOT import from `lib/features/`, `lib/adapters/`, or `app/`.
- It CAN import from `lib/shared/` if needed for shared types.

Do NOT implement the interface yet — just define the contract.
Delete the `ExamplePort.ts` template file.
Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 1.2 — DataForSEO port interface

```
Create a DataForSEO port interface at `apps/web/lib/ports/DataForSeoPort.ts`.

Study `apps/web/lib/dataforseo/` (especially `client.ts`, `youtube-serp.ts`,
`competitive-context.ts`, and `utils.ts`) to understand what operations exist.

The port should cover:
- Keyword research (overview data, related keywords)
- Task-based keyword research (create task, poll task)
- Google Trends data
- YouTube SERP results
- Keyword suggestions/ideas
- Competitive context (SERP analysis, ranking data)

Guidelines:
- Domain-friendly names and types.
- The port defines WHAT can be done, not HOW.
- Include input/output types for each method.
- This file must NOT import from `lib/features/`, `lib/adapters/`, or `app/`.

Do NOT implement yet — just the contract.
Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 1.3 — LLM port interface

```
Create an LLM port interface at `apps/web/lib/ports/LlmPort.ts`.

Study `apps/web/lib/llm.ts` to see all the LLM operations currently used:
- Subscriber insight generation
- Comment analysis
- Competitor video analysis
- Niche query generation
- Channel audit summaries
- Tag generation
- Idea generation
- Any other LLM calls in route handlers

The port should define a generic completion interface plus domain-specific
convenience methods. Something like:

```ts
export interface LlmPort {
  complete(params: LlmCompletionParams): Promise<string>;
  completeJson<T>(params: LlmCompletionParams & { schema?: unknown }): Promise<T>;
}
```

Keep it minimal — features will compose prompts and call `complete()` or
`completeJson()`. Don't encode every domain operation into the port; the port
is about the LLM capability, not the business logic.

This file must NOT import from `lib/features/`, `lib/adapters/`, or `app/`.
Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 1.4 — Stripe, Storage, and Replicate port interfaces

```
Create three port interfaces:

1. `apps/web/lib/ports/StripePort.ts`
   Study `apps/web/lib/stripe.ts`. Define interfaces for:
   - Creating checkout sessions
   - Creating billing portal sessions
   - Webhook event parsing/verification
   - Customer/subscription lookups

2. `apps/web/lib/ports/StoragePort.ts`
   Study `apps/web/lib/storage/`. Define interfaces for:
   - File upload (with key/path)
   - File download / URL generation
   - File deletion
   Note: `lib/storage/adapter.ts` may already have a port-like pattern —
   formalize it in `lib/ports/`.

3. `apps/web/lib/ports/ReplicatePort.ts`
   Study `apps/web/lib/replicate/` and `apps/web/lib/server/replicate/`.
   Define interfaces for:
   - Running predictions
   - Polling prediction status
   - Webhook handling

Guidelines for all:
- Pure TypeScript interfaces, no runtime code.
- Domain-friendly types, not SDK shapes.
- Must NOT import from `lib/features/`, `lib/adapters/`, or `app/`.

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 1.5 — Google OAuth port interface

```
Create `apps/web/lib/ports/GoogleOAuthPort.ts`.

Study `apps/web/lib/google-tokens.ts` and the Google OAuth callback route at
`apps/web/app/api/integrations/google/callback/route.ts`.

The port should define:
- Token exchange (auth code → tokens)
- Token refresh
- User info retrieval
- Analytics access verification

This file must NOT import from `lib/features/`, `lib/adapters/`, or `app/`.
Follow the Verified-Change Workflow and output the summary table.
```

---

## Phase 2 — Adapters (External I/O)

Move existing I/O code into `lib/adapters/<provider>/`, implementing the port
interfaces from Phase 1.

---

### Prompt 2.1 — YouTube adapter

```
Move the YouTube I/O code into the adapters layer.

Current location: `apps/web/lib/youtube/`
Target location: `apps/web/lib/adapters/youtube/`

Steps:
1. Copy the entire `lib/youtube/` directory to `lib/adapters/youtube/`.
2. Update internal imports within the copied files to use their new paths.
3. Make the adapter implement (or at minimum align with) the `YouTubePort`
   interface from `lib/ports/YouTubePort.ts`. You don't need to refactor
   everything at once — you can export standalone functions that match the port
   signature, with a TODO to formally implement the interface later.
4. Update `lib/youtube/index.ts` (the OLD location) to become a pure re-export
   barrel that re-exports everything from `@/lib/adapters/youtube/`. This
   preserves backward compatibility for all current consumers.
5. Also update `lib/youtube-api.ts` (the facade file) to re-export from the
   new adapter location.
6. Move `lib/youtube-analytics.ts` into the adapter IF it has unique logic not
   already in `lib/adapters/youtube/analytics-api.ts`. If it's a duplicate,
   make it a re-export barrel pointing to the adapter, or delete it and update
   its consumers.

Run `bun run build && bun run lint` to verify nothing broke.
Ensure no circular dependencies: `bunx madge --circular --extensions ts,tsx apps/web/lib/adapters/youtube`
Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 2.2 — DataForSEO adapter

```
Move the DataForSEO I/O code into the adapters layer.

Current location: `apps/web/lib/dataforseo/`
Target location: `apps/web/lib/adapters/dataforseo/`

Steps:
1. Copy the entire `lib/dataforseo/` directory to `lib/adapters/dataforseo/`.
2. Update internal imports within the copied files.
3. Align exports with the `DataForSeoPort` interface from Phase 1.
4. `competitive-context.ts` contains business logic (trend analysis, CTR
   expectations, topic extraction) — do NOT move this to the adapter. Instead,
   extract the pure API-calling portions into the adapter and leave the
   business logic portions for Phase 3 (features).
5. Update `lib/dataforseo/index.ts` (old location) to become a re-export
   barrel pointing to `@/lib/adapters/dataforseo/`.

Run `bun run build && bun run lint` to verify.
Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 2.3 — Stripe adapter

```
Create a proper Stripe adapter at `apps/web/lib/adapters/stripe/`.

Study `apps/web/lib/stripe.ts`. This file mixes:
- Stripe SDK calls (adapter concern)
- Entitlement calculation / status normalization (business logic)
- Database queries (should be separate)

Steps:
1. Create `lib/adapters/stripe/client.ts` with the pure Stripe I/O:
   - `createCheckoutSession()`
   - `createBillingPortalSession()`
   - `constructWebhookEvent()`
   - `getSubscription()`
   - `getCustomer()`
   - Any other direct Stripe SDK calls
2. Create `lib/adapters/stripe/index.ts` as a barrel file.
3. Leave business logic (entitlement calculation, subscription status
   normalization) in `lib/stripe.ts` for now — it will move to
   `lib/features/subscriptions/` in Phase 3.
4. Update the pure I/O functions in `lib/stripe.ts` to delegate to the new
   adapter.

The adapter must NOT contain business decisions about plan tiers, feature
locks, or entitlement calculations.

Run `bun run build && bun run lint` to verify.
Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 2.4 — OpenAI / LLM adapter

```
Create an LLM adapter at `apps/web/lib/adapters/openai/`.

Study `apps/web/lib/llm.ts`. This file mixes:
- OpenAI API calls (adapter concern)
- Prompt engineering (feature concern)
- Response parsing (feature concern)
- In-memory caching (adapter concern)

Steps:
1. Create `lib/adapters/openai/client.ts` with:
   - A `complete()` function that wraps the OpenAI chat completion call.
   - A `completeJson<T>()` function for structured JSON output.
   - Retry logic, error wrapping, rate limit handling.
   - Implement or align with `LlmPort` from `lib/ports/LlmPort.ts`.
2. Create `lib/adapters/openai/index.ts` barrel.
3. Do NOT move the prompt templates or response parsers — those are feature
   logic and will move to `lib/features/` in Phase 3.
4. Update `lib/llm.ts` to import the completion functions from the adapter
   instead of calling OpenAI directly.

Run `bun run build && bun run lint` to verify.
Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 2.5 — Replicate adapter

```
Create a Replicate adapter at `apps/web/lib/adapters/replicate/`.

Study:
- `apps/web/lib/replicate/client.ts`
- `apps/web/lib/replicate/webhook.ts`
- `apps/web/lib/server/replicate/runPrediction.ts`

Steps:
1. Move/consolidate Replicate I/O into `lib/adapters/replicate/`:
   - `client.ts` — prediction creation, status polling
   - `webhook.ts` — webhook signature verification
2. Align with `ReplicatePort` from Phase 1.
3. Update `lib/server/replicate/runPrediction.ts` to use the adapter.
4. Leave re-export barrels at old paths.

Run `bun run build && bun run lint` to verify.
Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 2.6 — Storage adapter

```
Formalize the storage adapter at `apps/web/lib/adapters/storage/`.

Study `apps/web/lib/storage/` — it already has a port-like pattern with
`adapter.ts`, `local.ts`, and `s3.ts`.

Steps:
1. Move `lib/storage/` to `lib/adapters/storage/`.
2. Ensure it implements the `StoragePort` interface from Phase 1.
3. Leave a re-export barrel at `lib/storage/index.ts`.
4. `safeLocalStorage.ts` is a client-side utility — move it to
   `lib/client/safeLocalStorage.ts` or `lib/shared/safeLocalStorage.ts`
   (it's not an adapter in the I/O sense).
5. `oauthAttemptTracker.ts` is client-side state — move it to
   `lib/client/oauthAttemptTracker.ts`.

Run `bun run build && bun run lint` to verify.
Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 2.7 — Google OAuth adapter

```
Create a Google OAuth adapter at `apps/web/lib/adapters/google/`.

Study:
- `apps/web/lib/google-tokens.ts` (token refresh, DB storage)
- `apps/web/app/api/integrations/google/callback/route.ts` (token exchange)
- `apps/web/app/api/integrations/google/start/route.ts` (OAuth URL generation)

Steps:
1. Create `lib/adapters/google/oauth.ts` with pure OAuth I/O:
   - `exchangeCodeForTokens()` — exchange auth code for tokens
   - `refreshAccessToken()` — refresh an expired token
   - `getUserInfo()` — fetch Google user info
   - `testAnalyticsAccess()` — verify YouTube Analytics access
   - `buildAuthUrl()` — generate OAuth consent URL
2. Implement or align with `GoogleOAuthPort`.
3. Update `lib/google-tokens.ts` to delegate API calls to the adapter.
   Keep the DB-persistence logic in `google-tokens.ts` for now (it'll move
   to a feature or server module later).
4. Leave a re-export barrel at the old `google-tokens.ts` path.

Run `bun run build && bun run lint` to verify.
Follow the Verified-Change Workflow and output the summary table.
```

---

## Phase 3 — Feature Domains

Create proper feature modules in `lib/features/<domain>/` with types, schemas,
errors, and use-cases. Extract business logic from kitchen-sink files and
route handlers.

---

### Prompt 3.1 — Competitors feature domain

```
Create the competitors feature domain at `apps/web/lib/features/competitors/`.

This is the LARGEST domain. Study these source files:
- `lib/competitor-search/` (search, niche inference, caching)
- `lib/competitors/video-detail/` (video analysis, strategic analysis)
- `lib/competitor-utils.ts` (utility functions)
- `app/api/competitors/discover/route.ts` (515 lines of business logic!)
- `app/api/competitors/search/route.ts` (streaming, niche inference)
- `app/api/competitors/video/[videoId]/route.ts` (500 lines, multi-stage)
- `app/api/competitors/video/[videoId]/more/route.ts`

Create this structure:
```
lib/features/competitors/
  types.ts        — CompetitorVideo, SearchResult, DiscoveryResult, etc.
  schemas.ts      — DiscoverBodySchema, SearchQuerySchema, etc.
  errors.ts       — CompetitorError extends DomainError
  use-cases/
    discoverCompetitors.ts  — extracted from discover/route.ts
    searchCompetitors.ts    — extracted from search/route.ts
    analyzeVideo.ts         — extracted from video/[videoId]/route.ts
    getMoreFromChannel.ts   — extracted from more/route.ts
  index.ts        — barrel re-exports
```

For this prompt, focus on:
1. Create the `types.ts`, `schemas.ts`, `errors.ts`, and `index.ts` files.
2. Define the types based on what the current routes return.
3. Define Zod schemas for route validation (body/query/params).
4. Create the `CompetitorError` class.
5. Create stub use-case files with the function signatures but delegate to
   existing code (import from the old kitchen-sink locations). We'll inline
   the logic in Phase 4.

Do NOT move business logic yet — just set up the domain structure and types.
Features must NOT import from `lib/adapters/` directly — use port interfaces.
Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 3.2 — Channel Audit feature domain

```
Create the channel audit feature domain at `apps/web/lib/features/channel-audit/`.

Study these source files:
- `app/api/me/channels/[channelId]/audit/route.ts` (632 lines!)
- `app/api/me/channels/[channelId]/audit/recommendations/route.ts`
- `lib/owned-video-math.ts` (metrics, baselines, bottleneck detection)
- `lib/insights/context.ts`

Create this structure:
```
lib/features/channel-audit/
  types.ts        — AuditResult, ChannelBaseline, Bottleneck, Pattern, etc.
  schemas.ts      — RunAuditParamsSchema, etc.
  errors.ts       — ChannelAuditError extends DomainError
  use-cases/
    runChannelAudit.ts        — main audit orchestration
    computeBaseline.ts        — baseline calculations from owned-video-math
    detectBottlenecks.ts      — bottleneck detection
    generateRecommendations.ts — recommendations logic
  index.ts        — barrel
```

For this prompt:
1. Create types based on what the audit route currently returns.
2. Move the pure calculation functions from `lib/owned-video-math.ts` into
   appropriate use-case files (these are domain logic, not adapters).
3. Create schemas for the route's params/query/body validation.
4. Create `ChannelAuditError`.
5. Create stub use-cases that delegate to existing code.

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 3.3 — Channels feature domain (sync, niche, profile)

```
Create the channels feature domain at `apps/web/lib/features/channels/`.

Study these source files:
- `lib/sync-youtube.ts` (channel + video sync orchestration)
- `lib/channel-niche.ts` (niche generation + caching)
- `lib/channel-profile/` (profile generation + types + utils)
- `app/api/me/channels/[channelId]/sync/route.ts`
- `app/api/me/channels/[channelId]/profile/route.ts`
- `app/api/me/channels/[channelId]/profile/generate/route.ts`
- `app/api/me/channels/[channelId]/route.ts`
- `app/api/me/channels/route.ts`

Create this structure:
```
lib/features/channels/
  types.ts        — Channel, ChannelProfile, SyncResult, NicheResult, etc.
  schemas.ts      — SyncParamsSchema, ProfileBodySchema, etc.
  errors.ts       — ChannelError extends DomainError
  use-cases/
    syncChannel.ts         — from sync-youtube.ts
    getOrGenerateNiche.ts  — from channel-niche.ts
    getProfile.ts          — from channel-profile/
    updateProfile.ts       — from channel-profile/
    generateProfile.ts     — from channel-profile/generate.ts
    listChannels.ts        — channel listing logic
  index.ts        — barrel
```

For this prompt:
1. Create types, schemas, errors.
2. Create stub use-cases that delegate to existing kitchen-sink code.
3. Move `lib/channel-profile/types.ts` content into `features/channels/types.ts`.
4. Move `lib/channel-profile/utils.ts` into the feature if it's domain logic,
   or into `lib/shared/` if it's generic.

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 3.4 — Subscriptions / Entitlements feature domain

```
Create the subscriptions feature domain at `apps/web/lib/features/subscriptions/`.

Study these source files:
- `lib/entitlements.ts` (plan limits, feature access checks)
- `lib/usage.ts` (daily usage tracking)
- `lib/with-entitlements.ts` (entitlement enforcement wrapper)
- `lib/stripe.ts` (the business logic portions — status normalization,
  entitlement calculation)

Create this structure:
```
lib/features/subscriptions/
  types.ts        — PlanTier, Entitlement, UsageInfo, FeatureLock, etc.
  schemas.ts      — (if needed for validation)
  errors.ts       — SubscriptionError extends DomainError
  use-cases/
    checkEntitlement.ts    — from entitlements.ts
    trackUsage.ts          — from usage.ts
    resolveSubscription.ts — status normalization from stripe.ts
  index.ts        — barrel
```

For this prompt:
1. Create types by studying entitlements.ts and usage.ts.
2. Move the plan configuration (limits, tiers) to types.ts.
3. Create stub use-cases that call existing code.
4. Create `SubscriptionError`.
5. Update `lib/with-entitlements.ts` to import from the new feature module.
6. Leave re-export barrels at old paths.

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 3.5 — Video Insights feature domain

```
Create the video insights feature domain at `apps/web/lib/features/video-insights/`.

Study these source files:
- `app/api/me/channels/[channelId]/videos/[videoId]/insights/summary/route.ts`
- `app/api/me/channels/[channelId]/videos/[videoId]/insights/analytics/route.ts`
- `app/api/me/channels/[channelId]/videos/[videoId]/insights/seo/route.ts`
- `app/api/me/channels/[channelId]/videos/[videoId]/insights/comments/route.ts`
- `app/api/me/channels/[channelId]/videos/[videoId]/insights/ideas/route.ts`
- `lib/owned-video-math.ts` (derived metrics, confidence scoring)
- `lib/youtube/descriptionSeoAudit.ts` (SEO analysis)
- `lib/dataforseo/competitive-context.ts` (competitive insights — business logic portions)

Create this structure:
```
lib/features/video-insights/
  types.ts        — VideoInsight, SeoAudit, CompetitiveContext, etc.
  schemas.ts      — InsightParamsSchema, etc.
  errors.ts       — VideoInsightError extends DomainError
  use-cases/
    generateSummary.ts
    analyzeRetention.ts
    runSeoAudit.ts         — from descriptionSeoAudit.ts
    analyzeComments.ts
    generateIdeas.ts
    fetchCompetitiveContext.ts  — business logic from competitive-context.ts
  index.ts        — barrel
```

Focus on:
1. Types, schemas, errors.
2. Move `descriptionSeoAudit.ts` business logic to `runSeoAudit.ts` use-case.
3. Move competitive-context business logic to `fetchCompetitiveContext.ts`.
4. Create stubs for the other use-cases.

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 3.6 — Subscriber Insights feature domain

```
Create the subscriber insights feature domain at
`apps/web/lib/features/subscriber-insights/`.

Study:
- `app/api/me/channels/[channelId]/subscriber-audit/route.ts`
- `lib/llm.ts` (the `generateSubscriberInsights` and related functions)

Create this structure:
```
lib/features/subscriber-insights/
  types.ts
  schemas.ts
  errors.ts       — SubscriberInsightError extends DomainError
  use-cases/
    runSubscriberAudit.ts  — extracted from the route
  index.ts
```

1. Create types matching what the route currently returns.
2. Extract the prompt-building and response-parsing logic from `lib/llm.ts`
   into the use-case (these are domain logic, not adapter logic).
3. The use-case should call `LlmPort.complete()` for the actual API call.
4. Create schemas for the route's params.

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 3.7 — Tags feature domain

```
Create the tags feature domain at `apps/web/lib/features/tags/`.

Study:
- `app/api/youtube-tag-generator/route.ts` (375 lines, LLM logic)
- `app/api/tags/extract/route.ts`

Create this structure:
```
lib/features/tags/
  types.ts
  schemas.ts
  errors.ts       — TagError extends DomainError
  use-cases/
    generateTags.ts    — LLM-based tag generation from route
    extractTags.ts     — tag extraction from videos
  index.ts
```

1. Create types, schemas, errors.
2. Extract the tag generation logic (prompt building, LLM call, parsing)
   from the route into `generateTags.ts`.
3. Extract tag extraction logic into `extractTags.ts`.
4. Use-cases call ports for YouTube data and LLM completion.

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 3.8 — Thumbnails feature domain

```
Create the thumbnails feature domain at `apps/web/lib/features/thumbnails/`.

Study:
- `app/api/thumbnails/generate/route.ts`
- `app/api/thumbnails/generate-img2img/route.ts`
- `app/api/thumbnails/projects/` (CRUD routes)
- `app/api/thumbnails/job/[id]/route.ts`
- `app/api/thumbnails/image/[key]/route.ts`
- `lib/server/prompting/buildThumbnailPrompt.ts`
- `lib/thumbnails-v2/` (editor state, style models)

Create this structure:
```
lib/features/thumbnails/
  types.ts
  schemas.ts
  errors.ts       — ThumbnailError extends DomainError
  use-cases/
    generateThumbnail.ts
    generateImg2Img.ts
    createProject.ts
    getProject.ts
    exportProject.ts
    buildPrompt.ts      — from server/prompting/
  editor/
    editorState.ts      — from thumbnails-v2/
    styleModels.ts      — from thumbnails-v2/
  index.ts
```

1. Create types, schemas, errors.
2. Move `lib/thumbnails-v2/` content to `features/thumbnails/editor/`.
3. Move `lib/server/prompting/buildThumbnailPrompt.ts` to the feature.
4. Create stub use-cases.

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 3.9 — Auth feature domain

```
Consolidate auth-related files into `apps/web/lib/server/auth/`.

These are server-only and don't need a full feature domain — they're server
infrastructure.

Study:
- `lib/auth.ts` (NextAuth config)
- `lib/user.ts` (user queries, subscription checks)
- `lib/jwt.ts` (JWT utilities)
- `lib/admin.ts` (admin detection)

Steps:
1. Create `lib/server/auth/` directory.
2. Move `lib/auth.ts` → `lib/server/auth/nextauth.ts`
3. Move `lib/user.ts` → `lib/server/auth/user.ts`
4. Move `lib/jwt.ts` → `lib/server/auth/jwt.ts` (or keep in `lib/shared/`
   since it's pure crypto — use your judgment)
5. Move `lib/admin.ts` → `lib/server/auth/admin.ts`
6. Create `lib/server/auth/index.ts` barrel.
7. Leave re-export barrels at all old paths.

Run `bun run build && bun run lint` to verify.
Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 3.10 — Badges feature domain

```
Create the badges feature domain at `apps/web/lib/features/badges/`.

Study `apps/web/lib/badges/` (compute.ts, registry.ts, types.ts).

Steps:
1. Move `lib/badges/` → `lib/features/badges/`.
2. Add `errors.ts` with `BadgeError extends DomainError`.
3. Rename `compute.ts` → `use-cases/computeBadges.ts`.
4. Keep `registry.ts` and `types.ts` at the feature root.
5. Create `index.ts` barrel.
6. Leave a re-export barrel at `lib/badges/index.ts`.

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 3.11 — Identity feature domain

```
Create the identity feature domain at `apps/web/lib/features/identity/`.

Study `apps/web/lib/identity/` (modelService.ts, normalizeImage.ts, triggerWord.ts).

Steps:
1. Move `lib/identity/` → `lib/features/identity/`.
2. Add `types.ts`, `errors.ts` (IdentityError extends DomainError).
3. Rename `modelService.ts` → `use-cases/trainModel.ts` (or appropriate name).
4. Create `index.ts` barrel.
5. Leave a re-export barrel at `lib/identity/index.ts`.

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 3.12 — Contact and Saved Ideas features

```
Create two small feature domains:

1. `apps/web/lib/features/contact/`
   Study `app/api/contact/route.ts` and `lib/content/contact.ts`.
   Create:
   - `types.ts` — ContactMessage, etc.
   - `schemas.ts` — ContactBodySchema
   - `errors.ts` — ContactError
   - `use-cases/sendContactMessage.ts`
   - `index.ts`

2. `apps/web/lib/features/saved-ideas/`
   Study `app/api/me/saved-ideas/route.ts` and `app/api/me/saved-ideas/[ideaId]/route.ts`.
   Create:
   - `types.ts` — SavedIdea, etc.
   - `schemas.ts` — SaveIdeaBodySchema, IdeaParamsSchema
   - `errors.ts` — SavedIdeaError
   - `use-cases/saveIdea.ts`, `deleteIdea.ts`, `listIdeas.ts`
   - `index.ts`

Follow the Verified-Change Workflow and output the summary table.
```

---

## Phase 4 — Route Thinning

Now that feature domains exist, extract all business logic from route handlers.
Each route should become ~10-20 lines of orchestration.

---

### Prompt 4.1 — Thin the keywords routes (already partially done)

```
The keyword routes have already been partially refactored with use-cases in
`lib/features/keywords/`. Verify they follow the target pattern and fix any
remaining issues.

Check each route:
- `app/api/keywords/research/route.ts`
- `app/api/keywords/trends/route.ts`
- `app/api/keywords/youtube-serp/route.ts`
- `app/api/keywords/ideas/route.ts`
- `app/api/keywords/task/[id]/route.ts`

Each route should ONLY:
1. Use `createApiRoute` + `withAuth` + `withValidation`
2. Call a use-case from `lib/features/keywords/`
3. Return `jsonOk(result)` or let middleware handle errors

If any route still has inline business logic, data transformation, or direct
adapter calls, extract them into the appropriate use-case.

Special attention to `task/[id]/route.ts` — it has complex polling logic and
data mapping that should be in a use-case.

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 4.2 — Thin the competitor discovery route

```
The competitor discovery route at `app/api/competitors/discover/route.ts` is
515 lines with massive business logic. Refactor it to be thin.

The use-case `lib/features/competitors/use-cases/discoverCompetitors.ts` should
contain ALL the business logic. The route should be ~15 lines.

Target route pattern:
```ts
export const POST = createApiRoute(
  { route: "/api/competitors/discover" },
  withAuth({ mode: "required" },
    withValidation({ body: DiscoverBodySchema },
      async (_req, _ctx, api, { body }) => {
        const result = await discoverCompetitors({
          userId: api.userId!,
          ...body,
        });
        return jsonOk(result, { requestId: api.requestId });
      }
    )
  )
);
```

Steps:
1. Move ALL helper functions from the route into the use-case
   (`fetchFastestGrowing`, `fetchBreakouts`, `fetchEmergingNiches`,
   `fetchLowCompetition`, `buildRationale`, `detectChannelBottleneck`,
   `generateActions`, `mapToSampleVideo`).
2. The use-case receives validated inputs and returns domain types.
3. The use-case accesses DB through Prisma directly (OK for now — can be
   ported later) and YouTube/LLM through port interfaces.
4. Replace the manual auth check with `withAuth` middleware.
5. Add a Zod schema for the request body to `lib/features/competitors/schemas.ts`.

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 4.3 — Thin the competitor search route

```
Refactor `app/api/competitors/search/route.ts` to be thin.

Move the streaming logic, niche inference, and search orchestration into
`lib/features/competitors/use-cases/searchCompetitors.ts`.

The route uses streaming (SSE) — the use-case can return an async generator
or accept a callback for streaming events. The route handler translates
the stream into an HTTP streaming response.

Steps:
1. Extract all business logic into the use-case.
2. The route handles only: auth → validate → call use-case → stream response.
3. Replace manual auth check with `withAuth`.
4. Add validation schema.

Note: If streaming makes the use-case pattern awkward, it's OK for the route
to have slightly more code to manage the SSE transport. But the BUSINESS LOGIC
(what to search, how to rank, what to return) must be in the use-case.

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 4.4 — Thin the competitor video detail route

```
Refactor `app/api/competitors/video/[videoId]/route.ts` to be thin.

This route is ~500 lines with multi-stage orchestration. Move it ALL into
`lib/features/competitors/use-cases/analyzeVideo.ts`.

The use-case should handle:
- Video data fetching (via YouTube port)
- Cache management
- Parallel analysis coordination
- LLM analysis (via LLM port)
- Strategic insights generation

The route should be ~15 lines following the standard pattern.

Also thin `app/api/competitors/video/[videoId]/more/route.ts` — move its
logic into `getMoreFromChannel.ts`.

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 4.5 — Thin the channel audit route

```
Refactor `app/api/me/channels/[channelId]/audit/route.ts` (632 lines!) to be thin.

Move ALL business logic into `lib/features/channel-audit/use-cases/`:
- `runChannelAudit.ts` — main orchestration
- `computeBaseline.ts` — from `computeChannelBaseline`, `computeTrafficSourcePercentages`
- `detectBottlenecks.ts` — from `detectChannelBottleneck`
- `generateRecommendations.ts` — from `generateActions`, `detectPatterns`, `computeTrends`

Also thin `audit/recommendations/route.ts` if it has inline logic.

The audit route should call `runChannelAudit()` and return the result.

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 4.6 — Thin the subscriber audit route

```
Refactor `app/api/me/channels/[channelId]/subscriber-audit/route.ts` to be thin.

Move ALL business logic (percentile ranking, LLM calls, calculations) into
`lib/features/subscriber-insights/use-cases/runSubscriberAudit.ts`.

The route should call the use-case and return the result. ~15 lines.

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 4.7 — Thin the channel sync route

```
Refactor `app/api/me/channels/[channelId]/sync/route.ts` to be thin.

Move sync orchestration into `lib/features/channels/use-cases/syncChannel.ts`.

The use-case should handle:
- Entitlement check
- YouTube API calls (via port)
- DB upserts
- Usage tracking

The route should call the use-case and return the result.

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 4.8 — Thin the channel profile routes

```
Refactor these routes to be thin:
- `app/api/me/channels/[channelId]/profile/route.ts` (GET + PUT)
- `app/api/me/channels/[channelId]/profile/generate/route.ts`

Move logic into:
- `lib/features/channels/use-cases/getProfile.ts`
- `lib/features/channels/use-cases/updateProfile.ts`
- `lib/features/channels/use-cases/generateProfile.ts`

Routes should be thin orchestration only.

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 4.9 — Thin the tag generator route

```
Refactor `app/api/youtube-tag-generator/route.ts` (375 lines) to be thin.

Move ALL logic (LLM prompt building, tag generation, rate limiting for
anonymous users) into `lib/features/tags/use-cases/generateTags.ts`.

The route should be ~15 lines.

Also thin `app/api/tags/extract/route.ts` — move logic to
`lib/features/tags/use-cases/extractTags.ts`.

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 4.10 — Thin the video insights routes

```
Refactor all 5 video insights routes to be thin:
- `app/api/me/channels/[channelId]/videos/[videoId]/insights/summary/route.ts`
- `app/api/me/channels/[channelId]/videos/[videoId]/insights/analytics/route.ts`
- `app/api/me/channels/[channelId]/videos/[videoId]/insights/seo/route.ts`
- `app/api/me/channels/[channelId]/videos/[videoId]/insights/comments/route.ts`
- `app/api/me/channels/[channelId]/videos/[videoId]/insights/ideas/route.ts`

Each route should call its corresponding use-case from
`lib/features/video-insights/use-cases/` and return the result.

Use shared param schemas from `lib/features/video-insights/schemas.ts`
(channelId + videoId params).

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 4.11 — Thin the thumbnail routes

```
Refactor the thumbnail routes to be thin:
- `app/api/thumbnails/generate/route.ts`
- `app/api/thumbnails/generate-img2img/route.ts`
- `app/api/thumbnails/projects/route.ts` (list + create)
- `app/api/thumbnails/projects/[projectId]/route.ts` (get + update + delete)
- `app/api/thumbnails/projects/[projectId]/export/route.ts`
- `app/api/thumbnails/projects/[projectId]/upload-overlay/route.ts`
- `app/api/thumbnails/job/[id]/route.ts`
- `app/api/thumbnails/image/[key]/route.ts`

Each route should call its corresponding use-case from
`lib/features/thumbnails/use-cases/`.

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 4.12 — Thin remaining routes

```
Refactor all remaining routes that still have inline business logic:

- `app/api/me/route.ts` — user profile endpoint
- `app/api/me/badges/route.ts` — badge computation
- `app/api/me/channels/route.ts` — channel listing
- `app/api/me/channels/[channelId]/route.ts` — single channel
- `app/api/me/channels/[channelId]/videos/route.ts` — video listing
- `app/api/me/channels/[channelId]/ideas/more/route.ts` — idea generation
- `app/api/me/saved-ideas/route.ts` — saved ideas CRUD
- `app/api/me/saved-ideas/[ideaId]/route.ts` — single idea
- `app/api/contact/route.ts` — contact form
- `app/api/identity/*` routes — identity/model training
- `app/api/integrations/google/*` routes — OAuth flow
- `app/api/integrations/stripe/*` routes — Stripe integration
- `app/api/webhooks/replicate/route.ts` — Replicate webhook
- `app/api/dev/youtube-usage/route.ts` — admin usage

For each:
1. If it has more than ~20 lines of logic, extract into a use-case.
2. Ensure it uses `createApiRoute`, `withAuth`, `withValidation`.
3. Routes that are already thin can be left as-is.

Focus on the ones with the most business logic first.

Follow the Verified-Change Workflow and output the summary table.
```

---

## Phase 5 — Cleanup

Remove re-export barrels, delete dead code, and finalize the migration.

---

### Prompt 5.1 — Remove kitchen-sink re-export barrels

```
In Phases 0-3, we left re-export barrels at old file paths for backward
compatibility. Now it's time to update all consumers to import from the
canonical locations and remove the barrels.

For each re-export barrel file in `apps/web/lib/` (not in subdirectories like
lib/features/, lib/adapters/, etc.):

1. Search for all imports of the barrel file across the codebase.
2. Update each import to point to the new canonical location:
   - `lib/shared/` for utilities
   - `lib/features/<domain>/` for domain logic
   - `lib/adapters/<provider>/` for I/O code
   - `lib/server/auth/` for auth code
3. Delete the barrel file once all imports are updated.

Do this in batches of ~5 files at a time. Run `bun run build` after each batch.

IMPORTANT: Before deleting any file, do a repo-wide search for:
- Static imports: `from "@/lib/<filename>"`
- Dynamic imports: `import("@/lib/<filename>")`
- String references: `"@/lib/<filename>"`

Only delete when there are ZERO remaining references.

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 5.2 — Delete example/template files

```
Remove the example/template scaffolding files:

- `apps/web/lib/features/example/` (entire directory)
- `apps/web/lib/adapters/example/` (entire directory)
- `apps/web/lib/ports/ExamplePort.ts` (if not already deleted)
- `apps/web/app/api/example/route.ts`
- `apps/web/components/features/example/` (entire directory)

Before deleting, verify nothing imports from these files.

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 5.3 — Audit import boundaries with dependency-cruiser

```
Run the full architecture validation suite to find any remaining boundary
violations:

```bash
bunx depcruise --config dependency-cruiser.js --output-type err-long apps/web
bunx madge --circular --extensions ts,tsx,js,jsx apps/web/app apps/web/lib
```

For each violation:
1. Identify which layer boundary is being crossed.
2. Move the import to the correct layer, or move the code.
3. Common fixes:
   - Feature importing from adapter → inject via port interface
   - Adapter importing from feature → move shared types to ports
   - Circular dependency → extract shared types to lib/shared/ or lib/ports/

Fix ALL violations. Run the checks again until clean.

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 5.4 — Run Knip and remove dead exports

```
Run Knip to find unused exports and files:

```bash
bunx knip --config apps/web/knip.json
```

For each unused export:
1. Verify it's truly unused (check dynamic imports, string references, tests).
2. If unused, remove it.
3. If the entire file becomes empty, delete it.

For each unused file:
1. Verify with repo-wide search.
2. Delete if truly unused.

Do NOT delete:
- Webhook handlers (externally invoked)
- Sitemap/robots entries
- Test fixtures
- Type-only exports that TypeScript strip at build time

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 5.5 — Final deduplication pass with jscpd

```
Run jscpd to find remaining code duplication:

```bash
bunx jscpd apps/web --pattern "**/*.{ts,tsx}" --min-lines 8 --min-tokens 70
```

For each duplication cluster:
1. Identify what's duplicated.
2. Extract into a shared function in the appropriate layer:
   - Cross-domain utility → `lib/shared/`
   - Domain-specific → `lib/features/<domain>/`
   - I/O-related → `lib/adapters/<provider>/`
3. Replace all duplicates with the shared function.

Target: reduce clone count to < 30 (current baseline: 56).

Follow the Verified-Change Workflow and output the summary table.
```

---

### Prompt 5.6 — Final comprehensive verification

```
Run the complete Verified-Change Workflow pre-flight suite:

```bash
bun run build
bun run lint
bunx knip --config apps/web/knip.json
bunx madge --circular --extensions ts,tsx,js,jsx apps/web/app apps/web/lib
bunx depcruise --config dependency-cruiser.js --output-type err-long apps/web
bunx jscpd apps/web --pattern "**/*.{ts,tsx}" --min-lines 8 --min-tokens 70
```

Compare against the baseline at `.agent/baseline.json`.
Fix any regressions. Update the baseline with improvements.

Output the final comparison table.

Then verify the architecture by spot-checking:
1. Pick 3 random routes — are they thin orchestration?
2. Pick 3 features — do they have types, schemas, errors, use-cases?
3. Pick 3 adapters — do they implement port interfaces?
4. Are there any remaining files directly under `lib/` that should have moved?

Report the final state of the architecture migration.
```

---

## Summary of Phases

| Phase | Prompts | Focus |
|-------|---------|-------|
| 0 | 0.1–0.3 | Move shared utilities to `lib/shared/` |
| 1 | 1.1–1.5 | Define port interfaces (contracts) |
| 2 | 2.1–2.7 | Move I/O code to `lib/adapters/` |
| 3 | 3.1–3.12 | Create feature domains in `lib/features/` |
| 4 | 4.1–4.12 | Extract business logic from route handlers |
| 5 | 5.1–5.6 | Remove barrels, dead code, final validation |

**Total: ~38 prompts across 6 phases.**

Each prompt is designed to be a single Cursor session that produces a working,
buildable codebase. Never skip the build/lint verification between prompts.

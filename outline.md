Which metrics matter? What do APV, AVD, CTR, weighted z-score mean?

Core YouTube growth pillars

Discovery: can people find/click it? → Impressions, CTR

Retention: do they keep watching? → AVD, APV, retention curve

Engagement/Conversion: do they interact/subscribe? → likes/comments/subs per view

Cadence/Fit: do you post consistently on topics your audience loves?

Definitions & quick formulas

Impressions: times a thumbnail was shown.

Views: counted views (YouTube rules apply).

CTR (Click-Through Rate): % of impressions that became views.
CTR = views / impressions

AVD (Average View Duration): avg watch time (seconds).
Higher AVD = stronger overall retention.

APV (Average Percentage Viewed): fraction of the video watched on average (0–1 or %).
APV = AVD / duration

Views/Day (velocity): views normalized by age.
views_per_day = total_views / max(days_since_publish, 1)

Subs per 1k Views: conversion to subscribers.
subs_per_1k = net_subs_gained / (views/1000)

Engagement per 1k: (likes + comments) / (views/1000)

Why “weighted z-score”?

Raw values aren’t comparable across channels/videos. A z-score tells you how far a video is from your channel’s average in standard deviations:

z = (value − mean) / std

Then we combine multiple z-scores with weights to get a single Health Score (0–100):

Health = 50 + 15 * (
   0.35*z(views/day) +
   0.25*z(CTR) +
   0.20*z(APV) +
   0.10*z(subs/1k) +
   0.10*z(engagement/1k)
)


Interpretation:

50 = average; >70 = doing great; <40 = needs attention.

Practical cutoffs you can surface

Weak hook: APV < 0.35 or AVD < 0.25 * duration

Low CTR: < 3.5% (context: depends on surface; Search CTR norms differ from Browse)

Underperformer: views/day z-score < −1.0 vs. your 28-day median (same duration bucket)



-----------------------------

# What lives where (high level)

## Next.js (Vercel) — “BFF & control plane”

- User auth (NextAuth) + session management
- Google OAuth flow (YouTube scopes) & token storage/refresh
- Public vs protected routes, UI, dashboards
- CRUD for user/channel/linkage
- “Kick off work” endpoints (enqueue jobs for Python)
- Lightweight reads (serve cached/DB analytics to UI)
- Webhooks/callbacks (job status updates, errors)
- RBAC/tenanting, rate limits for user-facing APIs

## Python (AWS ECS/Lambda) — “data/analytics plane”

- High-volume calls to YouTube Data API v3 + YouTube Analytics API
- Token-aware fetchers with retry/backoff/quota handling
- ETL to Postgres (and/or columnar/OLAP store if needed)
- Feature engineering, per-video metrics, scoring
- Batch jobs (nightly/interval), ad-hoc on-demand jobs
- Long-running or CPU-bound analytics (NLP, clustering, anomaly detection)
- Workers behind SQS (or EventBridge Scheduler) + optional RDS Proxy/PgBouncer

## Next.js (Vercel) — responsibilities & routes
- Auth & identity

NextAuth (Auth.js) with:

Email/password (if you want) or OAuth providers

Google OAuth configured with YouTube scopes:

https://www.googleapis.com/auth/youtube.readonly

https://www.googleapis.com/auth/yt-analytics.readonly

(optionally) .../yt-analytics-monetary.readonly

Store refresh_token (encrypted at rest). Ensure access_type=offline + prompt=consent on first connect so you get a refresh token.

Prisma adapter → RDS Postgres (users/sessions auto-created).

Events (e.g., signIn) to create your domain user/profile rows.

Public vs protected app routes

Public pages: marketing, pricing, docs, sign-in/up (/login).

Protected pages (middleware session guard): /dashboard, /channels, /videos/:id, /insights.

API (route handlers)

POST /api/auth/google/connect → kicks off OAuth for YouTube (or just use NextAuth provider sign-in with extra scopes).

POST /api/channels (protected) → attach a channel to the user (stores channelId + metadata).

GET /api/channels (protected) → list user’s channels.

POST /api/channels/:id/refresh (protected) → enqueue a channel-sync job.

POST /api/videos/:id/refresh (protected) → enqueue a video-sync job.

GET /api/insights/channel/:id → read cached channel insights (DB) for UI.

GET /api/insights/video/:id → read cached video insights (DB).

POST /api/webhooks/jobs → internal callback from Python workers to mark job done / store results (signed secret).

Token handling

Keep refresh_token in DB (encrypted). Store access_token transiently.

Provide Python workers least-privileged access to read refresh tokens (see below), or hand them a fresh short-lived access token per job if you prefer the BFF to be the token broker.

Job enqueueing (recommended)

POST /api/jobs/enqueue (protected) — Next.js signs a message containing:

userId, channelId (or videoId), job type, time range

Either a short-lived access token or a secure reference so Python can fetch the refresh token and mint its own access token.

Sends to SQS (or EventBridge). Prefer async → no extra hop latency to the user.

Reads for the UI

All charts/tables pull from your DB, not Google live.

For “refresh now” buttons, show optimistic toasts + background job → reload page when webhook says done.

Python (AWS) — responsibilities & components
Workers

ECS Fargate service (or Lambda) subscribed to SQS queue.

For each job:

Resolve identity (userId, channelId).

Get a token:

Option A (centralized): Decrypt & use refresh_token from DB + Google OAuth to mint access token.

Option B (brokered): Use access token passed in the job (Next.js minted). Renew by calling a minimal Next.js internal endpoint if expired (keeps refresh tokens away from Python).

Call YouTube APIs with quotas/retries/backoff & ETags.

Transform & upsert into Postgres (through RDS Proxy/PgBouncer).

Compute insights (per-channel & per-video).

Emit a status event → Next.js webhook (optional) and/or update job table.

Schedulers

EventBridge Scheduler (e.g., hourly/daily) → enqueue sync all active channels.

Throttle per-tenant to respect quotas.

Analytics/insights (examples)

Channel-level: views/subs watchtime trends, CTR, RPM proxies, churn/velocity charts, best posting windows, topic clusters.

Video-level: title/thumbnail A/B signals, first-24h velocity, retention curve stats (avg %, drop-off points), SEO (tags/keywords), suggested vs browse breakdowns, outlier detection.

Data model (starter)

User

id (pk), email, name

auth tables handled by NextAuth/Prisma

GoogleAccount

id (pk), userId (fk User)

provider = 'google', providerAccountId (Google sub)

refreshToken (encrypted), accessToken (ephemeral), scopes, tokenExpiresAt

Channel

id (pk), userId (fk), youtubeChannelId, title, thumbnailUrl

connectedAt, lastSyncedAt, syncStatus, syncError

Video

id (pk), channelId (fk), youtubeVideoId, title, publishedAt, duration, tags[]

Metrics (daily grain)

id (pk), channelId?, videoId?, date, views, watchTimeSec, likes, comments, impressions, clickThroughRate, averageViewDuration, revenue?

Insight

id (pk), entityType ('channel'|'video'), entityId, computedAt, summaryJSON (scores, anomalies, suggestions)

Job

id (pk), userId, type ('channel_sync'|'video_sync'|...), payloadJSON, status, error, createdAt, updatedAt

Typical flows
1) Sign-up / Sign-in

User signs up (NextAuth).

Prisma adapter creates User.

events.signIn ensures your profile row exists.

User lands on /dashboard (protected).

2) Connect Google / add channels

User clicks “Connect YouTube”.

NextAuth Google provider with YouTube scopes → consent → returns refresh_token.

Next.js fetches the user’s channels (Data API) once to list selectable channels (or Python does it via a job).

POST /api/channels to store chosen channel(s).

3) Sync data (background)

User clicks “Refresh analytics” (or scheduled job).

Next.js enqueues channel_sync jobs to SQS.

Python worker mints token, calls Reports API + Data API, writes Metrics + updates lastSyncedAt.

Worker computes Insights and saves to DB.

(Optional) Worker posts to /api/webhooks/jobs to flip job status to “done”.

4) Read in UI

UI calls GET /api/insights/channel/:id and .../video/:id.

No live Google calls from the UI path → fast & quota-friendly.

Security & ops tips

Never call RDS from the browser.

Use Prisma Data Proxy or RDS Proxy to tame serverless connections.

Encrypt refresh tokens (KMS). Give Python least privilege (read-only to token columns; or avoid storing refresh token in Python at all with the brokered model).

Add per-tenant quotas (db, queue) to prevent a single user from burning Google quotas.

Cache hot reads (Redis/Vercel KV) for dashboards.

Instrument everything (logs/metrics/traces) + dead-letter queue for failed jobs.
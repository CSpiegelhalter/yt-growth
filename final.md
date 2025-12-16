YouTube Growth Consultant — MVP README (Scoped to “ship fast, sell subscriptions”)
What this is

A lightweight “algorithm consultant” web app that connects to a creator’s YouTube channel and produces one prioritized plan for what to do next, backed by their last 10 uploads + top performers in their niche.

The MVP avoids long-running pipelines. Most work runs on-demand when the user opens a report, with aggressive caching and optional short scheduled refreshes.

MVP outcome (what users pay for)
1) “Decide for Me” Action Plan (Core MVP)

Input: user connects YouTube → picks a niche (or enters 3–5 competitor channels / seed keywords) → clicks Generate
Output: one page with:

Best next video topic (1 pick + 2 alternates)

Title suggestions (3 options)

Thumbnail guidance (not generating images in MVP; just layout + wording guidance)

Tags/keywords (top 5)

One-week checklist (exact actions in order)

Why this is MVP-worthy: it’s the clearest “I saved time + I know what to do” value.

2) Retention Cliff Pinpointer (Core MVP)

For each of the user’s last 10 videos:

Identify the timestamp where retention crosses 50% (or the steepest drop)

Provide AI hypotheses for why (hook mismatch, dead air, slow transition, payoff delay)

Provide 3 concrete fixes for the next video’s first 30–90 seconds

This uses YouTube Analytics audience retention report data (elapsedVideoTimeRatio + audienceWatchRatio). 
Google for Developers

3) Subscriber Magnet Audit (Core MVP)

A simple channel-wide audit:

Top 3 videos by subs gained per 1,000 views

“What they share” pattern summary (topic type, CTA style, structure)

A “make more like this” template

This uses YouTube Analytics core metrics like views, subscribersGained, averageViewDuration/Percentage, minutes watched, etc. 
Google for Developers

Explicit non-goals for MVP (save time, avoid traps)

These are powerful but not MVP:

Automatic thumbnail A/B testing via your app (YouTube has a Studio feature rolling out, but this isn’t something you can reliably automate via public API in a clean MVP). 
The Verge
+1

Google Trends ingestion + forecasting

Comment mining → Shorts generator

Cross-platform repurposing

Collab matchmaking network effects

Monetization RPM prediction

(You can add them later once the core subscription value is proven.)

Data sources & what you can (and can’t) compute cheaply
YouTube APIs you’ll use

YouTube Data API v3

Public competitor video data: titles, descriptions, tags (if exposed), publish date, viewCount/likeCount/commentCount, etc. 
Google for Developers

Upload/set thumbnails (useful later if you build a “thumbnail uploader” utility). 
Google for Developers

YouTube Analytics API

Your channel performance + retention curves

Metrics like averageViewDuration, averageViewPercentage, subscribersGained, estimatedMinutesWatched, views, etc. 
Google for Developers
+1

Important MVP constraint: “CTR”

Creators care about CTR, but the Analytics API docs emphasize many core metrics and do not list general “impressions CTR” as a standard report metric in the same way creators see in Studio (you can still build a great MVP without it by focusing on retention + conversion + velocity proxies). 
Google for Developers

So the MVP’s “Title & Thumbnail Booster” is framed as:

Comparative pattern analysis vs niche winners (language patterns, length, specificity, curiosity gap)

Predicted lift is presented as a confidence rating (heuristic) rather than “data-backed CTR increase”.

How the app works (no long-running jobs)
Core principle: “On-demand + cached”

Compute reports when the user asks (open dashboard / click Generate)

Cache results for 12–24 hours

Use a tiny scheduled refresh only if you want faster dashboards

When do you call YouTube APIs?
On initial connect (once)

OAuth connect

Fetch:

channel id

last 10 uploads (video ids)

store minimal metadata snapshot (title, publishedAt, duration)

On dashboard load (fast, cached)

If cached report is fresh: return it

Else:

Analytics API: pull last 28 days metrics for last 10 uploads (one or few batched queries)

Analytics API: pull retention curve for each video (only when user opens “Retention” tab, to save quota/time)

Data API: pull competitor top videos for the niche seed (cached)

On “Generate Decide-for-Me Plan”

Pull cached stats + competitor set

Run 1–3 LLM calls (strict budget)

Store result as a “Plan” record

Background jobs (optional, short, not scary)

You can avoid background jobs entirely and still ship.

If you want one:

A daily cron that refreshes competitor top videos + your last 10 performance metrics

This is a short job (seconds), not a long-running pipeline

Run via Vercel Cron / GitHub Actions / Cloud scheduler hitting a single endpoint

Core algorithms (MVP-simple)
A) Retention Cliff Pinpointer

Input: retention series (elapsedVideoTimeRatio 0→1, audienceWatchRatio values) 
Google for Developers

Steps:

Convert elapsed ratio → seconds = ratio * durationSec

Smooth lightly (moving average window 3–5 points)

Find:

first timestamp where retention ≤ 0.50 OR

max negative slope segment

Output:

cliffTimeSec

“likely causes” prompt to LLM with surrounding context:

title, description, first 90 seconds transcript (optional later)

where cliff occurs

B) Subscriber Magnet Audit

For last N videos:

subs_per_1k = subscribersGained / (views/1000)

rank top 3

LLM summary prompt: “What do these 3 share?”

C) “Decide for Me” Plan

You do not need prediction models in MVP.

Build a competitor set:

top videos for 3–5 keywords in last 6–12 months

rank by views/day = views / max(days_since_publish, 1)

Extract patterns:

title structures

video length clusters

repeatable topics

LLM produces a plan using:

user’s own winners (subs_per_1k, retention strength)

competitor set patterns

MVP product surface (pages)

Landing

Auth + Billing (Stripe)

Connect YouTube (Google OAuth)

Dashboard

Quick tiles: “Best video to emulate”, “Weakest retention point”, “Top subscriber magnet”

Decide-for-Me Plan (Generate + history)

Retention tab

Subscriber Magnet tab

Settings (niche keywords, competitors, refresh)

Minimal tech stack (keep it boring)

Next.js (fullstack)

Postgres (Supabase/Neon)

Stripe subscriptions

Google OAuth (YouTube scopes)

Queue/cron (optional): Vercel Cron or GitHub Actions calling an endpoint

LLM: 1 provider, strict token limits, cached outputs

Data model (minimum tables)

users

subscriptions (or rely on Stripe customer id mapping)

youtube_accounts (channelId, refresh token pointer, granted scopes)

videos (videoId, title, publishedAt, durationSec)

video_metrics_daily (date, views, avgViewDuration, avgViewPercentage, subsGained, minutesWatched)

retention_points (videoId, elapsedRatio, audienceWatchRatio, fetchedAt)

plans (userId, createdAt, inputs, outputMarkdown, modelVersion)

Security & cost controls

Encrypt/store OAuth tokens safely (use managed secrets + DB encryption if possible)

Least-privilege OAuth scopes (only what you need for Analytics + read-only Data)

Hard limits:

max 10 videos analyzed

max 200 competitor videos cached

max 3 LLM calls per plan

Cache everything (12–24h) to reduce quota + cost

Never promise metrics you can’t reliably fetch via API (e.g., CTR) — frame those as heuristic suggestions

What’s next (Nice-to-haves after MVP proves demand)

Studio A/B testing helper: deep-link users to the Studio test + import results back manually (CSV upload)

Competitor “gap finder” (keyword difficulty proxy)

Comments → Shorts idea generator

Collab matchmaker

Thumbnail generation (with strong ethics + originality controls)

Local development (example env vars)

DATABASE_URL=...

STRIPE_SECRET_KEY=...

STRIPE_WEBHOOK_SECRET=...

GOOGLE_CLIENT_ID=...

GOOGLE_CLIENT_SECRET=...

GOOGLE_REDIRECT_URI=...

OPENAI_API_KEY=... (or your LLM provider)

APP_URL=http://localhost:3000

MVP definition of done

You can charge money once:

A user can subscribe → connect YouTube → see:

Decide-for-Me Plan generated in < 60 seconds

Retention cliff timestamps for last 10 videos

Subscriber magnet top 3 + a reusable template

If you want, I can turn this into a repo-ready README with:

endpoints/routes list

exact OAuth scopes

YouTube API query shapes you’ll call (reports.query examples)

a tight “first sprint” build order that minimizes rework.
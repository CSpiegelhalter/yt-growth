# YT Growth - YouTube Creator Growth Platform

A YouTube growth application that helps creators make better content faster through channel analysis, competitor insights, idea generation, and AI-powered thumbnail creation.

## Architecture Overview

This is a **monorepo** with the following structure:

```
yt-growth/
├── apps/
│   ├── web/              # Next.js App Router application
│   └── worker/           # Python worker (embedding, clustering, scoring)
├── packages/
│   └── db/
│       └── sql/          # Platform-agnostic SQL migrations
├── docker-compose.yml    # Local Postgres with pgvector
├── package.json          # Root workspace config
└── Makefile              # Developer convenience commands
```

### Trending Niches Discovery System

The discovery system uses an **offline ingestion → cached ranking → fast API** architecture.
The Python worker is the single source of truth for all trending/discovery data ingestion and processing:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Python Worker (Long-Running)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Ingestion  │─▶│ Snapshotting│─▶│   Embed→Cluster→Score   │  │
│  │  (YouTube)  │  │  (YouTube)  │  │        →Rank            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
        │                  │                      │
        ▼                  ▼                      ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────────┐
│ discovered_     │ │ video_stat_     │ │ niche_clusters          │
│ videos          │ │ snapshots       │ │ + video_scores          │
└─────────────────┘ └─────────────────┘ └─────────────────────────┘
                            │
                            ▼
                  ┌─────────────────────┐
                  │   Next.js API       │
                  │ (DB-only serving)   │
                  └─────────────────────┘
```

**Key Design Decisions:**
- Worker uses server-owned API key (not user OAuth tokens) for trending/discovery
- On-demand user searches still use OAuth and go through Next.js API routes directly
- Trending endpoints are DB-only reads (no YouTube API calls at request time)

**4 Canonical Lists** (product surfaces):
1. **Fastest Growing** - Highest velocity (views/day)
2. **Breakouts** - Small creator winners (velocity/subs ratio)
3. **Emerging Niches** - Semantic clusters ranked by momentum
4. **Low-Competition** - High opportunity scores (demand vs competition)

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+)
- [Docker](https://www.docker.com/) (for local Postgres)
- [Python 3.11+](https://www.python.org/) (for worker)
- Node.js 18+ (for some tooling)

### Local Development

1. **Clone and install dependencies:**

```bash
git clone <repo-url>
cd yt-growth
bun install
```

2. **Start the database:**

```bash
make db-up
# or: docker compose up -d
```

This starts Postgres 16 with pgvector enabled. The SQL files in `packages/db/sql/` are automatically executed on first boot.

3. **Set up environment variables:**

```bash
cp env.example apps/web/.env.local
# Edit apps/web/.env.local with your credentials
```

Required variables:
- `DATABASE_URL` - Postgres connection string
- `NEXTAUTH_SECRET` - Random secret for auth
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth credentials

4. **Run Prisma migrations:**

```bash
make db-migrate
# or: cd apps/web && bunx prisma migrate deploy
```

5. **Start the dev server:**

```bash
make dev
# or: bun run dev
```

The app will be available at http://localhost:3000

### Running the Worker

The Python worker handles all trending discovery: ingestion, snapshotting, embedding, clustering, and scoring.

1. **Set up Python environment:**

```bash
cd apps/worker
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
```

2. **Set environment variables:**

```bash
export DATABASE_URL="postgres://yt_growth:yt_growth_dev@localhost:5432/yt_growth"
export YOUTUBE_API_KEY="AIza..."   # Server-owned YouTube Data API key
export EMBEDDING_API_KEY="sk-..."  # OpenAI API key
```

3. **Run the pipeline:**

```bash
# Full pipeline (long-running service)
python -m worker --mode all

# One-shot full pipeline (for testing/cron)
python -m worker --mode all --once

# Individual modes
python -m worker --mode ingest --once    # YouTube search → discovered_videos
python -m worker --mode snapshot --once  # YouTube videos.list → video_stat_snapshots
python -m worker --mode process --once   # Embed → Cluster → Score → Rank

# Legacy individual steps (still available)
python -m worker embed --window 7d
python -m worker cluster --window 7d
python -m worker score --window 7d
python -m worker rank --window 7d
```

### Testing

```bash
# Web app tests
bun run test:unit
bun run test:integration
bun run test:e2e

# Worker tests
cd apps/worker
pytest tests/
```

## Database Schema

### Discovery Tables (packages/db/sql/)

- **discovered_videos** - Candidate videos from ingestion
- **video_stat_snapshots** - Time-series stats for velocity computation
- **channel_profiles_lite** - Channel data for breakout scoring
- **video_scores** - Pre-computed velocity and breakout scores
- **video_embeddings** - Title embeddings (1536-dim, OpenAI)
- **niche_clusters** - Semantic clusters with metrics
- **niche_cluster_videos** - Cluster membership
- **ingestion_state** - Cursor state for feeder resumption

### Prisma Tables (apps/web/prisma/)

The existing app tables (users, channels, subscriptions, etc.) are managed by Prisma.

## Deployment

### Web App (Vercel)

The web app deploys to Vercel. Set the root directory to `apps/web` in your Vercel project settings.

Required environment variables:
- All from `.env.local`

### Worker (Any Platform)

The worker is platform-agnostic. Deploy it anywhere that can run Python. It handles the complete trending discovery pipeline:
- **Ingestion**: YouTube Search API → `discovered_videos`
- **Snapshotting**: YouTube Videos API → `video_stat_snapshots`
- **Processing**: Embed → Cluster → Score → Rank

**Environment variables:**
```bash
# Required
DATABASE_URL=postgres://...         # Postgres connection string
YOUTUBE_API_KEY=AIza...             # Server-owned API key for YouTube Data API
EMBEDDING_API_KEY=sk-...            # OpenAI API key for embeddings

# Optional (defaults shown)
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIM=1536
INGEST_INTERVAL_SECONDS=600         # 10 minutes between ingestion runs
SNAPSHOT_INTERVAL_SECONDS=300       # 5 minutes between snapshot runs
YOUTUBE_DAILY_QUOTA=10000           # Your YouTube API daily quota
```

**Running the worker:**
```bash
# Full pipeline as a long-lived service
python -m worker --mode all

# One-shot runs (useful for testing or cron)
python -m worker --mode ingest --once
python -m worker --mode snapshot --once  
python -m worker --mode process --once
python -m worker --mode all --once

# Legacy commands (still available)
python -m worker embed --window 7d
python -m worker cluster --window 7d
python -m worker score --window 7d
python -m worker rank --window 7d
```

**Deployment recommendations:**
- Run as a single long-lived process (`--mode all`) on ECS Fargate, Cloud Run, or a dedicated VM
- The worker handles graceful shutdown on SIGTERM/SIGINT
- Multiple worker instances can run concurrently (uses `FOR UPDATE SKIP LOCKED` for safe snapshotting)
- Monitor logs for `METRICS:` lines which contain structured JSON stats

## Project Structure

### apps/web/

```
apps/web/
├── app/                  # Next.js App Router pages and API routes
│   ├── (app)/            # Authenticated app pages
│   ├── (marketing)/      # Public marketing pages
│   ├── api/              # API routes
│   │   ├── competitors/  # Competitor analysis APIs (DB-only trending)
│   │   └── me/           # User-specific APIs (may use OAuth)
│   └── auth/             # Authentication pages
├── components/           # React components
├── lib/                  # Server-side utilities
├── prisma/               # Prisma schema and migrations
└── tests/                # Test files
```

### apps/worker/

```
apps/worker/
├── src/worker/
│   ├── __main__.py           # CLI entry point
│   ├── config.py             # Environment config
│   ├── db.py                 # Database operations
│   ├── youtube_client.py     # YouTube API client (API key auth, batching, retries)
│   ├── discovery_feeders.py  # Candidate generation (seeds, expansion, long-tail)
│   ├── gating.py             # Filtering, dedupe, per-channel caps
│   ├── snapshot_scheduler.py # Tiered snapshotting, leasing
│   ├── metrics.py            # Stats logging
│   ├── embed.py              # OpenAI embedding
│   ├── cluster.py            # HDBSCAN clustering
│   ├── label.py              # TF-IDF labeling
│   ├── score.py              # Velocity scoring
│   ├── rank.py               # Cluster ranking
│   └── pipeline.py           # Full pipeline orchestration
├── tests/                    # Python tests
└── scripts/
    └── seed_test_data.py     # Test data seeding
```

## Key Technologies

- **Frontend:** Next.js 16, React 19, TypeScript
- **Backend:** Next.js API Routes, Prisma, Postgres
- **ML Pipeline:** Python, OpenAI Embeddings, HDBSCAN, UMAP
- **Database:** Supabase Postgres with pgvector
- **Auth:** NextAuth.js with Google OAuth
- **Payments:** Stripe
- **Deployment:** Vercel (web), Any platform (worker)

## License

Proprietary - All rights reserved

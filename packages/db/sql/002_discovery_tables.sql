-- ============================================
-- TRENDING NICHES DISCOVERY SYSTEM
-- ============================================
-- These tables power the offline ingestion -> cached ranking -> fast API architecture.
-- Tables are separate from Prisma-managed tables to allow independent schema evolution.

-- ============================================
-- DISCOVERED VIDEOS (candidate pool)
-- ============================================
-- Central repository of all videos discovered through various feeders.
-- Videos exist once (no window column) - windows are computed at query time.

CREATE TABLE IF NOT EXISTS discovered_videos (
  video_id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  channel_title TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail_url TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  duration_sec INT,
  language TEXT,
  tags TEXT[] DEFAULT '{}',
  feeder TEXT,                    -- 'intent_seed', 'graph_expand', 'longtail'
  seed TEXT,                      -- The seed query that found this video
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discovered_videos_channel 
  ON discovered_videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_discovered_videos_published 
  ON discovered_videos(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovered_videos_first_seen 
  ON discovered_videos(first_seen_at DESC);

-- ============================================
-- VIDEO STAT SNAPSHOTS (time-series for velocity)
-- ============================================
-- Captures stats at regular intervals to compute real velocity and acceleration.
-- This is how we detect "trending" vs just "high views".

CREATE TABLE IF NOT EXISTS video_stat_snapshots (
  video_id TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  view_count BIGINT NOT NULL,
  like_count BIGINT,
  comment_count BIGINT,
  PRIMARY KEY (video_id, captured_at)
);

-- Foreign key added separately to avoid issues if tables created out of order
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_snapshots_video'
  ) THEN
    ALTER TABLE video_stat_snapshots 
      ADD CONSTRAINT fk_snapshots_video 
      FOREIGN KEY (video_id) REFERENCES discovered_videos(video_id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_snapshots_video_time 
  ON video_stat_snapshots(video_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_captured 
  ON video_stat_snapshots(captured_at DESC);

-- ============================================
-- CHANNEL PROFILES LITE (for breakout scoring)
-- ============================================
-- Lightweight channel data for computing breakout scores.
-- Includes rolling baselines computed from recent videos.

CREATE TABLE IF NOT EXISTS channel_profiles_lite (
  channel_id TEXT PRIMARY KEY,
  channel_title TEXT,
  subscriber_count BIGINT,
  channel_published_at TIMESTAMPTZ,
  median_views_per_day DOUBLE PRECISION,    -- Rolling baseline
  median_velocity_24h DOUBLE PRECISION,     -- Rolling baseline for breakout scoring
  video_count_for_baseline INT DEFAULT 0,   -- How many videos used to compute baselines
  last_fetched_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_channel_profiles_subs 
  ON channel_profiles_lite(subscriber_count DESC NULLS LAST);

-- ============================================
-- VIDEO COMPUTED SCORES (derived from snapshots)
-- ============================================
-- Pre-computed scores for fast serving. Updated by the worker pipeline.
-- Separate row per window since scores differ by time context.

CREATE TABLE IF NOT EXISTS video_scores (
  video_id TEXT NOT NULL,
  window TEXT NOT NULL,                     -- '24h', '7d', '30d'
  view_count BIGINT NOT NULL DEFAULT 0,
  views_per_day DOUBLE PRECISION NOT NULL DEFAULT 0,
  velocity_24h BIGINT,                      -- Views gained in last 24h
  velocity_7d BIGINT,                       -- Views gained in last 7d
  acceleration DOUBLE PRECISION,            -- velocity_24h - prior_velocity_24h
  -- Breakout scores (the key to finding what trending lists miss)
  breakout_by_subs DOUBLE PRECISION,        -- velocity_24h / max(100, subs)
  breakout_by_baseline DOUBLE PRECISION,    -- velocity_24h / channelMedianVelocity24h
  computed_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (video_id, window)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_scores_video'
  ) THEN
    ALTER TABLE video_scores 
      ADD CONSTRAINT fk_scores_video 
      FOREIGN KEY (video_id) REFERENCES discovered_videos(video_id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_video_scores_window_velocity 
  ON video_scores(window, velocity_24h DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_video_scores_window_breakout_subs 
  ON video_scores(window, breakout_by_subs DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_video_scores_window_breakout_baseline 
  ON video_scores(window, breakout_by_baseline DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_video_scores_window_vpd 
  ON video_scores(window, views_per_day DESC);

-- ============================================
-- VIDEO EMBEDDINGS (for clustering)
-- ============================================
-- Stores title embeddings for semantic clustering.
-- Using 1536 dimensions for OpenAI text-embedding-3-small.

CREATE TABLE IF NOT EXISTS video_embeddings (
  video_id TEXT PRIMARY KEY,
  embedding vector(1536) NOT NULL,
  model TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  embedded_at TIMESTAMPTZ DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_embeddings_video'
  ) THEN
    ALTER TABLE video_embeddings 
      ADD CONSTRAINT fk_embeddings_video 
      FOREIGN KEY (video_id) REFERENCES discovered_videos(video_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Optional: Add IVFFlat index for approximate nearest neighbor search
-- CREATE INDEX IF NOT EXISTS idx_video_embeddings_ivfflat 
--   ON video_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- NICHE CLUSTERS (semantic groupings)
-- ============================================
-- Clusters are recomputed periodically by the worker.
-- cluster_id is deterministic (hash of window + sorted video_ids) for idempotency.

CREATE TABLE IF NOT EXISTS niche_clusters (
  cluster_id UUID PRIMARY KEY,
  window TEXT NOT NULL,
  label TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  computed_at TIMESTAMPTZ DEFAULT now(),
  -- Aggregate metrics
  median_velocity_24h DOUBLE PRECISION,
  median_views_per_day DOUBLE PRECISION,
  unique_channels INT,
  total_videos INT,
  avg_days_old INT,
  -- Competition metrics (for "underserved opportunities" list)
  avg_channel_subs DOUBLE PRECISION,
  winner_concentration DOUBLE PRECISION,    -- Gini-like: 0=evenly spread, 1=dominated by few
  opportunity_score DOUBLE PRECISION        -- High demand + low competition
);

CREATE INDEX IF NOT EXISTS idx_clusters_window_computed 
  ON niche_clusters(window, computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_clusters_window_velocity 
  ON niche_clusters(window, median_velocity_24h DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_clusters_window_opportunity 
  ON niche_clusters(window, opportunity_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_clusters_window_vpd 
  ON niche_clusters(window, median_views_per_day DESC NULLS LAST);

-- ============================================
-- CLUSTER MEMBERSHIP (join table)
-- ============================================
-- Links videos to their clusters. A video can be in one cluster per window.

CREATE TABLE IF NOT EXISTS niche_cluster_videos (
  cluster_id UUID NOT NULL,
  video_id TEXT NOT NULL,
  rank_in_cluster INT NOT NULL DEFAULT 0,   -- For ordering within cluster
  PRIMARY KEY (cluster_id, video_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_cluster_videos_cluster'
  ) THEN
    ALTER TABLE niche_cluster_videos 
      ADD CONSTRAINT fk_cluster_videos_cluster 
      FOREIGN KEY (cluster_id) REFERENCES niche_clusters(cluster_id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_cluster_videos_video'
  ) THEN
    ALTER TABLE niche_cluster_videos 
      ADD CONSTRAINT fk_cluster_videos_video 
      FOREIGN KEY (video_id) REFERENCES discovered_videos(video_id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cluster_videos_video 
  ON niche_cluster_videos(video_id);

-- ============================================
-- INGESTION STATE (for cursor-based resumption)
-- ============================================
-- Tracks ingestion progress for each feeder to enable resumption.

CREATE TABLE IF NOT EXISTS ingestion_state (
  feeder TEXT PRIMARY KEY,                  -- 'intent_seed', 'graph_expand', 'longtail'
  cursor_position TEXT,                     -- Opaque cursor for resuming
  last_run_at TIMESTAMPTZ,
  videos_added_last_run INT DEFAULT 0,
  total_videos_added INT DEFAULT 0
);

-- ============================================
-- ADDITIONAL INDEXES FOR SNAPSHOTTING
-- ============================================

-- Index for finding videos that need snapshots (due-for-snapshot query)
CREATE INDEX IF NOT EXISTS idx_discovered_videos_snapshot_due 
  ON discovered_videos(published_at DESC)
  WHERE published_at > now() - interval '90 days';

-- Index for channel lookup during gating
CREATE INDEX IF NOT EXISTS idx_discovered_videos_channel_recent 
  ON discovered_videos(channel_id, first_seen_at DESC);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to compute days since published
CREATE OR REPLACE FUNCTION days_since_published(pub_at TIMESTAMPTZ) 
RETURNS DOUBLE PRECISION AS $$
BEGIN
  RETURN GREATEST(0.01, EXTRACT(EPOCH FROM (now() - pub_at)) / 86400.0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

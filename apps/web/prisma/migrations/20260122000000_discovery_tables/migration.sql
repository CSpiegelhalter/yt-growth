-- ============================================
-- TRENDING NICHES DISCOVERY SYSTEM
-- ============================================
-- These tables power the offline ingestion -> cached ranking -> fast API architecture.

-- Enable pgvector extension for embedding storage and similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- DISCOVERED VIDEOS (candidate pool)
-- ============================================
CREATE TABLE IF NOT EXISTS "discovered_videos" (
  "video_id" TEXT PRIMARY KEY,
  "channel_id" TEXT NOT NULL,
  "channel_title" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "thumbnail_url" TEXT,
  "published_at" TIMESTAMPTZ NOT NULL,
  "duration_sec" INT,
  "language" TEXT,
  "tags" TEXT[] DEFAULT '{}',
  "feeder" TEXT,
  "seed" TEXT,
  "first_seen_at" TIMESTAMPTZ DEFAULT now(),
  "last_seen_at" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_discovered_videos_channel" ON "discovered_videos"("channel_id");
CREATE INDEX IF NOT EXISTS "idx_discovered_videos_published" ON "discovered_videos"("published_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_discovered_videos_first_seen" ON "discovered_videos"("first_seen_at" DESC);

-- ============================================
-- VIDEO STAT SNAPSHOTS (time-series for velocity)
-- ============================================
CREATE TABLE IF NOT EXISTS "video_stat_snapshots" (
  "video_id" TEXT NOT NULL,
  "captured_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "view_count" BIGINT NOT NULL,
  "like_count" BIGINT,
  "comment_count" BIGINT,
  PRIMARY KEY ("video_id", "captured_at"),
  CONSTRAINT "fk_snapshots_video" FOREIGN KEY ("video_id") REFERENCES "discovered_videos"("video_id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_snapshots_video_time" ON "video_stat_snapshots"("video_id", "captured_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_snapshots_captured" ON "video_stat_snapshots"("captured_at" DESC);

-- ============================================
-- CHANNEL PROFILES LITE (for breakout scoring)
-- ============================================
CREATE TABLE IF NOT EXISTS "channel_profiles_lite" (
  "channel_id" TEXT PRIMARY KEY,
  "channel_title" TEXT,
  "subscriber_count" BIGINT,
  "channel_published_at" TIMESTAMPTZ,
  "median_views_per_day" DOUBLE PRECISION,
  "median_velocity_24h" DOUBLE PRECISION,
  "video_count_for_baseline" INT DEFAULT 0,
  "last_fetched_at" TIMESTAMPTZ DEFAULT now(),
  "updated_at" TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_channel_profiles_subs" ON "channel_profiles_lite"("subscriber_count" DESC NULLS LAST);

-- ============================================
-- VIDEO COMPUTED SCORES (derived from snapshots)
-- ============================================
-- Note: "window" is a reserved keyword in PostgreSQL, quoted for safety
CREATE TABLE IF NOT EXISTS "video_scores" (
  "video_id" TEXT NOT NULL,
  "window" TEXT NOT NULL,
  "view_count" BIGINT NOT NULL DEFAULT 0,
  "views_per_day" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "velocity_24h" BIGINT,
  "velocity_7d" BIGINT,
  "acceleration" DOUBLE PRECISION,
  "breakout_by_subs" DOUBLE PRECISION,
  "breakout_by_baseline" DOUBLE PRECISION,
  "computed_at" TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY ("video_id", "window"),
  CONSTRAINT "fk_scores_video" FOREIGN KEY ("video_id") REFERENCES "discovered_videos"("video_id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_video_scores_window_velocity" ON "video_scores"("window", "velocity_24h" DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS "idx_video_scores_window_breakout_subs" ON "video_scores"("window", "breakout_by_subs" DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS "idx_video_scores_window_breakout_baseline" ON "video_scores"("window", "breakout_by_baseline" DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS "idx_video_scores_window_vpd" ON "video_scores"("window", "views_per_day" DESC);

-- ============================================
-- VIDEO EMBEDDINGS (for clustering)
-- ============================================
CREATE TABLE IF NOT EXISTS "video_embeddings" (
  "video_id" TEXT PRIMARY KEY,
  "embedding" vector(1536) NOT NULL,
  "model" TEXT NOT NULL DEFAULT 'text-embedding-3-small',
  "embedded_at" TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT "fk_embeddings_video" FOREIGN KEY ("video_id") REFERENCES "discovered_videos"("video_id") ON DELETE CASCADE
);

-- ============================================
-- NICHE CLUSTERS (semantic groupings)
-- ============================================
CREATE TABLE IF NOT EXISTS "niche_clusters" (
  "cluster_id" UUID PRIMARY KEY,
  "window" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "keywords" TEXT[] DEFAULT '{}',
  "computed_at" TIMESTAMPTZ DEFAULT now(),
  "median_velocity_24h" DOUBLE PRECISION,
  "median_views_per_day" DOUBLE PRECISION,
  "unique_channels" INT,
  "total_videos" INT,
  "avg_days_old" INT,
  "avg_channel_subs" DOUBLE PRECISION,
  "winner_concentration" DOUBLE PRECISION,
  "opportunity_score" DOUBLE PRECISION
);

CREATE INDEX IF NOT EXISTS "idx_clusters_window_computed" ON "niche_clusters"("window", "computed_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_clusters_window_velocity" ON "niche_clusters"("window", "median_velocity_24h" DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS "idx_clusters_window_opportunity" ON "niche_clusters"("window", "opportunity_score" DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS "idx_clusters_window_vpd" ON "niche_clusters"("window", "median_views_per_day" DESC NULLS LAST);

-- ============================================
-- CLUSTER MEMBERSHIP (join table)
-- ============================================
CREATE TABLE IF NOT EXISTS "niche_cluster_videos" (
  "cluster_id" UUID NOT NULL,
  "video_id" TEXT NOT NULL,
  "rank_in_cluster" INT NOT NULL DEFAULT 0,
  PRIMARY KEY ("cluster_id", "video_id"),
  CONSTRAINT "fk_cluster_videos_cluster" FOREIGN KEY ("cluster_id") REFERENCES "niche_clusters"("cluster_id") ON DELETE CASCADE,
  CONSTRAINT "fk_cluster_videos_video" FOREIGN KEY ("video_id") REFERENCES "discovered_videos"("video_id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_cluster_videos_video" ON "niche_cluster_videos"("video_id");

-- ============================================
-- INGESTION STATE (for cursor-based resumption)
-- ============================================
CREATE TABLE IF NOT EXISTS "ingestion_state" (
  "feeder" TEXT PRIMARY KEY,
  "cursor_position" TEXT,
  "last_run_at" TIMESTAMPTZ,
  "videos_added_last_run" INT DEFAULT 0,
  "total_videos_added" INT DEFAULT 0
);

-- ============================================
-- ADDITIONAL INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS "idx_discovered_videos_channel_recent" ON "discovered_videos"("channel_id", "first_seen_at" DESC);

-- ============================================
-- HELPER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION days_since_published(pub_at TIMESTAMPTZ) 
RETURNS DOUBLE PRECISION AS $$
BEGIN
  RETURN GREATEST(0.01, EXTRACT(EPOCH FROM (now() - pub_at)) / 86400.0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

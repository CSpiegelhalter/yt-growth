"""
CLI entry point and composition root.

Responsibility: Wire up dependencies and run the worker.
This is the only place where concrete implementations are instantiated.
"""

import json
import logging
import signal
import sys
import time
import click

from ..config import get_config
from ..infra.youtube import YouTubeClient, get_quota_tracker
from ..infra.db import (
    get_connection,
    PostgresVideoRepository,
    PostgresSnapshotRepository,
    PostgresClusterRepository,
    PostgresScoreRepository,
    PostgresChannelRepository,
    PostgresIngestionStateRepository,
    PostgresEmbeddingRepository,
)
from ..infra.embeddings import OpenAIEmbedder
from ..infra.metrics import JsonMetricsCollector
from ..app.use_cases import (
    run_ingest_pipeline,
    run_snapshot_pipeline,
    run_process_pipeline,
    run_all_pipelines,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ============================================
# SIGNAL HANDLERS
# ============================================

_shutdown_requested = False


def handle_shutdown(signum, frame):
    """Handle shutdown signals gracefully."""
    global _shutdown_requested
    logger.info(f"Received signal {signum}, initiating graceful shutdown...")
    _shutdown_requested = True


def is_shutdown_requested() -> bool:
    """Check if shutdown has been requested."""
    return _shutdown_requested


# ============================================
# DEPENDENCY WIRING (Composition Root)
# ============================================

def create_repositories(conn):
    """Create all repository instances."""
    return {
        "video": PostgresVideoRepository(conn),
        "snapshot": PostgresSnapshotRepository(conn),
        "cluster": PostgresClusterRepository(conn),
        "score": PostgresScoreRepository(conn),
        "channel": PostgresChannelRepository(conn),
        "state": PostgresIngestionStateRepository(conn),
        "embedding": PostgresEmbeddingRepository(conn),
    }


# ============================================
# CLI GROUP
# ============================================

@click.group(invoke_without_command=True)
@click.option("--mode", type=click.Choice(["all", "ingest", "snapshot", "process"]), help="Worker mode")
@click.option("--window", default="7d", help="Time window (24h, 7d, 30d, 90d)")
@click.option("--once", is_flag=True, help="Run once then exit (vs continuous)")
@click.pass_context
def cli(ctx, mode: str | None, window: str, once: bool):
    """
    YT Growth Worker - Trending Niches Discovery Pipeline
    
    Modes:
    
      all      - Full pipeline: ingest -> snapshot -> embed -> cluster -> score -> rank
      
      ingest   - YouTube search for candidate videos
      
      snapshot - YouTube videos.list for stat snapshots
      
      process  - Embed -> Cluster -> Score -> Rank (DB-only, no YouTube calls)
    
    Use --once for one-shot runs, omit for continuous operation.
    """
    if mode:
        ctx.ensure_object(dict)
        ctx.obj["window"] = window
        ctx.obj["once"] = once
        
        # Set up signal handlers
        signal.signal(signal.SIGINT, handle_shutdown)
        signal.signal(signal.SIGTERM, handle_shutdown)
        
        # Validate config
        config = get_config()
        
        if mode in ("all", "ingest", "snapshot"):
            try:
                config.require_youtube_api_key()
            except ValueError as e:
                logger.error(str(e))
                sys.exit(1)
        
        try:
            if mode == "all":
                run_mode_all(config, window, once)
            elif mode == "ingest":
                run_mode_ingest(config, window, once)
            elif mode == "snapshot":
                run_mode_snapshot(config, window, once)
            elif mode == "process":
                run_mode_process(config, window, once)
        except KeyboardInterrupt:
            logger.info("Interrupted by user")
            sys.exit(0)
        except Exception as e:
            logger.exception(f"Fatal error: {e}")
            sys.exit(1)
        
        sys.exit(0)
    
    if ctx.invoked_subcommand is None:
        click.echo(ctx.get_help())


# ============================================
# MODE RUNNERS
# ============================================

def run_mode_all(config, window: str, once: bool):
    """Run the full pipeline."""
    collector = JsonMetricsCollector()
    
    logger.info(f"Starting worker in 'all' mode (window={window}, once={once})")
    
    if once:
        result = _run_all_once(config, window, collector)
        print(json.dumps(result, indent=2, default=str))
    else:
        iteration = 0
        while not is_shutdown_requested():
            iteration += 1
            logger.info(f"=== Starting iteration {iteration} ===")
            
            try:
                result = _run_all_once(config, window, collector)
                logger.info(f"Iteration {iteration} complete: {json.dumps(result.get('summary', {}), default=str)}")
            except Exception as e:
                logger.exception(f"Iteration {iteration} failed: {e}")
                collector.log_error(str(e), {"iteration": iteration})
            
            collector.log_worker_status()
            
            sleep_seconds = min(config.ingest_interval_seconds, config.snapshot_interval_seconds)
            logger.info(f"Sleeping {sleep_seconds}s before next iteration...")
            
            for _ in range(sleep_seconds):
                if is_shutdown_requested():
                    break
                time.sleep(1)
        
        logger.info("Worker shutdown complete")


def run_mode_ingest(config, window: str, once: bool):
    """Run ingestion only."""
    collector = JsonMetricsCollector()
    
    logger.info(f"Starting worker in 'ingest' mode (window={window}, once={once})")
    
    if once:
        result = _run_ingest_once(config, window, collector)
        print(json.dumps(result, indent=2, default=str))
    else:
        while not is_shutdown_requested():
            try:
                result = _run_ingest_once(config, window, collector)
                logger.info(f"Ingest complete: {json.dumps(result, default=str)}")
            except Exception as e:
                logger.exception(f"Ingest failed: {e}")
                collector.log_error(str(e))
            
            logger.info(f"Sleeping {config.ingest_interval_seconds}s...")
            for _ in range(config.ingest_interval_seconds):
                if is_shutdown_requested():
                    break
                time.sleep(1)
        
        logger.info("Ingest worker shutdown complete")


def run_mode_snapshot(config, window: str, once: bool):
    """Run snapshotting only."""
    collector = JsonMetricsCollector()
    
    logger.info(f"Starting worker in 'snapshot' mode (window={window}, once={once})")
    
    if once:
        result = _run_snapshot_once(config, collector)
        print(json.dumps(result, indent=2, default=str))
    else:
        while not is_shutdown_requested():
            try:
                result = _run_snapshot_once(config, collector)
                logger.info(f"Snapshot complete: {json.dumps(result, default=str)}")
            except Exception as e:
                logger.exception(f"Snapshot failed: {e}")
                collector.log_error(str(e))
            
            logger.info(f"Sleeping {config.snapshot_interval_seconds}s...")
            for _ in range(config.snapshot_interval_seconds):
                if is_shutdown_requested():
                    break
                time.sleep(1)
        
        logger.info("Snapshot worker shutdown complete")


def run_mode_process(config, window: str, once: bool):
    """Run processing only."""
    collector = JsonMetricsCollector()
    
    logger.info(f"Starting worker in 'process' mode (window={window}, once={once})")
    
    if once:
        result = _run_process_once(config, window, collector)
        print(json.dumps(result, indent=2, default=str))
    else:
        interval = max(config.ingest_interval_seconds, 1800)
        
        while not is_shutdown_requested():
            try:
                result = _run_process_once(config, window, collector)
                logger.info(f"Process complete: {json.dumps(result, default=str)}")
            except Exception as e:
                logger.exception(f"Process failed: {e}")
                collector.log_error(str(e))
            
            logger.info(f"Sleeping {interval}s...")
            for _ in range(interval):
                if is_shutdown_requested():
                    break
                time.sleep(1)
        
        logger.info("Process worker shutdown complete")


# ============================================
# ONE-SHOT RUNNERS (with dependency wiring)
# ============================================

def _run_all_once(config, window: str, collector):
    """Run all pipelines once with proper dependency wiring."""
    yt_client = YouTubeClient(api_key=config.require_youtube_api_key())
    embedder = OpenAIEmbedder(api_key=config.embedding_api_key, model=config.embedding_model)
    
    with get_connection(config.database_url) as conn:
        repos = create_repositories(conn)
        
        return run_all_pipelines(
            youtube_client=yt_client,
            embedder=embedder,
            video_repo=repos["video"],
            snapshot_repo=repos["snapshot"],
            cluster_repo=repos["cluster"],
            score_repo=repos["score"],
            channel_repo=repos["channel"],
            state_repo=repos["state"],
            embedding_repo=repos["embedding"],
            metrics=collector,
            window=window,
            max_per_channel=config.ingest_max_per_channel,
            seeds_per_run=config.ingest_seeds_per_run,
            videos_per_seed=config.ingest_videos_per_seed,
            longtail_queries=config.ingest_longtail_queries,
            snapshot_batch_size=config.snapshot_batch_size,
            snapshot_max_per_run=config.snapshot_max_per_run,
            tier_a_hours=config.snapshot_tier_a_hours,
            tier_b_hours=config.snapshot_tier_b_hours,
            tier_c_hours=config.snapshot_tier_c_hours,
            embedding_batch_size=config.embedding_batch_size,
            umap_n_components=config.umap_n_components,
            umap_n_neighbors=config.umap_n_neighbors,
            cluster_min_size=config.cluster_min_size,
        )


def _run_ingest_once(config, window: str, collector):
    """Run ingestion once with proper dependency wiring."""
    yt_client = YouTubeClient(api_key=config.require_youtube_api_key())
    
    with get_connection(config.database_url) as conn:
        repos = create_repositories(conn)
        
        return run_ingest_pipeline(
            youtube_client=yt_client,
            video_repo=repos["video"],
            score_repo=repos["score"],
            channel_repo=repos["channel"],
            state_repo=repos["state"],
            metrics=collector,
            window=window,
            max_per_channel=config.ingest_max_per_channel,
            seeds_per_run=config.ingest_seeds_per_run,
            videos_per_seed=config.ingest_videos_per_seed,
            longtail_queries=config.ingest_longtail_queries,
        )


def _run_snapshot_once(config, collector):
    """Run snapshot once with proper dependency wiring."""
    yt_client = YouTubeClient(api_key=config.require_youtube_api_key())
    
    with get_connection(config.database_url) as conn:
        repos = create_repositories(conn)
        
        return run_snapshot_pipeline(
            youtube_client=yt_client,
            snapshot_repo=repos["snapshot"],
            channel_repo=repos["channel"],
            metrics=collector,
            batch_size=config.snapshot_batch_size,
            max_per_run=config.snapshot_max_per_run,
            tier_a_hours=config.snapshot_tier_a_hours,
            tier_b_hours=config.snapshot_tier_b_hours,
            tier_c_hours=config.snapshot_tier_c_hours,
        )


def _run_process_once(config, window: str, collector):
    """Run processing once with proper dependency wiring."""
    embedder = OpenAIEmbedder(api_key=config.embedding_api_key, model=config.embedding_model)
    
    with get_connection(config.database_url) as conn:
        repos = create_repositories(conn)
        
        return run_process_pipeline(
            embedder=embedder,
            video_repo=repos["video"],
            embedding_repo=repos["embedding"],
            cluster_repo=repos["cluster"],
            score_repo=repos["score"],
            metrics=collector,
            window=window,
            embedding_batch_size=config.embedding_batch_size,
            umap_n_components=config.umap_n_components,
            umap_n_neighbors=config.umap_n_neighbors,
            cluster_min_size=config.cluster_min_size,
        )


# ============================================
# LEGACY SUBCOMMANDS (backwards compatibility)
# ============================================

@cli.command()
@click.option("--window", default="7d", help="Time window (24h, 7d, 30d, 90d)")
@click.option("--limit", default=1000, help="Maximum videos to embed")
def embed(window: str, limit: int):
    """Embed video titles that don't have embeddings yet."""
    config = get_config()
    embedder = OpenAIEmbedder(api_key=config.embedding_api_key, model=config.embedding_model)
    
    with get_connection(config.database_url) as conn:
        repos = create_repositories(conn)
        from ..app.services import EmbeddingService
        service = EmbeddingService(
            embedder=embedder,
            video_repo=repos["video"],
            embedding_repo=repos["embedding"],
            batch_size=config.embedding_batch_size,
        )
        result = service.embed_videos(window, limit=limit)
        print(json.dumps(result, indent=2))


@cli.command()
@click.option("--window", default="7d", help="Time window (24h, 7d, 30d, 90d)")
def cluster(window: str):
    """Cluster videos by semantic similarity."""
    config = get_config()
    
    with get_connection(config.database_url) as conn:
        repos = create_repositories(conn)
        from ..app.services import ClusteringService
        service = ClusteringService(
            embedding_repo=repos["embedding"],
            cluster_repo=repos["cluster"],
            umap_n_components=config.umap_n_components,
            umap_n_neighbors=config.umap_n_neighbors,
            cluster_min_size=config.cluster_min_size,
        )
        result = service.cluster_videos(window)
        print(json.dumps(result, indent=2))


@cli.command()
@click.option("--window", default="7d", help="Time window (24h, 7d, 30d, 90d)")
def score(window: str):
    """Compute velocity and breakout scores."""
    config = get_config()
    
    with get_connection(config.database_url) as conn:
        repos = create_repositories(conn)
        from ..app.services import ScoringService
        service = ScoringService(score_repo=repos["score"])
        result = service.compute_video_scores(window)
        print(json.dumps(result, indent=2))


@cli.command()
@click.option("--window", default="7d", help="Time window (24h, 7d, 30d, 90d)")
def rank(window: str):
    """Rank clusters by opportunity score."""
    config = get_config()
    
    with get_connection(config.database_url) as conn:
        repos = create_repositories(conn)
        from ..app.services import RankingService
        service = RankingService(
            cluster_repo=repos["cluster"],
            score_repo=repos["score"],
        )
        result = service.rank_clusters(window)
        print(json.dumps(result, indent=2))


@cli.command()
@click.option("--window", default="7d", help="Time window (24h, 7d, 30d, 90d)")
def run(window: str):
    """Run the processing pipeline: embed -> cluster -> score -> rank."""
    config = get_config()
    collector = JsonMetricsCollector()
    result = _run_process_once(config, window, collector)
    print(json.dumps(result, indent=2, default=str))


@cli.command("rss-expand")
@click.option("--max-channels", default=50, help="Max channels to fetch RSS from")
def rss_expand(max_channels: int):
    """
    Expand video pool from known channels using FREE RSS feeds.
    
    No API quota used! Fetches recent videos from channels we've already discovered.
    """
    config = get_config()
    
    with get_connection(config.database_url) as conn:
        repos = create_repositories(conn)
        from ..app.feeders import RSSExpansionFeeder
        from ..domain.models import DiscoveredVideo
        
        feeder = RSSExpansionFeeder(
            video_repo=repos["video"],
            max_channels=max_channels,
        )
        
        candidates = list(feeder.generate_candidates())
        
        if not candidates:
            print(json.dumps({"status": "no_new_videos", "found": 0}))
            return
        
        # Convert to DiscoveredVideo and insert
        videos_to_insert = [
            DiscoveredVideo.from_search_result(v, feeder="rss_expand")
            for v in candidates
        ]
        
        inserted, updated = repos["video"].upsert_videos_batch(videos_to_insert)
        
        print(json.dumps({
            "status": "success",
            "candidates_found": len(candidates),
            "inserted": inserted,
            "updated": updated,
            "quota_used": 0,  # FREE!
        }, indent=2))


def main():
    """Main entry point."""
    cli()


if __name__ == "__main__":
    main()

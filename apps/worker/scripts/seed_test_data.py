"""
Seed test data for local development.

Usage:
    python scripts/seed_test_data.py
"""

import os
import sys
from datetime import datetime, timedelta, timezone
import random
import uuid
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

import psycopg


def clean_database_url(database_url: str) -> str:
    """Remove Prisma-specific query parameters (?schema=public) from DATABASE_URL."""
    parsed = urlparse(database_url)
    params = parse_qs(parsed.query)
    params.pop("schema", None)
    params.pop("pgbouncer", None)
    clean_query = urlencode(params, doseq=True)
    return urlunparse(parsed._replace(query=clean_query))


# Sample data for realistic titles
TITLE_TEMPLATES = [
    "How to {verb} {topic} in 2024",
    "{topic} Tutorial for Beginners",
    "I Tried {topic} for 30 Days",
    "The Truth About {topic}",
    "{topic} Tips and Tricks",
    "Best {topic} Setup Guide",
    "{topic} vs {topic2}: Which is Better?",
    "Why Everyone is Switching to {topic}",
    "My {topic} Morning Routine",
    "{topic} Mistakes to Avoid",
]

VERBS = ["learn", "master", "start", "improve", "build", "create", "optimize"]
TOPICS = [
    "Python", "React", "AI", "ChatGPT", "Productivity", "Investing",
    "Fitness", "Cooking", "Photography", "Video Editing", "Gaming",
    "Home Office", "Side Hustle", "Travel", "Music Production",
    "Web Development", "Machine Learning", "Data Science", "Design",
]


def generate_title() -> str:
    """Generate a realistic video title."""
    template = random.choice(TITLE_TEMPLATES)
    return template.format(
        verb=random.choice(VERBS),
        topic=random.choice(TOPICS),
        topic2=random.choice(TOPICS),
    )


def generate_channel_id() -> str:
    """Generate a fake channel ID."""
    return f"UC{uuid.uuid4().hex[:22]}"


def generate_video_id() -> str:
    """Generate a fake video ID."""
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
    return "".join(random.choice(chars) for _ in range(11))


def seed_data(conn_string: str, num_videos: int = 100, num_channels: int = 30):
    """
    Seed the database with test data.
    
    Args:
        conn_string: Database connection string
        num_videos: Number of videos to create
        num_channels: Number of unique channels
    """
    print(f"Connecting to database...")
    clean_url = clean_database_url(conn_string)
    conn = psycopg.connect(clean_url)
    
    # Generate channels
    channels = []
    for _ in range(num_channels):
        channels.append({
            "channel_id": generate_channel_id(),
            "channel_title": f"Test Channel {random.randint(1000, 9999)}",
            "subscriber_count": random.randint(100, 1000000),
        })
    
    # Insert channels
    print(f"Inserting {num_channels} channels...")
    with conn.cursor() as cur:
        for ch in channels:
            cur.execute("""
                INSERT INTO channel_profiles_lite (channel_id, channel_title, subscriber_count)
                VALUES (%s, %s, %s)
                ON CONFLICT (channel_id) DO NOTHING
            """, (ch["channel_id"], ch["channel_title"], ch["subscriber_count"]))
    conn.commit()
    
    # Generate videos
    now = datetime.now(timezone.utc)
    print(f"Inserting {num_videos} videos...")
    
    with conn.cursor() as cur:
        for i in range(num_videos):
            channel = random.choice(channels)
            
            # Random publish date within last 30 days
            days_ago = random.randint(1, 30)
            published_at = now - timedelta(days=days_ago)
            
            # Random view count (correlated with age somewhat)
            base_views = random.randint(1000, 100000)
            view_count = int(base_views * (1 + random.random() * days_ago / 10))
            
            video = {
                "video_id": generate_video_id(),
                "channel_id": channel["channel_id"],
                "channel_title": channel["channel_title"],
                "title": generate_title(),
                "thumbnail_url": f"https://i.ytimg.com/vi/{generate_video_id()}/hqdefault.jpg",
                "published_at": published_at,
                "duration_sec": random.randint(60, 3600),
                "feeder": random.choice(["intent_seed", "graph_expand"]),
            }
            
            # Insert video
            cur.execute("""
                INSERT INTO discovered_videos (
                    video_id, channel_id, channel_title, title, thumbnail_url,
                    published_at, duration_sec, feeder
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (video_id) DO NOTHING
            """, (
                video["video_id"], video["channel_id"], video["channel_title"],
                video["title"], video["thumbnail_url"], video["published_at"],
                video["duration_sec"], video["feeder"],
            ))
            
            # Insert initial snapshot (captured at video publish time for realistic views_per_day calc)
            # This ensures views_per_day = view_count / days_old works correctly
            cur.execute("""
                INSERT INTO video_stat_snapshots (video_id, captured_at, view_count, like_count, comment_count)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT DO NOTHING
            """, (
                video["video_id"],
                now,  # Captured now, so views_per_day can be computed
                view_count,
                int(view_count * random.uniform(0.02, 0.08)),
                int(view_count * random.uniform(0.001, 0.01)),
            ))
            
            # Also insert a score record directly so it shows up in queries
            views_per_day = view_count / max(0.1, days_ago)
            cur.execute("""
                INSERT INTO video_scores (video_id, "window", view_count, views_per_day, computed_at)
                VALUES (%s, %s, %s, %s, now())
                ON CONFLICT (video_id, "window") DO UPDATE SET
                    view_count = EXCLUDED.view_count,
                    views_per_day = EXCLUDED.views_per_day,
                    computed_at = now()
            """, (video["video_id"], "7d", view_count, views_per_day))
            
            if (i + 1) % 20 == 0:
                print(f"  Inserted {i + 1}/{num_videos} videos")
    
    conn.commit()
    conn.close()
    
    print(f"\nDone! Seeded {num_videos} videos across {num_channels} channels.")


if __name__ == "__main__":
    conn_string = os.environ.get("DATABASE_URL")
    if not conn_string:
        print("Error: DATABASE_URL environment variable is required")
        sys.exit(1)
    
    seed_data(conn_string)

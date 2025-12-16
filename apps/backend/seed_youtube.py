#!/usr/bin/env python3
import os, time, json, pathlib, datetime
from typing import Dict, List, Any, Optional, Tuple
import requests
from dotenv import load_dotenv
import yaml
from tenacity import retry, wait_exponential, stop_after_attempt
from tqdm import tqdm
import pandas as pd

API_BASE = "https://www.googleapis.com/youtube/v3"

def today_dir() -> pathlib.Path:
    d = pathlib.Path("data") / datetime.date.today().isoformat()
    d.mkdir(parents=True, exist_ok=True)
    return d

def load_yaml(path: str) -> Dict[str, List[str]]:
    # Resolve relative to this script’s directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    abs_path = os.path.join(script_dir, path)

    if not os.path.exists(abs_path):
        raise FileNotFoundError(f"YAML file not found at: {abs_path}")

    with open(abs_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def save_jsonl(path: Path, rows: List[Dict[str, Any]]) -> None:
    with path.open("a", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")



class YTClient:
    def __init__(self, api_key: str, per_page: int = 50):
        self.api_key = api_key
        self.per_page = min(per_page, 50)

    @retry(wait=wait_exponential(min=1, max=32), stop=stop_after_attempt(5))
    def _get(self, path: str, params: Dict[str, Any]) -> Dict[str, Any]:
        params["key"] = self.api_key
        r = requests.get(f"{API_BASE}/{path}", params=params, timeout=20)
        if r.status_code == 403 and "quotaExceeded" in r.text:
            # Back off harder if quota is hit
            time.sleep(60)
        r.raise_for_status()
        return r.json()

    def search_videos(self, query: str, page_token: Optional[str] = None, published_after: Optional[str] = None) -> Dict[str, Any]:
        params = {
            "q": query,
            "part": "snippet",
            "type": "video",
            "maxResults": self.per_page,
            "order": "relevance",  # you can try "viewCount" or "date"
            "safeSearch": "none",
        }
        if page_token:
            params["pageToken"] = page_token
        if published_after:
            params["publishedAfter"] = published_after  # RFC3339
        return self._get("search", params)

    def videos_list(self, video_ids: List[str]) -> Dict[str, Any]:
        if not video_ids:
            return {"items": []}
        params = {
            "part": "snippet,statistics,contentDetails,topicDetails",
            "id": ",".join(video_ids[:50]),
            "maxResults": 50
        }
        return self._get("videos", params)

    def channels_list(self, channel_ids: List[str]) -> Dict[str, Any]:
        if not channel_ids:
            return {"items": []}
        params = {
            "part": "snippet,statistics,topicDetails,brandingSettings",
            "id": ",".join(channel_ids[:50]),
            "maxResults": 50
        }
        return self._get("channels", params)

def normalize_video_row(item: Dict[str, Any]) -> Dict[str, Any]:
    s = item.get("snippet", {})
    stats = item.get("statistics", {})
    cd = item.get("contentDetails", {})
    td = item.get("topicDetails", {})
    return {
        "video_id": item.get("id"),
        "channel_id": s.get("channelId"),
        "title": s.get("title"),
        "description": s.get("description"),
        "published_at": s.get("publishedAt"),
        "category_id": s.get("categoryId"),
        "tags": "|".join(s.get("tags", [])) if s.get("tags") else None,
        "duration": cd.get("duration"),
        "definition": cd.get("definition"),
        "caption": cd.get("caption"),
        "view_count": int(stats.get("viewCount", 0) or 0),
        "like_count": int(stats.get("likeCount", 0) or 0),
        "comment_count": int(stats.get("commentCount", 0) or 0),
        "topics": "|".join(td.get("topicCategories", [])) if td.get("topicCategories") else None,
    }

def normalize_channel_row(item: Dict[str, Any]) -> Dict[str, Any]:
    s = item.get("snippet", {})
    stats = item.get("statistics", {})
    return {
        "channel_id": item.get("id"),
        "title": s.get("title"),
        "custom_url": s.get("customUrl"),
        "published_at": s.get("publishedAt"),
        "country": s.get("country"),
        "view_count": int(stats.get("viewCount", 0) or 0),
        "subscriber_count": int(stats.get("subscriberCount", 0) or 0),
        "video_count": int(stats.get("videoCount", 0) or 0),
    }

def merge_video_channel(vrows: List[Dict[str, Any]], crows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Join video and channel data on channel_id."""
    c_map = {c["channel_id"]: c for c in crows}
    merged = []
    for v in vrows:
        ch = c_map.get(v["channel_id"], {})
        merged.append({
            "niche": v.get("niche"),
            "query": v.get("query"),
            "video_id": v.get("video_id"),
            "channel_id": v.get("channel_id"),
            "channel_title": ch.get("title"),
            "channel_subscribers": ch.get("subscriber_count"),
            "channel_views": ch.get("view_count"),
            "channel_videos": ch.get("video_count"),
            "title": v.get("title"),
            "description": v.get("description"),
            "published_at": v.get("published_at"),
            "view_count": v.get("view_count"),
            "like_count": v.get("like_count"),
            "comment_count": v.get("comment_count"),
            "topics": v.get("topics"),
            "tags": v.get("tags"),
            "duration": v.get("duration"),
            "definition": v.get("definition"),
            "caption": v.get("caption"),
        })
    return merged


def run_seed(
    niches: Dict[str, List[str]],
    api_key: str,
    per_query_max_pages: int = 3,
    published_after_days: Optional[int] = None
):
    out_dir = today_dir()
    # ✅ single output file for everything
    outfile = out_dir / "seed.jsonl"
    outfile.parent.mkdir(parents=True, exist_ok=True)

    client = YTClient(api_key=api_key, per_page=50)

    for niche, queries in niches.items():
        print(f"🔹 Collecting data for niche: {niche}")

        for q in queries:
            token = None
            pages = 0
            published_after = None
            if published_after_days:
                dt = datetime.datetime.utcnow() - datetime.timedelta(days=published_after_days)
                published_after = dt.replace(microsecond=0).isoformat("T") + "Z"

            pbar = tqdm(total=per_query_max_pages, desc=f"{niche} | {q}")
            while pages < per_query_max_pages:
                data = client.search_videos(q, page_token=token, published_after=published_after)
                token = data.get("nextPageToken")
                video_ids = [it["id"]["videoId"] for it in data.get("items", []) if it["id"]["kind"] == "youtube#video"]
                if not video_ids:
                    break

                vinfo = client.videos_list(video_ids).get("items", [])
                vrows = [normalize_video_row(v) for v in vinfo]
                for v in vrows:
                    v["niche"] = niche
                    v["query"] = q

                ch_ids = [r["channel_id"] for r in vrows if r["channel_id"]]
                cinfo = client.channels_list(ch_ids).get("items", [])
                crows = [normalize_channel_row(c) for c in cinfo]

                merged = merge_video_channel(vrows, crows)
                save_jsonl(outfile, merged)

                pages += 1
                pbar.update(1)
                if not token:
                    break
            pbar.close()



if __name__ == "__main__":
    load_dotenv()
    api_key = os.getenv("YT_API_KEY")
    if not api_key:
        raise SystemExit("Missing YT_API_KEY in .env")

    # Load niches yaml
    niches = load_yaml("niches.yaml")

    # Run
    run_seed(
        niches=niches,
        api_key=api_key,
        per_query_max_pages=3,        # adjust for ~150 results per query
        published_after_days=365      # keep data fresh (last 12 months). Set None for all time.
    )

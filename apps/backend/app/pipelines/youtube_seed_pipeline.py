from services.youtube_service import YouTubeService
from services.embeddings_service import EmbeddingsService

class YouTubeSeedPipeline:
    def __init__(self):
        self.yt = YouTubeService()
        self.embedder = EmbeddingsService()

    def run_niche(self, niche_name: str, queries: list[str]):
        all_videos = []
        for q in queries:
            data = self.yt.search_videos(q)
            items = data.get("items", [])
            for it in items:
                snippet = it.get("snippet", {})
                all_videos.append({
                    "niche": niche_name,
                    "title": snippet.get("title"),
                    "description": snippet.get("description"),
                    "tags": "|".join(snippet.get("tags", [])) if snippet.get("tags") else "",
                    "topics": "",
                })
        # Generate embeddings
        embeddings = self.embedder.encode_videos(all_videos)
        for v, emb in zip(all_videos, embeddings):
            v["embedding"] = emb.tolist()
        return all_videos

from sentence_transformers import SentenceTransformer
from core.utils.text_normalizer import normalize_text

class EmbeddingsService:
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)

    def build_text(self, video: dict) -> str:
        parts = [
            normalize_text(video.get("title")),
            normalize_text(video.get("description")),
            normalize_text(video.get("tags")),
            normalize_text(video.get("topics")),
        ]
        return " ".join([p for p in parts if p])

    def encode_videos(self, videos: list[dict]):
        texts = [self.build_text(v) for v in videos]
        return self.model.encode(texts, normalize_embeddings=True, batch_size=64)

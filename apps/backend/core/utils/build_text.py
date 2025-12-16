from apps.backend.core.utils.normalize_text import normalize


def build_text(row):
    parts = [
        normalize(row.get("title")),
        normalize(row.get("description")),
        normalize(row.get("tags")),
        normalize(row.get("topics"))
    ]
    return " ".join([p for p in parts if p])

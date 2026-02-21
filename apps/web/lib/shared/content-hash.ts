import { stableHash, sha256Short } from "@/lib/shared/stable-hash";

/**
 * Creates a stable hash of video content for cache invalidation.
 * Only re-query LLM when this hash changes.
 */
export function hashVideoContent(video: {
  title?: string | null;
  description?: string | null;
  tags?: string[] | string | null;
  durationSec?: number | null;
  categoryId?: string | null;
}): string {
  const tagsArray = Array.isArray(video.tags)
    ? video.tags
    : typeof video.tags === "string"
    ? video.tags.split(",").map((t) => t.trim())
    : [];

  return stableHash({
    title: (video.title ?? "").toLowerCase().trim(),
    description: (video.description ?? "").substring(0, 500).toLowerCase().trim(),
    tags: tagsArray.map((t) => t.toLowerCase().trim()).sort(),
    durationBucket: video.durationSec
      ? Math.floor(video.durationSec / 60)
      : 0,
    categoryId: video.categoryId ?? "",
  });
}

/**
 * Hash for subscriber audit pattern analysis.
 * Based on the top videos being analyzed.
 */
export function hashSubscriberAuditContent(
  videos: Array<{
    videoId: string;
    title: string;
    subsPerThousand: number;
  }>
): string {
  const content = videos
    .map((v) => `${v.videoId}:${v.subsPerThousand.toFixed(2)}`)
    .sort()
    .join("|");

  return sha256Short(content);
}

/**
 * Hash for competitor comments analysis.
 * Based on the actual comments being analyzed.
 */
export function hashCommentsContent(
  comments: Array<{ text?: string; authorName?: string }>
): string {
  const content = comments
    .slice(0, 50)
    .map((c) => (c.text ?? "").substring(0, 200))
    .join("|");

  return sha256Short(content);
}


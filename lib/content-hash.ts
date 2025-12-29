import { createHash } from "crypto";

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
  // Normalize tags to array
  const tagsArray = Array.isArray(video.tags)
    ? video.tags
    : typeof video.tags === "string"
    ? video.tags.split(",").map((t) => t.trim())
    : [];

  // Create a stable object for hashing
  const content = {
    title: (video.title ?? "").toLowerCase().trim(),
    // Only first 500 chars of description matter for analysis
    description: (video.description ?? "").substring(0, 500).toLowerCase().trim(),
    // Sort tags for stability
    tags: tagsArray.map((t) => t.toLowerCase().trim()).sort(),
    // Duration bucket (changes in duration don't matter much for analysis)
    durationBucket: video.durationSec
      ? Math.floor(video.durationSec / 60) // minute bucket
      : 0,
    categoryId: video.categoryId ?? "",
  };

  return createHash("sha256")
    .update(JSON.stringify(content))
    .digest("hex")
    .substring(0, 32); // 32 char hash is plenty
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
  // Use video IDs and their conversion rates
  const content = videos
    .map((v) => `${v.videoId}:${v.subsPerThousand.toFixed(2)}`)
    .sort()
    .join("|");

  return createHash("sha256")
    .update(content)
    .digest("hex")
    .substring(0, 32);
}

/**
 * Hash for competitor comments analysis.
 * Based on the actual comments being analyzed.
 */
export function hashCommentsContent(
  comments: Array<{ text?: string; authorName?: string }>
): string {
  // Hash first 50 comments (or all if fewer)
  const content = comments
    .slice(0, 50)
    .map((c) => (c.text ?? "").substring(0, 200))
    .join("|");

  return createHash("sha256")
    .update(content)
    .digest("hex")
    .substring(0, 32);
}


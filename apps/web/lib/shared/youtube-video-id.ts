/**
 * YouTube Video ID Parser
 *
 * Parses video IDs from various YouTube URL formats.
 */

const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

const YOUTUBE_DOMAINS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
]);

const SHORTLINK_HOSTS = new Set(["youtu.be", "www.youtu.be"]);

const PATH_PREFIX_PATTERNS = ["/shorts/", "/embed/", "/v/"];

function extractIdFromUrl(parsed: URL): string | null {
  const hostname = parsed.hostname.toLowerCase();

  if (SHORTLINK_HOSTS.has(hostname)) {
    return parsed.pathname.slice(1).split("/")[0] || null;
  }

  if (parsed.pathname === "/watch") {
    return parsed.searchParams.get("v");
  }

  for (const prefix of PATH_PREFIX_PATTERNS) {
    if (parsed.pathname.startsWith(prefix)) {
      const pathParts = parsed.pathname.split("/");
      return pathParts.length >= 3 ? (pathParts[2] ?? null) : null;
    }
  }

  return null;
}

function validateVideoId(id: string | null): string | null {
  return id && YOUTUBE_VIDEO_ID_REGEX.test(id) ? id : null;
}

/**
 * Parse a YouTube video ID from a URL.
 *
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEOID
 * - https://youtu.be/VIDEOID
 * - https://www.youtube.com/shorts/VIDEOID
 * - https://www.youtube.com/embed/VIDEOID
 * - https://youtube.com/v/VIDEOID
 * - https://m.youtube.com/watch?v=VIDEOID
 * - Query params after video ID (e.g., ?v=VIDEOID&t=10s)
 *
 * @param url - A YouTube URL string
 * @returns The 11-character video ID, or null if not found/invalid
 */
export function parseYouTubeVideoId(url: string): string | null {
  if (!url || typeof url !== "string") {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  if (YOUTUBE_VIDEO_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (!YOUTUBE_DOMAINS.has(parsed.hostname.toLowerCase())) {
    return null;
  }

  return validateVideoId(extractIdFromUrl(parsed));
}

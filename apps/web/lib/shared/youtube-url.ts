/**
 * Shared YouTube URL validation and video ID extraction.
 * Used by both the Tags page and the Analyze page.
 */

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

/**
 * Validate a YouTube URL. Returns an error message string if invalid, or null if valid.
 */
export function validateYouTubeUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return "Please enter a YouTube URL";
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return "Please enter a valid URL";
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(hostname)) {
    return "Please enter a valid YouTube URL";
  }

  // Reject playlist URLs
  if (parsed.searchParams.has("list")) {
    return "Please paste a single video URL, not a playlist.";
  }

  // Ensure we can extract a video ID
  if (!extractVideoId(trimmed)) {
    return "Could not find a video ID in this URL";
  }

  return null;
}

/**
 * Extract the YouTube video ID from a URL. Returns null if no ID could be extracted.
 *
 * Supported formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
export function extractVideoId(url: string): string | null {
  const trimmed = url.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(hostname)) {
    return null;
  }

  // youtu.be/VIDEO_ID
  if (hostname === "youtu.be") {
    const id = parsed.pathname.slice(1).split("/")[0];
    return id || null;
  }

  // youtube.com/watch?v=VIDEO_ID
  const vParam = parsed.searchParams.get("v");
  if (vParam) {
    return vParam;
  }

  // youtube.com/shorts/VIDEO_ID or youtube.com/embed/VIDEO_ID
  const pathMatch = parsed.pathname.match(/^\/(shorts|embed)\/([^/?]+)/);
  if (pathMatch?.[2]) {
    return pathMatch[2];
  }

  return null;
}

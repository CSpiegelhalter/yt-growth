/**
 * YouTube Video ID Parser
 *
 * Parses video IDs from various YouTube URL formats.
 */

const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

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

  // Trim whitespace
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  // If it's already just a video ID (11 characters), return it
  if (YOUTUBE_VIDEO_ID_REGEX.test(trimmed)) {
    return trimmed;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  // Check if it's a YouTube domain
  const hostname = parsed.hostname.toLowerCase();
  const isYouTubeDomain =
    hostname === "youtube.com" ||
    hostname === "www.youtube.com" ||
    hostname === "m.youtube.com" ||
    hostname === "youtu.be" ||
    hostname === "www.youtu.be";

  if (!isYouTubeDomain) {
    return null;
  }

  let videoId: string | null = null;

  // youtu.be/VIDEOID
  if (hostname === "youtu.be" || hostname === "www.youtu.be") {
    // The video ID is the path without the leading slash
    const pathVideoId = parsed.pathname.slice(1).split("/")[0];
    if (pathVideoId) {
      videoId = pathVideoId;
    }
  }
  // youtube.com/watch?v=VIDEOID
  else if (parsed.pathname === "/watch") {
    videoId = parsed.searchParams.get("v");
  }
  // youtube.com/shorts/VIDEOID
  else if (parsed.pathname.startsWith("/shorts/")) {
    const pathParts = parsed.pathname.split("/");
    if (pathParts.length >= 3) {
      videoId = pathParts[2];
    }
  }
  // youtube.com/embed/VIDEOID
  else if (parsed.pathname.startsWith("/embed/")) {
    const pathParts = parsed.pathname.split("/");
    if (pathParts.length >= 3) {
      videoId = pathParts[2];
    }
  }
  // youtube.com/v/VIDEOID (old embed format)
  else if (parsed.pathname.startsWith("/v/")) {
    const pathParts = parsed.pathname.split("/");
    if (pathParts.length >= 3) {
      videoId = pathParts[2];
    }
  }

  // Validate the video ID format (11 alphanumeric characters, underscores, and hyphens)
  if (videoId && YOUTUBE_VIDEO_ID_REGEX.test(videoId)) {
    return videoId;
  }

  return null;
}

/**
 * Check if a string is a valid YouTube URL.
 */
export function isValidYouTubeUrl(url: string): boolean {
  return parseYouTubeVideoId(url) !== null;
}

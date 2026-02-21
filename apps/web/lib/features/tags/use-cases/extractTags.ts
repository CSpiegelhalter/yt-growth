/**
 * Extract Tags Use-Case
 *
 * Accepts a YouTube video URL, parses the video ID, fetches the
 * video's metadata, and returns its tags.
 */

import { parseYouTubeVideoId } from "@/lib/shared/youtube-video-id";
import { TagError } from "../errors";
import type {
  ExtractTagsInput,
  ExtractTagsResult,
  VideoSnippetForTags,
} from "../types";

// ── Dependencies ────────────────────────────────────────────

export type ExtractTagsDeps = {
  youtube: {
    getVideoSnippet(videoId: string): Promise<VideoSnippetForTags | null>;
  };
};

// ── Use-case ────────────────────────────────────────────────

export async function extractTags(
  input: ExtractTagsInput,
  deps: ExtractTagsDeps,
): Promise<ExtractTagsResult> {
  const videoId = parseYouTubeVideoId(input.url);
  if (!videoId) {
    throw new TagError("INVALID_INPUT", "Invalid YouTube URL.");
  }

  const snippet = await deps.youtube.getVideoSnippet(videoId);

  if (!snippet) {
    throw new TagError(
      "NOT_FOUND",
      "Video not found. Please check the URL and try again.",
    );
  }

  const tags = snippet.tags ?? [];

  return {
    videoId,
    title: snippet.title || "Unknown Title",
    channelTitle: snippet.channelTitle || "Unknown Channel",
    thumbnailUrl: snippet.thumbnailUrl,
    tags,
    hasTags: tags.length > 0,
  };
}

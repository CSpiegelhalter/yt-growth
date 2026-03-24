import type { SuggestionContext } from "../types";

/**
 * Builds common channel context prompt parts from SuggestionContext.
 * Shared by generateSuggestions and suggestField.
 */
export function buildContextPromptParts(context: SuggestionContext): string[] {
  const parts: string[] = [];

  if (context.channelNiche) {
    parts.push(`CHANNEL NICHE: ${context.channelNiche}`);
  }
  if (context.targetAudience) {
    parts.push(`TARGET AUDIENCE: ${context.targetAudience}`);
  }
  if (context.contentPillars.length > 0) {
    parts.push(`CONTENT PILLARS: ${context.contentPillars.join(", ")}`);
  }
  if (context.recentVideoTitles.length > 0) {
    parts.push(
      `RECENT VIDEOS:\n${context.recentVideoTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}`,
    );
  }
  if (context.trendingTopics.length > 0) {
    parts.push(`TRENDING IN NICHE: ${context.trendingTopics.join(", ")}`);
  }

  return parts;
}

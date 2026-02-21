/**
 * Analyze Comments Use-Case
 *
 * Produces sentiment analysis, theme extraction, and viewer-voice
 * insights from a video's comment section via LLM.
 */

import type { CommentInsights, LlmCallFn } from "../types";

type AnalyzeCommentsInput = {
  videoTitle: string;
  comments: Array<{ text: string; likes: number }>;
};

const EMPTY_INSIGHTS: CommentInsights = {
  sentiment: { positive: 0, neutral: 100, negative: 0 },
  themes: [],
  viewerLoved: [],
  viewerAskedFor: [],
  hookInspiration: [],
};

export async function analyzeComments(
  input: AnalyzeCommentsInput,
  callLlm: LlmCallFn,
): Promise<CommentInsights> {
  const { videoTitle, comments } = input;

  const topComments = [...comments]
    .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
    .slice(0, 20)
    .map((c) => `[${c.likes ?? 0} likes] "${c.text.slice(0, 200)}"`)
    .join("\n");

  if (!topComments) {
    return EMPTY_INSIGHTS;
  }

  const systemPrompt = `You are a YouTube comment analyst. Extract viewer voice insights from these TOP COMMENTS.

Return ONLY valid JSON:
{
  "sentiment": { "positive": 60, "neutral": 30, "negative": 10 },
  "themes": [{ "theme": "Theme name", "count": 5, "examples": ["short quote"] }],
  "viewerLoved": ["What viewers praised - quote or paraphrase actual comments"],
  "viewerAskedFor": ["What viewers asked for in future content"],
  "hookInspiration": ["Short hook-worthy quotes under 25 words from comments"]
}

RULES:
1. Sentiment percentages must add up to 100
2. Base everything on the actual comments provided
3. viewerLoved and viewerAskedFor should quote or paraphrase real comments
4. hookInspiration should be memorable short quotes
5. If comments are sparse or generic, reflect that honestly
6. No emojis, no markdown`;

  try {
    const result = await callLlm(
      [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `VIDEO: "${videoTitle}"\n\nTOP COMMENTS (sorted by likes):\n${topComments}`,
        },
      ],
      { maxTokens: 600, temperature: 0.3, responseFormat: "json_object" },
    );
    return JSON.parse(result.content);
  } catch (err) {
    console.error("Comment insights LLM failed:", err);
    return EMPTY_INSIGHTS;
  }
}

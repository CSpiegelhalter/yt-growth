/**
 * Generate Ideas Use-Case
 *
 * Produces spinoff/remix content ideas and content gap analysis
 * based on a video's topic, performance, and channel profile.
 */

import type { IdeasAnalysis, LlmCallFn } from "../types";
import { VideoInsightError } from "../errors";

export type ChannelProfileForIdeas = {
  nicheLabel: string;
  nicheDescription: string;
  targetAudience: string;
  contentPillars: Array<{ name: string }>;
  channelValueProposition: string;
  toneAndStyle: string[];
} | null;

type GenerateIdeasInput = {
  videoTitle: string;
  videoDescription: string;
  tags: string[];
  totalViews: number;
  channelProfile: ChannelProfileForIdeas;
};

export async function generateIdeas(
  input: GenerateIdeasInput,
  callLlm: LlmCallFn,
): Promise<IdeasAnalysis> {
  const { videoTitle, videoDescription, tags, totalViews, channelProfile } =
    input;

  const profileContext = channelProfile
    ? `
CHANNEL PROFILE (use as PRIMARY context for idea generation):
- Channel Niche: ${channelProfile.nicheLabel}
- Description: ${channelProfile.nicheDescription}
- Target Audience: ${channelProfile.targetAudience}
- Content Pillars: ${channelProfile.contentPillars.map((p) => p.name).join(", ")}
- Value Proposition: ${channelProfile.channelValueProposition}
- Tone/Style: ${channelProfile.toneAndStyle.join(", ")}

IMPORTANT: Generate ideas that align with this channel's niche and audience. Ideas should fit within their content pillars and match their tone/style.
`
    : "";

  const systemPrompt = `You are a YouTube content strategist. Generate spinoff and remix ideas based on this video's topic and performance.
${profileContext}
Return ONLY valid JSON:
{
  "remixIdeas": [
    {
      "title": "Full video title ready to use",
      "hook": "Opening line for this video (2-3 sentences)",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "angle": "What makes this different from the original video"
    }
  ],
  "contentGaps": ["Topic gap 1 based on what viewers might want next", "Topic gap 2"]
}

RULES:
1. Generate exactly 4 remix ideas
2. Each title must be complete and usable (not a template)
3. Ideas should be genuine spinoffs from THIS video's topic${channelProfile ? " that align with the channel's niche and audience" : ""}
4. Include a mix: deep-dive, beginner version, contrarian take, related topic
5. Keywords should be searchable terms${channelProfile ? ` relevant to ${channelProfile.nicheLabel}` : ""}
6. Content gaps should be what viewers of this video would want next
7. No emojis, no hashtags`;

  const videoContext = `ORIGINAL VIDEO:
TITLE: "${videoTitle}"
DESCRIPTION: "${videoDescription?.slice(0, 300) || "No description"}"
TAGS: [${tags
    .slice(0, 10)
    .map((t) => `"${t}"`)
    .join(", ")}]
PERFORMANCE: ${totalViews.toLocaleString()} views`;

  try {
    const result = await callLlm(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: videoContext },
      ],
      { maxTokens: 800, temperature: 0.4, responseFormat: "json_object" },
    );
    return JSON.parse(result.content);
  } catch (err) {
    throw new VideoInsightError(
      "EXTERNAL_FAILURE",
      "Failed to generate content ideas",
      err,
    );
  }
}

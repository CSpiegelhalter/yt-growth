/**
 * LLM generation for IdeaBoard - premium structured output
 *
 * Generates rich idea data with proof from similar channel winners.
 * Uses channel profile (when available) as the primary context for idea generation.
 */

import { callLLM } from "./llm";
import type { IdeaBoardData, Idea } from "@/types/api";
import { normalizeIdeaBoardData } from "@/lib/idea-board-normalize";
import type { ChannelProfileAI } from "@/lib/channel-profile/types";

const CURRENT_YEAR = new Date().getFullYear();

type ProofVideoInput = {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  views: number;
  viewsPerDay: number;
};

type SimilarChannelInput = {
  channelId: string;
  channelTitle: string;
  channelThumbnailUrl: string | null;
};

type UserVideoInput = {
  title: string;
  views: number;
  viewsPerDay: number;
  publishedAt: string;
  tags?: string;
  description?: string;
};

type GenerateIdeaBoardInput = {
  channelId: string;
  channelTitle: string;
  range: "7d" | "28d";
  recentVideos: UserVideoInput[];
  topPerformingVideos: UserVideoInput[];
  nicheKeywords: string[];
  proofVideos: ProofVideoInput[];
  similarChannels: SimilarChannelInput[];
  channelProfile?: ChannelProfileAI;
};

/**
 * Light idea generation: return only title + angle/description for each idea.
 * The rest (titles/hooks/tags/etc) is generated lazily when the user opens an idea.
 */
export async function generateIdeaBoardIdeasOnly(
  input: GenerateIdeaBoardInput
): Promise<IdeaBoardData> {
  // Build channel profile context if available - this takes priority
  const profileContext = input.channelProfile
    ? `
CHANNEL PROFILE (use as PRIMARY context - the creator's stated intent):
- Niche: ${input.channelProfile.nicheLabel}
- Description: ${input.channelProfile.nicheDescription}
- Target Audience: ${input.channelProfile.targetAudience}
- Content Pillars: ${input.channelProfile.contentPillars
        .map((p) => p.name)
        .join(", ")}
- Value Proposition: ${input.channelProfile.channelValueProposition}
- Tone/Style: ${input.channelProfile.toneAndStyle.join(", ")}
- Key Topics: ${input.channelProfile.keywords.slice(0, 10).join(", ")}

IMPORTANT: All ideas MUST align with this channel's niche, audience, and content pillars. Match their tone/style.
`
    : "";

  const systemPrompt = `You are a YouTube creative strategist. Generate a list of strong, specific video ideas.
${profileContext}
OUTPUT FORMAT: Return ONLY valid JSON:
{
  "ideas": [
    { "id": "idea-1", "title": "Specific concept (not clickbait)", "angle": "1-2 sentence premise/description" }
  ]
}

RULES:
- Generate EXACTLY 6 ideas.
- No emojis.
- Titles must be specific (topic + mechanism + outcome).
- Angle must be concrete and filmable (what you would say/show).${
    input.channelProfile
      ? `
- Ideas must fit within the channel's content pillars: ${input.channelProfile.contentPillars
          .map((p) => p.name)
          .join(", ")}`
      : ""
  }
- Do NOT include hooks, title options, keywords, proof, difficulty, format, or estimated views.`;

  const userVideosContext = input.topPerformingVideos
    .slice(0, 6)
    .map((v, i) => `${i + 1}. "${v.title}" (${formatViews(v.viewsPerDay)}/day)`)
    .join("\n");

  const proofContext = input.proofVideos
    .sort((a, b) => b.viewsPerDay - a.viewsPerDay)
    .slice(0, 10)
    .map((v, i) => `${i + 1}. "${v.title}" by ${v.channelTitle} [${v.videoId}]`)
    .join("\n");

  const userPrompt = `Channel: ${input.channelTitle}
Window: ${input.range}
Niche keywords: ${input.nicheKeywords.join(", ")}

Top performing videos:
${userVideosContext || "N/A"}

Competitor winners:
${proofContext || "N/A"}

Generate 6 ideas${
    input.channelProfile
      ? ` that align with the channel's niche: "${input.channelProfile.nicheLabel}"`
      : ""
  }.`;

  try {
    const result = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 1400, temperature: 0.85 }
    );

    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return createFallbackIdeaBoard(input);
    }

    const parsed = JSON.parse(jsonMatch[0]) as { ideas: Array<Partial<Idea>> };
    const rawBoard: IdeaBoardData = {
      channelId: input.channelId,
      channelTitle: input.channelTitle,
      range: input.range,
      generatedAt: new Date().toISOString(),
      cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      ideas: (parsed.ideas ?? []).map((idea, idx) => ({
        id: `idea-${Date.now()}-${idx}`,
        title: idea.title ?? `Idea ${idx + 1}`,
        angle: idea.angle ?? "",
      })) as any,
      nicheInsights: { momentumNow: [], patternsToCopy: [], gapsToExploit: [] },
      similarChannels: input.similarChannels,
    };

    return (
      normalizeIdeaBoardData(rawBoard, {
        nicheKeywords: input.nicheKeywords,
        mode: "light",
      }) ?? rawBoard
    );
  } catch (err) {
    console.error("[IdeaBoard] Light generation failed:", err);
    return createFallbackIdeaBoard(input);
  }
}

/**
 * Generate more ideas to append to existing IdeaBoard
 */
export async function generateMoreIdeas(input: {
  channelTitle: string;
  existingIdeas: string[];
  nicheKeywords: string[];
  proofVideos: ProofVideoInput[];
  count: number;
  channelProfile?: ChannelProfileAI;
}): Promise<Idea[]> {
  // Build channel profile context if available - this takes priority
  const profileContext = input.channelProfile
    ? `
CHANNEL PROFILE (use as PRIMARY context):
- Niche: ${input.channelProfile.nicheLabel}
- Target Audience: ${input.channelProfile.targetAudience}
- Content Pillars: ${input.channelProfile.contentPillars
        .map((p) => p.name)
        .join(", ")}
- Tone/Style: ${input.channelProfile.toneAndStyle.join(", ")}

All ideas MUST align with this channel's niche and content pillars.
`
    : "";

  const systemPrompt = `You are a YouTube creative director. Generate ${
    input.count
  } NEW video ideas that are different from existing ones.
${profileContext}
Return ONLY a JSON array:
[
  { "id": "new-idea-1", "title": "Specific concept", "angle": "1-2 sentence premise/description" }
]

RULES:
- No emojis.${
    input.channelProfile
      ? `
- Ideas must fit within the channel's niche: ${input.channelProfile.nicheLabel}`
      : ""
  }
- Do NOT include hooks, title options, keywords, proof, difficulty, format, or estimated views.`;

  const userPrompt = `Channel: ${input.channelTitle}
Niche: ${input.nicheKeywords.join(", ")}

EXISTING IDEAS (do NOT duplicate):
${input.existingIdeas.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Generate ${input.count} completely different ideas${
    input.channelProfile
      ? ` that align with the channel's niche: "${input.channelProfile.nicheLabel}"`
      : ""
  }.`;

  try {
    const result = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 2500, temperature: 0.85 }
    );

    const jsonMatch = result.content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    const ideas = JSON.parse(jsonMatch[0]) as Array<Partial<Idea>>;
    // Always generate unique IDs - ignore LLM-provided IDs to prevent collisions
    const timestamp = Date.now();
    const withIds = ideas.map((idea, index) => ({
      id: `more-${timestamp}-${index}`,
      title: idea.title ?? `Idea ${index + 1}`,
      angle: idea.angle ?? "",
    })) as any;
    const normalizedBoard = normalizeIdeaBoardData(
      {
        channelId: "TEMP",
        channelTitle: input.channelTitle,
        range: "7d",
        generatedAt: new Date().toISOString(),
        cachedUntil: new Date(Date.now() + 60_000).toISOString(),
        ideas: withIds,
        nicheInsights: {
          momentumNow: [],
          patternsToCopy: [],
          gapsToExploit: [],
        },
        similarChannels: [],
      },
      { nicheKeywords: input.nicheKeywords, mode: "light" }
    );
    return (normalizedBoard?.ideas ?? withIds) as any;
  } catch (err) {
    console.error("Generate more ideas failed:", err);
    return [];
  }
}

/**
 * Create fallback IdeaBoard when LLM fails
 */
function createFallbackIdeaBoard(input: GenerateIdeaBoardInput): IdeaBoardData {
  // Generate ideas based on available data
  const topProof = input.proofVideos.slice(0, 3);
  const topKeyword = input.nicheKeywords[0] || "content";

  const fallbackIdeas: Idea[] = [
    {
      id: "fallback-1",
      title: `Deep dive tutorial on ${topKeyword}`,
      angle: "Comprehensive guide based on your proven expertise",
      format: "long",
      difficulty: "easy",
      hooks: [
        {
          text: "Most people overcomplicate this. Here's the simple way.",
          typeTags: ["contrarian", "promise"],
        },
        {
          text: "After 100+ videos, here's what actually works.",
          typeTags: ["story", "promise"],
        },
        {
          text: "Stop making this mistake. Do this instead.",
          typeTags: ["shock", "tutorial"],
        },
      ],
      titles: [
        {
          text: `The Complete ${topKeyword} Guide (Everything You Need)`,
          styleTags: ["authority", "specific"],
        },
        {
          text: `${topKeyword} Masterclass: From Zero to Pro`,
          styleTags: ["outcome", "challenge"],
        },
        {
          text: `I Tested Every ${topKeyword} Method. Here's What Works.`,
          styleTags: ["personal", "authority"],
        },
        {
          text: `${topKeyword} in ${CURRENT_YEAR}: The Only Guide You Need`,
          styleTags: ["timebound", "specific"],
        },
      ],
      thumbnailConcept: {
        overlayText: "FULL GUIDE",
        composition: "Face with pointing gesture on left, bold text on right",
        emotionToConvey: "Authority and expertise",
        colorScheme: "High contrast - dark background with bright accent",
        avoid: ["Cluttered background", "More than 4 words", "Small text"],
      },
      keywords: [
        {
          text: topKeyword,
          intent: "search",
          monthlySearches: "10K+",
          competition: "medium",
        },
        {
          text: `${topKeyword} tutorial`,
          intent: "search",
          monthlySearches: "5K+",
          competition: "medium",
        },
        {
          text: `how to ${topKeyword}`,
          intent: "search",
          monthlySearches: "8K+",
          competition: "low",
        },
      ],
      proof: {
        basedOn: topProof.map((v) => ({
          videoId: v.videoId,
          title: v.title,
          channelId: v.channelId,
          channelTitle: v.channelTitle,
          thumbnailUrl: v.thumbnailUrl ?? "",
          publishedAt: v.publishedAt,
          metrics: { views: v.views, viewsPerDay: v.viewsPerDay },
          whyItWorked: [
            "Clear value proposition",
            "Addresses common pain point",
          ],
          patternToSteal: ["Structured format", "Strong thumbnail"],
          howToMakeBetter: "Add your unique perspective and real examples",
        })),
      },
    },
    {
      id: "fallback-2",
      title: `Reaction/analysis of trending ${topKeyword} content`,
      angle: "Commentary on what's working in your niche right now",
      format: "long",
      difficulty: "easy",
      hooks: [
        {
          text: "This video is blowing up. Here's why.",
          typeTags: ["curiosity", "story"],
        },
        {
          text: "Everyone's talking about this. Let me explain.",
          typeTags: ["curiosity", "story"],
        },
      ],
      titles: [
        {
          text: `Why Did This ${topKeyword} Video Go Viral?`,
          styleTags: ["specific"],
        },
        {
          text: `Reacting to the Most Viral ${topKeyword} Content`,
          styleTags: ["personal", "specific"],
        },
      ],
      thumbnailConcept: {
        overlayText: "WHY VIRAL?",
        composition: "Split screen - your face reacting + competitor thumbnail",
        emotionToConvey: "Curiosity and insight",
        colorScheme: "Match competitor's colors for recognition",
        avoid: ["Looking bored", "Too busy composition"],
      },
      keywords: [
        {
          text: `${topKeyword} reaction`,
          intent: "browse",
          monthlySearches: "2K+",
          competition: "low",
        },
      ],
      proof: { basedOn: [] },
    },
    {
      id: "fallback-3",
      title: `${topKeyword} mistakes beginners make`,
      angle: "Help newcomers avoid common pitfalls",
      format: "long",
      difficulty: "medium",
      hooks: [
        {
          text: "I wasted months on this mistake. Don't be like me.",
          typeTags: ["story", "promise"],
        },
        {
          text: "90% of beginners get this wrong. Here's the fix.",
          typeTags: ["shock", "promise"],
        },
      ],
      titles: [
        {
          text: `7 ${topKeyword} Mistakes That Are Killing Your Results`,
          styleTags: ["specific", "outcome"],
        },
        {
          text: `Stop Doing This! ${topKeyword} Mistakes to Avoid`,
          styleTags: ["contrarian", "specific"],
        },
      ],
      thumbnailConcept: {
        overlayText: "STOP THIS",
        composition: "Face with concerned expression, X mark graphic",
        emotionToConvey: "Warning and helpfulness",
        colorScheme: "Red accent for urgency",
        avoid: ["Looking angry", "Negative imagery"],
      },
      keywords: [
        {
          text: `${topKeyword} mistakes`,
          intent: "search",
          monthlySearches: "3K+",
          competition: "low",
        },
      ],
      proof: { basedOn: [] },
    },
  ];

  return {
    channelId: input.channelId,
    channelTitle: input.channelTitle,
    range: input.range,
    generatedAt: new Date().toISOString(),
    cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ideas: fallbackIdeas,
    nicheInsights: {
      momentumNow: [
        `${topKeyword} tutorials are gaining traction`,
        "Reaction content performing well",
      ],
      winningPatterns: [
        "Numbered lists in titles",
        "Face + text thumbnails",
        "Problem-solution structure",
      ],
      contentGaps: ["Beginner-friendly content", "Behind-the-scenes content"],
      avoidThese: ["Overly generic topics", "Clickbait without payoff"],
    },
    similarChannels: input.similarChannels,
  };
}

function formatViews(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return num.toString();
}

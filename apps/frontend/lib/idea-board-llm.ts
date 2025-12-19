/**
 * LLM generation for IdeaBoard - premium structured output
 *
 * Generates rich idea data with proof from similar channel winners.
 */

import { callLLM } from "./llm";
import type { IdeaBoardData, Idea, ProofVideo } from "@/types/api";

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
  similarityScore: number;
};

type GenerateIdeaBoardInput = {
  channelId: string;
  channelTitle: string;
  range: "7d" | "28d";
  recentVideoTitles: string[];
  topPerformingTitles: string[];
  nicheKeywords: string[];
  proofVideos: ProofVideoInput[];
  similarChannels: SimilarChannelInput[];
};

/**
 * Generate a complete IdeaBoard with structured ideas backed by proof
 */
export async function generateIdeaBoardPlan(
  input: GenerateIdeaBoardInput
): Promise<IdeaBoardData> {
  const systemPrompt = `You are an elite YouTube creative director. Generate 8-10 video ideas backed by proof from similar channel successes.

OUTPUT FORMAT: Return ONLY valid JSON matching this structure:
{
  "ideas": [
    {
      "id": "idea-1",
      "title": "Compelling video concept (not a title, the main idea)",
      "angle": "One sentence describing the unique angle",
      "format": "long" or "shorts",
      "difficulty": "easy" or "medium" or "stretch",
      "hooks": [
        { "text": "Opening hook 8-14 words that grabs attention", "typeTags": ["curiosity", "story"] }
      ],
      "titles": [
        { "text": "Clickable title option", "styleTags": ["outcome", "specific"], "basedOnVideoId": "proof-video-id-if-inspired-by", "basedOnChannel": "channel name" }
      ],
      "thumbnailConcept": {
        "overlayText": "3-4 WORDS MAX",
        "composition": "Subject left, text right / close-up face / split comparison",
        "contrastNote": "Color contrast guidance",
        "avoid": ["Don't do this", "Don't do that"]
      },
      "keywords": [
        { "text": "keyword", "intent": "search" or "browse" or "suggested", "fit": "Why this keyword works for this channel" }
      ],
      "proof": {
        "basedOn": [
          {
            "videoId": "from-provided-proof-videos",
            "title": "exact title from proof",
            "channelId": "from proof",
            "channelTitle": "from proof",
            "thumbnailUrl": "from proof",
            "publishedAt": "from proof",
            "metrics": { "views": number, "viewsPerDay": number },
            "whyItWorked": ["Reason 1", "Reason 2"],
            "patternToSteal": ["Pattern to copy"],
            "remixIdea": "How to make it unique for this channel"
          }
        ]
      },
      "remixVariants": {
        "emotional": { "hooks": [...], "titles": [...] },
        "contrarian": { "hooks": [...], "titles": [...] },
        "beginner": { "hooks": [...], "titles": [...] }
      }
    }
  ],
  "nicheInsights": {
    "momentumNow": ["What's trending in this niche right now"],
    "patternsToCopy": ["Winning patterns from competitors"],
    "gapsToExploit": ["Opportunities competitors are missing"]
  }
}

RULES:
1. Generate 8-10 ideas, varied in difficulty (3 easy, 4 medium, 2 stretch)
2. Each idea must reference 1-3 proof videos that inspired it
3. Hooks must be punchy, 8-14 words, with type tags: shock, curiosity, contrarian, story, tutorial, promise
4. Titles must have style tags: outcome, timebound, contrarian, specific, authority, personal, challenge
5. Generate at least 4 title options per idea
6. Generate at least 3 hook options per idea
7. Include remix variants for at least the top 3 ideas
8. Thumbnail overlay text must be 4 words or less, impactful
9. Keywords should include mix of search, browse, and suggested intent
10. Be specific to THIS channel's niche and style`;

  const proofContext = input.proofVideos.slice(0, 20).map((v, i) => 
    `${i + 1}. "${v.title}" by ${v.channelTitle} (${formatViews(v.views)} views, ${formatViews(v.viewsPerDay)}/day) [ID: ${v.videoId}]`
  ).join("\n");

  const userPrompt = `Channel: ${input.channelTitle}
Date Range: ${input.range === "7d" ? "Last 7 days" : "Last 28 days"}

CHANNEL'S RECENT VIDEOS:
${input.recentVideoTitles.slice(0, 8).map((t, i) => `${i + 1}. ${t}`).join("\n")}

TOP PERFORMING VIDEOS:
${input.topPerformingTitles.slice(0, 5).map((t, i) => `${i + 1}. ${t}`).join("\n")}

NICHE KEYWORDS: ${input.nicheKeywords.join(", ")}

PROOF VIDEOS FROM SIMILAR CHANNELS (use these as inspiration and reference):
${proofContext || "No competitor videos available - generate ideas based on channel content"}

SIMILAR CHANNELS TRACKED:
${input.similarChannels.map(c => `- ${c.channelTitle} (${Math.round(c.similarityScore * 100)}% match)`).join("\n")}

Generate 8-10 video ideas with full structured details, referencing the proof videos where relevant.`;

  try {
    const result = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 4000, temperature: 0.8 }
    );

    // Parse JSON from response
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("No JSON found in LLM response, using fallback");
      return createFallbackIdeaBoard(input);
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      ideas: Idea[];
      nicheInsights: IdeaBoardData["nicheInsights"];
    };

    // Enrich ideas with missing proof video data
    const enrichedIdeas = parsed.ideas.map((idea, index) => ({
      ...idea,
      id: idea.id || `idea-${index + 1}`,
      proof: enrichProofData(idea.proof, input.proofVideos),
    }));

    return {
      channelId: input.channelId,
      channelTitle: input.channelTitle,
      range: input.range,
      generatedAt: new Date().toISOString(),
      cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      ideas: enrichedIdeas,
      nicheInsights: parsed.nicheInsights || {
        momentumNow: [],
        patternsToCopy: [],
        gapsToExploit: [],
      },
      similarChannels: input.similarChannels,
    };
  } catch (err) {
    console.error("IdeaBoard generation failed:", err);
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
}): Promise<Idea[]> {
  const systemPrompt = `You are a YouTube creative director. Generate ${input.count} NEW video ideas that are different from existing ones.

Return ONLY a JSON array of ideas matching this structure:
[
  {
    "id": "new-idea-1",
    "title": "Video concept",
    "angle": "Unique angle",
    "format": "long" or "shorts",
    "difficulty": "easy" or "medium" or "stretch",
    "hooks": [{ "text": "Hook text", "typeTags": ["curiosity"] }],
    "titles": [{ "text": "Title option", "styleTags": ["outcome"] }],
    "thumbnailConcept": { "overlayText": "3-4 WORDS", "composition": "...", "contrastNote": "...", "avoid": [] },
    "keywords": [{ "text": "keyword", "intent": "search", "fit": "..." }],
    "proof": { "basedOn": [] }
  }
]`;

  const userPrompt = `Channel: ${input.channelTitle}
Niche: ${input.nicheKeywords.join(", ")}

EXISTING IDEAS (do NOT duplicate):
${input.existingIdeas.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Generate ${input.count} completely different ideas.`;

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

    const ideas = JSON.parse(jsonMatch[0]) as Idea[];
    return ideas.map((idea, index) => ({
      ...idea,
      id: idea.id || `new-idea-${Date.now()}-${index}`,
    }));
  } catch (err) {
    console.error("Generate more ideas failed:", err);
    return [];
  }
}

/**
 * Enrich proof data with full video info from provided videos
 */
function enrichProofData(
  proof: Idea["proof"] | undefined,
  proofVideos: ProofVideoInput[]
): Idea["proof"] {
  if (!proof?.basedOn?.length) {
    // Assign random proof videos if none specified
    const randomProof = proofVideos.slice(0, 2).map((v) => ({
      videoId: v.videoId,
      title: v.title,
      channelId: v.channelId,
      channelTitle: v.channelTitle,
      thumbnailUrl: v.thumbnailUrl ?? "",
      publishedAt: v.publishedAt,
      metrics: { views: v.views, viewsPerDay: v.viewsPerDay },
      whyItWorked: ["Strong title and thumbnail combination"],
      patternToSteal: ["Engaging hook in first 5 seconds"],
      remixIdea: "Adapt this concept to your unique style",
    }));
    return { basedOn: randomProof };
  }

  // Enrich existing proof with full video data
  const proofMap = new Map(proofVideos.map((v) => [v.videoId, v]));
  
  const enriched: ProofVideo[] = proof.basedOn.map((p) => {
    const fullVideo = proofMap.get(p.videoId);
    return {
      videoId: p.videoId,
      title: p.title || fullVideo?.title || "Untitled",
      channelId: p.channelId || fullVideo?.channelId || "",
      channelTitle: p.channelTitle || fullVideo?.channelTitle || "",
      thumbnailUrl: p.thumbnailUrl || fullVideo?.thumbnailUrl || "",
      publishedAt: p.publishedAt || fullVideo?.publishedAt || "",
      metrics: p.metrics || {
        views: fullVideo?.views ?? 0,
        viewsPerDay: fullVideo?.viewsPerDay ?? 0,
      },
      whyItWorked: p.whyItWorked || [],
      patternToSteal: p.patternToSteal || [],
      remixIdea: p.remixIdea || "",
    };
  });

  return { basedOn: enriched };
}

/**
 * Create fallback IdeaBoard when LLM fails
 */
function createFallbackIdeaBoard(input: GenerateIdeaBoardInput): IdeaBoardData {
  const fallbackIdeas: Idea[] = [
    {
      id: "fallback-1",
      title: "Tutorial or how-to based on your top content",
      angle: "Step-by-step guide leveraging your expertise",
      format: "long",
      difficulty: "easy",
      hooks: [
        { text: "Most people overcomplicate this. Here's the simple way.", typeTags: ["contrarian", "promise"] },
        { text: "I've been doing this for years. Here's what actually works.", typeTags: ["story", "promise"] },
      ],
      titles: [
        { text: "The Complete Guide to [Your Niche Topic]", styleTags: ["authority", "specific"] },
        { text: "How to [Achieve Outcome] in 2024 (Step by Step)", styleTags: ["outcome", "timebound"] },
      ],
      thumbnailConcept: {
        overlayText: "FULL GUIDE",
        composition: "Face with pointing gesture, text on right",
        contrastNote: "High contrast with bold colors",
        avoid: ["Cluttered background", "Too much text"],
      },
      keywords: [
        { text: input.nicheKeywords[0] || "tutorial", intent: "search", fit: "High search intent" },
        { text: "how to", intent: "search", fit: "Evergreen query modifier" },
      ],
      proof: {
        basedOn: input.proofVideos.slice(0, 2).map((v) => ({
          videoId: v.videoId,
          title: v.title,
          channelId: v.channelId,
          channelTitle: v.channelTitle,
          thumbnailUrl: v.thumbnailUrl ?? "",
          publishedAt: v.publishedAt,
          metrics: { views: v.views, viewsPerDay: v.viewsPerDay },
          whyItWorked: ["Clear value proposition", "Searchable topic"],
          patternToSteal: ["Thumbnail shows end result"],
          remixIdea: "Apply your unique perspective",
        })),
      },
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
      momentumNow: ["Tutorial content performing well in this niche"],
      patternsToCopy: ["Numbered lists in titles drive clicks"],
      gapsToExploit: ["More beginner-friendly content needed"],
    },
    similarChannels: input.similarChannels,
  };
}

function formatViews(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return num.toString();
}


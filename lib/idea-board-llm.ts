/**
 * LLM generation for IdeaBoard - premium structured output
 *
 * Generates rich idea data with proof from similar channel winners.
 */

import { callLLM } from "./llm";
import type { IdeaBoardData, Idea, ProofVideo } from "@/types/api";
import { normalizeIdeaBoardData } from "@/lib/idea-board-normalize";

const CURRENT_YEAR = new Date().getFullYear();

function extractYouTubeVideoId(candidate: string | null | undefined): string | null {
  const s = String(candidate ?? "").trim();
  if (!s) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const m = s.match(/(?:v=|\/vi\/|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? null;
}

function youTubeThumbFromVideoId(candidate: string | null | undefined): string | null {
  const id = extractYouTubeVideoId(candidate);
  if (!id) return null;
  return `https://i.ytimg.com/vi/${encodeURIComponent(id)}/mqdefault.jpg`;
}

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
};

/**
 * Light idea generation: return only title + angle/description for each idea.
 * The rest (titles/hooks/tags/etc) is generated lazily when the user opens an idea.
 */
export async function generateIdeaBoardIdeasOnly(
  input: GenerateIdeaBoardInput
): Promise<IdeaBoardData> {
  const systemPrompt = `You are a YouTube creative strategist. Generate a list of strong, specific video ideas.

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
- Angle must be concrete and filmable (what you would say/show).
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

Generate 6 ideas.`;

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
        id: idea.id || `idea-${idx + 1}`,
        title: idea.title ?? `Idea ${idx + 1}`,
        angle: idea.angle ?? "",
      })) as any,
      nicheInsights: { momentumNow: [], patternsToCopy: [], gapsToExploit: [] },
      similarChannels: input.similarChannels,
    };

    return (
      normalizeIdeaBoardData(rawBoard, { nicheKeywords: input.nicheKeywords, mode: "light" }) ??
      rawBoard
    );
  } catch (err) {
    console.error("[IdeaBoard] Light generation failed:", err);
    return createFallbackIdeaBoard(input);
  }
}

/**
 * Generate a complete IdeaBoard with structured ideas backed by proof
 */
export async function generateIdeaBoardPlan(
  input: GenerateIdeaBoardInput
): Promise<IdeaBoardData> {
  const systemPrompt = `You are an elite YouTube creative strategist and growth expert. Your job is to analyze what's WORKING in a creator's niche and generate UNIQUE, SPECIFIC video ideas that will perform.

You have access to:
1. The creator's own video performance data (what worked for THEM)
2. Competitor videos that are currently winning (high views/day = momentum)
3. Niche keywords that define the space

Your ideas must be:
- SPECIFIC (not generic like "make a tutorial" - give the EXACT topic and angle)
- UNIQUE (each idea should be distinctly different - vary format, tone, audience level)
- ACTIONABLE (creator should be able to start filming TODAY)
- PROVEN (backed by data showing similar concepts work)

OUTPUT FORMAT: Return ONLY valid JSON matching this structure:
{
  "ideas": [
    {
      "id": "idea-1",
      "title": "Specific video concept (the core idea, not clickbait)",
      "angle": "What makes this different from the 100 other videos on this topic",
      "whyNow": "Why this idea will work RIGHT NOW based on the data",
      "format": "long" or "shorts",
      "difficulty": "easy" or "medium" or "stretch",
      "estimatedViews": "Conservative estimate based on proof data",
      "hooks": [
        { "text": "Opening hook 8-14 words that stops the scroll", "typeTags": ["curiosity", "story", "shock", "contrarian", "promise"] }
      ],
      "titles": [
        { "text": "Clickable title option", "styleTags": ["outcome", "timebound", "contrarian", "specific", "authority", "personal", "challenge"], "basedOnVideoId": "proof-video-id", "basedOnChannel": "channel name" }
      ],
      "thumbnailConcept": {
        "overlayText": "3-4 WORDS MAX (power words)",
        "composition": "Specific layout: face placement, text placement, imagery",
        "emotionToConvey": "The feeling viewers should get",
        "colorScheme": "Specific colors that will pop",
        "avoid": ["Common mistakes to avoid"]
      },
      "scriptOutline": {
        "hook": "First 5-10 seconds (CRITICAL)",
        "setup": "Why viewer should care (30 sec)",
        "mainPoints": ["Key point 1", "Key point 2", "Key point 3"],
        "payoff": "The satisfying conclusion",
        "cta": "What action to drive"
      },
      "keywords": [
        { "text": "keyword", "intent": "search" or "browse" or "suggested", "monthlySearches": "estimate", "competition": "low/medium/high" }
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
            "whyItWorked": ["Specific reason 1", "Specific reason 2"],
            "patternToSteal": ["Exact pattern to copy"],
            "howToMakeBetter": "How this creator can IMPROVE on it"
          }
        ]
      }
    }
  ],
  "nicheInsights": {
    "momentumNow": ["Specific trends with velocity data to back them up"],
    "winningPatterns": ["Exact patterns from top performers with examples"],
    "contentGaps": ["Specific gaps competitors are missing that this creator could fill"],
    "avoidThese": ["Topics/formats that are oversaturated or declining"]
  }
}

CRITICAL RULES:
1. Generate EXACTLY 6 unique ideas with this distribution:
   - 2 "easy" (can film today with minimal prep, based on creator's existing expertise)
   - 2 "medium" (requires some research/prep but doable this week)
   - 1 "stretch" (bigger production but high ceiling)
   - 1 "shorts" format idea
2. EVERY idea must reference at least 1 proof video that inspired it
3. NO two ideas should target the same audience segment or search intent
4. Hooks must be SPECIFIC and punchy (8-14 words), not generic
5. Generate exactly 3 title options per idea, each with different style
6. Thumbnail concepts must be ACTIONABLE (specific colors, specific text, specific composition)
7. Include script outline for top 2 ideas (omit for the rest)
8. Be BRUTALLY specific - vague ideas are useless`;

  // Build rich context about the creator's own videos
  const userVideosContext = input.topPerformingVideos
    .slice(0, 6)
    .map((v, i) => {
      const daysOld = Math.floor(
        (Date.now() - new Date(v.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return `${i + 1}. "${v.title}" - ${formatViews(
        v.views
      )} views (${formatViews(v.viewsPerDay)}/day, ${daysOld}d old)${
        v.tags ? ` [Tags: ${v.tags.split(",").slice(0, 5).join(", ")}]` : ""
      }`;
    })
    .join("\n");

  const recentVideosContext = input.recentVideos
    .slice(0, 4)
    .map((v, i) => {
      return `${i + 1}. "${v.title}" - ${formatViews(
        v.views
      )} views (${formatViews(v.viewsPerDay)}/day)`;
    })
    .join("\n");

  // Build rich context about competitor proof videos
  const proofContext = input.proofVideos
    .sort((a, b) => b.viewsPerDay - a.viewsPerDay) // Sort by velocity
    .slice(0, 12)
    .map((v, i) => {
      const velocityLabel =
        v.viewsPerDay > 10000
          ? "🔥 VIRAL"
          : v.viewsPerDay > 1000
          ? "📈 HOT"
          : "✓ Solid";
      return `${i + 1}. "${v.title}" by ${v.channelTitle}
   ${formatViews(v.views)} views | ${formatViews(
        v.viewsPerDay
      )}/day ${velocityLabel} | [ID: ${v.videoId}]`;
    })
    .join("\n\n");

  const userPrompt = `CREATOR PROFILE
Channel: ${input.channelTitle}
Analysis Window: ${input.range === "7d" ? "Last 7 days" : "Last 28 days"}
Niche Keywords: ${input.nicheKeywords.join(", ")}

═══════════════════════════════════════════════════════════
CREATOR'S TOP PERFORMING VIDEOS (what's working for THEM)
═══════════════════════════════════════════════════════════
${userVideosContext || "No performance data yet - focus on competitor patterns"}

CREATOR'S RECENT UPLOADS:
${recentVideosContext || "No recent uploads"}

═══════════════════════════════════════════════════════════
COMPETITOR PROOF VIDEOS (sorted by velocity - what's HOT now)
═══════════════════════════════════════════════════════════
${proofContext || "No competitor data - generate ideas based on niche keywords"}

═══════════════════════════════════════════════════════════
SIMILAR CHANNELS IN NICHE
═══════════════════════════════════════════════════════════
${input.similarChannels.map((c) => `• ${c.channelTitle}`).join("\n")}

═══════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════
Generate 6 UNIQUE video ideas for ${input.channelTitle} that:
1. Build on what's already working for them (their top videos)
2. Capitalize on competitor momentum (high velocity proof videos)
3. Fill gaps in the niche that others are missing
4. Are SPECIFIC enough to film TODAY

Each idea should feel like it was custom-made for THIS creator, not generic advice.`;

  try {
    const result = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      // Keep this tight for speed: 6 ideas with limited titles/outlines.
      { maxTokens: 3200, temperature: 0.8 }
    );

    console.log("[IdeaBoard] LLM response length:", result.content.length);

    // Parse JSON from response
    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn(
        "[IdeaBoard] No JSON found in LLM response, using fallback. Response:",
        result.content.slice(0, 500)
      );
      return createFallbackIdeaBoard(input);
    }

    let parsed: {
      ideas: Idea[];
      nicheInsights: IdeaBoardData["nicheInsights"];
    };

    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("[IdeaBoard] JSON parse error:", parseErr);
      console.error(
        "[IdeaBoard] Raw JSON attempt:",
        jsonMatch[0].slice(0, 1000)
      );
      return createFallbackIdeaBoard(input);
    }

    console.log(
      "[IdeaBoard] Successfully parsed",
      parsed.ideas?.length ?? 0,
      "ideas from LLM"
    );

    // Ensure ideas is an array
    if (!Array.isArray(parsed.ideas) || parsed.ideas.length === 0) {
      console.warn("[IdeaBoard] No ideas in parsed response, using fallback");
      return createFallbackIdeaBoard(input);
    }

    // Enrich ideas with missing proof video data, then normalize shape so UI never gets partial ideas.
    const enrichedIdeas = parsed.ideas.map((idea, index) => {
      const enriched = {
        ...idea,
        id: idea.id || `idea-${index + 1}`,
        proof: enrichProofData(idea.proof, input.proofVideos),
      };
      return enriched;
    });

    console.log(
      "[IdeaBoard] Returning",
      enrichedIdeas.length,
      "enriched ideas"
    );

    const rawBoard: IdeaBoardData = {
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

    return (
      normalizeIdeaBoardData(rawBoard, { nicheKeywords: input.nicheKeywords }) ??
      rawBoard
    );
  } catch (err) {
    console.error("[IdeaBoard] Generation failed:", err);
    console.error(
      "[IdeaBoard] Using fallback with 3 ideas. Error details:",
      err instanceof Error ? err.message : err
    );
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

Return ONLY a JSON array:
[
  { "id": "new-idea-1", "title": "Specific concept", "angle": "1-2 sentence premise/description" }
]

RULES:
- No emojis.
- Do NOT include hooks, title options, keywords, proof, difficulty, format, or estimated views.`;

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

    const ideas = JSON.parse(jsonMatch[0]) as Array<Partial<Idea>>;
    const withIds = ideas.map((idea, index) => ({
      id: idea.id || `new-idea-${Date.now()}-${index}`,
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
        nicheInsights: { momentumNow: [], patternsToCopy: [], gapsToExploit: [] },
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
 * Enrich proof data with full video info from provided videos
 */
function enrichProofData(
  proof: Idea["proof"] | undefined,
  proofVideos: ProofVideoInput[]
): Idea["proof"] {
  const normalizeText = (s: unknown, fallback: string) => {
    const t = typeof s === "string" ? s.trim() : "";
    if (!t || t === "N/A") return fallback;
    return t;
  };

  if (!proof?.basedOn?.length) {
    // Assign random proof videos if none specified
    const randomProof = proofVideos.slice(0, 2).map((v) => ({
      videoId: v.videoId,
      title: normalizeText(v.title, "Untitled video"),
      channelId: v.channelId,
      channelTitle: normalizeText(v.channelTitle, "Unknown channel"),
      thumbnailUrl:
        v.thumbnailUrl ??
        youTubeThumbFromVideoId(v.videoId) ??
        "",
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
    const derivedThumb =
      youTubeThumbFromVideoId(p.videoId) ??
      youTubeThumbFromVideoId(fullVideo?.videoId);
    return {
      videoId: p.videoId,
      title: normalizeText(
        p.title,
        normalizeText(fullVideo?.title, "Untitled")
      ),
      channelId: p.channelId || fullVideo?.channelId || "",
      channelTitle: normalizeText(
        p.channelTitle,
        normalizeText(fullVideo?.channelTitle, "Unknown channel")
      ),
      thumbnailUrl: p.thumbnailUrl || fullVideo?.thumbnailUrl || derivedThumb || "",
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

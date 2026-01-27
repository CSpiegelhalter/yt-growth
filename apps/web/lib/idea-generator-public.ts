/**
 * Public Idea Generator
 *
 * Generates video ideas for the public Video Ideas Generator tool.
 * This is a simplified version that doesn't require a connected channel.
 *
 * Uses:
 * - Optional reference video for inspiration
 * - Content type (Short vs Long-form)
 * - User's channel data if available (enrichment)
 */

import { callLLM } from "./llm";
import { prisma } from "@/prisma";

// ============================================
// TYPES
// ============================================

type PublicIdea = {
  id: string;
  title: string;
  angle?: string;
  hook?: string;
  format: "long" | "short";
};

type GeneratePublicIdeasInput = {
  userId: number;
  topic?: string;
  referenceVideoId?: string;
  isShort: boolean;
};

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Generate video ideas for the public tool
 */
export async function generatePublicIdeas(
  input: GeneratePublicIdeasInput
): Promise<PublicIdea[]> {
  const { userId, topic, referenceVideoId, isShort } = input;
  const format = isShort ? "short" : "long";

  // Try to get user's channel context for enrichment (optional)
  let channelContext = "";
  let nicheKeywords: string[] = [];

  try {
    const userChannel = await prisma.channel.findFirst({
      where: { userId },
      select: {
        title: true,
      },
    });

    // Also get recent videos for this channel
    const recentVideos = userChannel
      ? await prisma.video.findMany({
          where: { channelId: (await prisma.channel.findFirst({ where: { userId } }))?.id },
          orderBy: { publishedAt: "desc" },
          take: 5,
          select: { title: true, tags: true },
        })
      : [];

    if (userChannel) {
      channelContext = `
User's Channel: ${userChannel.title}
Recent Videos: ${recentVideos.map((v) => v.title).join(", ")}
`;
      // Extract keywords from tags
      const allTags = recentVideos.flatMap((v) => v.tags ?? []);
      nicheKeywords = [...new Set(allTags)].slice(0, 10) as string[];
    }
  } catch {
    // No channel data available - continue without enrichment
  }

  // Get reference video info if provided
  let referenceContext = "";
  if (referenceVideoId) {
    try {
      // Try to get video from our database first
      const video = await prisma.video.findFirst({
        where: { youtubeVideoId: referenceVideoId },
        select: { title: true, description: true, tags: true },
      });

      if (video) {
        const tags = Array.isArray(video.tags) ? video.tags : [];
        referenceContext = `
Reference Video: "${video.title}"
Tags: ${(tags as string[]).slice(0, 10).join(", ")}
`;
      } else {
        referenceContext = `Reference Video ID: ${referenceVideoId}`;
      }
    } catch {
      referenceContext = `Reference Video ID: ${referenceVideoId}`;
    }
  }

  // Build topic context if provided
  const topicContext = topic
    ? `
USER'S REQUEST: The creator wants ideas for: "${topic}"
This is the PRIMARY input - all ideas MUST be relevant to this topic/niche/audience.
`
    : "";

  // Build the prompt
  const formatContext = isShort
    ? `
FORMAT: YouTube Shorts (under 60 seconds)
- Ideas should be quick, punchy, and immediately engaging
- Think: one clear concept that can be shown/explained in under a minute
- Hook must grab attention in the first 2 seconds
- Works well: tips, hacks, reactions, mini-tutorials, satisfying reveals
`
    : `
FORMAT: Long-form YouTube videos (8-15+ minutes)
- Ideas should have depth and room for exploration
- Think: topics that benefit from detailed explanation or storytelling
- Hook should promise value that takes time to deliver
- Works well: tutorials, stories, analyses, comparisons, deep dives
`;

  const systemPrompt = `You are a YouTube content strategist. Generate video ideas based on the user's request.
${topicContext}
${formatContext}
OUTPUT FORMAT: Return ONLY valid JSON:
{
  "ideas": [
    {
      "id": "idea-1",
      "title": "Specific, compelling title",
      "angle": "1-2 sentence premise that explains what makes this video interesting",
      "hook": "Opening line that grabs attention"
    }
  ]
}

RULES:
- Generate EXACTLY 6 ideas.
- No emojis in titles or angles.
- Titles must be specific (topic + mechanism + outcome).
- Angles must be concrete - what would the video actually show/explain?
- Hooks should be conversational and attention-grabbing.
- All ideas must work for ${isShort ? "Shorts" : "long-form"} format.
- Make ideas actionable - things a creator could actually film today.
${topic ? "- ALL ideas must be directly relevant to the user's requested topic/niche." : ""}`;

  const userPrompt = `Generate 6 ${isShort ? "YouTube Shorts" : "long-form video"} ideas.
${topic ? `\nTOPIC/NICHE: ${topic}` : ""}
${channelContext}
${referenceContext}
${nicheKeywords.length > 0 ? `Additional context - relevant topics: ${nicheKeywords.join(", ")}` : ""}

Create ideas that are specific, filmable, and would perform well on YouTube.${topic ? ` Focus on the topic: "${topic}"` : ""}`;

  try {
    const result = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 1800, temperature: 0.85 }
    );

    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return generateFallbackIdeas(format);
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      ideas: Array<Partial<PublicIdea>>;
    };

    const timestamp = Date.now();
    return (parsed.ideas ?? []).slice(0, 6).map((idea, idx) => ({
      id: `public-${timestamp}-${idx}`,
      title: idea.title ?? `Video Idea ${idx + 1}`,
      angle: idea.angle ?? undefined,
      hook: idea.hook ?? undefined,
      format,
    }));
  } catch (err) {
    console.error("[PublicIdeas] Generation failed:", err);
    return generateFallbackIdeas(format);
  }
}

/**
 * Fallback ideas when LLM fails
 */
function generateFallbackIdeas(format: "long" | "short"): PublicIdea[] {
  const timestamp = Date.now();

  if (format === "short") {
    return [
      {
        id: `fallback-${timestamp}-0`,
        title: "One tip that changed everything",
        angle:
          "Share a single powerful insight that transformed your approach",
        hook: "I wish someone told me this sooner...",
        format: "short",
      },
      {
        id: `fallback-${timestamp}-1`,
        title: "POV: You just learned this",
        angle: "Show the 'aha moment' realization in a relatable way",
        hook: "Wait... it's actually that simple?",
        format: "short",
      },
      {
        id: `fallback-${timestamp}-2`,
        title: "Stop doing this (do this instead)",
        angle: "Quick comparison of wrong vs right approach",
        hook: "This mistake is costing you...",
        format: "short",
      },
      {
        id: `fallback-${timestamp}-3`,
        title: "3 things I learned the hard way",
        angle: "Rapid-fire lessons from real experience",
        hook: "Number 2 hurt the most...",
        format: "short",
      },
      {
        id: `fallback-${timestamp}-4`,
        title: "Reply to: 'How do you do that?'",
        angle: "Quick tutorial in response to a common question",
        hook: "You asked, here's how...",
        format: "short",
      },
      {
        id: `fallback-${timestamp}-5`,
        title: "Before vs After (real results)",
        angle: "Show transformation or progress",
        hook: "30 days ago vs today...",
        format: "short",
      },
    ];
  }

  return [
    {
      id: `fallback-${timestamp}-0`,
      title: "The complete beginner's guide to [topic]",
      angle:
        "Everything someone needs to know to get started, explained from zero",
      hook: "If you're new to this, you're in the right place. Let me save you months of confusion.",
      format: "long",
    },
    {
      id: `fallback-${timestamp}-1`,
      title: "I tested [method] for 30 days. Here's what happened.",
      angle:
        "Document a real experiment with honest results and takeaways",
      hook: "I had no idea it would turn out like this...",
      format: "long",
    },
    {
      id: `fallback-${timestamp}-2`,
      title: "Why everyone is wrong about [topic]",
      angle:
        "Challenge common wisdom with evidence and your own experience",
      hook: "The advice you keep hearing? It's actually holding you back.",
      format: "long",
    },
    {
      id: `fallback-${timestamp}-3`,
      title: "How I went from [A] to [B] in [timeframe]",
      angle:
        "Share your journey with specific steps others can follow",
      hook: "A year ago, I was exactly where you are. Here's what changed.",
      format: "long",
    },
    {
      id: `fallback-${timestamp}-4`,
      title: "5 mistakes killing your [goal] (and how to fix them)",
      angle:
        "Identify common problems and provide actionable solutions",
      hook: "Number 3 is the one almost everyone makes...",
      format: "long",
    },
    {
      id: `fallback-${timestamp}-5`,
      title: "[Expert] reveals what actually works",
      angle:
        "Share insights from an interview or collaboration",
      hook: "I asked them the questions everyone wants answered...",
      format: "long",
    },
  ];
}

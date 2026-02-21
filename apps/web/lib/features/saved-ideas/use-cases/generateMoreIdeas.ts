import crypto from "crypto";
import { prisma } from "@/prisma";
import { callLLM } from "@/lib/llm";
import { SavedIdeaError } from "../errors";

type IdeaSeed = {
  ideaId?: string;
  title: string;
  summary?: string;
  keywords: string[];
  hooks: string[];
  inspiredByVideoIds?: string[];
};

type MoreIdeaResponse = {
  hooks: string[];
  titles: string[];
  keywords: string[];
  packaging: {
    titleAngles: string[];
    hookSetups: string[];
    visualMoments: string[];
  };
  remixes: {
    title: string;
    hook: string;
    overlayText: string;
    angle: string;
  }[];
};

type GenerateMoreIdeasInput = {
  userId: number;
  channelId: string;
  seed: IdeaSeed;
};

const responseCache = new Map<
  string,
  { data: MoreIdeaResponse; expiresAt: number }
>();

function hashSeed(seed: IdeaSeed, channelId: string): string {
  const normalized = JSON.stringify({
    channelId,
    title: seed.title.toLowerCase().trim(),
    keywords: seed.keywords.slice(0, 5).sort(),
    hooks: seed.hooks.slice(0, 2).map((h: string) => h.toLowerCase().trim()),
  });
  return crypto
    .createHash("sha256")
    .update(normalized)
    .digest("hex")
    .slice(0, 16);
}

export async function generateMoreIdeas(
  input: GenerateMoreIdeasInput,
): Promise<MoreIdeaResponse> {
  const { userId, channelId, seed } = input;

  const channel = await prisma.channel.findFirst({
    where: { youtubeChannelId: channelId, userId },
  });
  if (!channel) {
    throw new SavedIdeaError("NOT_FOUND", "Channel not found");
  }

  const cacheKey = hashSeed(seed, channelId);
  const cached = responseCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const result = await callLlmForMoreIdeas(
    seed,
    channel.title ?? "Your Channel",
  );

  responseCache.set(cacheKey, {
    data: result,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  });

  if (responseCache.size > 100) {
    const now = Date.now();
    for (const [key, value] of responseCache) {
      if (value.expiresAt < now) {
        responseCache.delete(key);
      }
    }
  }

  return result;
}

async function callLlmForMoreIdeas(
  seed: IdeaSeed,
  channelTitle: string,
): Promise<MoreIdeaResponse> {
  const systemPrompt = `You are an elite YouTube creative director. Generate additional content for an existing video idea.

OUTPUT FORMAT: Return ONLY valid JSON matching this structure:
{
  "hooks": ["8 opening hooks (8-14 words each)"],
  "titles": ["8 title options (distinct angles/styles)"],
  "keywords": ["12 relevant keywords/tags"],
  "packaging": {
    "titleAngles": ["6 specific title angle approaches"],
    "hookSetups": ["6 specific ways to open the video"],
    "visualMoments": ["6 specific visual elements to show early"]
  },
  "remixes": [
    {
      "title": "Remix title option",
      "hook": "Opening line for this angle",
      "overlayText": "3-4 WORD thumbnail text",
      "angle": "What makes this version different"
    }
  ]
}

RULES:
- Hooks should grab attention in first 5 seconds
- Titles must be clickable and under 60 characters
- Keywords should be searchable terms
- Packaging ideas must be specific and actionable, not generic
- Remixes should offer genuinely different angles on the same topic
- NO emojis or special characters
- Keep everything concise and professional`;

  const userPrompt = `Channel: ${channelTitle}

EXISTING IDEA:
Title: ${seed.title}
${seed.summary ? `Summary: ${seed.summary}` : ""}
Keywords: ${seed.keywords.join(", ")}
Current hooks: ${seed.hooks.join(" | ")}

Generate MORE content that complements (not duplicates) this idea.`;

  const result = await callLLM(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    { maxTokens: 1500, temperature: 0.8 },
  );

  const jsonMatch = result.content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new SavedIdeaError("EXTERNAL_FAILURE", "LLM did not return JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]) as MoreIdeaResponse;

  return {
    hooks: Array.isArray(parsed.hooks) ? parsed.hooks.slice(0, 10) : [],
    titles: Array.isArray(parsed.titles) ? parsed.titles.slice(0, 10) : [],
    keywords: Array.isArray(parsed.keywords)
      ? parsed.keywords.slice(0, 16)
      : [],
    packaging: {
      titleAngles: parsed.packaging?.titleAngles?.slice(0, 8) ?? [],
      hookSetups: parsed.packaging?.hookSetups?.slice(0, 8) ?? [],
      visualMoments: parsed.packaging?.visualMoments?.slice(0, 8) ?? [],
    },
    remixes: Array.isArray(parsed.remixes) ? parsed.remixes.slice(0, 6) : [],
  };
}

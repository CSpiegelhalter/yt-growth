/**
 * POST /api/me/channels/[channelId]/ideas/more
 *
 * Generate more hooks, titles, keywords, and packaging ideas for an existing idea.
 * This expands on an idea without replacing it.
 *
 * Auth: Required
 * Entitlements: idea_generate (10/day FREE, 200/day PRO)
 * Caching: 24h via in-memory cache (simple approach)
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma";
import { createApiRoute } from "@/lib/api/route";
import {
  getCurrentUserWithSubscription,
  hasActiveSubscription,
} from "@/lib/user";
import { isDemoMode } from "@/lib/demo-fixtures";
import { callLLM } from "@/lib/llm";
import {
  checkEntitlement,
  entitlementErrorResponse,
} from "@/lib/with-entitlements";
import crypto from "crypto";

const ParamsSchema = z.object({
  channelId: z.string().min(1),
});

const SeedSchema = z.object({
  ideaId: z.string().optional(),
  title: z.string().min(1),
  summary: z.string().optional(),
  keywords: z.array(z.string()),
  hooks: z.array(z.string()),
  inspiredByVideoIds: z.array(z.string()).optional(),
});

const BodySchema = z.object({
  seed: SeedSchema,
});

type Seed = z.infer<typeof SeedSchema>;

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

// Simple in-memory cache (24h TTL)
const responseCache = new Map<
  string,
  { data: MoreIdeaResponse; expiresAt: number }
>();

/**
 * Generate a stable hash from the seed for caching
 */
function hashSeed(seed: Seed, channelId: string): string {
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

/**
 * POST - Generate more content for an existing idea
 */
async function POSTHandler(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  // Return demo data if demo mode
  if (isDemoMode()) {
    return Response.json(getDemoMoreIdeas());
  }

  try {
    // Entitlement check - idea generation is a usage-limited feature
    const entitlementResult = await checkEntitlement({
      featureKey: "idea_generate",
      increment: true,
    });
    if (!entitlementResult.ok) {
      return entitlementErrorResponse(entitlementResult.error);
    }
    const user = entitlementResult.context.user;

    // Validate params
    const resolvedParams = await params;
    const parsedParams = ParamsSchema.safeParse(resolvedParams);
    if (!parsedParams.success) {
      return Response.json({ error: "Invalid channel ID" }, { status: 400 });
    }

    const { channelId } = parsedParams.data;

    // Parse body
    const body = await req.json();
    const parsedBody = BodySchema.safeParse(body);
    if (!parsedBody.success) {
      return Response.json(
        { error: "Invalid request body", details: parsedBody.error.errors },
        { status: 400 }
      );
    }

    const { seed } = parsedBody.data;

    // Verify channel ownership
    const channel = await prisma.channel.findFirst({
      where: {
        youtubeChannelId: channelId,
        userId: user.id,
      },
    });

    if (!channel) {
      return Response.json({ error: "Channel not found" }, { status: 404 });
    }

    // Check cache
    const cacheKey = hashSeed(seed, channelId);
    const cached = responseCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return Response.json(cached.data);
    }

    // Generate more content via LLM
    const result = await generateMoreIdeaContent(
      seed,
      channel.title ?? "Your Channel"
    );

    // Cache the result (24h TTL)
    responseCache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    // Clean up old cache entries (simple garbage collection)
    if (responseCache.size > 100) {
      const now = Date.now();
      for (const [key, value] of responseCache) {
        if (value.expiresAt < now) {
          responseCache.delete(key);
        }
      }
    }

    return Response.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Generate more ideas failed:", err);
    return Response.json(
      { error: "Failed to generate more ideas", detail: message },
      { status: 500 }
    );
  }
}

export const POST = createApiRoute(
  { route: "/api/me/channels/[channelId]/ideas/more" },
  async (req, ctx) => POSTHandler(req, ctx as any)
);

/**
 * Generate more content using LLM
 */
async function generateMoreIdeaContent(
  seed: Seed,
  channelTitle: string
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

  try {
    const result = await callLLM(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 1500, temperature: 0.8 }
    );

    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("LLM did not return JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]) as MoreIdeaResponse;

    // Validate and ensure arrays
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
  } catch (err: unknown) {
    console.error("LLM generation failed:", err);
    throw err;
  }
}

/**
 * Demo/fallback data
 */
function getDemoMoreIdeas(): MoreIdeaResponse {
  return {
    hooks: [
      "Most creators get this completely wrong. Here's the fix.",
      "I tested this for 30 days. The results surprised me.",
      "Stop doing what everyone else does. Try this instead.",
    ],
    titles: [
      "The Counterintuitive Secret to [Topic]",
      "Why [Topic] Is Harder Than It Looks",
      "I Was Wrong About [Topic] for Years",
    ],
    keywords: [
      "tutorial",
      "tips and tricks",
      "beginner guide",
      "advanced techniques",
      "mistakes to avoid",
    ],
    packaging: {
      titleAngles: [
        "Lead with the unexpected outcome",
        "Frame it as a common mistake most people make",
        "Use a specific number or timeframe for credibility",
      ],
      hookSetups: [
        "Start with a bold contrarian statement",
        "Open with a relatable struggle your audience faces",
        "Begin by showing the end result, then rewind",
      ],
      visualMoments: [
        "Show a before/after comparison in the first 3 seconds",
        "Use a text overlay that matches your title promise",
        "Cut to yourself reacting to a surprising result",
      ],
    },
    remixes: [
      {
        title: "Why I Stopped [Common Practice] (And You Should Too)",
        hook: "Everyone told me to do this. They were wrong.",
        overlayText: "I WAS WRONG",
        angle: "Contrarian take that challenges conventional wisdom",
      },
      {
        title: "The Beginner's Guide to [Topic] That Actually Works",
        hook: "If you're just starting out, this is the only video you need.",
        overlayText: "START HERE",
        angle: "Beginner-friendly approach with step-by-step clarity",
      },
      {
        title: "I Tried [Topic] for 30 Days - Here's What Happened",
        hook: "I didn't expect these results. Let me show you everything.",
        overlayText: "30 DAYS LATER",
        angle: "Personal experiment format with documented journey",
      },
    ],
  };
}

/**
 * POST /api/youtube-tag-generator
 *
 * Generate YouTube tags using LLM based on video title, description,
 * and optional reference video.
 *
 * Auth: Required
 * Rate Limited: 5/day free, 200/day pro
 */
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { jsonOk, jsonError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { callLLM } from "@/lib/llm";
import { parseYouTubeVideoId } from "@/lib/youtube-video-id";
import { getLimit, type Plan } from "@/lib/entitlements";
import { checkAndIncrement, getUsageInfo } from "@/lib/usage";
import { hasActiveSubscription } from "@/lib/user";
import { logger } from "@/lib/logger";

// ============================================
// VALIDATION SCHEMA
// ============================================

const requestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must be at most 120 characters"),
  description: z
    .string()
    .trim()
    .max(4000, "Description must be at most 4000 characters")
    .optional(),
  referenceYoutubeUrl: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return parseYouTubeVideoId(val) !== null;
      },
      { message: "Invalid YouTube URL" }
    ),
});

// ============================================
// YOUTUBE API FETCH
// ============================================

type YouTubeSnippet = {
  title: string;
  description: string;
  tags?: string[];
  channelTitle: string;
};

async function fetchYouTubeVideoSnippet(
  videoId: string
): Promise<YouTubeSnippet | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    logger.warn("youtube-tag-generator.missing_api_key", {
      message: "YOUTUBE_API_KEY not configured",
    });
    return null;
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", apiKey);
  url.searchParams.set(
    "fields",
    "items/snippet(title,description,tags,channelTitle)"
  );

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url.toString(), {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.warn("youtube-tag-generator.youtube_api_error", {
        status: response.status,
        videoId,
      });
      return null;
    }

    const data = await response.json();
    const snippet = data.items?.[0]?.snippet;

    if (!snippet) {
      return null;
    }

    return {
      title: snippet.title || "",
      description: snippet.description || "",
      tags: snippet.tags || [],
      channelTitle: snippet.channelTitle || "",
    };
  } catch (err) {
    logger.warn("youtube-tag-generator.youtube_fetch_failed", {
      videoId,
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return null;
  }
}

// ============================================
// LLM TAG GENERATION
// ============================================

type TagGenerationInput = {
  title: string;
  description?: string;
  referenceVideo?: YouTubeSnippet | null;
};

type TagGenerationOutput = {
  tags: string[];
  notes: string[];
};

async function generateTags(
  input: TagGenerationInput
): Promise<TagGenerationOutput> {
  const systemPrompt = `You are a YouTube SEO expert. Generate optimized tags for a YouTube video.

CRITICAL: Return ONLY valid JSON matching this exact structure:
{
  "tags": ["tag1", "tag2", ...],
  "notes": ["Strategy note 1", "Strategy note 2"]
}

Tag Requirements:
- Generate 25-40 tags
- Mix broad category tags, niche-specific tags, intent-based tags, and long-tail phrases
- NO duplicate tags (case-insensitive)
- NO hashtags (# symbols)
- NO misleading or spam tags
- Keep total character count conservative to avoid YouTube's limits (~500 chars total)
- Tags should be relevant to the video content
- Include variations of key phrases (singular/plural, different word orders)

Notes Requirements:
- Provide 1-3 short, actionable strategy notes
- Focus on why certain tag types were chosen
- Include any warnings about tag placement strategy`;

  let userPrompt = `Generate YouTube tags for this video:

VIDEO TITLE: ${input.title}`;

  if (input.description) {
    // Truncate description to avoid huge prompts
    const truncatedDesc = input.description.slice(0, 1000);
    userPrompt += `\n\nVIDEO DESCRIPTION: ${truncatedDesc}${input.description.length > 1000 ? "..." : ""}`;
  }

  if (input.referenceVideo) {
    userPrompt += `\n\nREFERENCE VIDEO (for context):
Title: ${input.referenceVideo.title}
Channel: ${input.referenceVideo.channelTitle}`;

    if (input.referenceVideo.tags && input.referenceVideo.tags.length > 0) {
      // Only include first 20 tags to avoid huge prompts
      const refTags = input.referenceVideo.tags.slice(0, 20).join(", ");
      userPrompt += `\nExisting Tags: ${refTags}`;
    }

    if (input.referenceVideo.description) {
      const refDesc = input.referenceVideo.description.slice(0, 500);
      userPrompt += `\nDescription preview: ${refDesc}${input.referenceVideo.description.length > 500 ? "..." : ""}`;
    }
  }

  const response = await callLLM(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    {
      responseFormat: "json_object",
      temperature: 0.7,
      maxTokens: 1500,
    }
  );

  // Parse the response
  try {
    const parsed = JSON.parse(response.content);

    // Validate and clean tags
    let tags: string[] = [];
    if (Array.isArray(parsed.tags)) {
      const seen = new Set<string>();
      tags = parsed.tags
        .filter((t: unknown): t is string => typeof t === "string")
        .map((t: string) => t.trim().replace(/^#/, "")) // Remove leading hashtags
        .filter((t: string) => {
          if (!t || t.length > 100) return false;
          const lower = t.toLowerCase();
          if (seen.has(lower)) return false;
          seen.add(lower);
          return true;
        })
        .slice(0, 40); // Cap at 40 tags
    }

    // Validate notes
    let notes: string[] = [];
    if (Array.isArray(parsed.notes)) {
      notes = parsed.notes
        .filter((n: unknown): n is string => typeof n === "string")
        .map((n: string) => n.trim())
        .filter((n: string) => n.length > 0 && n.length <= 500)
        .slice(0, 3);
    }

    // Ensure we have some notes if empty
    if (notes.length === 0) {
      notes = [
        "Use your most important tags first - YouTube weighs early tags more heavily.",
      ];
    }

    return { tags, notes };
  } catch {
    // Fallback if JSON parsing fails
    logger.warn("youtube-tag-generator.llm_parse_error", {
      response: response.content.slice(0, 200),
    });
    throw new ApiError({
      code: "INTERNAL",
      status: 500,
      message: "Failed to generate tags. Please try again.",
    });
  }
}

// ============================================
// ROUTE HANDLER
// ============================================

export const POST = createApiRoute(
  { route: "/api/youtube-tag-generator" },
  withAuth({ mode: "required" }, async (req, _ctx, api: ApiAuthContext) => {
    const user = api.user!;

    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        status: 400,
        message: "Invalid JSON body",
      });
    }

    // Validate request size (abuse protection)
    const bodyStr = JSON.stringify(body);
    if (bodyStr.length > 50000) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        status: 400,
        message: "Request too large",
      });
    }

    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        status: 400,
        message: parsed.error.errors[0]?.message || "Invalid request",
        details: parsed.error.flatten(),
      });
    }

    const { title, description, referenceYoutubeUrl } = parsed.data;

    // Determine plan and limits
    const isPro = hasActiveSubscription(user.subscription);
    const plan: Plan = isPro ? "PRO" : "FREE";
    const limit = getLimit(plan, "tag_generate");

    // Check rate limit
    const usageResult = await checkAndIncrement({
      userId: user.id,
      featureKey: "tag_generate",
      limit,
    });

    if (!usageResult.allowed) {
      logger.info("youtube-tag-generator.rate_limited", {
        userId: user.id,
        plan,
      });

      return jsonError({
        status: 429,
        code: "LIMIT_REACHED",
        message: `You have used all ${limit} tag generations for today.`,
        requestId: api.requestId,
        details: {
          remaining: 0,
          resetAt: usageResult.resetAt,
          isPro,
        },
      });
    }

    // Fetch reference video if URL provided
    let referenceVideo: YouTubeSnippet | null = null;
    let referenceWarning: string | null = null;

    if (referenceYoutubeUrl) {
      const videoId = parseYouTubeVideoId(referenceYoutubeUrl);
      if (videoId) {
        referenceVideo = await fetchYouTubeVideoSnippet(videoId);
        if (!referenceVideo) {
          referenceWarning =
            "Could not fetch reference video. Generating tags without it.";
        }
      }
    }

    // Generate tags
    const result = await generateTags({
      title,
      description,
      referenceVideo,
    });

    // Add warning note if reference video fetch failed
    if (referenceWarning && result.notes.length < 3) {
      result.notes.push(referenceWarning);
    }

    // Build copy strings
    const copyComma = result.tags.join(", ");
    const copyLines = result.tags.join("\n");

    // Log success (no sensitive data)
    logger.info("youtube-tag-generator.success", {
      userId: user.id,
      tagCount: result.tags.length,
      hadReference: !!referenceVideo,
      plan,
    });

    return jsonOk(
      {
        tags: result.tags,
        copyComma,
        copyLines,
        notes: result.notes,
        remaining: usageResult.remaining,
        resetAt: usageResult.resetAt,
      },
      { requestId: api.requestId }
    );
  })
);

export const runtime = "nodejs";

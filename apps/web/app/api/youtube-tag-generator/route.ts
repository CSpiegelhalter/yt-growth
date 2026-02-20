/**
 * POST /api/youtube-tag-generator
 *
 * Generate YouTube tags using LLM based on video title, description,
 * and optional reference video.
 *
 * Auth: Optional (works for both authenticated and anonymous users)
 * Rate Limited: 
 *   - Anonymous: 5/day (basic IP tracking)
 *   - Free users: 5/day
 *   - Pro users: 200/day
 */
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk, jsonError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { callLLM } from "@/lib/llm";
import { parseYouTubeVideoId } from "@/lib/youtube-video-id";
import { fetchVideoSnippetByApiKey } from "@/lib/youtube/data-api";
import { getLimit, type Plan } from "@/lib/entitlements";
import { checkAndIncrement } from "@/lib/usage";
import { hasActiveSubscription } from "@/lib/user";
import { logger } from "@/lib/logger";

// Simple in-memory rate limiting for anonymous users
// In production, consider using Redis or a proper rate limiter
const anonymousUsage = new Map<string, { count: number; date: string }>();
const ANONYMOUS_DAILY_LIMIT = 5;

function getAnonymousRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const usage = anonymousUsage.get(ip);
  
  // Reset if it's a new day
  if (!usage || usage.date !== today) {
    anonymousUsage.set(ip, { count: 1, date: today });
    return { allowed: true, remaining: ANONYMOUS_DAILY_LIMIT - 1 };
  }
  
  if (usage.count >= ANONYMOUS_DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  
  usage.count++;
  return { allowed: true, remaining: ANONYMOUS_DAILY_LIMIT - usage.count };
}

// Cleanup old entries periodically (runs on each request, but cheap)
function cleanupOldEntries() {
  const today = new Date().toISOString().split("T")[0];
  for (const [ip, usage] of anonymousUsage.entries()) {
    if (usage.date !== today) {
      anonymousUsage.delete(ip);
    }
  }
}

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
// YOUTUBE SNIPPET TYPE (for reference video context)
// ============================================

type YouTubeSnippet = {
  title: string;
  description: string;
  tags?: string[];
  channelTitle: string;
};

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
  withAuth(
    { mode: "optional" },
    withValidation(
      { body: requestSchema },
      async (req, _ctx, api: ApiAuthContext, validated) => {
        const user = api.user;
        const { title, description, referenceYoutubeUrl } = validated.body!;

        // Rate limiting
        let remaining: number;
        let resetAt: string;
        let isPro = false;

        if (user) {
          isPro = hasActiveSubscription(user.subscription);
          const plan: Plan = isPro ? "PRO" : "FREE";
          const limit = getLimit(plan, "tag_generate");

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

          remaining = usageResult.remaining;
          resetAt = usageResult.resetAt;
        } else {
          cleanupOldEntries();

          const forwardedFor = req.headers.get("x-forwarded-for");
          const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

          const anonLimit = getAnonymousRateLimit(ip);

          if (!anonLimit.allowed) {
            logger.info("youtube-tag-generator.rate_limited_anonymous", { ip });

            return jsonError({
              status: 429,
              code: "LIMIT_REACHED",
              message: `You've reached the free limit. Sign up for more generations.`,
              requestId: api.requestId,
              details: {
                remaining: 0,
                resetAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
              },
            });
          }

          remaining = anonLimit.remaining;
          resetAt = new Date(new Date().setHours(24, 0, 0, 0)).toISOString();
        }

        let referenceVideo: YouTubeSnippet | null = null;
        let referenceWarning: string | null = null;

        if (referenceYoutubeUrl) {
          const videoId = parseYouTubeVideoId(referenceYoutubeUrl);
          if (videoId) {
            try {
              const item = await fetchVideoSnippetByApiKey(videoId, {
                fields:
                  "items/snippet(title,description,tags,channelTitle)",
              });
              if (item?.snippet) {
                referenceVideo = {
                  title: item.snippet.title || "",
                  description: item.snippet.description || "",
                  tags: item.snippet.tags || [],
                  channelTitle: item.snippet.channelTitle || "",
                };
              }
            } catch {
              // Silently fall through — tags will be generated without reference
            }
            if (!referenceVideo) {
              referenceWarning =
                "Could not fetch reference video. Generating tags without it.";
            }
          }
        }

        const result = await generateTags({
          title,
          description,
          referenceVideo,
        });

        if (referenceWarning && result.notes.length < 3) {
          result.notes.push(referenceWarning);
        }

        const copyComma = result.tags.join(", ");
        const copyLines = result.tags.join("\n");

        logger.info("youtube-tag-generator.success", {
          userId: user?.id ?? "anonymous",
          tagCount: result.tags.length,
          hadReference: !!referenceVideo,
          plan: user ? (isPro ? "PRO" : "FREE") : "ANONYMOUS",
        });

        return jsonOk(
          {
            tags: result.tags,
            copyComma,
            copyLines,
            notes: result.notes,
            remaining,
            resetAt,
          },
          { requestId: api.requestId }
        );
      }
    )
  )
);

export const runtime = "nodejs";

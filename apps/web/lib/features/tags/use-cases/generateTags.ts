/**
 * Generate Tags Use-Case
 *
 * Builds an LLM prompt from a video title/description (and optional
 * reference video), calls the LLM, then validates and deduplicates
 * the returned tags.
 *
 * Also handles rate limiting: anonymous users are tracked in-memory;
 * authenticated users go through an injected usage dependency.
 */

import type { LlmCompletionParams, LlmCompletionResult } from "@/lib/ports/LlmPort";
import { parseYouTubeVideoId } from "@/lib/shared/youtube-video-id";
import { TagError } from "../errors";
import type {
  GenerateTagsInput,
  GenerateTagsResult,
  ReferenceVideoContext,
  VideoSnippetForTags,
} from "../types";

// ── Dependencies ────────────────────────────────────────────

export type GenerateTagsDeps = {
  llm: {
    complete(params: LlmCompletionParams): Promise<LlmCompletionResult>;
  };
  youtube: {
    getVideoSnippet(videoId: string): Promise<VideoSnippetForTags | null>;
  };
  usage: {
    checkAndIncrement(params: {
      userId: number;
      featureKey: "tag_generate";
      limit: number;
    }): Promise<{ allowed: boolean; remaining: number; resetAt: string }>;
  };
  getLimit: (plan: "FREE" | "PRO", feature: "tag_generate") => number;
};

// ── Anonymous rate limiting (in-memory) ─────────────────────

const anonymousUsage = new Map<string, { count: number; date: string }>();
const ANONYMOUS_DAILY_LIMIT = 5;

function checkAnonymousRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().split("T")[0];

  // Evict stale entries for this check
  for (const [key, entry] of anonymousUsage.entries()) {
    if (entry.date !== today) anonymousUsage.delete(key);
  }

  const usage = anonymousUsage.get(ip);
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

// ── Use-case ────────────────────────────────────────────────

export async function generateTags(
  input: GenerateTagsInput,
  deps: GenerateTagsDeps,
): Promise<GenerateTagsResult> {
  // ── Rate limiting ───────────────────────────────────
  let remaining: number;
  let resetAt: string;

  if (input.userId != null) {
    const plan: "FREE" | "PRO" = input.isPro ? "PRO" : "FREE";
    const limit = deps.getLimit(plan, "tag_generate");

    const usageResult = await deps.usage.checkAndIncrement({
      userId: input.userId,
      featureKey: "tag_generate",
      limit,
    });

    if (!usageResult.allowed) {
      throw new TagError(
        "LIMIT_REACHED",
        `You have used all ${limit} tag generations for today.`,
      );
    }

    remaining = usageResult.remaining;
    resetAt = usageResult.resetAt;
  } else {
    const anonResult = checkAnonymousRateLimit(input.ip);

    if (!anonResult.allowed) {
      throw new TagError(
        "LIMIT_REACHED",
        "You've reached the free limit. Sign up for more generations.",
      );
    }

    remaining = anonResult.remaining;
    resetAt = new Date(new Date().setHours(24, 0, 0, 0)).toISOString();
  }

  // ── Parse reference URL → video ID ──────────────────
  const referenceVideoId = input.referenceYoutubeUrl
    ? (parseYouTubeVideoId(input.referenceYoutubeUrl) ?? undefined)
    : undefined;

  // ── Fetch reference video context ───────────────────
  let referenceVideo: ReferenceVideoContext | null = null;
  let referenceWarning: string | undefined;

  if (referenceVideoId) {
    try {
      const snippet = await deps.youtube.getVideoSnippet(referenceVideoId);
      if (snippet) {
        referenceVideo = {
          title: snippet.title,
          description: snippet.description,
          tags: snippet.tags,
          channelTitle: snippet.channelTitle,
        };
      }
    } catch {
      // Fall through — generate tags without the reference video
    }
    if (!referenceVideo) {
      referenceWarning = "Could not fetch reference video. Generating tags without it.";
    }
  }

  // ── LLM call ────────────────────────────────────────
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(
    { title: input.title, description: input.description },
    referenceVideo,
  );

  let rawContent: string;
  try {
    const response = await deps.llm.complete({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      maxTokens: 1500,
    });
    rawContent = response.content;
  } catch (cause) {
    throw new TagError(
      "EXTERNAL_FAILURE",
      "Failed to generate tags. Please try again.",
      cause,
    );
  }

  // ── Parse & format ──────────────────────────────────
  const { tags, notes } = parseTagResponse(rawContent);

  if (referenceWarning && notes.length < 3) {
    notes.push(referenceWarning);
  }

  return {
    tags,
    notes,
    copyComma: tags.join(", "),
    copyLines: tags.join("\n"),
    remaining,
    resetAt,
  };
}

// ── Prompt builders ─────────────────────────────────────────

const SYSTEM_PROMPT = `You are a YouTube SEO expert. Generate optimized tags for a YouTube video.

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

function buildSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

function buildUserPrompt(
  input: { title: string; description?: string },
  referenceVideo: ReferenceVideoContext | null,
): string {
  let prompt = `Generate YouTube tags for this video:\n\nVIDEO TITLE: ${input.title}`;

  if (input.description) {
    const truncated = input.description.slice(0, 1000);
    const ellipsis = input.description.length > 1000 ? "..." : "";
    prompt += `\n\nVIDEO DESCRIPTION: ${truncated}${ellipsis}`;
  }

  if (referenceVideo) {
    prompt += `\n\nREFERENCE VIDEO (for context):\nTitle: ${referenceVideo.title}\nChannel: ${referenceVideo.channelTitle}`;

    if (referenceVideo.tags.length > 0) {
      const refTags = referenceVideo.tags.slice(0, 20).join(", ");
      prompt += `\nExisting Tags: ${refTags}`;
    }

    if (referenceVideo.description) {
      const refDesc = referenceVideo.description.slice(0, 500);
      const ellipsis = referenceVideo.description.length > 500 ? "..." : "";
      prompt += `\nDescription preview: ${refDesc}${ellipsis}`;
    }
  }

  return prompt;
}

// ── Response parsing ────────────────────────────────────────

function parseTagResponse(content: string): { tags: string[]; notes: string[] } {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content);
  } catch (cause) {
    throw new TagError(
      "EXTERNAL_FAILURE",
      "Failed to generate tags. Please try again.",
      cause,
    );
  }

  let tags: string[] = [];
  if (Array.isArray(parsed.tags)) {
    const seen = new Set<string>();
    tags = (parsed.tags as unknown[])
      .filter((t): t is string => typeof t === "string")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter((t) => {
        if (!t || t.length > 100) return false;
        const lower = t.toLowerCase();
        if (seen.has(lower)) return false;
        seen.add(lower);
        return true;
      })
      .slice(0, 40);
  }

  let notes: string[] = [];
  if (Array.isArray(parsed.notes)) {
    notes = (parsed.notes as unknown[])
      .filter((n): n is string => typeof n === "string")
      .map((n) => n.trim())
      .filter((n) => n.length > 0 && n.length <= 500)
      .slice(0, 3);
  }

  if (notes.length === 0) {
    notes = [
      "Use your most important tags first - YouTube weighs early tags more heavily.",
    ];
  }

  return { tags, notes };
}

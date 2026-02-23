/**
 * Niche Inference Module
 *
 * Deterministic, testable pipeline for inferring niche from:
 * - User-provided niche text
 * - Reference YouTube video URL
 * - Or both combined
 *
 * Security considerations:
 * - Validates YouTube URL hosts
 * - Sanitizes inputs
 * - Does not log full user text or URLs (PII-ish)
 */
import "server-only";

import { parseYouTubeVideoId } from "@/lib/shared/youtube-video-id";
import { fetchVideoDetails } from "@/lib/youtube";
import { YOUTUBE_CATEGORIES } from "@/lib/youtube/constants";
import type { GoogleAccount, VideoDetails } from "@/lib/youtube/types";

import type {
  ContentTypeFilter,
  InferredNiche,
  NicheInferenceInput,
} from "./types";
import {
  extractKeywords,
  inferNicheFromText,
  STOPWORDS,
} from "./utils";

// Platform/game identifiers that provide important context
const PLATFORM_KEYWORDS = new Set([
  "roblox", "minecraft", "fortnite", "gta", "valorant", "apex", "cod",
  "warzone", "pubg", "overwatch", "league", "lol", "dota", "csgo", "cs2",
  "tiktok", "shorts", "reels", "twitch", "streaming", "gameplay", "gaming",
  "tutorial", "guide", "tips", "tricks", "review", "reaction", "vlog",
  "podcast", "asmr", "mukbang", "unboxing", "haul", "diy", "craft",
]);

/**
 * Extract hashtags from text (these are high-value context keywords).
 */
function extractHashtags(text: string): string[] {
  if (!text) {return [];}
  const matches = text.match(/#[\w]+/g) || [];
  return matches
    .map((h) => h.slice(1).toLowerCase()) // Remove # prefix
    .filter((h) => h.length >= 2 && h.length <= 30);
}

/**
 * Clean title by removing hashtags and emojis, keeping the core phrase.
 */
function cleanTitle(title: string): string {
  return title
    .replaceAll(/#[\w]+/g, "") // Remove hashtags
    .replaceAll(/[\u{1F300}-\u{1F9FF}]/gu, "") // Remove emojis
    .replaceAll(/[^\w\s'-]/g, " ") // Remove special chars except apostrophes/hyphens
    .replaceAll(/\s+/g, " ")
    .trim()
    .toLowerCase();
}



/**
 * Extract keywords from video tags, preserving multi-word tags.
 */
function extractTagKeywords(tags: string[]): { phrases: string[]; words: string[] } {
  if (!tags || !Array.isArray(tags)) {return { phrases: [], words: [] };}

  const phrases: string[] = [];
  const words: string[] = [];

  for (const tag of tags) {
    const normalized = tag.toLowerCase().trim();
    if (normalized.length < 2 || normalized.length > 50) {continue;}

    // Multi-word tags are valuable phrases
    if (normalized.includes(" ") && normalized.length >= 5) {
      phrases.push(normalized);
    }

    // Also extract individual words
    const tagWords = extractKeywords(normalized);
    words.push(...tagWords);
  }

  return {
    phrases: [...new Set(phrases)],
    words: [...new Set(words)],
  };
}

/**
 * Identify platform/context keywords from all sources.
 * These keywords provide crucial context (e.g., "roblox" tells us it's a game).
 */
function identifyContextKeywords(
  hashtags: string[],
  tagWords: string[],
  titleWords: string[],
  categoryName?: string
): string[] {
  const context: string[] = [];

  // Check hashtags first (most explicit signal)
  for (const h of hashtags) {
    if (PLATFORM_KEYWORDS.has(h)) {
      context.push(h);
    }
  }

  // Check tags
  for (const w of tagWords) {
    if (PLATFORM_KEYWORDS.has(w) && !context.includes(w)) {
      context.push(w);
    }
  }

  // Check title words
  for (const w of titleWords) {
    if (PLATFORM_KEYWORDS.has(w) && !context.includes(w)) {
      context.push(w);
    }
  }

  // Add category as context if it's informative
  if (categoryName) {
    const catLower = categoryName.toLowerCase();
    if (catLower === "gaming" && !context.some(c => PLATFORM_KEYWORDS.has(c))) {
      context.push("gaming");
    }
  }

  return context.slice(0, 3); // Max 3 context keywords
}

type QueryGenContext = {
  cleanedTitle: string;
  contextKeywords: string[];
  tagPhrases: string[];
  contentWords: string[];
  categoryName?: string;
  primaryContext: string | undefined;
  hasContext: boolean;
};

function addContextTitleQueries(ctx: QueryGenContext, queries: string[]): void {
  if (ctx.hasContext && ctx.cleanedTitle.length >= 3 && ctx.cleanedTitle.length <= 50) {
    queries.push(`${ctx.primaryContext} ${ctx.cleanedTitle}`);
  }

  const titleWordCount = ctx.cleanedTitle.split(/\s+/).filter(w => w.length >= 2).length;
  if (titleWordCount >= 3 && ctx.cleanedTitle.length <= 40) {
    queries.push(ctx.cleanedTitle);
  }
}

function addTagPhraseQueries(ctx: QueryGenContext, queries: string[]): void {
  for (const phrase of ctx.tagPhrases.slice(0, 3)) {
    if (ctx.hasContext) { queries.push(`${ctx.primaryContext} ${phrase}`); }
    queries.push(phrase);
  }
}

function addContentWordQueries(ctx: QueryGenContext, queries: string[]): void {
  if (ctx.hasContext && ctx.contentWords.length >= 2) {
    queries.push(`${ctx.primaryContext} ${ctx.contentWords.slice(0, 3).join(" ")}`);
  }
  if (ctx.hasContext) {
    for (const word of ctx.contentWords.slice(0, 4)) {
      if (word.length >= 4) { queries.push(`${ctx.primaryContext} ${word}`); }
    }
  }
}

function addMultiContextQueries(ctx: QueryGenContext, queries: string[]): void {
  if (ctx.contextKeywords.length >= 2) {
    queries.push(ctx.contextKeywords.slice(0, 2).join(" "));
    if (ctx.contentWords.length > 0) {
      queries.push(`${ctx.contextKeywords.slice(0, 2).join(" ")} ${ctx.contentWords[0]}`);
    }
  }
}

function addCategoryFallbackQueries(ctx: QueryGenContext, queries: string[]): void {
  if (!ctx.categoryName || ctx.hasContext) {return;}
  const catLower = ctx.categoryName.toLowerCase();
  if (ctx.contentWords.length >= 2) {
    queries.push(`${catLower} ${ctx.contentWords.slice(0, 2).join(" ")}`);
  }
  queries.push(catLower);
}

function addSingleContextFallbackQueries(ctx: QueryGenContext, queries: string[]): void {
  for (const kw of ctx.contextKeywords) {
    if (!queries.includes(kw)) { queries.push(kw); }
  }
}

/**
 * Generate search queries from video metadata.
 */
function generateQueryTerms(
  cleanedTitle: string,
  contextKeywords: string[],
  tagPhrases: string[],
  titleWords: string[],
  categoryName?: string
): string[] {
  const contentWords = titleWords.filter(w => !STOPWORDS.has(w) && w.length >= 3);
  const ctx: QueryGenContext = {
    cleanedTitle,
    contextKeywords,
    tagPhrases,
    contentWords,
    categoryName,
    primaryContext: contextKeywords[0],
    hasContext: contextKeywords.length > 0,
  };

  const queries: string[] = [];
  addContextTitleQueries(ctx, queries);
  addTagPhraseQueries(ctx, queries);
  addContentWordQueries(ctx, queries);
  addMultiContextQueries(ctx, queries);
  addCategoryFallbackQueries(ctx, queries);
  addSingleContextFallbackQueries(ctx, queries);

  return [...new Set(queries)]
    .filter(q => q.length >= 3 && q.length <= 60)
    .slice(0, 15);
}

/**
 * Determine suggested content type from video duration.
 */
function suggestContentType(durationSec?: number): ContentTypeFilter {
  if (durationSec === undefined) {return "both";}
  return durationSec < 60 ? "shorts" : "long";
}

/**
 * Infer niche from video metadata.
 */
function inferNicheFromVideo(video: VideoDetails): InferredNiche {
  // Extract hashtags from title and description (high-value context)
  const titleHashtags = extractHashtags(video.title);
  const descHashtags = extractHashtags(video.description.slice(0, 500));
  const allHashtags = [...new Set([...titleHashtags, ...descHashtags])];

  // Clean the title (remove hashtags, emojis, special chars)
  const cleanedTitle = cleanTitle(video.title);
  const titleWords = extractKeywords(cleanedTitle);

  // Extract tag keywords (both phrases and individual words)
  const { phrases: tagPhrases, words: tagWords } = extractTagKeywords(video.tags);

  // Identify platform/context keywords (e.g., "roblox", "minecraft", "gaming")
  const categoryName = video.category
    ? YOUTUBE_CATEGORIES[video.category]
    : undefined;
  const contextKeywords = identifyContextKeywords(
    allHashtags,
    tagWords,
    titleWords,
    categoryName
  );

  // Generate search queries using the improved strategy
  const queryTerms = generateQueryTerms(
    cleanedTitle,
    contextKeywords,
    tagPhrases,
    titleWords,
    categoryName
  );

  // Create niche description: context + title phrase
  let nicheDescription: string;
  if (contextKeywords.length > 0 && cleanedTitle) {
    nicheDescription = `${contextKeywords[0]} ${cleanedTitle}`.slice(0, 50);
  } else if (cleanedTitle) {
    nicheDescription = cleanedTitle.slice(0, 50);
  } else {
    nicheDescription = video.channelTitle;
  }

  console.log(`[NicheInference] Extracted from video:`);
  console.log(`  - Clean title: "${cleanedTitle}"`);
  console.log(`  - Hashtags: [${allHashtags.join(", ")}]`);
  console.log(`  - Context keywords: [${contextKeywords.join(", ")}]`);
  console.log(`  - Tag phrases: [${tagPhrases.slice(0, 5).join(", ")}]`);

  return {
    niche: nicheDescription,
    queryTerms,
    categoryHints: {
      categoryId: video.category,
      categoryName,
      suggestedContentType: suggestContentType(video.durationSec),
    },
    source: "video",
    referenceVideo: {
      videoId: video.videoId,
      title: video.title,
      channelTitle: video.channelTitle,
      description: video.description.slice(0, 500),
      tags: video.tags?.slice(0, 20),
    },
    inferredAt: new Date().toISOString(),
  };
}

/**
 * Combine text-based and video-based niche inference.
 * User text is weighted higher than video-derived text.
 */
function combineNicheInferences(
  textNiche: InferredNiche,
  videoNiche: InferredNiche
): InferredNiche {
  // User text takes priority for the niche description
  const niche = textNiche.niche || videoNiche.niche;

  // Combine query terms: user text queries first, then video queries
  const textQueries = new Set(textNiche.queryTerms);
  const videoQueries = videoNiche.queryTerms.filter((q) => !textQueries.has(q));
  const queryTerms = [...textNiche.queryTerms, ...videoQueries].slice(0, 15);

  return {
    niche,
    queryTerms,
    categoryHints: videoNiche.categoryHints,
    source: "combined",
    referenceVideo: videoNiche.referenceVideo,
    inferredAt: new Date().toISOString(),
  };
}

/**
 * Main niche inference function.
 *
 * @param input - Niche text and/or reference video URL
 * @param ga - Google account for YouTube API calls (required if video URL provided)
 * @returns Inferred niche data
 * @throws Error if video URL is invalid or video fetch fails
 */
export async function inferNiche(
  input: NicheInferenceInput,
  ga?: GoogleAccount
): Promise<InferredNiche> {
  const { nicheText, referenceVideoUrl } = input;

  // Log truncated input for debugging (not full text/URL for privacy)
  const textPreview = nicheText ? `"${nicheText.slice(0, 30)}..."` : "none";
  const urlPreview = referenceVideoUrl ? "[video URL provided]" : "none";
  console.log(`[NicheInference] Text: ${textPreview}, URL: ${urlPreview}`);

  // Case 1: No input provided
  if (!nicheText && !referenceVideoUrl) {
    throw new Error(
      "At least one of nicheText or referenceVideoUrl is required"
    );
  }

  // Case 2: Text only
  if (nicheText && !referenceVideoUrl) {
    return inferNicheFromText(nicheText);
  }

  // Case 3: Video URL provided (with or without text)
  if (referenceVideoUrl) {
    const videoId = parseYouTubeVideoId(referenceVideoUrl);
    if (!videoId) {
      throw new Error(
        "Invalid YouTube URL. Please provide a valid youtube.com or youtu.be URL."
      );
    }

    if (!ga) {
      throw new Error(
        "Google account required for video-based niche inference"
      );
    }

    // Fetch video metadata
    const video = await fetchVideoDetails(ga, videoId);
    if (!video) {
      throw new Error(
        "Could not fetch video details. The video may be private or deleted."
      );
    }

    const videoNiche = inferNicheFromVideo(video);

    // If text was also provided, combine them
    if (nicheText) {
      const textNiche = inferNicheFromText(nicheText);
      return combineNicheInferences(textNiche, videoNiche);
    }

    return videoNiche;
  }

  // Fallback (should not reach here)
  return inferNicheFromText(nicheText || "");
}

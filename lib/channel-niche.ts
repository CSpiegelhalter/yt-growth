/**
 * Channel Niche Cache
 *
 * Generates and caches a channel's niche based on their last 15 videos.
 * Uses a hash of video titles to detect when niche needs regeneration.
 *
 * The niche is used by:
 * - Competitor discovery page (to find similar channels)
 * - Idea generation (to understand content context)
 */

import crypto from "crypto";
import { prisma } from "@/prisma";
import { generateNicheQueries } from "@/lib/llm";

// Number of recent videos to analyze for niche detection
const NICHE_VIDEO_COUNT = 15;

// Cache duration: 7 days (but will regenerate early if video titles change)
const NICHE_CACHE_DAYS = 7;

// In-flight niche generation promises (for deduplication)
// This prevents duplicate LLM calls if dashboard and competitors page both request niche simultaneously
const inFlightGenerations = new Map<number, Promise<ChannelNicheData | null>>();

// Clean up old entries after 5 minutes (in case of errors/hangs)
const IN_FLIGHT_TIMEOUT_MS = 5 * 60 * 1000;

// YouTube Video Category ID to Name mapping
const YOUTUBE_CATEGORIES: Record<string, string> = {
  "1": "Film & Animation",
  "2": "Autos & Vehicles",
  "10": "Music",
  "15": "Pets & Animals",
  "17": "Sports",
  "19": "Travel & Events",
  "20": "Gaming",
  "22": "People & Blogs",
  "23": "Comedy",
  "24": "Entertainment",
  "25": "News & Politics",
  "26": "Howto & Style",
  "27": "Education",
  "28": "Science & Technology",
  "29": "Nonprofits & Activism",
};

// Generic tags that don't indicate actual niche
const GENERIC_TAG_BLOCKLIST = new Set([
  "gaming",
  "game",
  "games",
  "video game",
  "video games",
  "gameplay",
  "playthrough",
  "lets play",
  "let's play",
  "walkthrough",
  "funny moments",
  "best moments",
  "highlights",
  "gamer",
  "pc gaming",
  "console gaming",
  "xbox",
  "playstation",
  "ps4",
  "ps5",
  "nintendo",
  "minecraft",
  "fortnite",
  "roblox",
  "gta",
  "gta 5",
  "youtube",
  "youtuber",
  "vlog",
  "vlogs",
  "video",
  "videos",
  "subscribe",
  "viral",
  "trending",
  "new",
  "funny",
  "comedy",
  "entertainment",
  "how to",
  "tutorial",
  "tips",
  "tricks",
  "guide",
  "review",
  "reaction",
]);

// Stop words for title keyword extraction
const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "shall",
  "can",
  "this",
  "that",
  "these",
  "those",
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "my",
  "your",
  "his",
  "her",
  "its",
  "our",
  "their",
  "what",
  "which",
  "who",
  "whom",
  "when",
  "where",
  "why",
  "how",
  "all",
  "each",
  "every",
  "both",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "nor",
  "not",
  "only",
  "own",
  "same",
  "so",
  "than",
  "too",
  "very",
  "just",
  "also",
  "now",
  "here",
  "there",
  "about",
  "into",
  "over",
  "after",
  "before",
  "between",
  "under",
  "again",
  "out",
  "new",
  "first",
  "part",
  "episode",
  "ep",
  "official",
  "full",
  "hd",
  "4k",
]);

export type ChannelNicheData = {
  niche: string;
  queries: string[];
  videoTitlesHash: string;
  generatedAt: Date;
  cachedUntil: Date;
};

/**
 * Compute a stable hash from video titles for change detection
 */
export function computeVideoTitlesHash(titles: string[]): string {
  // Sort and normalize titles for consistent hashing
  const normalized = titles
    .map((t) => t.toLowerCase().trim())
    .sort()
    .join("|");

  return crypto.createHash("md5").update(normalized).digest("hex");
}

/**
 * Extract meaningful keywords from video titles
 */
function extractTitleKeywords(titles: string[]): string[] {
  const phraseCounts = new Map<string, number>();
  const wordCounts = new Map<string, number>();

  for (const title of titles) {
    // Extract capitalized phrases (likely game/topic names)
    const capitalizedPhrases =
      title.match(/\b[A-Z][a-z]+(?:\s+(?:of|the|and|&)?\s*[A-Z][a-z]+)+\b/g) ||
      [];
    for (const phrase of capitalizedPhrases) {
      const cleaned = phrase.toLowerCase();
      if (cleaned.length > 4 && !STOP_WORDS.has(cleaned)) {
        phraseCounts.set(cleaned, (phraseCounts.get(cleaned) ?? 0) + 1);
      }
    }

    // Extract individual words
    const words = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));

    const uniqueWords = [...new Set(words)];
    for (const word of uniqueWords) {
      wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
    }
  }

  // Only include items that appear in at least 20% of titles
  const minCount = Math.max(2, Math.ceil(titles.length * 0.2));

  const validPhrases = [...phraseCounts.entries()]
    .filter(([, count]) => count >= minCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([phrase]) => phrase);

  const validWords = [...wordCounts.entries()]
    .filter(([word, count]) => {
      if (count < minCount) return false;
      return !validPhrases.some((phrase) => phrase.includes(word));
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  return [...validPhrases, ...validWords].slice(0, 8);
}

/**
 * Get the cached niche for a channel, or null if not cached/expired
 */
export async function getChannelNiche(
  channelId: number
): Promise<ChannelNicheData | null> {
  const cached = await prisma.channelNiche.findUnique({
    where: { channelId },
  });

  if (!cached) return null;

  // Check if cache is still valid
  if (cached.cachedUntil < new Date()) {
    return null;
  }

  return {
    niche: cached.niche,
    queries: cached.queriesJson as string[],
    videoTitlesHash: cached.videoTitlesHash,
    generatedAt: cached.generatedAt,
    cachedUntil: cached.cachedUntil,
  };
}

/**
 * Check if the niche should be regenerated based on video title changes
 * Returns true if the hash of current video titles differs from the cached hash
 */
export async function shouldRegenerateNiche(
  channelId: number
): Promise<boolean> {
  // Get current video titles (last 15)
  const videos = await prisma.video.findMany({
    where: { channelId },
    orderBy: { publishedAt: "desc" },
    take: NICHE_VIDEO_COUNT,
    select: { title: true },
  });

  const currentTitles = videos
    .map((v) => v.title ?? "")
    .filter((t) => t.length > 0);

  if (currentTitles.length === 0) {
    return false; // No videos, can't regenerate
  }

  const currentHash = computeVideoTitlesHash(currentTitles);

  // Get cached niche
  const cached = await prisma.channelNiche.findUnique({
    where: { channelId },
    select: { videoTitlesHash: true },
  });

  if (!cached) {
    return true; // No cache, need to generate
  }

  // Compare hashes
  return cached.videoTitlesHash !== currentHash;
}

/**
 * Generate and store the niche for a channel based on their last 15 videos
 */
export async function generateAndStoreNiche(
  channelId: number
): Promise<ChannelNicheData | null> {
  // Get channel with last 15 videos
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: {
      Video: {
        orderBy: { publishedAt: "desc" },
        take: NICHE_VIDEO_COUNT,
        select: {
          title: true,
          tags: true,
          categoryId: true,
        },
      },
    },
  });

  if (!channel || channel.Video.length === 0) {
    console.log(
      `[ChannelNiche] Channel ${channelId} has no videos, skipping niche generation`
    );
    return null;
  }

  const videoTitles = channel.Video.map((v) => v.title ?? "").filter(Boolean);

  if (videoTitles.length < 3) {
    console.log(
      `[ChannelNiche] Channel ${channelId} has fewer than 3 videos, skipping niche generation`
    );
    return null;
  }

  // Compute hash of current video titles
  const videoTitlesHash = computeVideoTitlesHash(videoTitles);

  // Extract keywords from titles
  const titleKeywords = extractTitleKeywords(videoTitles);

  // Count tag frequency
  const tagCounts = new Map<string, number>();
  channel.Video.forEach((v) => {
    if (v.tags) {
      v.tags.split(",").forEach((t) => {
        const cleaned = t.trim().toLowerCase();
        if (cleaned.length > 2 && !GENERIC_TAG_BLOCKLIST.has(cleaned)) {
          tagCounts.set(cleaned, (tagCounts.get(cleaned) ?? 0) + 1);
        }
      });
    }
  });

  // Only include tags that appear on at least 30% of videos
  const videoCount = channel.Video.length;
  const minTagFrequency = Math.max(2, Math.ceil(videoCount * 0.3));

  const validatedTags = [...tagCounts.entries()]
    .filter(([, count]) => count >= minTagFrequency)
    .map(([tag, count]) => {
      const titleMatch = titleKeywords.some(
        (kw) => tag.includes(kw) || kw.includes(tag)
      );
      return { tag, score: count + (titleMatch ? 10 : 0) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ tag }) => tag);

  // Combine validated tags with title keywords
  const topTags = [
    ...new Set([...validatedTags, ...titleKeywords.slice(0, 5)]),
  ].slice(0, 15);

  // Get primary category
  const categoryCounts = new Map<string, number>();
  channel.Video.forEach((v) => {
    if (v.categoryId) {
      categoryCounts.set(
        v.categoryId,
        (categoryCounts.get(v.categoryId) ?? 0) + 1
      );
    }
  });
  const primaryCategoryId =
    [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const categoryName = primaryCategoryId
    ? YOUTUBE_CATEGORIES[primaryCategoryId]
    : null;

  console.log(
    `[ChannelNiche] Generating niche for channel ${channelId} - Category: ${categoryName}, Keywords: ${titleKeywords
      .slice(0, 5)
      .join(", ")}`
  );

  // Generate niche via LLM
  const nicheData = await generateNicheQueries({
    videoTitles,
    topTags,
    categoryName,
  });

  const cachedUntil = new Date(
    Date.now() + NICHE_CACHE_DAYS * 24 * 60 * 60 * 1000
  );

  // Store in database
  await prisma.channelNiche.upsert({
    where: { channelId },
    create: {
      channelId,
      niche: nicheData.niche,
      queriesJson: nicheData.queries,
      videoTitlesHash,
      generatedAt: new Date(),
      cachedUntil,
    },
    update: {
      niche: nicheData.niche,
      queriesJson: nicheData.queries,
      videoTitlesHash,
      generatedAt: new Date(),
      cachedUntil,
    },
  });

  console.log(
    `[ChannelNiche] Stored niche for channel ${channelId}: "${nicheData.niche}"`
  );

  return {
    niche: nicheData.niche,
    queries: nicheData.queries,
    videoTitlesHash,
    generatedAt: new Date(),
    cachedUntil,
  };
}

/**
 * Get or generate the niche for a channel
 * Uses cached niche if available and hash matches, otherwise regenerates
 *
 * DEDUPLICATION: If generation is already in progress for this channel,
 * returns the existing promise instead of starting a new LLM call.
 * This prevents duplicate calls when dashboard and competitors page both request niche.
 */
export async function getOrGenerateNiche(
  channelId: number
): Promise<ChannelNicheData | null> {
  // Check if we have a valid cached niche
  const cached = await getChannelNiche(channelId);

  if (cached) {
    // Check if video titles have changed
    const needsRegeneration = await shouldRegenerateNiche(channelId);

    if (!needsRegeneration) {
      console.log(`[ChannelNiche] Using cached niche for channel ${channelId}`);
      return cached;
    }

    console.log(
      `[ChannelNiche] Video titles changed for channel ${channelId}, regenerating niche`
    );
  }

  // Check if generation is already in progress (deduplication)
  const inFlight = inFlightGenerations.get(channelId);
  if (inFlight) {
    console.log(
      `[ChannelNiche] Generation already in progress for channel ${channelId}, waiting...`
    );
    return inFlight;
  }

  // Start new generation and track the promise
  const generationPromise = generateAndStoreNiche(channelId);

  // Store in map for deduplication
  inFlightGenerations.set(channelId, generationPromise);

  // Clean up after completion (success or failure)
  generationPromise
    .finally(() => {
      inFlightGenerations.delete(channelId);
    })
    .catch(() => {
      // Error already logged in generateAndStoreNiche
    });

  // Also set a timeout to clean up in case of hangs
  setTimeout(() => {
    if (inFlightGenerations.get(channelId) === generationPromise) {
      inFlightGenerations.delete(channelId);
    }
  }, IN_FLIGHT_TIMEOUT_MS);

  return generationPromise;
}

/**
 * Trigger niche generation in the background (non-blocking)
 * Called by dashboard to pre-warm the niche cache.
 *
 * Returns immediately with status info - does not wait for generation to complete.
 * If generation is already in progress or cache is valid, returns quickly.
 */
export async function triggerNicheGenerationInBackground(
  channelId: number
): Promise<{
  status: "cached" | "generating" | "already_in_progress" | "no_videos";
}> {
  // Check if we already have a valid cached niche
  const cached = await getChannelNiche(channelId);

  if (cached) {
    const needsRegeneration = await shouldRegenerateNiche(channelId);
    if (!needsRegeneration) {
      return { status: "cached" };
    }
  }

  // Check if generation is already in progress
  if (inFlightGenerations.has(channelId)) {
    return { status: "already_in_progress" };
  }

  // Check if channel has videos
  const videoCount = await prisma.video.count({
    where: { channelId },
  });

  if (videoCount < 3) {
    return { status: "no_videos" };
  }

  // Start generation in background (fire and forget)
  // Use getOrGenerateNiche to get deduplication benefits
  getOrGenerateNiche(channelId).catch((err) => {
    console.error(
      `[ChannelNiche] Background generation failed for channel ${channelId}:`,
      err
    );
  });

  return { status: "generating" };
}

/**
 * Refresh niche for all channels that have outdated video title hashes
 * Called by daily cron job
 */
export async function refreshStaleNiches(): Promise<{
  checked: number;
  regenerated: number;
}> {
  // Get all channels with cached niches
  const channelsWithNiche = await prisma.channelNiche.findMany({
    select: { channelId: true },
  });

  let checked = 0;
  let regenerated = 0;

  for (const { channelId } of channelsWithNiche) {
    checked++;

    const needsRegeneration = await shouldRegenerateNiche(channelId);

    if (needsRegeneration) {
      try {
        await generateAndStoreNiche(channelId);
        regenerated++;
      } catch (err) {
        console.error(
          `[ChannelNiche] Failed to regenerate niche for channel ${channelId}:`,
          err
        );
      }
    }
  }

  console.log(
    `[ChannelNiche] Refresh complete: checked ${checked}, regenerated ${regenerated}`
  );

  return { checked, regenerated };
}

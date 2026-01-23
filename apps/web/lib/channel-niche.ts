/**
 * Channel Niche Cache
 *
 * Generates and caches a channel's niche based on their last 15 videos.
 * Uses a hash of video titles to detect when niche needs regeneration.
 *
 * PRIORITY ORDER FOR NICHE DETECTION:
 * 1. User's Channel Profile (what they WANT to create) - highest priority
 * 2. Video-based inference (what they HAVE created) - fallback
 *
 * The niche is used by:
 * - Competitor discovery page (to find similar channels)
 * - Idea generation (to understand content context)
 */

import crypto from "crypto";
import { prisma } from "@/prisma";
import { generateNicheQueries, ChannelProfileContext } from "@/lib/llm";
import {
  ChannelProfileAI,
  ChannelProfileInput,
} from "@/lib/channel-profile/types";

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

// NOTE: We no longer filter tags or title keywords.
// The LLM should receive ALL raw titles and tags because even "small" tokens
// (AI, Go, F1, S3, HR, 2.0, etc.) provide critical niche context.

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

// extractTitleKeywords has been removed - the LLM receives raw titles now.

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
 * When a channel profile exists, it's used as additional context for niche generation
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

  // Collect ALL tags from videos (no filtering - let the LLM see everything)
  const allTags: string[] = [];
  channel.Video.forEach((v) => {
    if (v.tags) {
      v.tags.split(",").forEach((t) => {
        const cleaned = t.trim();
        if (cleaned.length > 0) {
          allTags.push(cleaned);
        }
      });
    }
  });

  // Dedupe tags but preserve all of them (no blocklist filtering)
  const topTags = [...new Set(allTags)];

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

  // Extract channel profile context if available
  // Note: ChannelProfile may not exist if migration hasn't been run
  // We use raw query to handle the case where the model doesn't exist in Prisma yet
  let channelProfile: ChannelProfileContext | undefined;
  try {
    const profiles = await prisma.$queryRaw<{ aiProfileJson: string | null }[]>`
      SELECT "aiProfileJson" FROM "ChannelProfile" WHERE "channelId" = ${channelId} LIMIT 1
    `;
    const profile = profiles[0];
    if (profile?.aiProfileJson) {
      const aiProfile = JSON.parse(profile.aiProfileJson) as ChannelProfileAI;
      channelProfile = {
        nicheLabel: aiProfile.nicheLabel,
        nicheDescription: aiProfile.nicheDescription,
        primaryCategories: aiProfile.primaryCategories,
        keywords: aiProfile.keywords,
        competitorSearchHints: aiProfile.competitorSearchHints,
        targetAudience: aiProfile.targetAudience,
      };
      console.log(
        `[ChannelNiche] Using channel profile as context for channel ${channelId}: "${aiProfile.nicheLabel}"`
      );
    }
  } catch {
    // ChannelProfile table may not exist if migration hasn't been run
    // This is expected and fine - we just won't use profile context
  }

  console.log(
    `[ChannelNiche] Generating niche for channel ${channelId} - Category: ${categoryName}, Videos: ${
      videoTitles.length
    }, Tags: ${topTags.length}, HasProfile: ${!!channelProfile}`
  );

  // Generate niche via LLM (2-step flow: persona generation → query generation)
  // When channelProfile exists, it's used as the anchor/ground truth
  const nicheData = await generateNicheQueries({
    channelId,
    videoTitles,
    topTags,
    categoryName,
    channelProfile,
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
 * Get niche data directly from channel profile if available.
 * This is the HIGHEST PRIORITY source - represents what the user WANTS to create.
 *
 * Returns null if no profile exists or no AI profile has been generated.
 */
async function getNicheFromProfile(
  channelId: number
): Promise<ChannelNicheData | null> {
  try {
    // Get profile with both raw input and AI-generated data
    const profiles = await prisma.$queryRaw<
      {
        inputJson: string;
        aiProfileJson: string | null;
        updatedAt: Date;
      }[]
    >`
      SELECT "inputJson", "aiProfileJson", "updatedAt" 
      FROM "ChannelProfile" 
      WHERE "channelId" = ${channelId} 
      LIMIT 1
    `;

    const profile = profiles[0];
    if (!profile) return null;

    // If we have an AI profile, use its competitorSearchHints directly
    if (profile.aiProfileJson) {
      try {
        const aiProfile = JSON.parse(profile.aiProfileJson) as ChannelProfileAI;

        // AI profile should have competitorSearchHints (8-15 hints)
        if (
          aiProfile.competitorSearchHints &&
          aiProfile.competitorSearchHints.length > 0
        ) {
          console.log(
            `[ChannelNiche] Using AI profile hints for channel ${channelId}: "${aiProfile.nicheLabel}" (${aiProfile.competitorSearchHints.length} queries)`
          );

          return {
            niche: aiProfile.nicheLabel,
            queries: aiProfile.competitorSearchHints,
            videoTitlesHash: "profile-based", // Not hash-based for profile data
            generatedAt: profile.updatedAt,
            cachedUntil: new Date(
              Date.now() + NICHE_CACHE_DAYS * 24 * 60 * 60 * 1000
            ),
          };
        }
      } catch {
        console.warn(
          `[ChannelNiche] Failed to parse AI profile for channel ${channelId}`
        );
      }
    }

    // Fallback: Generate queries from raw user input if no AI profile yet
    // This ensures we still use profile data even before AI generation
    try {
      const rawInput = JSON.parse(profile.inputJson) as ChannelProfileInput;

      // Build queries from user's categories and custom category
      const queries: string[] = [];

      // Add categories as search terms
      rawInput.categories.forEach((cat) => {
        if (cat !== "Other") {
          queries.push(cat.toLowerCase());
        }
      });

      // Add custom category if specified
      if (rawInput.customCategory) {
        queries.push(rawInput.customCategory.toLowerCase());
      }

      // If we have at least some queries from user input, use them
      if (queries.length > 0) {
        const niche =
          rawInput.customCategory ||
          rawInput.categories.filter((c) => c !== "Other").join(" & ") ||
          "Content Creator";

        console.log(
          `[ChannelNiche] Using raw profile categories for channel ${channelId}: "${niche}" (${queries.length} queries)`
        );

        return {
          niche,
          queries,
          videoTitlesHash: "profile-raw",
          generatedAt: profile.updatedAt,
          cachedUntil: new Date(
            Date.now() + NICHE_CACHE_DAYS * 24 * 60 * 60 * 1000
          ),
        };
      }
    } catch {
      console.warn(
        `[ChannelNiche] Failed to parse raw profile input for channel ${channelId}`
      );
    }

    return null;
  } catch {
    // Table doesn't exist or query failed - no profile available
    return null;
  }
}

/**
 * Get or generate the niche for a channel
 *
 * PRIORITY ORDER:
 * 1. Channel Profile (AI-generated hints) - HIGHEST PRIORITY
 * 2. Channel Profile (raw user categories) - if no AI profile yet
 * 3. Video-based inference (cached) - traditional fallback
 * 4. Video-based inference (regenerate) - if cache stale
 *
 * DEDUPLICATION: If generation is already in progress for this channel,
 * returns the existing promise instead of starting a new LLM call.
 */
export async function getOrGenerateNiche(
  channelId: number
): Promise<ChannelNicheData | null> {
  // PRIORITY 1 & 2: Check channel profile first (user's stated intent)
  const profileNiche = await getNicheFromProfile(channelId);
  if (profileNiche) {
    console.log(
      `[ChannelNiche] Using profile-based niche for channel ${channelId} (${profileNiche.queries.length} queries)`
    );
    return profileNiche;
  }

  // PRIORITY 3: Check if we have a valid cached video-based niche
  const cached = await getChannelNiche(channelId);

  if (cached) {
    // Check if video titles have changed
    const needsRegeneration = await shouldRegenerateNiche(channelId);

    if (!needsRegeneration) {
      console.log(
        `[ChannelNiche] Using cached video-based niche for channel ${channelId}`
      );
      return cached;
    }

    console.log(
      `[ChannelNiche] Video titles changed for channel ${channelId}, regenerating niche`
    );
  }

  // PRIORITY 4: Generate from videos (fallback when no profile)
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

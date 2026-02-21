/**
 * DataForSEO Response Cache
 *
 * Caches DataForSEO API responses to avoid repeated charges.
 * Uses database-backed storage with TTL expiration.
 *
 * For Standard task-based workflow:
 * - Stores pending task records when task is submitted but not yet complete
 * - Converts pending records to completed records when results arrive
 * - Allows polling endpoints to check if task is already in progress
 */

import "server-only";
import { prisma } from "@/prisma";
import { generateRequestHash } from "./utils";
import {
  type KeywordOverviewResponse,
  type KeywordRelatedResponse,
  type KeywordCombinedResponse,
  type GoogleTrendsResponse,
} from "./client";
import { type YouTubeSerpResponse } from "./youtube-serp";

// ============================================
// CONFIGURATION
// ============================================

const CACHE_TTL_DAYS = 7;
const PENDING_TTL_MS = 60 * 60 * 1000;
const PROVIDER = "dataforseo";

// ============================================
// TYPES
// ============================================

type CacheMode = string;

const YOUTUBE_SERP_TTL_DAYS = 1;

type PendingCacheEntry = {
  pending: true;
  taskId: string;
  submittedAt: string;
};

type VideoIdeasCacheResponse = {
  ideas: Array<{
    id: string;
    title: string;
    hook: string;
    format: "shorts" | "longform";
    targetKeyword: string;
    whyItWins: string;
    outline: string[];
    seoNotes: {
      primaryKeyword: string;
      supportingKeywords: string[];
    };
  }>;
  keywords: Array<{
    keyword: string;
    searchVolume: number;
    competitionIndex: number;
    cpc: number;
    trend: number[];
    difficultyEstimate: number;
    intent: string | null;
  }>;
  seedKeywords: string[];
  meta: {
    topicDescription: string;
    location: string;
    generatedAt: string;
    cached?: boolean;
  };
};

// ============================================
// CACHE OPERATIONS
// ============================================

export async function getCachedResponse<T extends KeywordOverviewResponse | KeywordRelatedResponse | KeywordCombinedResponse | GoogleTrendsResponse | YouTubeSerpResponse>(
  mode: CacheMode,
  phrase: string,
  location: string
): Promise<{ data: T; cached: true } | null> {
  const requestHash = generateRequestHash({ mode, phrase, location });
  const now = new Date();

  const entry = await prisma.keywordCache.findFirst({
    where: {
      provider: PROVIDER,
      mode,
      requestHash,
      expiresAt: { gt: now },
    },
  });

  if (!entry) {
    return null;
  }

  const responseData = entry.responseJson as Record<string, unknown>;
  if (responseData?.pending === true) {
    return null;
  }

  return {
    data: responseData as T,
    cached: true,
  };
}

export async function setCachedResponse(
  mode: CacheMode,
  phrase: string,
  location: string,
  response: KeywordOverviewResponse | KeywordRelatedResponse | KeywordCombinedResponse | GoogleTrendsResponse | YouTubeSerpResponse
): Promise<void> {
  const requestHash = generateRequestHash({ mode, phrase, location });
  const now = new Date();
  const ttlDays = mode === "youtube_serp" ? YOUTUBE_SERP_TTL_DAYS : CACHE_TTL_DAYS;
  const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);

  await prisma.keywordCache.upsert({
    where: {
      provider_mode_requestHash: {
        provider: PROVIDER,
        mode,
        requestHash,
      },
    },
    create: {
      provider: PROVIDER,
      mode,
      phrase: phrase.toLowerCase().trim(),
      database: location.toLowerCase(),
      requestHash,
      responseJson: { ...response, pending: false },
      fetchedAt: now,
      expiresAt,
    },
    update: {
      responseJson: { ...response, pending: false },
      fetchedAt: now,
      expiresAt,
    },
  });
}

export async function setPendingTask(
  mode: CacheMode,
  phrase: string,
  location: string,
  taskId: string
): Promise<void> {
  const requestHash = generateRequestHash({ mode, phrase, location });
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PENDING_TTL_MS);

  const pendingEntry: PendingCacheEntry = {
    pending: true,
    taskId,
    submittedAt: now.toISOString(),
  };

  await prisma.keywordCache.upsert({
    where: {
      provider_mode_requestHash: {
        provider: PROVIDER,
        mode,
        requestHash,
      },
    },
    create: {
      provider: PROVIDER,
      mode,
      phrase: phrase.toLowerCase().trim(),
      database: location.toLowerCase(),
      requestHash,
      responseJson: pendingEntry,
      fetchedAt: now,
      expiresAt,
    },
    update: {
      responseJson: pendingEntry,
      fetchedAt: now,
      expiresAt,
    },
  });
}

export async function getPendingTask(
  taskId: string
): Promise<{
  mode: CacheMode;
  phrase: string;
  location: string;
  requestHash: string;
} | null> {
  const now = new Date();

  const entry = await prisma.keywordCache.findFirst({
    where: {
      provider: PROVIDER,
      expiresAt: { gt: now },
      responseJson: {
        path: ["taskId"],
        equals: taskId,
      },
    },
  });

  if (!entry) {
    return null;
  }

  const responseData = entry.responseJson as Record<string, unknown>;
  if (responseData?.pending !== true) {
    return null;
  }

  return {
    mode: entry.mode as CacheMode,
    phrase: entry.phrase,
    location: entry.database,
    requestHash: entry.requestHash,
  };
}

export async function completePendingTask(
  taskId: string,
  response: KeywordOverviewResponse | KeywordRelatedResponse | KeywordCombinedResponse | GoogleTrendsResponse
): Promise<boolean> {
  const pending = await getPendingTask(taskId);

  if (!pending) {
    return false;
  }

  await setCachedResponse(
    pending.mode,
    pending.phrase,
    pending.location,
    response
  );

  return true;
}

// ============================================
// VIDEO IDEAS CACHE OPERATIONS
// ============================================

export function generateVideoIdeasCacheKey(params: {
  topicDescription: string;
  location: string;
  audienceLevel?: string;
  formatPreference?: string;
}): string {
  const normalized = {
    topic: params.topicDescription.toLowerCase().trim().slice(0, 500),
    location: params.location.toLowerCase(),
    audience: params.audienceLevel || "all",
    format: params.formatPreference || "mixed",
  };
  return generateRequestHash({
    mode: "video-ideas",
    phrase: JSON.stringify(normalized),
    location: normalized.location,
  });
}

export async function getCachedVideoIdeas(
  cacheKey: string
): Promise<{ data: VideoIdeasCacheResponse; cached: true } | null> {
  const now = new Date();

  const entry = await prisma.keywordCache.findFirst({
    where: {
      provider: PROVIDER,
      mode: "video-ideas",
      requestHash: cacheKey,
      expiresAt: { gt: now },
    },
  });

  if (!entry) {
    return null;
  }

  const responseData = entry.responseJson as Record<string, unknown>;
  if (responseData?.pending === true) {
    return null;
  }

  return {
    data: responseData as VideoIdeasCacheResponse,
    cached: true,
  };
}

export async function setCachedVideoIdeas(
  cacheKey: string,
  topicDescription: string,
  location: string,
  response: VideoIdeasCacheResponse
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.keywordCache.upsert({
    where: {
      provider_mode_requestHash: {
        provider: PROVIDER,
        mode: "video-ideas",
        requestHash: cacheKey,
      },
    },
    create: {
      provider: PROVIDER,
      mode: "video-ideas",
      phrase: topicDescription.toLowerCase().trim().slice(0, 255),
      database: location.toLowerCase(),
      requestHash: cacheKey,
      responseJson: { ...response, meta: { ...response.meta, cached: true } },
      fetchedAt: now,
      expiresAt,
    },
    update: {
      responseJson: { ...response, meta: { ...response.meta, cached: true } },
      fetchedAt: now,
      expiresAt,
    },
  });
}

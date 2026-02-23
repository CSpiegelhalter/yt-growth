import type { Prisma } from "@prisma/client";

import { hashVideoContent } from "@/lib/shared/content-hash";
import { prisma } from "@/prisma";

import { VideoInsightError } from "../errors";
import type { CoreAnalysis, LlmCallFn } from "../types";
import { type CompetitiveContextData,generateSummary } from "./generateSummary";

type InsightDerivedData = {
  video: {
    title: string;
    description?: string;
    tags: string[];
    durationSec: number;
    categoryId?: string | null;
  };
  derived: {
    totalViews: number;
    viewsPerDay: number;
    avdRatio: number | null;
    engagementPerView: number | null;
    subsPer1k: number | null;
    daysInRange: number;
    impressionsCtr?: number | null;
    trafficSources?: { search?: number; total?: number } | null;
  };
  comparison: {
    viewsPerDay: { vsBaseline: string; delta?: number | null };
    avgViewPercentage: { vsBaseline: string; delta?: number | null };
    engagementPerView: { vsBaseline: string; delta?: number | null };
    subsPer1k: { vsBaseline: string; delta?: number | null };
  };
  bottleneck: {
    bottleneck: string;
    evidence: string;
  } | null;
  subscriberBreakdown?: {
    subscriberViewPct?: number | null;
    subscribers?: { avgViewPct?: number | null; ctr?: number | null } | null;
    nonSubscribers?: { avgViewPct?: number | null } | null;
  } | null;
  geoBreakdown?: {
    topCountries?: Array<{
      countryName: string;
      viewsPct: number;
      avgViewPct: number | null;
    }>;
    primaryMarket?: string | null;
  } | null;
  trafficDetail?: {
    searchTerms?: Array<{ term: string; views: number }> | null;
    suggestedVideos?: Array<{ videoId: string; views: number }> | null;
    browseFeatures?: Array<{ feature: string; views: number }> | null;
  } | null;
  demographicBreakdown?: {
    hasData?: boolean;
    byAge: Array<{ ageGroup: string; viewsPct: number }>;
    byGender: Array<{ gender: string; viewsPct: number }>;
  } | null;
};

type CachedLlmData = {
  headline?: string;
  summary?: { headline?: string };
};

type InsightContext = {
  derivedData: InsightDerivedData;
  cached: {
    llmJson: unknown;
    cachedUntil: Date;
    contentHash: string | null;
  };
  channel: { id: number };
};

type GetVideoSummaryDeps = {
  fetchCompetitiveContext: (input: {
    videoId: string;
    title: string;
    tags: string[];
    searchTerms: Array<{ term: string; views: number }>;
    totalViews: number;
  }) => Promise<unknown>;
  callLlm: LlmCallFn;
  checkEntitlement: (opts: {
    featureKey: string;
    increment?: boolean;
    amount?: number;
  }) => Promise<{ ok: boolean; error?: unknown }>;
};

function extractCachedSummary(llmJson: unknown): CoreAnalysis | null {
  const data = llmJson as CachedLlmData;
  if (data.headline) {
    return data as CoreAnalysis;
  }
  if (data.summary?.headline) {
    return data.summary as CoreAnalysis;
  }
  return null;
}

function tryResolveFromCache(
  cached: InsightContext["cached"],
  currentHash: string,
): CoreAnalysis | null {
  if (cached.llmJson && cached.cachedUntil > new Date()) {
    const hit = extractCachedSummary(cached.llmJson);
    if (hit) {
      return hit;
    }
  }
  if (cached.contentHash === currentHash && cached.llmJson) {
    const hit = extractCachedSummary(cached.llmJson);
    if (hit) {
      return hit;
    }
  }
  return null;
}

async function fetchCompetitiveContextIfAvailable(
  videoId: string,
  derivedData: InsightDerivedData,
  deps: GetVideoSummaryDeps,
): Promise<unknown> {
  const searchTerms = derivedData.trafficDetail?.searchTerms;
  if (!searchTerms?.length) {
    return null;
  }

  return deps
    .fetchCompetitiveContext({
      videoId,
      title: derivedData.video.title,
      tags: derivedData.video.tags ?? [],
      searchTerms: searchTerms.slice(0, 3),
      totalViews: derivedData.derived.totalViews,
    })
    .catch(() => null);
}

export async function getVideoSummary(
  input: { userId: number; videoId: string; range: string; context: InsightContext },
  deps: GetVideoSummaryDeps,
): Promise<{ summary: CoreAnalysis; cached: boolean }> {
  const { userId, videoId, range, context } = input;
  const { derivedData, cached, channel } = context;

  const currentHash = hashVideoContent({
    title: derivedData.video?.title,
    description: derivedData.video?.description,
    tags: derivedData.video?.tags,
    durationSec: derivedData.video?.durationSec,
    categoryId: derivedData.video?.categoryId,
  });

  const cachedSummary = tryResolveFromCache(cached, currentHash);
  if (cachedSummary) {
    return { summary: cachedSummary, cached: true };
  }

  const entResult = await deps.checkEntitlement({
    featureKey: "owned_video_analysis",
    increment: true,
  });
  if (!entResult.ok) {
    throw new VideoInsightError("LIMIT_REACHED", "Entitlement limit reached", entResult.error);
  }

  const competitiveContext = await fetchCompetitiveContextIfAvailable(videoId, derivedData, deps);

  const summary = await generateSummary(
    {
      video: derivedData.video,
      derived: derivedData.derived,
      comparison: derivedData.comparison,
      bottleneck: derivedData.bottleneck,
      subscriberBreakdown: derivedData.subscriberBreakdown,
      geoBreakdown: derivedData.geoBreakdown,
      trafficDetail: derivedData.trafficDetail,
      demographicBreakdown: derivedData.demographicBreakdown,
      competitiveContext: competitiveContext as CompetitiveContextData,
    },
    deps.callLlm,
  );

  await prisma.ownedVideoInsightsCache.update({
    where: {
      userId_channelId_videoId_range: { userId, channelId: channel.id, videoId, range },
    },
    data: {
      contentHash: currentHash,
      llmJson: summary as unknown as Prisma.JsonObject,
    },
  });

  return { summary, cached: false };
}

import { Prisma } from "@prisma/client";
import { prisma } from "@/prisma";
import type { CoreAnalysis, LlmCallFn } from "../types";
import { VideoInsightError } from "../errors";
import { generateSummary } from "./generateSummary";
import { hashVideoContent } from "@/lib/shared/content-hash";

type InsightContext = {
  derivedData: any;
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
  }) => Promise<{ ok: boolean; error?: any }>;
};

export async function getVideoSummary(
  input: { userId: number; videoId: string; range: string; context: InsightContext },
  deps: GetVideoSummaryDeps,
): Promise<{ summary: CoreAnalysis; cached: boolean }> {
  const { userId, videoId, range, context } = input;
  const { derivedData, cached, channel } = context;

  if (cached.llmJson && cached.cachedUntil > new Date()) {
    const llmData = cached.llmJson as any;
    if (llmData.headline) return { summary: llmData, cached: true };
    if (llmData.summary?.headline) return { summary: llmData.summary, cached: true };
  }

  const currentHash = hashVideoContent({
    title: derivedData.video?.title,
    description: derivedData.video?.description,
    tags: derivedData.video?.tags,
    durationSec: derivedData.video?.durationSec,
    categoryId: derivedData.video?.categoryId,
  });

  if (cached.contentHash === currentHash && cached.llmJson) {
    const llmData = cached.llmJson as any;
    if (llmData.headline) return { summary: llmData, cached: true };
    if (llmData.summary?.headline) return { summary: llmData.summary, cached: true };
  }

  const entResult = await deps.checkEntitlement({
    featureKey: "owned_video_analysis",
    increment: true,
  });
  if (!entResult.ok) {
    throw new VideoInsightError("LIMIT_REACHED", "Entitlement limit reached", entResult.error);
  }

  let competitiveContext = null;
  if (derivedData.trafficDetail?.searchTerms?.length > 0) {
    competitiveContext = await deps
      .fetchCompetitiveContext({
        videoId,
        title: derivedData.video.title,
        tags: derivedData.video.tags || [],
        searchTerms: derivedData.trafficDetail.searchTerms.slice(0, 3),
        totalViews: derivedData.derived.totalViews,
      })
      .catch(() => null);
  }

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
      competitiveContext: competitiveContext as any,
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

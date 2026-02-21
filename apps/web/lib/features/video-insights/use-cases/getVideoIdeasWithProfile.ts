import { prisma } from "@/prisma";
import type { IdeasAnalysis, LlmCallFn } from "../types";
import { generateIdeas } from "./generateIdeas";

type InsightContext = {
  derivedData: any;
  channel: { id: number };
};

type GetVideoIdeasDeps = {
  callLlm: LlmCallFn;
};

export async function getVideoIdeasWithProfile(
  input: { context: InsightContext },
  deps: GetVideoIdeasDeps,
): Promise<IdeasAnalysis> {
  const { context } = input;
  const { derivedData, channel } = context;

  let channelProfile: any = null;
  try {
    const profiles = await prisma.$queryRaw<
      { aiProfileJson: string | null }[]
    >`
      SELECT "aiProfileJson" FROM "ChannelProfile" WHERE "channelId" = ${channel.id} LIMIT 1
    `;
    if (profiles[0]?.aiProfileJson) {
      channelProfile = JSON.parse(profiles[0].aiProfileJson);
    }
  } catch {
    // Profile table may not exist or no profile set
  }

  return generateIdeas(
    {
      videoTitle: derivedData.video.title,
      videoDescription: derivedData.video.description ?? "",
      tags: derivedData.video.tags ?? [],
      totalViews: derivedData.derived.totalViews,
      channelProfile,
    },
    deps.callLlm,
  );
}

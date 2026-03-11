import { prisma } from "@/prisma";

import { VideoIdeaError } from "../errors";
import { mapRowToVideoIdea } from "../mapRow";
import type { VideoIdea, VideoIdeaStatus } from "../types";

type ListIdeasInput = {
  userId: number;
  channelId: number;
  status?: VideoIdeaStatus;
};

export async function listIdeas(input: ListIdeasInput): Promise<VideoIdea[]> {
  const { userId, channelId, status } = input;

  try {
    const rows = await prisma.videoIdea.findMany({
      where: {
        userId,
        channelId,
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return rows.map(mapRowToVideoIdea);
  } catch (error) {
    if (error instanceof VideoIdeaError) {throw error;}
    throw new VideoIdeaError("LIST_FAILED", "Failed to list video ideas", error);
  }
}

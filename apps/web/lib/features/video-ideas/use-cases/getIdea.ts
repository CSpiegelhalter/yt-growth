import { prisma } from "@/prisma";

import { VideoIdeaError } from "../errors";
import { mapRowToVideoIdea } from "../mapRow";
import type { VideoIdea } from "../types";

type GetIdeaInput = {
  userId: number;
  ideaId: string;
};

export async function getIdea(input: GetIdeaInput): Promise<VideoIdea> {
  const { userId, ideaId } = input;

  const row = await prisma.videoIdea.findFirst({
    where: { id: ideaId, userId },
  });

  if (!row) {
    throw new VideoIdeaError("NOT_FOUND", `Video idea ${ideaId} not found`);
  }

  return mapRowToVideoIdea(row);
}

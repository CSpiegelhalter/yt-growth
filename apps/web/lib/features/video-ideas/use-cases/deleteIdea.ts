import { prisma } from "@/prisma";

import { VideoIdeaError } from "../errors";

type DeleteIdeaInput = {
  userId: number;
  ideaId: string;
};

export async function deleteIdea(input: DeleteIdeaInput): Promise<void> {
  const { userId, ideaId } = input;

  const existing = await prisma.videoIdea.findFirst({
    where: { id: ideaId, userId },
  });

  if (!existing) {
    throw new VideoIdeaError("NOT_FOUND", `Video idea ${ideaId} not found`);
  }

  await prisma.videoIdea.delete({
    where: { id: ideaId },
  });
}

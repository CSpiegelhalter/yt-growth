import { prisma } from "@/prisma";

import { VideoIdeaError } from "../errors";
import { mapRowToVideoIdea } from "../mapRow";
import type { UpdateIdeaInput, VideoIdea } from "../types";

type UpdateIdeaParams = {
  userId: number;
  ideaId: string;
  input: UpdateIdeaInput;
};

export async function updateIdea(params: UpdateIdeaParams): Promise<VideoIdea> {
  const { userId, ideaId, input } = params;

  const existing = await prisma.videoIdea.findFirst({
    where: { id: ideaId, userId },
  });

  if (!existing) {
    throw new VideoIdeaError("NOT_FOUND", `Video idea ${ideaId} not found`);
  }

  const data: Record<string, unknown> = {};
  if (input.summary !== undefined) {data.summary = input.summary;}
  if (input.title !== undefined) {data.title = input.title;}
  if (input.script !== undefined) {data.script = input.script;}
  if (input.description !== undefined) {data.description = input.description;}
  if (input.tags !== undefined) {data.tags = JSON.stringify(input.tags);}
  if (input.postDate !== undefined) {data.postDate = input.postDate ? new Date(input.postDate) : null;}
  if (input.status !== undefined) {data.status = input.status;}
  if (input.publishedVideoId !== undefined) {data.publishedVideoId = input.publishedVideoId;}

  try {
    const row = await prisma.videoIdea.update({
      where: { id: ideaId },
      data,
    });

    return mapRowToVideoIdea(row);
  } catch (error) {
    if (error instanceof VideoIdeaError) {throw error;}
    throw new VideoIdeaError("UPDATE_FAILED", "Failed to update video idea", error);
  }
}

import { prisma } from "@/prisma";

import { VideoIdeaError } from "../errors";
import { mapRowToVideoIdea } from "../mapRow";
import type { CreateIdeaInput, VideoIdea } from "../types";

export async function createIdea(input: CreateIdeaInput): Promise<VideoIdea> {
  const { userId, channelId, summary, title, script, description, tags, postDate, sourceProvenanceJson } = input;

  try {
    const row = await prisma.videoIdea.create({
      data: {
        userId,
        channelId,
        summary,
        title: title ?? null,
        script: script ?? null,
        description: description ?? null,
        tags: tags ? JSON.stringify(tags) : null,
        postDate: postDate ? new Date(postDate) : null,
        status: "draft",
        sourceProvenanceJson: sourceProvenanceJson ?? null,
      },
    });

    return mapRowToVideoIdea(row);
  } catch (error) {
    throw new VideoIdeaError("CREATE_FAILED", "Failed to create video idea", error);
  }
}

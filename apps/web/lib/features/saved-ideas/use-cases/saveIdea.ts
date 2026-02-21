/**
 * Save Idea Use-Case
 *
 * Persists a new idea for the user. Resolves string channel IDs to
 * the internal numeric Channel.id before storing.
 */

import { prisma } from "@/prisma";
import { SavedIdeaError } from "../errors";
import type { SaveIdeaInput, SaveIdeaResult } from "../types";

export async function saveIdea(input: SaveIdeaInput): Promise<SaveIdeaResult> {
  let resolvedChannelId: number | null = null;

  if (typeof input.channelId === "number") {
    resolvedChannelId = input.channelId;
  } else if (typeof input.channelId === "string" && input.channelId.trim()) {
    const ch = await prisma.channel.findFirst({
      where: { userId: input.userId, youtubeChannelId: input.channelId.trim() },
      select: { id: true },
    });
    resolvedChannelId = ch?.id ?? null;
  }

  const existing = await prisma.savedIdea.findUnique({
    where: {
      userId_ideaId: {
        userId: input.userId,
        ideaId: input.ideaId,
      },
    },
  });

  if (existing) {
    throw new SavedIdeaError("INVALID_INPUT", "Idea already saved");
  }

  try {
    const savedIdea = await prisma.savedIdea.create({
      data: {
        userId: input.userId,
        channelId: resolvedChannelId,
        ideaId: input.ideaId,
        title: input.title,
        angle: input.angle ?? null,
        format: input.format,
        difficulty: input.difficulty,
        ideaJson: input.ideaJson as object,
        notes: input.notes ?? null,
        status: "saved",
      },
    });

    return {
      id: savedIdea.id,
      ideaId: savedIdea.ideaId,
      title: savedIdea.title,
      status: savedIdea.status,
      createdAt: savedIdea.createdAt.toISOString(),
    };
  } catch (err) {
    throw new SavedIdeaError("EXTERNAL_FAILURE", "Failed to save idea", err);
  }
}

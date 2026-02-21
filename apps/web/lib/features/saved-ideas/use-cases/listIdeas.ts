/**
 * List Ideas Use-Case
 *
 * Fetches all saved ideas for a user, optionally filtered by status.
 */

import { prisma } from "@/prisma";
import { SavedIdeaError } from "../errors";
import type { ListIdeasInput, ListIdeasResult, SavedIdea } from "../types";

export async function listIdeas(input: ListIdeasInput): Promise<ListIdeasResult> {
  try {
    const savedIdeas = await prisma.savedIdea.findMany({
      where: {
        userId: input.userId,
        ...(input.status ? { status: input.status } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    const channelIds = Array.from(
      new Set(
        savedIdeas
          .map((i) => i.channelId)
          .filter((id): id is number => typeof id === "number"),
      ),
    );

    const channels = channelIds.length
      ? await prisma.channel.findMany({
          where: { userId: input.userId, id: { in: channelIds } },
          select: { id: true, youtubeChannelId: true },
        })
      : [];

    const channelMap = new Map<number, string>(
      channels.map((c) => [c.id, c.youtubeChannelId]),
    );

    const mapped: SavedIdea[] = savedIdeas.map((idea) => ({
      id: idea.id,
      ideaId: idea.ideaId,
      youtubeChannelId:
        typeof idea.channelId === "number"
          ? channelMap.get(idea.channelId) ?? null
          : null,
      title: idea.title,
      angle: idea.angle,
      format: idea.format,
      difficulty: idea.difficulty,
      ideaJson: idea.ideaJson as Record<string, unknown>,
      notes: idea.notes,
      status: idea.status,
      createdAt: idea.createdAt.toISOString(),
      updatedAt: idea.updatedAt.toISOString(),
    }));

    return { savedIdeas: mapped, total: mapped.length };
  } catch (err) {
    if (err instanceof SavedIdeaError) throw err;
    throw new SavedIdeaError("EXTERNAL_FAILURE", "Failed to fetch saved ideas", err);
  }
}

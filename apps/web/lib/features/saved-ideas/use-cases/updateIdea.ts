/**
 * Update Idea Use-Case
 *
 * Updates notes, status, or ideaJson for an existing saved idea.
 */

import { prisma } from "@/prisma";
import { SavedIdeaError } from "../errors";
import type { UpdateIdeaInput, UpdateIdeaResult } from "../types";

export async function updateIdea(input: UpdateIdeaInput): Promise<UpdateIdeaResult> {
  const existing = await prisma.savedIdea.findUnique({
    where: {
      userId_ideaId: {
        userId: input.userId,
        ideaId: input.ideaId,
      },
    },
  });

  if (!existing) {
    throw new SavedIdeaError("NOT_FOUND", "Idea not found");
  }

  try {
    const updated = await prisma.savedIdea.update({
      where: { id: existing.id },
      data: {
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.ideaJson !== undefined ? { ideaJson: input.ideaJson as object } : {}),
      },
    });

    return {
      id: updated.id,
      ideaId: updated.ideaId,
      notes: updated.notes,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    };
  } catch (err) {
    if (err instanceof SavedIdeaError) {throw err;}
    throw new SavedIdeaError("EXTERNAL_FAILURE", "Failed to update saved idea", err);
  }
}

/**
 * Delete Idea Use-Case
 *
 * Removes a saved idea belonging to the user.
 */

import { prisma } from "@/prisma";
import { SavedIdeaError } from "../errors";
import type { DeleteIdeaInput, DeleteIdeaResult } from "../types";

export async function deleteIdea(input: DeleteIdeaInput): Promise<DeleteIdeaResult> {
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
    await prisma.savedIdea.delete({
      where: { id: existing.id },
    });

    return { success: true, ideaId: input.ideaId };
  } catch (err) {
    throw new SavedIdeaError("EXTERNAL_FAILURE", "Failed to delete saved idea", err);
  }
}

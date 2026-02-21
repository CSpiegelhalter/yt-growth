import { prisma } from "@/prisma";
import type { Prisma } from "@prisma/client";
import { ThumbnailError } from "../errors";

type UpdateProjectInput = {
  userId: number;
  projectId: string;
  editorState: Prisma.InputJsonValue;
};

type UpdateProjectResult = {
  ok: true;
};

export async function updateProject(
  input: UpdateProjectInput,
): Promise<UpdateProjectResult> {
  const { userId, projectId, editorState } = input;

  const project = await prisma.thumbnailProject.findUnique({
    where: { id: projectId },
    select: { id: true, userId: true },
  });
  if (!project) {
    throw new ThumbnailError("NOT_FOUND", "Project not found");
  }
  if (project.userId !== userId) {
    throw new ThumbnailError("FORBIDDEN", "Access denied");
  }

  await prisma.thumbnailProject.update({
    where: { id: projectId },
    data: { editorState },
  });

  return { ok: true };
}

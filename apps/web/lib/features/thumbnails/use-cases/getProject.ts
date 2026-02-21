import { prisma } from "@/prisma";
import { ThumbnailError } from "../errors";

type GetProjectInput = {
  userId: number;
  projectId: string;
};

type ThumbnailProjectResult = {
  projectId: string;
  thumbnailJobId: string;
  baseImageUrl: string;
  editorState: unknown;
  exports: unknown[];
  updatedAt: string;
};

export async function getProject(
  input: GetProjectInput,
): Promise<ThumbnailProjectResult> {
  const { userId, projectId } = input;

  const project = await prisma.thumbnailProject.findUnique({
    where: { id: projectId },
  });
  if (!project) {
    throw new ThumbnailError("NOT_FOUND", "Project not found");
  }
  if (project.userId !== userId) {
    throw new ThumbnailError("FORBIDDEN", "Access denied");
  }

  return {
    projectId: project.id,
    thumbnailJobId: project.thumbnailJobId,
    baseImageUrl: project.baseImageUrl,
    editorState: project.editorState,
    exports: Array.isArray(project.exports) ? (project.exports as unknown[]) : [],
    updatedAt: project.updatedAt.toISOString(),
  };
}

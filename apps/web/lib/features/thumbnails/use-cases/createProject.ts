import { prisma } from "@/prisma";
import { ThumbnailError } from "../errors";
import { defaultEditorState } from "../editor/editorState";

type OutputImage = { url?: string; [key: string]: unknown };

type CreateProjectInput = {
  userId: number;
  thumbnailJobId: string;
  baseImageUrl: string;
};

type CreateProjectResult = {
  projectId: string;
};

export async function createProject(
  input: CreateProjectInput,
): Promise<CreateProjectResult> {
  const { userId, thumbnailJobId, baseImageUrl } = input;

  const job = await prisma.thumbnailJob.findUnique({
    where: { id: thumbnailJobId },
    select: {
      id: true,
      userId: true,
      status: true,
      outputImages: true,
      Predictions: { select: { outputImages: true } },
    },
  });
  if (!job || job.userId !== userId) {
    throw new ThumbnailError("NOT_FOUND", "Thumbnail job not found");
  }
  if (job.status !== "succeeded") {
    throw new ThumbnailError("INVALID_INPUT", "Job is not finished yet");
  }

  const allOutputUrls = new Set<string>();
  if (Array.isArray(job.outputImages)) {
    for (const img of job.outputImages) {
      const imgObj = img as OutputImage;
      if (imgObj?.url) {
        allOutputUrls.add(imgObj.url);
      }
    }
  }
  for (const pred of job.Predictions) {
    if (Array.isArray(pred.outputImages)) {
      for (const img of pred.outputImages) {
        const imgObj = img as OutputImage;
        if (imgObj?.url) {
          allOutputUrls.add(imgObj.url);
        }
      }
    }
  }

  if (!allOutputUrls.has(baseImageUrl)) {
    throw new ThumbnailError("FORBIDDEN", "Invalid base image for this job");
  }

  const project = await prisma.thumbnailProject.create({
    data: {
      userId,
      thumbnailJobId,
      baseImageUrl,
      editorState: defaultEditorState(),
      exports: [],
    },
    select: { id: true },
  });

  return { projectId: project.id };
}

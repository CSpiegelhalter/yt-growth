import crypto from "crypto";
import sharp from "sharp";
import { prisma } from "@/prisma";
import type { StoragePort } from "@/lib/ports/StoragePort";
import { ThumbnailError } from "../errors";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

type UploadOverlayInput = {
  userId: number;
  projectId: string;
  file: {
    bytes: Buffer;
    type: string;
    size: number;
  };
};

type UploadOverlayDeps = {
  storage: Pick<StoragePort, "put" | "getPublicUrl">;
};

type UploadOverlayResult = {
  url: string;
};

export async function uploadOverlay(
  input: UploadOverlayInput,
  deps: UploadOverlayDeps,
): Promise<UploadOverlayResult> {
  const { userId, projectId, file } = input;

  const project = await prisma.thumbnailProject.findUnique({
    where: { id: projectId },
    select: { id: true, userId: true },
  });
  if (!project || project.userId !== userId) {
    throw new ThumbnailError("NOT_FOUND", "Project not found");
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new ThumbnailError("INVALID_INPUT", "Unsupported file type");
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    throw new ThumbnailError("INVALID_INPUT", "File too large");
  }

  const meta = await sharp(file.bytes).metadata();
  if ((meta.width ?? 0) < 16 || (meta.height ?? 0) < 16) {
    throw new ThumbnailError("INVALID_INPUT", "Image too small");
  }

  const ext = MIME_EXT[file.type] ?? "bin";
  const key = `thumbnails/projects/${projectId}/overlays/${crypto.randomUUID()}.${ext}`;
  await deps.storage.put(key, file.bytes, { contentType: file.type });

  return { url: deps.storage.getPublicUrl(key) };
}

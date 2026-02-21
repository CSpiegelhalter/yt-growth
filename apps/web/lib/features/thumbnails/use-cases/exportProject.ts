import crypto from "crypto";
import sharp from "sharp";
import { prisma } from "@/prisma";
import type { StoragePort } from "@/lib/ports/StoragePort";
import { ThumbnailError } from "../errors";

type ExportProjectInput = {
  userId: number;
  projectId: string;
  dataUrl: string;
  format: "png" | "jpg";
};

type ExportProjectDeps = {
  storage: Pick<StoragePort, "put" | "getPublicUrl">;
};

type ExportProjectResult = {
  url: string;
};

function decodeDataUrl(dataUrl: string): { mime: string; bytes: Buffer } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) {throw new Error("Invalid data URL");}
  return { mime: m[1], bytes: Buffer.from(m[2], "base64") };
}

export async function exportProject(
  input: ExportProjectInput,
  deps: ExportProjectDeps,
): Promise<ExportProjectResult> {
  const { userId, projectId, dataUrl, format } = input;

  const project = await prisma.thumbnailProject.findUnique({
    where: { id: projectId },
    select: { id: true, userId: true, exports: true },
  });
  if (!project || project.userId !== userId) {
    throw new ThumbnailError("NOT_FOUND", "Project not found");
  }

  let decoded: { mime: string; bytes: Buffer };
  try {
    decoded = decodeDataUrl(dataUrl);
  } catch {
    throw new ThumbnailError("INVALID_INPUT", "Invalid export payload");
  }

  const meta = await sharp(decoded.bytes).metadata();
  if (meta.width !== 1280 || meta.height !== 720) {
    throw new ThumbnailError("INVALID_INPUT", "Export must be exactly 1280x720");
  }

  const key = `thumbnails/projects/${projectId}/exports/${crypto.randomUUID()}.${format}`;
  await deps.storage.put(key, decoded.bytes, {
    contentType: format === "png" ? "image/png" : "image/jpeg",
    cacheControl: "public, max-age=31536000, immutable",
  });

  const url = deps.storage.getPublicUrl(key);

  const existing = Array.isArray(project.exports) ? project.exports : [];
  const updated = [
    ...existing,
    { url, format, width: 1280, height: 720, createdAt: new Date().toISOString() },
  ];

  await prisma.thumbnailProject.update({
    where: { id: projectId },
    data: { exports: updated },
  });

  return { url };
}

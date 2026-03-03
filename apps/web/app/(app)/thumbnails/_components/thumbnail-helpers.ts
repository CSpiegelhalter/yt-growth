/**
 * Pure helper functions for the thumbnails workflow.
 *
 * These are stateless utilities extracted from ThumbnailsClient
 * to keep component files focused on rendering.
 */

import type {
  PersistedThumbnail,
  ToastFn,
  UploadedPhoto,
  UploadResult,
} from "../thumbnail-types";

export function isPersistedThumbnailArray(
  value: unknown,
): value is PersistedThumbnail[] {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      typeof item.id === "string" &&
      typeof item.url === "string" &&
      typeof item.createdAt === "number" &&
      typeof item.jobId === "string",
  );
}

export function isUploadedPhotoArray(
  value: unknown,
): value is UploadedPhoto[] {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      typeof item.id === "string" &&
      (item.url === null || typeof item.url === "string") &&
      typeof item.width === "number" &&
      typeof item.height === "number",
  );
}

export async function downloadThumbnailImage(
  imageUrl: string,
  filename: string,
  toastFn: ToastFn,
) {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toastFn("Download started!", "success");
  } catch {
    toastFn("Download failed", "error");
  }
}

export function showUploadResultToasts(
  data: { counts?: { uploaded?: number; failed?: number }; results?: unknown[] },
  toastFn: ToastFn,
) {
  const succeeded = data.counts?.uploaded ?? 0;
  const failed = data.counts?.failed ?? 0;

  if (failed > 0) {
    const failedFiles = ((data.results as UploadResult[]) || [])
      .filter((r) => r.status === "error")
      .map((r) => `${r.filename}: ${r.error}`)
      .join("\n");

    if (succeeded > 0) {
      toastFn(`${succeeded} uploaded, ${failed} failed:\n${failedFiles}`, "info");
    } else {
      toastFn(`All ${failed} failed:\n${failedFiles}`, "error");
    }
  } else if (succeeded > 0) {
    toastFn(`${succeeded} photo(s) uploaded`, "success");
  }
}

export function getToggleTitle(
  canUseIdentity: boolean,
  isCompatibleStyle: boolean,
  photoCount: number,
): string {
  if (canUseIdentity) {
    return "Include your face in the thumbnail";
  }
  if (!isCompatibleStyle) {
    return "Identity works with Subject and Hold styles only";
  }
  const remaining = 7 - photoCount;
  return `Upload ${remaining} more photo${remaining !== 1 ? "s" : ""} to enable`;
}

import type { StoragePort } from "@/lib/ports/StoragePort";
import { ThumbnailError } from "../errors";

const ALLOWED_PREFIXES = ["thumbnails/", "assets/", "face-refs/", "identity/"];

type GetImageInput = {
  encodedKey: string;
};

type GetImageDeps = {
  storage: Pick<StoragePort, "get">;
};

type GetImageResult = {
  buffer: Buffer;
  mime: string;
  size: number;
};

export async function getImage(
  input: GetImageInput,
  deps: GetImageDeps,
): Promise<GetImageResult> {
  const key = decodeURIComponent(input.encodedKey);

  if (!ALLOWED_PREFIXES.some((prefix) => key.startsWith(prefix))) {
    throw new ThumbnailError("FORBIDDEN", "Invalid image key");
  }

  const obj = await deps.storage.get(key);
  if (!obj) {
    throw new ThumbnailError("NOT_FOUND", "Image not found");
  }

  return {
    buffer: obj.buffer,
    mime: obj.mime,
    size: obj.size,
  };
}

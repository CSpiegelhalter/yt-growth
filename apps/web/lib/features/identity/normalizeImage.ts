import sharp from "sharp";
import { IdentityError } from "./errors";
import type { NormalizedImage } from "./types";

/**
 * Normalize an identity training image:
 * - Center crop to square
 * - Resize to 1024x1024
 * - Encode as high-quality JPEG
 *
 * (Face detection is intentionally omitted here to keep the pipeline dependency-light.
 * If needed later, we can add face-aware crops behind a feature flag.)
 */
export async function normalizeIdentityImage(
  input: Buffer
): Promise<NormalizedImage> {
  const img = sharp(input, { failOnError: true });
  const meta = await img.metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w < 256 || h < 256) {
    throw new IdentityError(
      "INVALID_INPUT",
      "Image too small (min 256px on each side)"
    );
  }

  const size = Math.min(w, h);
  const left = Math.max(0, Math.floor((w - size) / 2));
  const top = Math.max(0, Math.floor((h - size) / 2));

  const out = await img
    .extract({ left, top, width: size, height: size })
    .resize(1024, 1024, { fit: "cover" })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  return { bytes: out, width: 1024, height: 1024, contentType: "image/jpeg" };
}

/**
 * Composite Overlay Utility
 *
 * Composites a meme/reference image onto a base thumbnail at a specified
 * position, scale, and rotation. Uses Sharp for image manipulation.
 *
 * NOTE: Use pre-processed PNG images with transparent backgrounds
 * (e.g., -removebg-preview.png files) for best results.
 */

import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

export interface OverlayTransform {
  /** X position as percentage of base image width (0-100) */
  x: number;
  /** Y position as percentage of base image height (0-100) */
  y: number;
  /** Scale factor (1.0 = original size, 0.5 = half, 2.0 = double) */
  scale: number;
  /** Rotation in degrees (0-360) */
  rotation: number;
  /** Whether to flip horizontally */
  flipX?: boolean;
}

export interface CompositeResult {
  /** The composited image buffer */
  buffer: Buffer;
  /** MIME type */
  mime: string;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

/**
 * Load a meme reference image from the public folder.
 * Returns the image as-is. Use pre-processed PNGs with transparent backgrounds.
 */
export async function loadMemeImage(
  memePath: string
): Promise<Buffer | null> {
  try {
    // memePath is like "/memes/trollface.png"
    const fullPath = path.join(process.cwd(), "public", memePath);
    console.log(`[loadMemeImage] Loading from: ${fullPath}`);
    const rawBuffer = await fs.readFile(fullPath);
    
    // Ensure image has alpha channel for compositing
    const processedBuffer = await sharp(rawBuffer)
      .ensureAlpha()
      .png()
      .toBuffer();
    
    console.log(`[loadMemeImage] Loaded, size: ${processedBuffer.length} bytes`);
    return processedBuffer;
  } catch (error) {
    console.error(`[loadMemeImage] Failed to load:`, error);
    return null;
  }
}

/**
 * Composite a meme overlay onto a base thumbnail image.
 *
 * @param baseImage - The base thumbnail image buffer
 * @param overlayImage - The meme/overlay image buffer
 * @param transform - Position, scale, and rotation settings
 * @returns The composited image
 */
export async function compositeOverlay(
  baseImage: Buffer,
  overlayImage: Buffer,
  transform: OverlayTransform
): Promise<CompositeResult> {
  console.log(`[compositeOverlay] Compositing with transform:`, transform);

  // Get base image metadata
  const baseMetadata = await sharp(baseImage).metadata();
  const baseWidth = baseMetadata.width || 1536;
  const baseHeight = baseMetadata.height || 1024;

  // Get overlay image metadata
  const overlayMetadata = await sharp(overlayImage).metadata();
  const overlayOriginalWidth = overlayMetadata.width || 200;
  const overlayOriginalHeight = overlayMetadata.height || 200;

  // Calculate scaled overlay dimensions
  // Default overlay size is ~25% of base image width
  const defaultOverlayWidth = Math.round(baseWidth * 0.25);
  const scaledWidth = Math.round(defaultOverlayWidth * transform.scale);
  const scaledHeight = Math.round(
    scaledWidth * (overlayOriginalHeight / overlayOriginalWidth)
  );

  // Process the overlay: resize, flip, rotate, and add transparency handling
  let processedOverlay = sharp(overlayImage)
    .resize(scaledWidth, scaledHeight, { fit: "contain" });

  // Apply horizontal flip if requested
  if (transform.flipX) {
    processedOverlay = processedOverlay.flop(); // flop = horizontal flip
  }

  // Apply rotation
  processedOverlay = processedOverlay.rotate(transform.rotation, {
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  });

  // Ensure we have an alpha channel for proper compositing
  processedOverlay = processedOverlay.ensureAlpha();

  const overlayBuffer = await processedOverlay.png().toBuffer();

  // Get the rotated overlay dimensions (rotation changes bounding box)
  const rotatedMetadata = await sharp(overlayBuffer).metadata();
  const finalOverlayWidth = rotatedMetadata.width || scaledWidth;
  const finalOverlayHeight = rotatedMetadata.height || scaledHeight;

  // Calculate pixel position from percentage
  // Position is the CENTER of the overlay
  const centerX = Math.round((transform.x / 100) * baseWidth);
  const centerY = Math.round((transform.y / 100) * baseHeight);

  // Convert to top-left position for Sharp composite
  const left = Math.round(centerX - finalOverlayWidth / 2);
  const top = Math.round(centerY - finalOverlayHeight / 2);

  console.log(
    `[compositeOverlay] Overlay size: ${finalOverlayWidth}x${finalOverlayHeight}, position: (${left}, ${top})`
  );

  // Composite the overlay onto the base
  const result = await sharp(baseImage)
    .composite([
      {
        input: overlayBuffer,
        left: Math.max(0, left), // Clamp to image bounds
        top: Math.max(0, top),
        blend: "over",
      },
    ])
    .png()
    .toBuffer();

  return {
    buffer: result,
    mime: "image/png",
    width: baseWidth,
    height: baseHeight,
  };
}

/**
 * Composite a meme from the public folder onto a base image.
 */
export async function compositeMemeOntoThumbnail(
  baseImage: Buffer,
  memePath: string,
  transform: OverlayTransform
): Promise<CompositeResult | null> {
  const memeBuffer = await loadMemeImage(memePath);
  if (!memeBuffer) {
    console.error(`[compositeMemeOntoThumbnail] Failed to load meme: ${memePath}`);
    return null;
  }

  return compositeOverlay(baseImage, memeBuffer, transform);
}

/**
 * Default transform for centering an overlay in the left third of the image.
 */
export function getDefaultOverlayTransform(): OverlayTransform {
  return {
    x: 25, // Left third, centered
    y: 50, // Vertically centered
    scale: 1.0,
    rotation: 0,
  };
}

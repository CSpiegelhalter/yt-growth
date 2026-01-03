/**
 * Thumbnail Renderer (Concept-Based)
 *
 * Orchestrates the rendering pipeline:
 * 1. Take base image (AI-generated scene or fallback gradient)
 * 2. Generate SVG overlay using concept template
 * 3. Composite overlay onto base (with attention elements)
 * 4. Export as optimized PNG (1280x720)
 *
 * Note: Requires `sharp` package for image processing.
 */

import type {
  ConceptSpec,
  ThumbnailPalette,
  TemplateRenderOutput,
  ConceptPlan,
} from "./types";
import {
  generateOverlay,
  generateGradientBackground,
  THUMBNAIL_WIDTH,
  THUMBNAIL_HEIGHT,
} from "./templates";

// ============================================
// DYNAMIC SHARP IMPORT
// ============================================

// Sharp is an optional heavy dependency - only load when needed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sharpModule: any = null;

async function getSharp(): Promise<any> {
  if (!sharpModule) {
    try {
      const imported = await import("sharp");
      // Handle both ESM default export and CommonJS
      sharpModule = imported.default ?? imported;
    } catch {
      throw new Error(
        "Sharp is required for thumbnail rendering. Install with: bun add sharp"
      );
    }
  }
  return sharpModule;
}

// ============================================
// MAIN RENDER FUNCTION
// ============================================

/**
 * Render a complete thumbnail from base image and concept spec.
 */
export async function renderThumbnail(
  baseImage: Buffer | null,
  spec: ConceptSpec
): Promise<TemplateRenderOutput> {
  const sharp = await getSharp();

  // Generate the SVG overlay (concept-based with attention elements)
  const overlaySvg = generateOverlay(spec);
  const overlayBuffer = Buffer.from(overlaySvg);

  let baseBuffer: Buffer;

  if (baseImage) {
    // Ensure base image is correct size (1280x720)
    baseBuffer = await sharp(baseImage)
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
        fit: "cover",
        position: "center",
      })
      .toBuffer();
  } else {
    // Use fallback gradient background (enhanced for concept)
    const gradientSvg = generateGradientBackground(
      spec.plan.palette,
      THUMBNAIL_WIDTH,
      THUMBNAIL_HEIGHT,
      spec.plan.conceptId
    );
    baseBuffer = await sharp(Buffer.from(gradientSvg))
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT)
      .toBuffer();
  }

  // Composite overlay onto base
  const finalBuffer = await sharp(baseBuffer)
    .composite([
      {
        input: overlayBuffer,
        top: 0,
        left: 0,
      },
    ])
    .png({
      quality: 90,
      compressionLevel: 9,
    })
    .toBuffer();

  return {
    buffer: finalBuffer,
    mime: "image/png",
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT,
  };
}

// ============================================
// OVERLAY-ONLY RENDER (Fast Re-render)
// ============================================

/**
 * Re-render just the overlay onto an existing base image.
 * Much faster than full generation since no AI is needed.
 * Used when user edits hook text, badges, or overlay toggles.
 */
export async function rerenderOverlay(
  baseImageBuffer: Buffer,
  spec: ConceptSpec
): Promise<TemplateRenderOutput> {
  const sharp = await getSharp();

  // Generate new overlay with updated spec
  const overlaySvg = generateOverlay(spec);
  const overlayBuffer = Buffer.from(overlaySvg);

  // Composite onto base
  const finalBuffer = await sharp(baseImageBuffer)
    .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
      fit: "cover",
      position: "center",
    })
    .composite([
      {
        input: overlayBuffer,
        top: 0,
        left: 0,
      },
    ])
    .png({
      quality: 90,
      compressionLevel: 9,
    })
    .toBuffer();

  return {
    buffer: finalBuffer,
    mime: "image/png",
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT,
  };
}

// ============================================
// FALLBACK RENDER (No AI)
// ============================================

/**
 * Render a thumbnail using only gradient background (no AI).
 * Used as fallback when AI generation fails.
 * Still applies full concept overlay with attention elements.
 */
export async function renderFallbackThumbnail(
  spec: ConceptSpec
): Promise<TemplateRenderOutput> {
  return renderThumbnail(null, spec);
}

// ============================================
// GRADIENT ONLY (Preview)
// ============================================

/**
 * Generate a preview gradient image (no overlay).
 * Useful for showing color palette previews.
 */
export async function renderGradientPreview(
  palette: ThumbnailPalette,
  width: number = 320,
  height: number = 180
): Promise<Buffer> {
  const sharp = await getSharp();

  const gradientSvg = generateGradientBackground(palette, width, height);
  return sharp(Buffer.from(gradientSvg))
    .png()
    .toBuffer();
}

// ============================================
// IMAGE VALIDATION
// ============================================

/**
 * Validate and process an uploaded image for use as base.
 * Ensures correct format and dimensions.
 */
export async function processUploadedImage(
  buffer: Buffer,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
  }
): Promise<{
  buffer: Buffer;
  width: number;
  height: number;
  mime: string;
}> {
  const sharp = await getSharp();
  const { maxWidth = 2560, maxHeight = 1440 } = options ?? {};

  const image = sharp(buffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Invalid image: could not read dimensions");
  }

  // Resize if too large
  let processed = image;
  if (metadata.width > maxWidth || metadata.height > maxHeight) {
    processed = image.resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  // Convert to PNG for consistency
  const outputBuffer = await processed.png().toBuffer();
  const outputMeta = await sharp(outputBuffer).metadata();

  return {
    buffer: outputBuffer,
    width: outputMeta.width ?? THUMBNAIL_WIDTH,
    height: outputMeta.height ?? THUMBNAIL_HEIGHT,
    mime: "image/png",
  };
}

// ============================================
// SVG-ONLY EXPORT (for debugging)
// ============================================

/**
 * Export just the SVG overlay (no base image).
 * Useful for debugging template output.
 */
export function exportOverlaySvg(spec: ConceptSpec): string {
  return generateOverlay(spec);
}

// ============================================
// BATCH RENDERING
// ============================================

/**
 * Render multiple thumbnails in sequence.
 * More memory-efficient than parallel rendering.
 */
export async function renderBatch(
  items: Array<{ baseImage: Buffer | null; spec: ConceptSpec }>,
  onProgress?: (completed: number, total: number) => void
): Promise<TemplateRenderOutput[]> {
  const results: TemplateRenderOutput[] = [];

  for (let i = 0; i < items.length; i++) {
    const { baseImage, spec } = items[i];
    const result = await renderThumbnail(baseImage, spec);
    results.push(result);
    onProgress?.(i + 1, items.length);
  }

  return results;
}

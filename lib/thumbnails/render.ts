/**
 * Thumbnail Renderer (Concept-Based)
 *
 * Orchestrates the rendering pipeline:
 * 1. Take base image (AI-generated scene - REQUIRED)
 * 2. Generate SVG overlay using concept template
 * 3. Composite overlay onto base (with attention elements)
 * 4. Add text contrast enhancement
 * 5. Export as optimized PNG (1280x720)
 *
 * Note: AI base image is required - no fallbacks.
 * If AI generation fails, an error is shown to the user.
 *
 * Note: Requires `sharp` package for image processing.
 */

import type {
  ConceptSpec,
  ThumbnailPalette,
  TemplateRenderOutput,
} from "./types";
import {
  generateOverlay,
  THUMBNAIL_WIDTH,
  THUMBNAIL_HEIGHT,
} from "./templates";
import { validateImage, isPngBuffer } from "./validation";

// ============================================
// DYNAMIC SHARP IMPORT
// ============================================

// Sharp is an optional heavy dependency - only load when needed
 
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
 * Base image is REQUIRED - throws error if not provided.
 */
export async function renderThumbnail(
  baseImage: Buffer,
  spec: ConceptSpec,
  options?: {
    addContrastOverlay?: boolean;
    validateOutput?: boolean;
  }
): Promise<TemplateRenderOutput> {
  const {
    addContrastOverlay = true,
    validateOutput = true,
  } = options ?? {};

  // Base image is required - no fallbacks
  if (!baseImage || baseImage.length === 0) {
    throw new Error("Base image is required for thumbnail rendering");
  }

  const sharp = await getSharp();
  const conceptId = spec.plan.conceptId;

  console.log(`[renderThumbnail] Rendering concept: ${conceptId}, baseImage: ${baseImage.length} bytes`);

  // Validate the base image first
  const isValidPng = isPngBuffer(baseImage);
  console.log(`[renderThumbnail] Base image isPNG: ${isValidPng}`);

  // Generate the SVG overlay (concept-based with attention elements)
  const overlaySvg = generateOverlay(spec);
  const overlayBuffer = Buffer.from(overlaySvg);

  // Ensure base image is correct size (1280x720)
  const baseBuffer = await sharp(baseImage)
    .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
      fit: "cover",
      position: "center",
    })
    .toBuffer();
  console.log(`[renderThumbnail] Resized base image to ${THUMBNAIL_WIDTH}x${THUMBNAIL_HEIGHT}`);

  // Build composite layers
  const compositeLayers: Array<{ input: Buffer; top: number; left: number }> = [];

  // Add text contrast enhancement overlay (gradient behind text area)
  if (addContrastOverlay) {
    const contrastSvg = generateTextContrastOverlay(spec);
    compositeLayers.push({
      input: Buffer.from(contrastSvg),
      top: 0,
      left: 0,
    });
  }

  // Add the main overlay (text, badges, symbols)
  compositeLayers.push({
    input: overlayBuffer,
    top: 0,
    left: 0,
  });

  // Composite all layers onto base
  const finalBuffer = await sharp(baseBuffer)
    .composite(compositeLayers)
    .png({
      compressionLevel: 9,
    })
    .toBuffer();

  // Validate output if requested
  if (validateOutput) {
    const validation = await validateImage(finalBuffer, {
      requireExactSize: true,
      expectedWidth: THUMBNAIL_WIDTH,
      expectedHeight: THUMBNAIL_HEIGHT,
      checkQuality: false, // Skip quality check on final output
    });

    if (!validation.valid) {
      console.error("[renderThumbnail] Output validation failed:", validation.issues);
      throw new Error(`Output validation failed: ${validation.issues.join(", ")}`);
    }
  }

  console.log(`[renderThumbnail] Final output: ${finalBuffer.length} bytes`);

  return {
    buffer: finalBuffer,
    mime: "image/png",
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT,
  };
}

/**
 * Generate a subtle gradient overlay to improve text contrast.
 * Placed behind text based on composition settings.
 */
function generateTextContrastOverlay(spec: ConceptSpec): string {
  const { textSafeArea } = spec.plan.composition;
  
  // Determine where to place the contrast gradient based on text position
  let gradientDef = "";
  let rect = "";

  switch (textSafeArea) {
    case "left":
      gradientDef = `
        <linearGradient id="textContrast" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#000000;stop-opacity:0.5"/>
          <stop offset="60%" style="stop-color:#000000;stop-opacity:0.2"/>
          <stop offset="100%" style="stop-color:#000000;stop-opacity:0"/>
        </linearGradient>
      `;
      rect = `<rect x="0" y="0" width="${THUMBNAIL_WIDTH * 0.55}" height="${THUMBNAIL_HEIGHT}" fill="url(#textContrast)"/>`;
      break;

    case "right":
      gradientDef = `
        <linearGradient id="textContrast" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" style="stop-color:#000000;stop-opacity:0.5"/>
          <stop offset="60%" style="stop-color:#000000;stop-opacity:0.2"/>
          <stop offset="100%" style="stop-color:#000000;stop-opacity:0"/>
        </linearGradient>
      `;
      rect = `<rect x="${THUMBNAIL_WIDTH * 0.45}" y="0" width="${THUMBNAIL_WIDTH * 0.55}" height="${THUMBNAIL_HEIGHT}" fill="url(#textContrast)"/>`;
      break;

    case "top":
      gradientDef = `
        <linearGradient id="textContrast" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#000000;stop-opacity:0.6"/>
          <stop offset="50%" style="stop-color:#000000;stop-opacity:0.2"/>
          <stop offset="100%" style="stop-color:#000000;stop-opacity:0"/>
        </linearGradient>
      `;
      rect = `<rect x="0" y="0" width="${THUMBNAIL_WIDTH}" height="${THUMBNAIL_HEIGHT * 0.5}" fill="url(#textContrast)"/>`;
      break;

    case "bottom":
      gradientDef = `
        <linearGradient id="textContrast" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" style="stop-color:#000000;stop-opacity:0.6"/>
          <stop offset="50%" style="stop-color:#000000;stop-opacity:0.2"/>
          <stop offset="100%" style="stop-color:#000000;stop-opacity:0"/>
        </linearGradient>
      `;
      rect = `<rect x="0" y="${THUMBNAIL_HEIGHT * 0.5}" width="${THUMBNAIL_WIDTH}" height="${THUMBNAIL_HEIGHT * 0.5}" fill="url(#textContrast)"/>`;
      break;

    case "center":
    default:
      // Vignette-style for centered text
      gradientDef = `
        <radialGradient id="textContrast" cx="50%" cy="50%" r="70%">
          <stop offset="0%" style="stop-color:#000000;stop-opacity:0.4"/>
          <stop offset="100%" style="stop-color:#000000;stop-opacity:0"/>
        </radialGradient>
      `;
      rect = `<rect x="0" y="0" width="${THUMBNAIL_WIDTH}" height="${THUMBNAIL_HEIGHT}" fill="url(#textContrast)"/>`;
      break;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${THUMBNAIL_WIDTH}" height="${THUMBNAIL_HEIGHT}" viewBox="0 0 ${THUMBNAIL_WIDTH} ${THUMBNAIL_HEIGHT}">
    <defs>${gradientDef}</defs>
    ${rect}
  </svg>`;
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
// NO FALLBACK RENDER
// ============================================

// Note: Fallback rendering has been removed.
// AI image generation is required. If it fails, an error is shown to the user.

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

  // Simple gradient for palette preview
  const gradientSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${palette.bg1};stop-opacity:1"/>
        <stop offset="100%" style="stop-color:${palette.bg2};stop-opacity:1"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <circle cx="${width * 0.75}" cy="${height * 0.5}" r="${height * 0.3}" fill="${palette.accent}" opacity="0.3"/>
  </svg>`;

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
    if (!baseImage) {
      throw new Error(`baseImage is null for item ${i}`);
    }
    const result = await renderThumbnail(baseImage, spec);
    results.push(result);
    onProgress?.(i + 1, items.length);
  }

  return results;
}

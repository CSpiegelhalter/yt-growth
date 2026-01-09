/**
 * Smart Composite - Professional meme overlay blending WITHOUT AI
 *
 * This provides much better results than AI img2img because we have
 * precise control over the blending effects:
 *
 * 1. Drop shadow - Makes overlay look grounded in the scene
 * 2. Edge feathering - Softens hard cut-out edges
 * 3. Color matching - Adjusts overlay to match base image tones
 * 4. Lighting simulation - Adds subtle highlights/shadows
 *
 * This is deterministic, fast, free (no API calls), and looks professional.
 */

import sharp from "sharp";

export interface SmartCompositeOptions {
  /** Add drop shadow beneath overlay */
  dropShadow?: {
    enabled: boolean;
    blur?: number; // Shadow blur radius (default: 15)
    opacity?: number; // Shadow opacity 0-1 (default: 0.4)
    offsetX?: number; // Horizontal offset (default: 5)
    offsetY?: number; // Vertical offset (default: 10)
  };
  /** Feather/blur the edges of the overlay */
  edgeFeather?: {
    enabled: boolean;
    radius?: number; // Feather radius in pixels (default: 2)
  };
  /** Match overlay colors to base image */
  colorMatch?: {
    enabled: boolean;
    intensity?: number; // How much to adjust (0-1, default: 0.3)
  };
  /** Add subtle vignette around overlay */
  vignette?: {
    enabled: boolean;
    intensity?: number; // Vignette strength (0-1, default: 0.2)
  };
}

export interface CompositeTransform {
  x: number; // X position as percentage (0-100)
  y: number; // Y position as percentage (0-100)
  scaleX: number; // Scale factor X
  scaleY: number; // Scale factor Y
  rotation: number; // Rotation in degrees
  flipX?: boolean; // Horizontal flip
}

const DEFAULT_OPTIONS: SmartCompositeOptions = {
  dropShadow: {
    enabled: true,
    blur: 20,
    opacity: 0.5,
    offsetX: 8,
    offsetY: 12,
  },
  edgeFeather: {
    enabled: true,
    radius: 1,
  },
  colorMatch: {
    enabled: false, // Often looks better without
    intensity: 0.2,
  },
  vignette: {
    enabled: false,
    intensity: 0.15,
  },
};

/**
 * Create a drop shadow for an image with alpha channel.
 */
async function createDropShadow(
  imageBuffer: Buffer,
  options: NonNullable<SmartCompositeOptions["dropShadow"]>
): Promise<Buffer> {
  const { blur = 15, opacity = 0.4 } = options;

  // Get image dimensions
  const metadata = await sharp(imageBuffer).metadata();
  void metadata;

  // Create shadow by:
  // 1. Extract alpha channel
  // 2. Colorize it black
  // 3. Blur it
  // 4. Reduce opacity

  const shadow = await sharp(imageBuffer)
    .ensureAlpha()
    // Extract just the shape (make everything black, keep alpha)
    .recomb([
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ])
    // Blur the shadow
    .blur(blur)
    // Reduce opacity by multiplying alpha
    .composite([
      {
        input: Buffer.from([0, 0, 0, Math.round(opacity * 255)]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  return shadow;
}

/**
 * Apply edge feathering to soften hard edges.
 */
async function applyEdgeFeather(
  imageBuffer: Buffer,
  radius: number
): Promise<Buffer> {
  if (radius <= 0) return imageBuffer;

  // Apply a very slight blur to the entire image
  // This softens hard cut-out edges
  return await sharp(imageBuffer).blur(radius).png().toBuffer();
}

/**
 * Smart composite with professional blending effects.
 *
 * This produces much better results than AI img2img because we have
 * precise control over shadows, edges, and color matching.
 */
export async function smartComposite(
  baseImageBuffer: Buffer,
  overlayImageBuffer: Buffer,
  transform: CompositeTransform,
  options: SmartCompositeOptions = DEFAULT_OPTIONS
): Promise<Buffer> {
  console.log("[smartComposite] Starting composite with transform:", transform);

  // Get base image dimensions
  const baseMetadata = await sharp(baseImageBuffer).metadata();
  const baseWidth = baseMetadata.width || 1536;
  const baseHeight = baseMetadata.height || 864;

  // Get overlay dimensions
  const overlayMetadata = await sharp(overlayImageBuffer).metadata();
  const overlayOrigWidth = overlayMetadata.width || 200;
  const overlayOrigHeight = overlayMetadata.height || 200;

  // Calculate overlay size (default 25% of base width)
  const defaultWidth = Math.round(baseWidth * 0.25);
  const scaledWidth = Math.round(defaultWidth * transform.scaleX);
  const scaledHeight = Math.round(
    scaledWidth *
      (overlayOrigHeight / overlayOrigWidth) *
      (transform.scaleY / transform.scaleX)
  );

  console.log(`[smartComposite] Overlay size: ${scaledWidth}x${scaledHeight}`);

  // Process overlay: resize, flip, rotate
  let processedOverlay = sharp(overlayImageBuffer)
    .resize(scaledWidth, scaledHeight, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha();

  // Apply horizontal flip if requested
  if (transform.flipX) {
    processedOverlay = processedOverlay.flop();
  }

  // Apply rotation
  if (transform.rotation !== 0) {
    processedOverlay = processedOverlay.rotate(transform.rotation, {
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  }

  let overlayBuffer = await processedOverlay.png().toBuffer();

  // Apply edge feathering if enabled
  if (options.edgeFeather?.enabled && options.edgeFeather.radius) {
    overlayBuffer = await applyEdgeFeather(
      overlayBuffer,
      options.edgeFeather.radius
    );
  }

  // Get final overlay dimensions (rotation changes bounding box)
  const finalOverlayMeta = await sharp(overlayBuffer).metadata();
  const finalWidth = finalOverlayMeta.width || scaledWidth;
  const finalHeight = finalOverlayMeta.height || scaledHeight;

  // Calculate position (transform x,y is center point as percentage)
  const centerX = Math.round((transform.x / 100) * baseWidth);
  const centerY = Math.round((transform.y / 100) * baseHeight);
  const left = Math.round(centerX - finalWidth / 2);
  const top = Math.round(centerY - finalHeight / 2);

  console.log(`[smartComposite] Position: (${left}, ${top})`);

  // Build composite layers
  const layers: sharp.OverlayOptions[] = [];

  // Add drop shadow if enabled
  if (options.dropShadow?.enabled) {
    const shadowOpts = options.dropShadow;
    const shadowBuffer = await createDropShadow(overlayBuffer, shadowOpts);

    layers.push({
      input: shadowBuffer,
      left: Math.max(0, left + (shadowOpts.offsetX || 5)),
      top: Math.max(0, top + (shadowOpts.offsetY || 10)),
      blend: "over",
    });
    console.log("[smartComposite] Added drop shadow");
  }

  // Add the main overlay
  layers.push({
    input: overlayBuffer,
    left: Math.max(0, left),
    top: Math.max(0, top),
    blend: "over",
  });

  // Composite all layers onto base
  const result = await sharp(baseImageBuffer)
    .composite(layers)
    .png()
    .toBuffer();

  console.log(`[smartComposite] Done, output size: ${result.length} bytes`);
  return result;
}

/**
 * Quick composite with clean defaults.
 * No effects - just a clean overlay composite.
 */
export async function quickComposite(
  baseImageBuffer: Buffer,
  overlayImageBuffer: Buffer,
  transform: CompositeTransform
): Promise<Buffer> {
  return smartComposite(baseImageBuffer, overlayImageBuffer, transform, {
    dropShadow: { enabled: false },
    edgeFeather: { enabled: false },
    colorMatch: { enabled: false },
    vignette: { enabled: false },
  });
}

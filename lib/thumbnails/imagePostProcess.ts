/**
 * Image Post-Processing Pipeline
 *
 * Applies deterministic style transformations to generated images.
 * Used primarily for styles like "deep fried" where the effect
 * should be STRONG and CONSISTENT regardless of the base image.
 *
 * Uses Sharp for high-performance image manipulation.
 */

import sharp from "sharp";
import type { PostProcessingStep } from "./stylePacks";

// ============================================
// TYPES
// ============================================

export interface PostProcessingResult {
  buffer: Buffer;
  mime: string;
  stepsApplied: string[];
  processingTimeMs: number;
}

// ============================================
// INDIVIDUAL EFFECTS
// ============================================

/**
 * Apply saturation adjustment.
 * intensity: 0 = grayscale, 50 = normal, 100 = very saturated
 */
async function applySaturation(
  image: sharp.Sharp,
  intensity: number
): Promise<sharp.Sharp> {
  // Convert intensity (0-100) to Sharp saturation multiplier
  // 50 = 1.0 (normal), 100 = 2.5 (very saturated), 0 = 0 (grayscale)
  const multiplier = intensity <= 50 ? intensity / 50 : 1 + ((intensity - 50) / 50) * 1.5;
  return image.modulate({ saturation: multiplier });
}

/**
 * Apply contrast adjustment.
 * intensity: 0 = flat, 50 = normal, 100 = extreme contrast
 */
async function applyContrast(
  image: sharp.Sharp,
  intensity: number
): Promise<sharp.Sharp> {
  // Use linear transform for contrast
  // intensity 50 = no change, 100 = 2x contrast
  const factor = intensity <= 50 ? intensity / 50 : 1 + ((intensity - 50) / 50);

  return image.linear(factor, -(128 * (factor - 1)));
}

/**
 * Apply brightness adjustment.
 * intensity: 0 = dark, 50 = normal, 100 = bright
 */
async function applyBrightness(
  image: sharp.Sharp,
  intensity: number
): Promise<sharp.Sharp> {
  // Convert to brightness multiplier
  const multiplier = intensity / 50;
  return image.modulate({ brightness: multiplier });
}

/**
 * Apply sharpening.
 * intensity: 0 = none, 50 = moderate, 100 = extreme
 */
async function applySharpen(
  image: sharp.Sharp,
  intensity: number
): Promise<sharp.Sharp> {
  if (intensity <= 0) return image;

  // Sharp's sharpen params: sigma (blur radius), flat (threshold), jagged (threshold for edges)
  const sigma = 0.5 + (intensity / 100) * 2; // 0.5 to 2.5
  const flat = Math.max(0.1, 1 - intensity / 100); // 1 to 0.1
  const jagged = 1 + (intensity / 100) * 3; // 1 to 4

  return image.sharpen({ sigma, m1: flat, m2: jagged });
}

/**
 * Apply blur.
 * intensity: 0 = none, 100 = very blurry
 */
async function applyBlur(
  image: sharp.Sharp,
  intensity: number
): Promise<sharp.Sharp> {
  if (intensity <= 0) return image;

  const sigma = (intensity / 100) * 10; // 0 to 10
  return image.blur(Math.max(0.3, sigma));
}

/**
 * Apply noise/grain.
 * intensity: 0 = none, 100 = heavy grain
 */
async function applyNoise(
  image: sharp.Sharp,
  intensity: number,
  options?: { type?: string }
): Promise<sharp.Sharp> {
  if (intensity <= 0) return image;
  void options;

  // For noise effect, we use gamma and contrast adjustments
  // Sharp doesn't support true noise overlay easily, so we simulate it
  // with gamma adjustments that create a grainy appearance
  const gamma = 1 + (intensity / 100) * 0.3; // 1.0 to 1.3
  return image.gamma(gamma);
}

/**
 * Apply JPEG compression artifacts.
 * intensity: 0 = none, 100 = extreme artifacts
 */
async function applyJpegArtifacts(
  image: sharp.Sharp,
  intensity: number
): Promise<sharp.Sharp> {
  if (intensity <= 0) return image;

  // Get current buffer
  const buffer = await image.toBuffer();

  // Compress with low quality JPEG, then decompress
  // Quality: 100 - intensity maps to 10-90 quality
  const quality = Math.max(10, Math.round(90 - (intensity / 100) * 80));

  const compressedBuffer = await sharp(buffer)
    .jpeg({ quality, chromaSubsampling: "4:2:0" })
    .toBuffer();

  // Re-import as PNG pipeline
  return sharp(compressedBuffer);
}

/**
 * Apply posterization (reduce color depth).
 * intensity: 0 = none, 100 = extreme posterization (few colors)
 */
async function applyPosterize(
  image: sharp.Sharp,
  intensity: number
): Promise<sharp.Sharp> {
  if (intensity <= 0) return image;

  // Map intensity to number of levels
  // Higher intensity = fewer levels = more posterized
  // intensity 0 = 256 levels, intensity 100 = 2 levels
  const levels = Math.max(2, Math.round(256 - (intensity / 100) * 250));

  // Sharp doesn't have native posterize, so we use linear transform
  // This approximates by crushing the color range
  const factor = levels / 256;
  const offset = (1 - factor) * 128;

  return image.linear(factor, offset);
}

/**
 * Apply chromatic aberration (RGB color fringing) simulation.
 * intensity: 0 = none, 100 = strong effect
 *
 * Note: True chromatic aberration requires complex channel manipulation.
 * This approximation uses saturation and slight color shift for a similar effect.
 */
async function applyChromaticAberration(
  image: sharp.Sharp,
  intensity: number
): Promise<sharp.Sharp> {
  if (intensity <= 0) return image;

  // Simulate chromatic aberration with saturation boost
  // Higher intensity = more color separation effect
  const saturationBoost = 1 + (intensity / 100) * 0.3; // 1.0 to 1.3

  return image.modulate({ saturation: saturationBoost });
}

/**
 * Apply gamma adjustment.
 * intensity maps to gamma: 50 = 1.0, 0 = 0.5 (darker), 100 = 2.0 (lighter)
 */
async function applyGamma(
  image: sharp.Sharp,
  intensity: number
): Promise<sharp.Sharp> {
  const gamma = 0.5 + (intensity / 100) * 1.5; // 0.5 to 2.0
  return image.gamma(gamma);
}

// ============================================
// MAIN PIPELINE EXECUTOR
// ============================================

/**
 * Apply a series of post-processing steps to an image.
 */
export async function applyPostProcessing(
  inputBuffer: Buffer,
  steps: PostProcessingStep[]
): Promise<PostProcessingResult> {
  const startTime = Date.now();
  const stepsApplied: string[] = [];

  if (steps.length === 0) {
    return {
      buffer: inputBuffer,
      mime: "image/png",
      stepsApplied: [],
      processingTimeMs: 0,
    };
  }

  console.log(`[imagePostProcess] Applying ${steps.length} post-processing steps`);

  let image = sharp(inputBuffer);

  for (const step of steps) {
    console.log(`[imagePostProcess] Applying ${step.type} at intensity ${step.intensity}`);

    switch (step.type) {
      case "saturation":
        image = await applySaturation(image, step.intensity);
        break;
      case "contrast":
        image = await applyContrast(image, step.intensity);
        break;
      case "brightness":
        image = await applyBrightness(image, step.intensity);
        break;
      case "sharpen":
        image = await applySharpen(image, step.intensity);
        break;
      case "blur":
        image = await applyBlur(image, step.intensity);
        break;
      case "noise":
        image = await applyNoise(image, step.intensity, step.options as { type?: string });
        break;
      case "jpeg_artifacts":
        image = await applyJpegArtifacts(image, step.intensity);
        break;
      case "posterize":
        image = await applyPosterize(image, step.intensity);
        break;
      case "chromatic_aberration":
        image = await applyChromaticAberration(image, step.intensity);
        break;
      case "gamma":
        image = await applyGamma(image, step.intensity);
        break;
      // outline and cel_shade would require more complex edge detection
      // For now, these are handled by prompt modifications
      case "outline":
      case "cel_shade":
        console.log(`[imagePostProcess] ${step.type} not implemented as post-process, using prompt`);
        break;
      default:
        console.warn(`[imagePostProcess] Unknown step type: ${step.type}`);
    }

    stepsApplied.push(`${step.type}:${step.intensity}`);
  }

  // Output as PNG
  const outputBuffer = await image.png().toBuffer();

  const processingTimeMs = Date.now() - startTime;
  console.log(`[imagePostProcess] Completed in ${processingTimeMs}ms, output: ${outputBuffer.length} bytes`);

  return {
    buffer: outputBuffer,
    mime: "image/png",
    stepsApplied,
    processingTimeMs,
  };
}

/**
 * Apply "deep fried" effect specifically.
 * This is a convenience function with EXTREME settings for maximum deep-fried effect.
 * Based on deepfriedmemes.com approach: multiple JPEG passes, extreme contrast/saturation.
 */
export async function applyDeepFriedEffect(
  inputBuffer: Buffer,
  strength: number = 100
): Promise<PostProcessingResult> {
  const startTime = Date.now();
  const stepsApplied: string[] = [];

  console.log(`[imagePostProcess] Applying EXTREME DEEP FRIED effect at strength ${strength}`);

  let image = sharp(inputBuffer);

  // Step 1: Lower brightness + MODERATE saturation (not too red)
  const satMultiplier = 1.6 + (strength / 100) * 0.6; // 1.6 to 2.2x saturation (reduced!)
  const brightness = 0.80 - (strength / 100) * 0.15; // 0.80 to 0.65 (darker)
  image = image.modulate({ saturation: satMultiplier, brightness });
  stepsApplied.push(`saturation:${Math.round(satMultiplier * 100)}`);
  stepsApplied.push(`brightness:${Math.round(brightness * 100)}`);

  // Step 2: HIGH contrast (crushed blacks, blown whites)
  const contrastFactor = 2.0 + (strength / 100) * 0.8; // 2.0 to 2.8x contrast
  image = image.linear(contrastFactor, -(128 * (contrastFactor - 1)));
  stepsApplied.push(`contrast:${Math.round(contrastFactor * 100)}`);

  // Step 3: Heavy sharpening (makes it crunchy)
  image = image.sharpen({ sigma: 4, m1: 0.3, m2: 6 });
  stepsApplied.push("sharpen:extreme");

  // Step 4: Add noise/grain for that deep fried texture
  image = image.gamma(1.5); // Crushes midtones, adds grit
  stepsApplied.push("gamma:150");

  // Step 5: Additional noise via blur-sharpen cycle (creates texture)
  let buffer = await image.blur(0.5).sharpen({ sigma: 2, m1: 0.5, m2: 4 }).toBuffer();
  image = sharp(buffer);
  stepsApplied.push("noise_texture:blur_sharpen");

  // Step 6: First JPEG compression pass (low quality = more artifacts)
  buffer = await image.jpeg({ quality: 15, chromaSubsampling: "4:2:0" }).toBuffer();
  stepsApplied.push("jpeg_pass_1:q15");

  // Step 6: Second JPEG compression pass (stacks artifacts)
  buffer = await sharp(buffer).jpeg({ quality: 8, chromaSubsampling: "4:2:0" }).toBuffer();
  stepsApplied.push("jpeg_pass_2:q8");

  // Step 7: Third JPEG compression pass (maximum crunch)
  buffer = await sharp(buffer).jpeg({ quality: 5, chromaSubsampling: "4:2:0" }).toBuffer();
  stepsApplied.push("jpeg_pass_3:q5");

  // Step 8: Fourth pass for extreme strength
  if (strength >= 80) {
    buffer = await sharp(buffer).jpeg({ quality: 3, chromaSubsampling: "4:2:0" }).toBuffer();
    stepsApplied.push("jpeg_pass_4:q3");
  }

  // Step 9: More saturation and LOWER brightness after compression
  image = sharp(buffer).modulate({ saturation: 1.8, brightness: 0.9 });
  stepsApplied.push("saturation_boost:180");
  stepsApplied.push("brightness_lower:90");

  // Step 10: Even more contrast punch (darker shadows, blown highlights)
  image = image.linear(1.5, -64);
  stepsApplied.push("contrast_punch:150");

  // Step 11: One more sharpen for that crunchy edge look
  image = image.sharpen({ sigma: 3, m1: 0.2, m2: 5 });
  stepsApplied.push("sharpen_final");

  // Step 12: Final gamma crush for that gritty look
  image = image.gamma(1.3);
  stepsApplied.push("gamma_crush:130");

  // Output as PNG to preserve the artifacts
  const outputBuffer = await image.png().toBuffer();

  const processingTimeMs = Date.now() - startTime;
  console.log(`[imagePostProcess] DEEP FRIED complete in ${processingTimeMs}ms`);
  console.log(`[imagePostProcess] Steps: ${stepsApplied.join(" → ")}`);

  return {
    buffer: outputBuffer,
    mime: "image/png",
    stepsApplied,
    processingTimeMs,
  };
}

/**
 * Apply cartoon enhancement effect.
 * Flattens colors and boosts contrast to make images look more cartoon-like.
 */
export async function applyCartoonEnhancement(
  inputBuffer: Buffer,
  strength: number = 70
): Promise<PostProcessingResult> {
  const startTime = Date.now();
  const stepsApplied: string[] = [];

  console.log(`[imagePostProcess] Applying CARTOON enhancement at strength ${strength}`);

  let image = sharp(inputBuffer);

  // Step 1: Boost contrast for cleaner edges
  const contrastFactor = 1.3 + (strength / 100) * 0.4; // 1.3 to 1.7
  image = image.linear(contrastFactor, -(128 * (contrastFactor - 1)));
  stepsApplied.push(`contrast:${Math.round(contrastFactor * 100)}`);

  // Step 2: Boost saturation for vivid cartoon colors
  const satMultiplier = 1.3 + (strength / 100) * 0.4; // 1.3 to 1.7
  image = image.modulate({ saturation: satMultiplier });
  stepsApplied.push(`saturation:${Math.round(satMultiplier * 100)}`);

  // Step 3: Posterize to flatten color gradients (key for cartoon look)
  // We simulate this by reducing color depth through JPEG then back to PNG
  if (strength >= 50) {
    const buffer = await image.jpeg({ quality: 70, chromaSubsampling: "4:2:0" }).toBuffer();
    image = sharp(buffer);
    stepsApplied.push("color_flatten:jpeg70");
  }

  // Step 4: Light sharpen to enhance edges
  image = image.sharpen({ sigma: 1.5, m1: 0.5, m2: 2 });
  stepsApplied.push("sharpen:edges");

  const outputBuffer = await image.png().toBuffer();

  const processingTimeMs = Date.now() - startTime;
  console.log(`[imagePostProcess] CARTOON enhancement complete in ${processingTimeMs}ms`);

  return {
    buffer: outputBuffer,
    mime: "image/png",
    stepsApplied,
    processingTimeMs,
  };
}

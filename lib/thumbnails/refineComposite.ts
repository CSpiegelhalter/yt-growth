/**
 * Refine Composite Image
 *
 * Uses Stability AI image-to-image with low strength to blend
 * a composited meme overlay into the thumbnail scene, making it
 * look more natural and integrated.
 */

import sharp from "sharp";

interface RefineOptions {
  /** Context about the desired style (e.g., "rage comic", "meme style") */
  context?: string;
  /** Whether to strongly preserve the composition (uses lower strength) */
  preserveComposition?: boolean;
}

interface RefineResult {
  buffer: Buffer;
  mime: string;
  width: number;
  height: number;
}

/**
 * Refine a composite image using Stability AI to blend elements together.
 *
 * @param compositeImage - The composited image buffer to refine
 * @param options - Refinement options
 * @returns Refined image or null if refinement fails/unavailable
 */
export async function refineCompositeImage(
  compositeImage: Buffer,
  options: RefineOptions = {}
): Promise<RefineResult | null> {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) {
    console.warn("[refineComposite] No STABILITY_API_KEY set, skipping refinement");
    return null;
  }

  const { context = "", preserveComposition = true } = options;

  // Use low strength to preserve the composition but blend elements
  // Lower = more like original, Higher = more AI interpretation
  const strength = preserveComposition ? 0.25 : 0.4;

  // Build refinement prompt
  const basePrompt = `High quality YouTube thumbnail. Seamlessly blend and harmonize all elements. Match lighting and shadows across the entire image. Ensure the face/character integrates naturally with the background. Maintain sharp focus on the subject. Professional, cohesive look.`;

  const styleContext = context
    ? ` Style: ${context}. Keep the existing artistic style consistent.`
    : "";

  const prompt = basePrompt + styleContext;

  console.log(`[refineComposite] Refining with strength ${strength}`);
  console.log(`[refineComposite] Prompt: ${prompt.slice(0, 100)}...`);

  // Prepare the image - Stability needs specific format
  const metadata = await sharp(compositeImage).metadata();
  const width = metadata.width || 1536;
  const height = metadata.height || 1024;

  // Ensure PNG format for Stability
  const pngBuffer = await sharp(compositeImage).png().toBuffer();

  // Create form data
  const formData = new FormData();
  const uint8Array = new Uint8Array(pngBuffer);
  const imageBlob = new Blob([uint8Array], { type: "image/png" });

  formData.append("image", imageBlob, "composite.png");
  formData.append("prompt", prompt);
  formData.append("strength", strength.toString());
  formData.append("output_format", "png");
  formData.append("mode", "image-to-image");

  try {
    const response = await fetch(
      "https://api.stability.ai/v2beta/stable-image/generate/sd3",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "image/*",
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(
        `[refineComposite] Stability API error ${response.status}:`,
        errorText
      );

      // Don't throw - just return null so we fall back to unrefined composite
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[refineComposite] Success, received ${buffer.length} bytes`);

    return {
      buffer,
      mime: "image/png",
      width,
      height,
    };
  } catch (error) {
    console.error(`[refineComposite] Failed:`, error);
    return null;
  }
}

/**
 * Check if refinement is available (API key is set).
 */
export function isRefinementAvailable(): boolean {
  return !!process.env.STABILITY_API_KEY;
}

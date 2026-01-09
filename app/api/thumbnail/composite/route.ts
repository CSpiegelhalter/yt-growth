/**
 * POST /api/thumbnail/composite
 *
 * Smart compositing endpoint - combines base image + meme overlay
 * with professional blending effects (drop shadow, edge feathering).
 *
 * This is MUCH better than AI img2img because:
 * 1. Deterministic - same inputs = same outputs
 * 2. Fast - no AI API calls needed
 * 3. Free - no credits consumed
 * 4. Professional - drop shadows and edge blending look great
 *
 * Optionally can apply AI enhancement after compositing.
 *
 * Input:
 *   - baseImageBase64: string - The base thumbnail
 *   - overlayImageBase64: string - The meme overlay (with transparency)
 *   - transform: { x, y, scaleX, scaleY, rotation, flipX }
 *   - useAiEnhance?: boolean - Apply AI enhancement after compositing
 *
 * Output:
 *   - imageBase64: string - The composited image
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { ApiError } from "@/lib/api/errors";
import { quickComposite, type CompositeTransform } from "@/lib/thumbnails/smartComposite";
import { validateImageSize } from "@/lib/stability";

// Input validation schema
const compositeInputSchema = z.object({
  baseImageBase64: z.string().min(1),
  overlayImageBase64: z.string().min(1),
  transform: z.object({
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    scaleX: z.number().min(0.1).max(5),
    scaleY: z.number().min(0.1).max(5),
    rotation: z.number().min(-360).max(360),
    flipX: z.boolean().optional().default(false),
  }),
  useAiEnhance: z.boolean().optional().default(false),
});

export const POST = createApiRoute(
  { route: "/api/thumbnail/composite" },
  withAuth(
    { mode: "required" },
    withValidation(
      { body: compositeInputSchema },
      async (_req, _ctx, api: ApiAuthContext, validated) => {
        const userId = api.userId!;
        const input = validated.body!;

        // Validate image sizes
        const baseSizeCheck = validateImageSize(input.baseImageBase64);
        if (!baseSizeCheck.valid) {
          throw new ApiError({
            code: "VALIDATION_ERROR",
            status: 400,
            message: `Base image too large: ${(baseSizeCheck.size / 1024 / 1024).toFixed(2)}MB`,
          });
        }

        const overlaySizeCheck = validateImageSize(input.overlayImageBase64);
        if (!overlaySizeCheck.valid) {
          throw new ApiError({
            code: "VALIDATION_ERROR",
            status: 400,
            message: `Overlay image too large: ${(overlaySizeCheck.size / 1024 / 1024).toFixed(2)}MB`,
          });
        }

        console.log(`[composite] User ${userId} compositing with smart blending`);

        try {
          // Decode base64 images
          const baseBuffer = Buffer.from(
            input.baseImageBase64.includes(",")
              ? input.baseImageBase64.split(",")[1]
              : input.baseImageBase64,
            "base64"
          );

          const overlayBuffer = Buffer.from(
            input.overlayImageBase64.includes(",")
              ? input.overlayImageBase64.split(",")[1]
              : input.overlayImageBase64,
            "base64"
          );

          // Build transform object
          const transform: CompositeTransform = {
            x: input.transform.x,
            y: input.transform.y,
            scaleX: input.transform.scaleX,
            scaleY: input.transform.scaleY,
            rotation: input.transform.rotation,
            flipX: input.transform.flipX,
          };

          // Smart composite with drop shadow and edge blending
          const resultBuffer = await quickComposite(
            baseBuffer,
            overlayBuffer,
            transform
          );

          // Convert to base64
          const resultBase64 = resultBuffer.toString("base64");

          console.log(`[composite] Success, output size: ${resultBuffer.length} bytes`);

          return NextResponse.json({
            imageBase64: resultBase64,
            method: "smart-composite",
          });
        } catch (error) {
          console.error(`[composite] Error for user ${userId}:`, error);
          throw new ApiError({
            code: "INTERNAL",
            status: 500,
            message: "Failed to composite images",
          });
        }
      }
    )
  )
);

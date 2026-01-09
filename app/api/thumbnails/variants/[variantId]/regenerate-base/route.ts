/**
 * POST /api/thumbnails/variants/:variantId/regenerate-base
 *
 * Regenerate the AI base scene image for a variant.
 * Keeps the overlay spec, just generates new background scene.
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { ApiError } from "@/lib/api/errors";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { parseSpecJson } from "@/lib/thumbnails/schemas";
import { regenerateBaseImage } from "@/lib/thumbnails/openaiImages";
import { renderThumbnail } from "@/lib/thumbnails/render";
import { getConceptMeta } from "@/lib/thumbnails/concepts";
import { getStorage, thumbnailKey } from "@/lib/storage";
import type { ThumbnailVariantResponse, ConceptPlan, ConceptSpec } from "@/lib/thumbnails/types";

const prisma = new PrismaClient();

// Stricter rate limit for AI regeneration
const REGENERATE_RATE_LIMIT = { limit: 5, windowSec: 600 }; // 5 per 10 min

const paramsSchema = z.object({
  variantId: z.string().uuid(),
});

export const POST = createApiRoute(
  { route: "/api/thumbnails/variants/[variantId]/regenerate-base" },
  withAuth(
    { mode: "required" },
    withRateLimit(
      {
        operation: "planGeneration", // Reuse key
        identifier: (api) => api.userId,
        config: REGENERATE_RATE_LIMIT,
      },
      withValidation(
        { params: paramsSchema },
        async (req: NextRequest, ctx, api: ApiAuthContext, validated) => {
          void req;
          void ctx;
          const userId = api.userId!;
          const { variantId } = validated.params!;

          // Fetch variant with job
          const variant = await prisma.thumbnailVariant.findUnique({
            where: { id: variantId },
            include: { Job: true },
          });

          if (!variant) {
            throw new ApiError({
              code: "NOT_FOUND",
              status: 404,
              message: "Variant not found",
            });
          }

          if (variant.Job.userId !== userId) {
            throw new ApiError({
              code: "FORBIDDEN",
              status: 403,
              message: "Access denied",
            });
          }

          // Parse plan and spec
          const planData = JSON.parse(variant.planJson);
          // Remove metadata before using as plan
          const { _meta, ...plan } = planData;
          const spec = parseSpecJson(variant.specJson) as ConceptSpec | null;

          if (!plan || !spec) {
            throw new ApiError({
              code: "INTERNAL",
              status: 500,
              message: "Invalid variant data",
            });
          }

          const storage = getStorage();

          // Regenerate base scene image
          const newBase = await regenerateBaseImage(plan as ConceptPlan);

          if (!newBase) {
            throw new ApiError({
              code: "INTERNAL",
              status: 500,
              message: "AI image generation failed. Please try again.",
            });
          }

          // Save new base image
          const newBaseKey = thumbnailKey("base", variant.jobId, variantId);
          await storage.put(newBaseKey, newBase.buffer, {
            contentType: newBase.mime,
          });

          // Render final with new base
          const finalImage = await renderThumbnail(newBase.buffer, spec);

          // Save final image
          const finalKey = thumbnailKey("final", variant.jobId, variantId);
          await storage.put(finalKey, finalImage.buffer, {
            contentType: finalImage.mime,
          });

          // Update variant record
          await prisma.thumbnailVariant.update({
            where: { id: variantId },
            data: {
              baseImageKey: newBaseKey,
              finalImageKey: finalKey,
            },
          });

          // Get concept metadata
          let conceptName: string | undefined;
          if (spec.plan?.conceptId) {
            const meta = getConceptMeta(spec.plan.conceptId);
            conceptName = meta.name;
          }

          const response: ThumbnailVariantResponse = {
            variantId,
            previewUrl: storage.getPublicUrl(finalKey),
            spec,
            conceptName,
          };

          return NextResponse.json(response);
        }
      )
    )
  )
);

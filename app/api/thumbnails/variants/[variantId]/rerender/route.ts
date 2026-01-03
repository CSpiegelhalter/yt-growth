/**
 * POST /api/thumbnails/variants/:variantId/rerender
 *
 * Fast re-render with edits (no AI).
 * Updates the overlay without regenerating the base image.
 * Supports editing: hookText, subHook, badges, symbols, highlights, palette.
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { ApiError } from "@/lib/api/errors";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { rerenderPatchSchema, parseSpecJson } from "@/lib/thumbnails/schemas";
import { rerenderOverlay, renderFallbackThumbnail } from "@/lib/thumbnails/render";
import { getConceptMeta } from "@/lib/thumbnails/concepts";
import { getStorage, thumbnailKey } from "@/lib/storage";
import type { ConceptSpec, ThumbnailVariantResponse } from "@/lib/thumbnails/types";

const prisma = new PrismaClient();

const paramsSchema = z.object({
  variantId: z.string().uuid(),
});

const bodySchema = z.object({
  patch: rerenderPatchSchema,
});

export const POST = createApiRoute(
  { route: "/api/thumbnails/variants/[variantId]/rerender" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: paramsSchema, body: bodySchema },
      async (req: NextRequest, ctx, api: ApiAuthContext, validated) => {
        const userId = api.userId!;
        const { variantId } = validated.params!;
        const { patch } = validated.body!;

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

        // Parse current spec
        const currentSpec = parseSpecJson(variant.specJson) as ConceptSpec | null;
        if (!currentSpec) {
          throw new ApiError({
            code: "INTERNAL",
            status: 500,
            message: "Invalid variant spec",
          });
        }

        // Apply patch to create new spec
        const newSpec: ConceptSpec = {
          ...currentSpec,
          // Text edits
          hookText: patch.hookText ?? currentSpec.hookText,
          subHook: patch.subHook ?? currentSpec.subHook,
          badgeText: patch.badgeText ?? currentSpec.badgeText,
          // Style edits
          palette: patch.palette
            ? { ...currentSpec.palette, ...patch.palette }
            : currentSpec.palette,
          align: patch.align ?? currentSpec.align,
          outline: patch.outline ?? currentSpec.outline,
          shadow: patch.shadow ?? currentSpec.shadow,
          // Overlay toggles
          showBadges: patch.showBadges ?? currentSpec.showBadges,
          showSymbol: patch.showSymbol ?? currentSpec.showSymbol,
          showHighlights: patch.showHighlights ?? currentSpec.showHighlights,
        };

        const storage = getStorage();

        // Re-render with new overlay
        let finalImage;
        if (variant.baseImageKey) {
          const baseObj = await storage.get(variant.baseImageKey);
          if (baseObj) {
            finalImage = await rerenderOverlay(baseObj.buffer, newSpec);
          }
        }

        if (!finalImage) {
          finalImage = await renderFallbackThumbnail(newSpec);
        }

        // Save new final image
        const newKey = thumbnailKey("final", variant.jobId, variantId);
        await storage.put(newKey, finalImage.buffer, {
          contentType: finalImage.mime,
        });

        // Update variant record
        await prisma.thumbnailVariant.update({
          where: { id: variantId },
          data: {
            specJson: JSON.stringify(newSpec),
            finalImageKey: newKey,
          },
        });

        // Get concept metadata
        let conceptName: string | undefined;
        if (newSpec.plan?.conceptId) {
          const meta = getConceptMeta(newSpec.plan.conceptId);
          conceptName = meta.name;
        }

        const response: ThumbnailVariantResponse = {
          variantId,
          previewUrl: storage.getPublicUrl(newKey),
          spec: newSpec,
          conceptName,
        };

        return NextResponse.json(response);
      }
    )
  )
);

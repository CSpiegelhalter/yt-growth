/**
 * POST /api/thumbnails/regenerate
 *
 * Regenerate thumbnails based on user edit request.
 * Takes a reference thumbnail and user feedback to generate new variants.
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { withRateLimit } from "@/lib/api/withRateLimit";
import { ApiError } from "@/lib/api/errors";
import { PrismaClient } from "@prisma/client";
import { editRequestSchema, type EditRequest } from "@/lib/thumbnails/editTypes";
import { buildEditIntent, generateEditVariants } from "@/lib/thumbnails/editIntent";
import { generateBaseImage } from "@/lib/thumbnails/openaiImages";
import { quickValidateImage } from "@/lib/thumbnails/validation";
import { getStorage, thumbnailKey } from "@/lib/storage";
import { parseSpecJson } from "@/lib/thumbnails/schemas";
import type { ConceptPlan, ConceptSpec, ThumbnailVariantResponse } from "@/lib/thumbnails/types";

const prisma = new PrismaClient();

// Stricter rate limit for regeneration
const REGENERATE_RATE_LIMIT = { limit: 10, windowSec: 600 }; // 10 per 10 min

export const POST = createApiRoute(
  { route: "/api/thumbnails/regenerate" },
  withAuth(
    { mode: "required" },
    withRateLimit(
      {
        operation: "thumbnailRegenerate",
        identifier: (api) => api.userId,
        config: REGENERATE_RATE_LIMIT,
      },
      withValidation(
        { body: editRequestSchema },
        async (req: NextRequest, ctx, api: ApiAuthContext, validated) => {
          void req;
          void ctx;
          const userId = api.userId!;
          const editRequest = validated.body!;

          // Fetch reference variant
          const referenceVariant = await prisma.thumbnailVariant.findUnique({
            where: { id: editRequest.referenceVariantId },
            include: { Job: true },
          });

          if (!referenceVariant) {
            throw new ApiError({
              code: "NOT_FOUND",
              status: 404,
              message: "Reference variant not found",
            });
          }

          if (referenceVariant.Job.userId !== userId) {
            throw new ApiError({
              code: "FORBIDDEN",
              status: 403,
              message: "Access denied",
            });
          }

          // Parse reference plan
          const planData = JSON.parse(referenceVariant.planJson);
          const { _meta, ...referencePlan } = planData;
          const referenceSpec = parseSpecJson(referenceVariant.specJson) as ConceptSpec | null;

          // Build edit intent from request
          const editIntent = buildEditIntent(editRequest as EditRequest, referencePlan as ConceptPlan);

          // Generate variant prompts
          const variantPrompts = generateEditVariants(editIntent, editRequest.variantCount);

          console.log(
            `[regenerate] Generating ${variantPrompts.length} variants from edit request`
          );

          // Create a new job for the regeneration
          const newJob = await prisma.thumbnailJob.create({
            data: {
              userId,
              inputJson: JSON.stringify({
                ...editRequest,
                type: "regeneration",
                referenceVariantId: editRequest.referenceVariantId,
              }),
              status: "generating",
              progress: 10,
              phase: "Generating from edit request...",
            },
          });

          const storage = getStorage();
          const generatedVariants: ThumbnailVariantResponse[] = [];
          let successCount = 0;
          let failCount = 0;

          // Generate each variant
          for (let i = 0; i < variantPrompts.length; i++) {
            const { prompt, negativePrompt, variationNote } = variantPrompts[i];

            console.log(
              `[regenerate] Generating variant ${i + 1}/${variantPrompts.length}: ${variationNote}`
            );

            try {
              // Build a plan-like object for the generator
              const editedPlan: ConceptPlan = {
                ...referencePlan,
                conceptId: referencePlan.conceptId || "clean-hero",
                hookText: editIntent.text.headline,
                basePrompt: prompt,
                negativePrompt: negativePrompt,
                palette: referenceSpec?.plan?.palette || {
                  bg1: "#1a1a2e",
                  bg2: "#16213e",
                  accent: "#f97316",
                  text: "#ffffff",
                },
                composition: referenceSpec?.plan?.composition || {
                  textSafeArea: editIntent.text.placement as "left" | "right" | "top" | "bottom" | "center",
                  focalSubjectPosition: "center",
                  backgroundComplexity: "medium",
                },
                subjects: editIntent.subject.description,
                emotionTone: "curious",
                overlayDirectives: referenceSpec?.plan?.overlayDirectives || {
                  badges: [],
                  highlights: [],
                  bigSymbol: "NONE",
                },
              };

              // Generate base image
              const image = await generateBaseImage(editedPlan, {
                maxRetries: 1,
                validateQuality: true,
              });

              if (image) {
                // Validate
                const validation = await quickValidateImage(image.buffer);

                if (validation.valid) {
                  // Create variant record
                  const variant = await prisma.thumbnailVariant.create({
                    data: {
                      jobId: newJob.id,
                      planJson: JSON.stringify({
                        ...editedPlan,
                        _meta: {
                          variationNote,
                          editRequest: editRequest,
                        },
                      }),
                      specJson: JSON.stringify({
                        plan: editedPlan,
                        hookText: editIntent.text.headline,
                      }),
                    },
                  });

                  // Store base image
                  const baseKey = thumbnailKey("base", newJob.id, variant.id);
                  await storage.put(baseKey, image.buffer, {
                    contentType: image.mime,
                  });

                  // For now, use base as final (AI generates complete thumbnail)
                  const finalKey = baseKey;

                  // Update variant with image keys
                  await prisma.thumbnailVariant.update({
                    where: { id: variant.id },
                    data: {
                      baseImageKey: baseKey,
                      finalImageKey: finalKey,
                    },
                  });

                  generatedVariants.push({
                    variantId: variant.id,
                    previewUrl: storage.getPublicUrl(finalKey),
                    spec: {
                      plan: editedPlan,
                      hookText: editIntent.text.headline,
                    },
                    conceptName: variationNote,
                  });

                  successCount++;
                } else {
                  console.warn(
                    `[regenerate] Variant ${i + 1} failed validation:`,
                    validation.format
                  );
                  failCount++;
                }
              } else {
                console.warn(`[regenerate] Variant ${i + 1} generation returned null`);
                failCount++;
              }
            } catch (err) {
              console.error(`[regenerate] Error generating variant ${i + 1}:`, err);
              failCount++;
            }

            // Update progress
            const progress = Math.round(10 + ((i + 1) / variantPrompts.length) * 80);
            await prisma.thumbnailJob.update({
              where: { id: newJob.id },
              data: {
                progress,
                phase: `Generated ${successCount}/${variantPrompts.length} variants...`,
              },
            });
          }

          // Final status
          const finalStatus = successCount > 0 ? "completed" : "failed";
          const finalMessage =
            successCount > 0
              ? `Generated ${successCount} thumbnails from edit request`
              : "All variants failed to generate";

          await prisma.thumbnailJob.update({
            where: { id: newJob.id },
            data: {
              status: finalStatus,
              progress: 100,
              phase: finalMessage,
              error: successCount === 0 ? "Generation failed for all variants" : null,
            },
          });

          console.log(
            `[regenerate] Complete: ${successCount} success, ${failCount} failed`
          );

          return NextResponse.json({
            jobId: newJob.id,
            status: finalStatus,
            message: finalMessage,
            variants: generatedVariants,
            successCount,
            failCount,
          });
        }
      )
    )
  )
);

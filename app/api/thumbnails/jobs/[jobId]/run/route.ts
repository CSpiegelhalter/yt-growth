/**
 * POST /api/thumbnails/jobs/:jobId/run
 *
 * Worker endpoint that advances the job through stages:
 * 1. Planning (LLM generates ConceptPlans with visual stories)
 * 2. Generating (AI creates scene-like base images with retry logic)
 * 3. Rendering (Sharp composites final thumbnails with rich fallbacks)
 *
 * Key improvements:
 * - Retry logic for AI generation failures
 * - Quality validation at each stage
 * - Rich fallback backgrounds (not just gradients)
 * - Detailed logging for debugging
 *
 * Safe to call multiple times (idempotent-ish).
 * Processes in batches to stay within Vercel limits.
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { ApiError } from "@/lib/api/errors";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { normalizeJobInput } from "@/lib/thumbnails/schemas";
import { generateConceptPlans } from "@/lib/thumbnails/llmPlanner";
import {
  generateStyledImage,
  getImageProvider,
} from "@/lib/thumbnails/imageProvider";
import { getStylePackIdsFromControls } from "@/lib/thumbnails/stylePacks";
import { rankConceptPlans, enforceDiversity } from "@/lib/thumbnails/scoring";
import { getConceptMeta } from "@/lib/thumbnails/concepts";
import { getStorage, thumbnailKey } from "@/lib/storage";
import { quickValidateImage } from "@/lib/thumbnails/validation";
import type { ConceptSpec } from "@/lib/thumbnails/types";
import {
  type GenerationControls,
  getDefaultControls,
} from "@/lib/thumbnails/generationControls";
import { getControlsSummary } from "@/lib/thumbnails/controlledPromptBuilder";

const prisma = new PrismaClient();

// Vercel function config
export const maxDuration = 60; // 60 seconds max

const paramsSchema = z.object({
  jobId: z.string().uuid(),
});

// Process fewer items per call to avoid timeout
// DALL-E takes 10-30 seconds per image, so only do 1-2 per call
const MAX_IMAGES_PER_CALL = 2; // Maximum images to generate in one /run call

export const POST = createApiRoute(
  { route: "/api/thumbnails/jobs/[jobId]/run" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: paramsSchema },
      async (req: NextRequest, ctx, api: ApiAuthContext, validated) => {
        void req;
        void ctx;
        const userId = api.userId!;
        const { jobId } = validated.params!;

        // Fetch job
        const job = await prisma.thumbnailJob.findUnique({
          where: { id: jobId },
          include: { Variants: true },
        });

        if (!job) {
          throw new ApiError({
            code: "NOT_FOUND",
            status: 404,
            message: "Job not found",
          });
        }

        if (job.userId !== userId) {
          throw new ApiError({
            code: "FORBIDDEN",
            status: 403,
            message: "Access denied",
          });
        }

        // Skip if already completed or failed
        if (job.status === "completed" || job.status === "failed") {
          return NextResponse.json({
            jobId: job.id,
            status: job.status,
            message: `Job already ${job.status}`,
          });
        }

        const input = normalizeJobInput(JSON.parse(job.inputJson));
        if (!input) {
          await updateJobStatus(jobId, "failed", 0, "Invalid job input");
          throw new ApiError({
            code: "VALIDATION_ERROR",
            status: 400,
            message: "Invalid job input",
          });
        }

        const storage = getStorage();

        try {
          // STAGE 1: Planning (Concept Generation)
          if (job.status === "queued" || job.status === "planning") {
            if (job.Variants.length === 0) {
              await updateJobStatus(
                jobId,
                "planning",
                5,
                "Analyzing video concept..."
              );

              // Get controls (from input or defaults)
              const controls: GenerationControls =
                input.controls ?? getDefaultControls();

              // Log the generation settings
              console.log(
                `[thumbnails/run] Generation controls: ${getControlsSummary(
                  controls
                )}`
              );

              // Generate concept plans (visual story approach) with controls
              let plans = await generateConceptPlans(
                input,
                input.count ?? 12,
                controls
              );

              // Enforce diversity - ensure variety in concepts
              plans = enforceDiversity(plans, 5);

              // Score and rank plans
              const ranked = rankConceptPlans(plans);

              await updateJobStatus(
                jobId,
                "planning",
                10,
                "Creating thumbnail variants..."
              );

              // Create variant records for each plan (in score order)
              for (const { plan, score, rank } of ranked) {
                const spec: ConceptSpec = { plan };
                const conceptMeta = getConceptMeta(plan.conceptId);

                await prisma.thumbnailVariant.create({
                  data: {
                    jobId,
                    planJson: JSON.stringify({
                      ...plan,
                      // Store scoring metadata
                      _meta: {
                        score: score.total,
                        rank,
                        conceptName: conceptMeta.name,
                      },
                    }),
                    specJson: JSON.stringify(spec),
                  },
                });
              }

              await updateJobStatus(
                jobId,
                "generating",
                15,
                "Plans created, generating scene images..."
              );
            }
          }

          // Re-fetch variants after planning
          const variants = await prisma.thumbnailVariant.findMany({
            where: { jobId },
            orderBy: { createdAt: "asc" },
          });

          // STAGE 2: Generate base images (scene-like, no text)
          // Process only a limited number per call to avoid timeout
          if (
            job.status === "queued" ||
            job.status === "planning" ||
            job.status === "generating"
          ) {
            const variantsNeedingBase = variants.filter((v) => !v.baseImageKey);
            let successCount = 0;
            let failCount = 0;
            let processedThisCall = 0;

            if (variantsNeedingBase.length > 0 && input.aiBase !== false) {
              const totalVariants = variants.length;
              const completedBefore =
                totalVariants - variantsNeedingBase.length;

              await updateJobStatus(
                jobId,
                "generating",
                Math.round(20 + (completedBefore / totalVariants) * 40),
                `Generating scene images (${completedBefore}/${totalVariants})...`
              );

              console.log(
                `[thumbnails/run] Starting AI generation: ${variantsNeedingBase.length} remaining, will process up to ${MAX_IMAGES_PER_CALL}`
              );

              // Only process up to MAX_IMAGES_PER_CALL per request to avoid timeout
              const toProcess = variantsNeedingBase.slice(
                0,
                MAX_IMAGES_PER_CALL
              );

              for (const variant of toProcess) {
                const planData = JSON.parse(variant.planJson);
                // Remove metadata before using as plan
                const { _meta, ...plan } = planData;

                console.log(
                  `[thumbnails/run] Generating base for variant ${variant.id}, concept: ${plan.conceptId}`
                );
                console.log(
                  `[thumbnails/run] LLM basePrompt: ${plan.basePrompt}`
                );

                // Get style packs from generation controls
                const generationControls =
                  input.controls ?? getDefaultControls();
                const stylePackIds =
                  getStylePackIdsFromControls(generationControls);
                const provider = getImageProvider();

                console.log(
                  `[thumbnails/run] Using image provider: ${provider.name}`
                );
                console.log(
                  `[thumbnails/run] Style packs: ${
                    stylePackIds.join(", ") || "none"
                  }`
                );

                // Generate with styled image generation (applies style packs + post-processing)
                const result = await generateStyledImage({
                  prompt: plan.basePrompt,
                  negativePrompt: plan.negativePrompt,
                  stylePackIds,
                });

                const image = { buffer: result.buffer, mime: result.mime };
                console.log(
                  `[thumbnails/run] Generation successful: ${
                    result.buffer.length
                  } bytes (${result.duration?.toFixed(1)}s)`
                );
                if (result.appliedStyles?.length) {
                  console.log(
                    `[thumbnails/run] Applied styles: ${result.appliedStyles.join(
                      ", "
                    )}`
                  );
                }
                if (result.postProcessingSteps?.length) {
                  console.log(
                    `[thumbnails/run] Post-processing: ${result.postProcessingSteps.join(
                      ", "
                    )}`
                  );
                }

                processedThisCall++;

                if (image) {
                  // Additional validation before storing
                  const validation = await quickValidateImage(image.buffer);

                  if (validation.valid) {
                    const key = thumbnailKey("base", jobId, variant.id);
                    await storage.put(key, image.buffer, {
                      contentType: image.mime,
                    });
                    await prisma.thumbnailVariant.update({
                      where: { id: variant.id },
                      data: { baseImageKey: key },
                    });
                    successCount++;
                    console.log(
                      `[thumbnails/run] Stored base image for variant ${variant.id}: ${image.buffer.length} bytes`
                    );
                  } else {
                    console.warn(
                      `[thumbnails/run] Generated image failed validation for variant ${variant.id}:`,
                      validation.format
                    );
                    // Mark as needing skip (no base image = will be skipped in render)
                    await prisma.thumbnailVariant.update({
                      where: { id: variant.id },
                      data: { baseImageKey: "__failed__" },
                    });
                    failCount++;
                  }
                } else {
                  console.log(
                    `[thumbnails/run] AI failed for variant ${variant.id}, marking as failed`
                  );
                  // Mark as failed so we don't retry forever
                  await prisma.thumbnailVariant.update({
                    where: { id: variant.id },
                    data: { baseImageKey: "__failed__" },
                  });
                  failCount++;
                }

                // Update progress after each image
                const newCompleted = completedBefore + processedThisCall;
                const progress = Math.round(
                  20 + (newCompleted / totalVariants) * 40
                );
                await updateJobStatus(
                  jobId,
                  "generating",
                  progress,
                  `Generating scene images (${newCompleted}/${totalVariants})...`
                );
              }

              console.log(
                `[thumbnails/run] This call: ${successCount} success, ${failCount} failed. More remaining: ${
                  variantsNeedingBase.length - processedThisCall > 0
                }`
              );

              // If more variants remain, return early - client will call again
              if (variantsNeedingBase.length - processedThisCall > 0) {
                return NextResponse.json({
                  jobId,
                  status: "generating",
                  message: `Generated ${processedThisCall} images, ${
                    variantsNeedingBase.length - processedThisCall
                  } remaining`,
                  needsMoreWork: true,
                });
              }
            }

            await updateJobStatus(
              jobId,
              "rendering",
              60,
              "Compositing final thumbnails..."
            );
          }

          // Re-fetch variants with base images
          const variantsWithBase = await prisma.thumbnailVariant.findMany({
            where: { jobId },
            orderBy: { createdAt: "asc" },
          });

          // STAGE 3: Finalize thumbnails
          // AI generates complete thumbnails - just copy base to final
          const variantsNeedingFinalize = variantsWithBase.filter(
            (v) =>
              !v.finalImageKey &&
              v.baseImageKey &&
              v.baseImageKey !== "__failed__"
          );
          const variantsFailed = variantsWithBase.filter(
            (v) => v.baseImageKey === "__failed__"
          );
          let finalizeSuccessCount = 0;
          let finalizeFailCount = 0;

          if (variantsFailed.length > 0) {
            console.log(
              `[thumbnails/run] ${variantsFailed.length} variants failed AI generation and will be skipped`
            );
          }

          if (variantsNeedingFinalize.length > 0) {
            const totalToFinalize = variantsNeedingFinalize.length;
            console.log(
              `[thumbnails/run] Finalizing ${totalToFinalize} AI-generated thumbnails`
            );

            // Process finalizations (just copying base to final - very fast)
            for (let i = 0; i < variantsNeedingFinalize.length; i++) {
              const variant = variantsNeedingFinalize[i];

              // Must have base image
              if (
                !variant.baseImageKey ||
                variant.baseImageKey === "__failed__"
              ) {
                console.error(
                  `[thumbnails/run] No base image for variant ${variant.id} - skipping`
                );
                finalizeFailCount++;
                continue;
              }

              // AI generates complete thumbnail - use base image as final
              // No compositor overlay needed
              console.log(
                `[thumbnails/run] Using AI-generated image as final for variant ${variant.id}`
              );

              try {
                // Just use the base image key as the final image key
                // The AI generated the complete thumbnail including text
                await prisma.thumbnailVariant.update({
                  where: { id: variant.id },
                  data: { finalImageKey: variant.baseImageKey },
                });

                finalizeSuccessCount++;
                console.log(`[thumbnails/run] Finalized variant ${variant.id}`);
              } catch (err) {
                console.error(
                  `[thumbnails/run] Finalize failed for variant ${variant.id}:`,
                  err
                );
                finalizeFailCount++;
              }

              const progress =
                60 + Math.round(((i + 1) / totalToFinalize) * 35);
              await updateJobStatus(
                jobId,
                "rendering",
                progress,
                `Finalizing thumbnails (${i + 1}/${totalToFinalize})...`
              );
            }

            console.log(
              `[thumbnails/run] Finalize complete: ${finalizeSuccessCount} success, ${finalizeFailCount} failed`
            );
          }

          // Re-check all variants for final status
          const finalVariants = await prisma.thumbnailVariant.findMany({
            where: { jobId },
          });

          const successfulVariants = finalVariants.filter(
            (v) => v.finalImageKey && v.finalImageKey !== "__failed__"
          ).length;
          const failedVariants = finalVariants.filter(
            (v) =>
              v.baseImageKey === "__failed__" ||
              (!v.finalImageKey && v.baseImageKey)
          ).length;
          const totalVariants = finalVariants.length;

          console.log(
            `[thumbnails/run] Final status: ${successfulVariants} success, ${failedVariants} failed, ${totalVariants} total`
          );

          if (successfulVariants === 0 && totalVariants > 0) {
            // All variants failed - this is an error
            await updateJobStatus(
              jobId,
              "failed",
              95,
              "All variants failed",
              "AI image generation failed for all variants. Please check your OpenAI API key and try again."
            );
            throw new ApiError({
              code: "INTERNAL",
              status: 500,
              message: "AI image generation failed for all variants",
            });
          }

          // Mark completed
          const message =
            failedVariants > 0
              ? `Done! ${successfulVariants} thumbnails generated (${failedVariants} failed)`
              : "Done!";
          await updateJobStatus(jobId, "completed", 100, message);

          return NextResponse.json({
            jobId,
            status: "completed",
            message: "Job completed successfully",
          });
        } catch (err) {
          console.error("[thumbnails/run] Error:", err);
          await updateJobStatus(
            jobId,
            "failed",
            job.progress,
            err instanceof Error ? err.message : "Unknown error"
          );
          throw new ApiError({
            code: "INTERNAL",
            status: 500,
            message: "Job processing failed",
          });
        }
      }
    )
  )
);

/**
 * Helper to update job status.
 * Phase is limited to 64 chars (VarChar(64) in schema).
 * Error can be longer (Text field).
 */
async function updateJobStatus(
  jobId: string,
  status: string,
  progress: number,
  phase: string,
  errorMessage?: string
): Promise<void> {
  // Truncate phase to 64 chars (database limit)
  const truncatedPhase = phase.length > 60 ? phase.slice(0, 57) + "..." : phase;

  await prisma.thumbnailJob.update({
    where: { id: jobId },
    data: {
      status,
      progress,
      phase: truncatedPhase,
      error: status === "failed" ? errorMessage || phase : null,
    },
  });
}

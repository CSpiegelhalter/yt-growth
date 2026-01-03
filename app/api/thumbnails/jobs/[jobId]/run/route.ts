/**
 * POST /api/thumbnails/jobs/:jobId/run
 *
 * Worker endpoint that advances the job through stages:
 * 1. Planning (LLM generates ConceptPlans with visual stories)
 * 2. Generating (AI creates scene-like base images)
 * 3. Rendering (Sharp composites final thumbnails with attention overlays)
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
import { normalizeJobInput, parseSpecJson } from "@/lib/thumbnails/schemas";
import { generateConceptPlans } from "@/lib/thumbnails/llmPlanner";
import { generateBaseImage } from "@/lib/thumbnails/openaiImages";
import { renderThumbnail, renderFallbackThumbnail } from "@/lib/thumbnails/render";
import { rankConceptPlans, enforceDiversity } from "@/lib/thumbnails/scoring";
import { getConceptMeta } from "@/lib/thumbnails/concepts";
import { getStorage, thumbnailKey } from "@/lib/storage";
import type { ConceptPlan, ConceptSpec, ThumbnailJobInput } from "@/lib/thumbnails/types";

const prisma = new PrismaClient();

// Vercel function config
export const maxDuration = 60; // 60 seconds max

const paramsSchema = z.object({
  jobId: z.string().uuid(),
});

// Batch size for concurrent operations (keep low for memory)
const BATCH_SIZE = 2;

export const POST = createApiRoute(
  { route: "/api/thumbnails/jobs/[jobId]/run" },
  withAuth(
    { mode: "required" },
    withValidation(
      { params: paramsSchema },
      async (req: NextRequest, ctx, api: ApiAuthContext, validated) => {
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
              await updateJobStatus(jobId, "planning", 5, "Analyzing video concept...");

              // Generate concept plans (visual story approach)
              let plans = await generateConceptPlans(input, input.count ?? 12);

              // Enforce diversity - ensure variety in concepts
              plans = enforceDiversity(plans, 5);

              // Score and rank plans
              const ranked = rankConceptPlans(plans);

              await updateJobStatus(jobId, "planning", 10, "Creating thumbnail variants...");

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

              await updateJobStatus(jobId, "generating", 15, "Plans created, generating scene images...");
            }
          }

          // Re-fetch variants after planning
          const variants = await prisma.thumbnailVariant.findMany({
            where: { jobId },
            orderBy: { createdAt: "asc" },
          });

          // STAGE 2: Generate base images (scene-like, no text)
          if (job.status === "queued" || job.status === "planning" || job.status === "generating") {
            const variantsNeedingBase = variants.filter((v) => !v.baseImageKey);

            if (variantsNeedingBase.length > 0 && input.aiBase !== false) {
              await updateJobStatus(
                jobId,
                "generating",
                20,
                `Generating scene images (0/${variantsNeedingBase.length})...`
              );

              // Process in batches
              for (let i = 0; i < variantsNeedingBase.length; i += BATCH_SIZE) {
                const batch = variantsNeedingBase.slice(i, i + BATCH_SIZE);

                await Promise.all(
                  batch.map(async (variant) => {
                    const planData = JSON.parse(variant.planJson);
                    // Remove metadata before using as plan
                    const { _meta, ...plan } = planData;
                    const image = await generateBaseImage(plan as ConceptPlan);

                    if (image) {
                      const key = thumbnailKey("base", jobId, variant.id);
                      await storage.put(key, image.buffer, {
                        contentType: image.mime,
                      });
                      await prisma.thumbnailVariant.update({
                        where: { id: variant.id },
                        data: { baseImageKey: key },
                      });
                    }
                    // If image generation fails, we'll use fallback in rendering
                    // Fallbacks still have attention overlays (arrows, badges, etc.)
                  })
                );

                const progress = 20 + Math.round(((i + batch.length) / variantsNeedingBase.length) * 40);
                await updateJobStatus(
                  jobId,
                  "generating",
                  progress,
                  `Generating scene images (${Math.min(i + BATCH_SIZE, variantsNeedingBase.length)}/${variantsNeedingBase.length})...`
                );
              }
            }

            await updateJobStatus(jobId, "rendering", 60, "Compositing final thumbnails...");
          }

          // Re-fetch variants with base images
          const variantsWithBase = await prisma.thumbnailVariant.findMany({
            where: { jobId },
            orderBy: { createdAt: "asc" },
          });

          // STAGE 3: Render final thumbnails (base + attention overlays + hook text)
          const variantsNeedingRender = variantsWithBase.filter((v) => !v.finalImageKey);

          if (variantsNeedingRender.length > 0) {
            for (let i = 0; i < variantsNeedingRender.length; i += BATCH_SIZE) {
              const batch = variantsNeedingRender.slice(i, i + BATCH_SIZE);

              await Promise.all(
                batch.map(async (variant) => {
                  const spec = parseSpecJson(variant.specJson) as ConceptSpec | null;
                  if (!spec) return;

                  let finalImage;

                  if (variant.baseImageKey) {
                    // Render with AI base scene
                    const baseObj = await storage.get(variant.baseImageKey);
                    if (baseObj) {
                      finalImage = await renderThumbnail(baseObj.buffer, spec);
                    }
                  }

                  // Fallback if no base or render failed
                  // Note: Fallback still applies full concept overlay (not just gradient)
                  if (!finalImage) {
                    finalImage = await renderFallbackThumbnail(spec);
                  }

                  if (finalImage) {
                    const key = thumbnailKey("final", jobId, variant.id);
                    await storage.put(key, finalImage.buffer, {
                      contentType: finalImage.mime,
                    });
                    await prisma.thumbnailVariant.update({
                      where: { id: variant.id },
                      data: { finalImageKey: key },
                    });
                  }
                })
              );

              const progress = 60 + Math.round(((i + batch.length) / variantsNeedingRender.length) * 35);
              await updateJobStatus(
                jobId,
                "rendering",
                progress,
                `Compositing thumbnails (${Math.min(i + BATCH_SIZE, variantsNeedingRender.length)}/${variantsNeedingRender.length})...`
              );
            }
          }

          // Mark completed
          await updateJobStatus(jobId, "completed", 100, "Done!");

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
 */
async function updateJobStatus(
  jobId: string,
  status: string,
  progress: number,
  phase: string
): Promise<void> {
  await prisma.thumbnailJob.update({
    where: { id: jobId },
    data: {
      status,
      progress,
      phase,
      error: status === "failed" ? phase : null,
    },
  });
}

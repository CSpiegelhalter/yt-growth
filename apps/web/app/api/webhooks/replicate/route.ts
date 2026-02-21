/**
 * POST /api/webhooks/replicate
 *
 * Handle Replicate webhook events for training and prediction completion.
 *
 * Auth: Replicate webhook signature verification
 *
 * IMPORTANT: This is an externally-invoked webhook endpoint.
 * Do not wrap with createApiRoute/withAuth — Replicate calls this directly.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma";
import { verifyReplicateWebhook } from "@/lib/replicate/webhook";
import { processTrainingWebhook } from "@/lib/features/identity";
import { processPredictionWebhook } from "@/lib/features/thumbnails";
import { createLogger } from "@/lib/shared/logger";

export const runtime = "nodejs";

const log = createLogger({ route: "/api/webhooks/replicate" });

type ReplicateWebhookPayload = {
  id?: string;
  status?: string;
  error?: string | null;
  output?: unknown;
};

export async function POST(req: NextRequest) {
  const payloadText = await req.text();
  try {
    verifyReplicateWebhook({ payload: payloadText, headers: req.headers });
  } catch (err) {
    log.warn("Webhook verification failed", {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let payload: ReplicateWebhookPayload;
  try {
    payload = JSON.parse(payloadText) as ReplicateWebhookPayload;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const id = payload.id;
  const status = payload.status;
  if (!id || !status) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Idempotency guard
  const eventId = `replicate:${id}:${status}`;
  const already = await prisma.replicateWebhookEvent
    .create({ data: { id: eventId } })
    .then(() => false)
    .catch(() => true);

  if (already) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  // Training webhook?
  const model = await prisma.userModel.findFirst({
    where: { trainingId: id },
  });
  if (model) {
    await processTrainingWebhook({
      trainingId: id,
      status,
      error: payload.error,
      output: payload.output,
    });
    return NextResponse.json({ ok: true, type: "training" });
  }

  // Prediction webhook?
  const pred = await prisma.thumbnailJobPrediction.findUnique({
    where: { replicatePredictionId: id },
  });
  if (pred) {
    await processPredictionWebhook({
      predictionId: id,
      status,
      output: payload.output,
    });
    return NextResponse.json({ ok: true, type: "prediction" });
  }

  return NextResponse.json({ ok: true, type: "unknown" });
}

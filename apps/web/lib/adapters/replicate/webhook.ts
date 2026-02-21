/**
 * Replicate Adapter — webhook signature verification.
 *
 * Supports two modes:
 * 1) Signed webhooks (preferred): HMAC SHA-256 with timestamp.
 * 2) Shared secret header (fallback): static secret comparison.
 *
 * Fails closed in production when neither is configured.
 */

import "server-only";
import crypto from "crypto";
import { timingSafeEqualHex } from "@/lib/shared/crypto";
import type { WebhookVerificationInput } from "@/lib/ports/ReplicatePort";

const TOLERANCE_SECONDS = 5 * 60;

function verifySigned(payload: string, signatureHeader: string) {
  const SIGNING_SECRET = process.env.REPLICATE_WEBHOOK_SIGNING_SECRET;
  if (!SIGNING_SECRET) {
    throw new Error("REPLICATE_WEBHOOK_SIGNING_SECRET not configured");
  }
  if (!signatureHeader) {
    throw new Error("Missing Replicate signature header");
  }

  if (signatureHeader.includes("t=") && signatureHeader.includes("v1=")) {
    const parts = signatureHeader.split(",").map((p) => p.trim());
    const tPart = parts.find((p) => p.startsWith("t="));
    const v1Parts = parts.filter((p) => p.startsWith("v1="));
    const tsRaw = tPart?.slice(2) ?? "";
    const timestamp = Number(tsRaw);
    if (!Number.isFinite(timestamp) || timestamp <= 0) {
      throw new Error("Invalid Replicate signature timestamp");
    }

    const age = Math.abs(Date.now() / 1000 - timestamp);
    if (age > TOLERANCE_SECONDS) {
      throw new Error("Replicate signature timestamp outside tolerance");
    }

    const signedPayload = `${timestamp}.${payload}`;
    const expected = crypto
      .createHmac("sha256", SIGNING_SECRET)
      .update(signedPayload, "utf8")
      .digest("hex");

    const provided = v1Parts.map((p) => p.slice(3)).filter(Boolean);
    const ok = provided.some((sig) => timingSafeEqualHex(sig, expected));
    if (!ok) throw new Error("Invalid Replicate webhook signature");
    return;
  }

  const expected = crypto
    .createHmac("sha256", SIGNING_SECRET)
    .update(payload, "utf8")
    .digest("hex");

  const cleaned = signatureHeader.replace(/^sha256=/i, "").trim();
  if (!timingSafeEqualHex(cleaned, expected)) {
    throw new Error("Invalid Replicate webhook signature");
  }
}

/**
 * Verify a Replicate webhook request is authentic.
 * Throws if verification fails (when configured).
 *
 * Fails closed in production; allows unverified requests in dev/test.
 */
export function verifyReplicateWebhook(input: WebhookVerificationInput) {
  const SIGNING_SECRET = process.env.REPLICATE_WEBHOOK_SIGNING_SECRET;
  const SHARED_SECRET = process.env.REPLICATE_WEBHOOK_SHARED_SECRET;

  const signature =
    input.headers.get("x-replicate-signature") ??
    input.headers.get("replicate-signature") ??
    input.headers.get("webhook-signature") ??
    "";

  const shared =
    input.headers.get("x-webhook-secret") ??
    input.headers.get("x-replicate-webhook-secret") ??
    "";

  if (SIGNING_SECRET) {
    verifySigned(input.payload, signature);
    return;
  }

  if (SHARED_SECRET) {
    if (!shared) throw new Error("Missing webhook secret header");
    if (shared !== SHARED_SECRET)
      throw new Error("Invalid webhook secret header");
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Webhook verification not configured");
  }
}

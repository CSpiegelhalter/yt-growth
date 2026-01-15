import crypto from "crypto";

/**
 * Replicate webhook verification.
 *
 * We support two modes:
 * 1) Signed webhooks (preferred): HMAC SHA-256 similar to Stripe.
 *    Header format (supported):
 *    - "t=timestamp,v1=hexsig[,v1=hexsig2...]"
 *    - OR a raw hex signature in "X-Replicate-Signature"
 *
 * 2) Shared secret header (fallback): "x-webhook-secret" must match env.
 *
 * This is intentionally strict: if env is configured, verification must pass.
 */

// Stripe-like timestamp tolerance to mitigate replay attacks
const TOLERANCE_SECONDS = 5 * 60;

function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

function verifySigned(payload: string, signatureHeader: string) {
  const SIGNING_SECRET = process.env.REPLICATE_WEBHOOK_SIGNING_SECRET;
  if (!SIGNING_SECRET) {
    throw new Error("REPLICATE_WEBHOOK_SIGNING_SECRET not configured");
  }
  if (!signatureHeader) {
    throw new Error("Missing Replicate signature header");
  }

  // Stripe-like format: "t=...,v1=..."
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

  // Raw hex signature: HMAC(secret, payload)
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
 * Throws if verification fails (when configured).
 *
 * If neither signing nor shared secret is configured, we fail closed in production,
 * but allow in development/test to unblock local iteration.
 */
export function verifyReplicateWebhook(input: {
  payload: string;
  headers: Headers;
}) {
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

  // Preferred: signed verification
  if (SIGNING_SECRET) {
    verifySigned(input.payload, signature);
    return;
  }

  // Fallback: shared secret
  if (SHARED_SECRET) {
    if (!shared) throw new Error("Missing webhook secret header");
    if (shared !== SHARED_SECRET) throw new Error("Invalid webhook secret header");
    return;
  }

  // Fail-closed in production-like environments
  if (process.env.NODE_ENV === "production") {
    throw new Error("Webhook verification not configured");
  }
}


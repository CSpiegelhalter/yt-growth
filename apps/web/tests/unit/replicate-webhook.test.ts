import { describe, test, expect, beforeEach } from "bun:test";
import crypto from "crypto";
import { verifyReplicateWebhook } from "@/lib/replicate/webhook";

function makeHeaders(obj: Record<string, string>): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(obj)) {h.set(k, v);}
  return h;
}

describe("verifyReplicateWebhook", () => {
  beforeEach(() => {
    delete process.env.REPLICATE_WEBHOOK_SIGNING_SECRET;
    delete process.env.REPLICATE_WEBHOOK_SHARED_SECRET;
    // NODE_ENV is read-only in TS strict mode; tests already run in non-production env
  });

  test("allows when not configured outside production", () => {
    const payload = JSON.stringify({ ok: true });
    expect(() =>
      verifyReplicateWebhook({ payload, headers: makeHeaders({}) })
    ).not.toThrow();
  });

  test("shared secret verification works", () => {
    process.env.REPLICATE_WEBHOOK_SHARED_SECRET = "shh";
    const payload = JSON.stringify({ id: "x", status: "succeeded" });
    expect(() =>
      verifyReplicateWebhook({
        payload,
        headers: makeHeaders({ "x-webhook-secret": "shh" }),
      })
    ).not.toThrow();

    expect(() =>
      verifyReplicateWebhook({
        payload,
        headers: makeHeaders({ "x-webhook-secret": "nope" }),
      })
    ).toThrow();
  });

  test("signed (stripe-like) verification works", () => {
    process.env.REPLICATE_WEBHOOK_SIGNING_SECRET = "sign";
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify({ id: "x", status: "succeeded" });
    const signedPayload = `${timestamp}.${payload}`;
    const sig = crypto.createHmac("sha256", "sign").update(signedPayload, "utf8").digest("hex");

    const header = `t=${timestamp},v1=${sig}`;
    expect(() =>
      verifyReplicateWebhook({
        payload,
        headers: makeHeaders({ "x-replicate-signature": header }),
      })
    ).not.toThrow();

    expect(() =>
      verifyReplicateWebhook({
        payload,
        headers: makeHeaders({ "x-replicate-signature": `t=${timestamp},v1=deadbeef` }),
      })
    ).toThrow();
  });
});


import { describe, test, expect } from "bun:test";
import { buildThumbnailPrompt } from "@/lib/server/prompting/buildThumbnailPrompt";

describe("buildThumbnailPrompt (workflow v2)", () => {
  test("starts with style trigger and includes no-text constraints", async () => {
    const out = await buildThumbnailPrompt({
      style: "object",
      styleTriggerWord: "OBJECT",
      userText: "a gaming mouse with dramatic lighting",
      variants: 1,
    });

    expect(out.variants.length).toBe(1);
    const p = out.variants[0].finalPrompt;
    expect(p.startsWith("OBJECT ")).toBe(true);
    expect(p.toLowerCase()).toContain("youtube thumbnail");
    expect(p.toLowerCase()).toContain("no text");
    expect(p.toLowerCase()).toContain("no watermark");
  });

  test("identity trigger comes immediately after style trigger", async () => {
    const out = await buildThumbnailPrompt({
      style: "subject",
      styleTriggerWord: "SUBJECT",
      identityTriggerWord: "ID_ABC123",
      userText: "a creator reacting to a graph spike",
      variants: 1,
    });

    const p = out.variants[0].finalPrompt;
    expect(p.startsWith("SUBJECT ID_ABC123 YouTube thumbnail")).toBe(true);
  });

  test("COMPARE is at both start and end", async () => {
    const out = await buildThumbnailPrompt({
      style: "compare",
      styleTriggerWord: "COMPARE",
      userText: "a cheap mic vs expensive mic on split background",
      variants: 1,
    });

    const p = out.variants[0].finalPrompt;
    expect(p.startsWith("COMPARE ")).toBe(true);
    expect(p.trim().endsWith("COMPARE")).toBe(true);
  });

  test("clamps prompt length", async () => {
    const out = await buildThumbnailPrompt({
      style: "object",
      styleTriggerWord: "OBJECT",
      userText: "A".repeat(2000),
      variants: 1,
    });
    expect(out.variants[0].finalPrompt.length).toBeLessThanOrEqual(700);
  });
});


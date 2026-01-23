import { describe, test, expect } from "bun:test";
import { editorStateV1Schema, defaultEditorState } from "@/lib/thumbnails-v2/editorState";

describe("editorState schema", () => {
  test("round-trips default state", () => {
    const state = defaultEditorState();
    const parsed = editorStateV1Schema.parse(state);
    expect(parsed.version).toBe(1);
    expect(parsed.canvas.width).toBe(1280);
    expect(parsed.canvas.height).toBe(720);
  });

  test("rejects wrong canvas size", () => {
    const bad = {
      ...defaultEditorState(),
      canvas: { width: 1000, height: 720 },
    };
    expect(() => editorStateV1Schema.parse(bad)).toThrow();
  });
});


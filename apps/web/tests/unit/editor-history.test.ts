import { describe, test, expect } from "bun:test";
import { historyReducer } from "@/app/(app)/thumbnails/editor/[projectId]/components/hooks/useEditorHistory";
import type { HistoryState } from "@/app/(app)/thumbnails/editor/[projectId]/components/types";
import { DEFAULT_DOCUMENT } from "@/app/(app)/thumbnails/editor/[projectId]/components/types";

function createInitialState(): HistoryState {
  return {
    past: [],
    present: {
      document: DEFAULT_DOCUMENT,
      timestamp: Date.now(),
    },
    future: [],
    maxSize: 50,
  };
}

describe("historyReducer", () => {
  test("SET action adds current state to past and clears future", () => {
    const initial = createInitialState();
    const newDoc = {
      ...DEFAULT_DOCUMENT,
      objects: [
        {
          id: "test-1",
          type: "text" as const,
          x: 100,
          y: 100,
          rotation: 0,
          zIndex: 1,
          opacity: 1,
          text: "Hello",
          fontFamily: "Inter",
          fontSize: 64,
          fontWeight: "700",
          letterSpacing: 0,
          lineHeight: 1.1,
          textAlign: "left" as const,
          fill: "#FFFFFF",
          stroke: "#000000",
          strokeWidth: 0,
          shadowEnabled: false,
          shadowColor: "#000000",
          shadowBlur: 0,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
          backgroundEnabled: false,
          backgroundColor: "#000000",
          backgroundPadding: 0,
          backgroundRadius: 0,
        },
      ],
    };

    const result = historyReducer(initial, { type: "SET", document: newDoc });

    expect(result.past.length).toBe(1);
    expect(result.present.document.objects.length).toBe(1);
    expect(result.present.document.objects[0].id).toBe("test-1");
    expect(result.future.length).toBe(0);
  });

  test("UNDO moves present to future and restores from past", () => {
    // Create state with history
    const state: HistoryState = {
      past: [
        {
          document: DEFAULT_DOCUMENT,
          timestamp: Date.now() - 1000,
        },
      ],
      present: {
        document: {
          ...DEFAULT_DOCUMENT,
          settings: { ...DEFAULT_DOCUMENT.settings, backgroundColor: "#ff0000" },
        },
        timestamp: Date.now(),
      },
      future: [],
      maxSize: 50,
    };

    const result = historyReducer(state, { type: "UNDO" });

    expect(result.past.length).toBe(0);
    expect(result.present.document.settings.backgroundColor).toBe("#1a1a1a");
    expect(result.future.length).toBe(1);
    expect(result.future[0].document.settings.backgroundColor).toBe("#ff0000");
  });

  test("UNDO does nothing when past is empty", () => {
    const initial = createInitialState();
    const result = historyReducer(initial, { type: "UNDO" });

    expect(result).toBe(initial);
    expect(result.past.length).toBe(0);
    expect(result.future.length).toBe(0);
  });

  test("REDO moves present to past and restores from future", () => {
    const state: HistoryState = {
      past: [],
      present: {
        document: DEFAULT_DOCUMENT,
        timestamp: Date.now(),
      },
      future: [
        {
          document: {
            ...DEFAULT_DOCUMENT,
            settings: { ...DEFAULT_DOCUMENT.settings, backgroundColor: "#00ff00" },
          },
          timestamp: Date.now() + 1000,
        },
      ],
      maxSize: 50,
    };

    const result = historyReducer(state, { type: "REDO" });

    expect(result.past.length).toBe(1);
    expect(result.present.document.settings.backgroundColor).toBe("#00ff00");
    expect(result.future.length).toBe(0);
  });

  test("REDO does nothing when future is empty", () => {
    const initial = createInitialState();
    const result = historyReducer(initial, { type: "REDO" });

    expect(result).toBe(initial);
    expect(result.past.length).toBe(0);
    expect(result.future.length).toBe(0);
  });

  test("RESET clears history and sets new document", () => {
    const state: HistoryState = {
      past: [
        { document: DEFAULT_DOCUMENT, timestamp: Date.now() - 2000 },
        { document: DEFAULT_DOCUMENT, timestamp: Date.now() - 1000 },
      ],
      present: { document: DEFAULT_DOCUMENT, timestamp: Date.now() },
      future: [{ document: DEFAULT_DOCUMENT, timestamp: Date.now() + 1000 }],
      maxSize: 50,
    };

    const newDoc = {
      ...DEFAULT_DOCUMENT,
      settings: { ...DEFAULT_DOCUMENT.settings, backgroundColor: "#0000ff" },
    };

    const result = historyReducer(state, { type: "RESET", document: newDoc });

    expect(result.past.length).toBe(0);
    expect(result.present.document.settings.backgroundColor).toBe("#0000ff");
    expect(result.future.length).toBe(0);
  });

  test("SET respects maxSize and trims old history", () => {
    // Create state with past at max size
    const pastEntries = Array.from({ length: 50 }, (_, i) => ({
      document: DEFAULT_DOCUMENT,
      timestamp: Date.now() - (50 - i) * 1000,
    }));

    const state: HistoryState = {
      past: pastEntries,
      present: { document: DEFAULT_DOCUMENT, timestamp: Date.now() },
      future: [],
      maxSize: 50,
    };

    const newDoc = {
      ...DEFAULT_DOCUMENT,
      settings: { ...DEFAULT_DOCUMENT.settings, backgroundColor: "#123456" },
    };

    const result = historyReducer(state, { type: "SET", document: newDoc });

    // Should have trimmed to 50 (maxSize)
    expect(result.past.length).toBe(50);
    // First entry should have been removed
    expect(result.past[0].timestamp).toBe(pastEntries[1].timestamp);
  });

  test("multiple undo/redo operations work correctly", () => {
    let state = createInitialState();

    // Make 3 changes
    const docs = [
      { ...DEFAULT_DOCUMENT, settings: { ...DEFAULT_DOCUMENT.settings, backgroundColor: "#111111" } },
      { ...DEFAULT_DOCUMENT, settings: { ...DEFAULT_DOCUMENT.settings, backgroundColor: "#222222" } },
      { ...DEFAULT_DOCUMENT, settings: { ...DEFAULT_DOCUMENT.settings, backgroundColor: "#333333" } },
    ];

    for (const doc of docs) {
      state = historyReducer(state, { type: "SET", document: doc });
    }

    expect(state.past.length).toBe(3);
    expect(state.present.document.settings.backgroundColor).toBe("#333333");

    // Undo twice
    state = historyReducer(state, { type: "UNDO" });
    state = historyReducer(state, { type: "UNDO" });

    expect(state.past.length).toBe(1);
    expect(state.future.length).toBe(2);
    expect(state.present.document.settings.backgroundColor).toBe("#111111");

    // Redo once
    state = historyReducer(state, { type: "REDO" });

    expect(state.past.length).toBe(2);
    expect(state.future.length).toBe(1);
    expect(state.present.document.settings.backgroundColor).toBe("#222222");

    // Make a new change (should clear future)
    state = historyReducer(state, {
      type: "SET",
      document: { ...DEFAULT_DOCUMENT, settings: { ...DEFAULT_DOCUMENT.settings, backgroundColor: "#444444" } },
    });

    expect(state.past.length).toBe(3);
    expect(state.future.length).toBe(0);
    expect(state.present.document.settings.backgroundColor).toBe("#444444");
  });
});

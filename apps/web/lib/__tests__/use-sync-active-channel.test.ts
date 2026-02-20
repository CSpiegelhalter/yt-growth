/**
 * Unit tests for resolveActiveChannelId — the pure resolution function
 * from the centralized active-channel hook.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolveActiveChannelId } from "../use-sync-active-channel";

/* ------------------------------------------------------------------ */
/*  Lightweight localStorage mock                                      */
/*  safeLocalStorage checks `typeof window` then does a real           */
/*  setItem/getItem probe, so we provide a minimal Map-backed impl.    */
/* ------------------------------------------------------------------ */

const store = new Map<string, string>();

const fakeLocalStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => store.set(k, v),
  removeItem: (k: string) => store.delete(k),
};

const hadWindow = typeof globalThis.window !== "undefined";

beforeEach(() => {
  store.clear();
  if (!hadWindow) {
    (globalThis as any).window = { localStorage: fakeLocalStorage };
  } else {
    Object.defineProperty(globalThis.window, "localStorage", {
      value: fakeLocalStorage,
      writable: true,
      configurable: true,
    });
  }
});

afterEach(() => {
  store.clear();
  if (!hadWindow) {
    delete (globalThis as any).window;
  }
});

/* ------------------------------------------------------------------ */
/*  Fixtures                                                           */
/* ------------------------------------------------------------------ */

const CHANNELS = [
  { channel_id: "UC_aaa" },
  { channel_id: "UC_bbb" },
  { channel_id: "UC_ccc" },
];

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("resolveActiveChannelId", () => {
  it("returns null when channels list is empty", () => {
    expect(resolveActiveChannelId([], "UC_aaa", "UC_bbb")).toBeNull();
  });

  it("returns urlChannelId when it exists in channels (highest priority)", () => {
    expect(resolveActiveChannelId(CHANNELS, "UC_bbb", "UC_ccc")).toBe(
      "UC_bbb",
    );
  });

  it("ignores urlChannelId that is not in the channels list", () => {
    expect(resolveActiveChannelId(CHANNELS, "UC_unknown")).toBe("UC_aaa");
  });

  it("falls back to stored id when urlChannelId is absent", () => {
    store.set("activeChannelId", "UC_ccc");
    expect(resolveActiveChannelId(CHANNELS, null, null)).toBe("UC_ccc");
  });

  it("ignores stored id that is not in the channels list", () => {
    store.set("activeChannelId", "UC_gone");
    expect(resolveActiveChannelId(CHANNELS, null, null)).toBe("UC_aaa");
  });

  it("falls back to initialActiveChannelId when url and stored are absent", () => {
    expect(resolveActiveChannelId(CHANNELS, null, "UC_bbb")).toBe("UC_bbb");
  });

  it("ignores initialActiveChannelId that is not in channels list", () => {
    expect(resolveActiveChannelId(CHANNELS, null, "UC_gone")).toBe("UC_aaa");
  });

  it("falls back to first channel when no other source matches", () => {
    expect(resolveActiveChannelId(CHANNELS)).toBe("UC_aaa");
  });

  it("respects full priority chain: url > stored > initial > first", () => {
    store.set("activeChannelId", "UC_bbb");

    // All three provided — URL wins
    expect(resolveActiveChannelId(CHANNELS, "UC_ccc", "UC_aaa")).toBe(
      "UC_ccc",
    );

    // No URL — stored wins over initial
    expect(resolveActiveChannelId(CHANNELS, null, "UC_aaa")).toBe("UC_bbb");

    // No URL, no stored match — initial wins over first
    store.clear();
    expect(resolveActiveChannelId(CHANNELS, null, "UC_ccc")).toBe("UC_ccc");
  });
});

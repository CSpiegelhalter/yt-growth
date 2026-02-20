import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getLastOAuthAttempt,
  canAttemptOAuth,
  recordOAuthAttempt,
} from "../storage/oauthAttemptTracker";

const store = new Map<string, string>();

const fakeSessionStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => {
    store.set(k, v);
  },
  removeItem: (k: string) => {
    store.delete(k);
  },
};

const hadWindow = typeof globalThis.window !== "undefined";

beforeEach(() => {
  store.clear();
  if (!hadWindow) {
    (globalThis as any).window = { sessionStorage: fakeSessionStorage };
  } else {
    Object.defineProperty(globalThis.window, "sessionStorage", {
      value: fakeSessionStorage,
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

describe("oauthAttemptTracker", () => {
  it("returns null when no attempt has been recorded", () => {
    expect(getLastOAuthAttempt()).toBeNull();
  });

  it("records and retrieves a timestamp", () => {
    const now = 1_700_000_000_000;
    recordOAuthAttempt(now);
    expect(getLastOAuthAttempt()).toBe(now);
  });

  it("allows attempt when no previous attempt exists", () => {
    expect(canAttemptOAuth()).toBe(true);
  });

  it("blocks attempt inside the 60 s throttle window", () => {
    const now = 1_700_000_000_000;
    recordOAuthAttempt(now);
    expect(canAttemptOAuth(now + 30_000)).toBe(false);
    expect(canAttemptOAuth(now + 59_999)).toBe(false);
  });

  it("allows attempt once throttle window has elapsed", () => {
    const now = 1_700_000_000_000;
    recordOAuthAttempt(now);
    expect(canAttemptOAuth(now + 60_000)).toBe(true);
    expect(canAttemptOAuth(now + 120_000)).toBe(true);
  });

  it("stores value under the correct sessionStorage key", () => {
    recordOAuthAttempt(1_700_000_000_000);
    expect(store.get("lastOAuthAttempt")).toBe("1700000000000");
  });

  it("handles corrupt storage values gracefully", () => {
    store.set("lastOAuthAttempt", "not-a-number");
    expect(getLastOAuthAttempt()).toBeNull();
    expect(canAttemptOAuth()).toBe(true);
  });
});

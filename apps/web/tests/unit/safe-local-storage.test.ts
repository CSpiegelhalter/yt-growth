import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import {
  getJSON,
  setJSON,
  removeJSON,
  STORAGE_KEYS,
} from "@/lib/storage/safeLocalStorage";

// The storage functions prefix keys with "cb_thumbnails_"
const PREFIX = "cb_thumbnails_";

describe("safeLocalStorage", () => {
  // Store original globals for cleanup
  let originalWindow: typeof globalThis.window | undefined;
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    // Save original window
    originalWindow = globalThis.window;

    // Create a mock storage backend
    mockStorage = {};

    // Create mock localStorage
    const mockLocalStorage = {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, value: string) => {
        mockStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockStorage[key];
      },
      clear: () => {
        Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
      },
      key: (index: number) => Object.keys(mockStorage)[index] ?? null,
      get length() {
        return Object.keys(mockStorage).length;
      },
    } as Storage;

    // Mock window with localStorage
    // @ts-expect-error - creating mock window object
    globalThis.window = {
      localStorage: mockLocalStorage,
    };
  });

  afterEach(() => {
    // Restore original window
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    } else {
      // @ts-expect-error - removing window for tests
      delete globalThis.window;
    }
  });

  describe("getJSON", () => {
    test("returns null for non-existent key", () => {
      const result = getJSON("nonexistent");
      expect(result).toBeNull();
    });

    test("parses valid JSON", () => {
      const data = { foo: "bar", count: 42 };
      window.localStorage.setItem(PREFIX + "test_key", JSON.stringify(data));

      const result = getJSON<typeof data>("test_key");
      expect(result).toEqual(data);
    });

    test("returns null for invalid JSON", () => {
      window.localStorage.setItem(PREFIX + "bad_json", "not valid json {{{");

      const result = getJSON("bad_json");
      expect(result).toBeNull();
    });

    test("returns null when validator fails", () => {
      const data = { foo: "bar" };
      window.localStorage.setItem(PREFIX + "validated", JSON.stringify(data));

      // Validator that always returns false
      const validator = (_: unknown): _ is never => false;

      const result = getJSON("validated", validator);
      expect(result).toBeNull();
    });

    test("returns value when validator passes", () => {
      const data = [
        { id: "1", url: "http://example.com", createdAt: 123, jobId: "job1" },
      ];
      window.localStorage.setItem(PREFIX + "validated", JSON.stringify(data));

      // Simple validator for our thumbnail structure
      const validator = (val: unknown): val is typeof data => {
        return (
          Array.isArray(val) &&
          val.every(
            (item) =>
              typeof item === "object" &&
              item !== null &&
              typeof (item as Record<string, unknown>).id === "string" &&
              typeof (item as Record<string, unknown>).url === "string",
          )
        );
      };

      const result = getJSON("validated", validator);
      expect(result).toEqual(data);
    });
  });

  describe("setJSON", () => {
    test("stores value as JSON", () => {
      const data = { test: true, items: [1, 2, 3] };

      const success = setJSON("store_test", data);

      expect(success).toBe(true);
      expect(window.localStorage.getItem(PREFIX + "store_test")).toBe(
        JSON.stringify(data),
      );
    });

    test("handles quota exceeded gracefully", () => {
      // Override setItem to throw quota error
      const originalSetItem = window.localStorage.setItem;
      window.localStorage.setItem = () => {
        const error = new DOMException("Quota exceeded", "QuotaExceededError");
        throw error;
      };

      const result = setJSON("big_data", { huge: "data" });

      expect(result).toBe(false);

      // Restore
      window.localStorage.setItem = originalSetItem;
    });
  });

  describe("removeJSON", () => {
    test("removes existing key", () => {
      window.localStorage.setItem(PREFIX + "to_remove", "some value");

      const result = removeJSON("to_remove");

      expect(result).toBe(true);
      expect(window.localStorage.getItem(PREFIX + "to_remove")).toBeNull();
    });

    test("returns true even for non-existent key", () => {
      const result = removeJSON("never_existed");
      expect(result).toBe(true);
    });
  });

  describe("STORAGE_KEYS", () => {
    test("has expected keys", () => {
      expect(STORAGE_KEYS.GENERATED_THUMBNAILS).toBe("generated_v1");
      expect(STORAGE_KEYS.UPLOADED_PHOTOS).toBe("uploaded_photos_v1");
    });
  });

  describe("SSR safety", () => {
    test("getJSON returns null when window undefined", () => {
      // Simulate SSR by removing window
      const original = globalThis.window;
      // @ts-expect-error - intentionally breaking for test
      delete globalThis.window;

      const result = getJSON("any_key");
      expect(result).toBeNull();

      // Restore
      globalThis.window = original;
    });

    test("setJSON returns false when window undefined", () => {
      const original = globalThis.window;
      // @ts-expect-error - intentionally breaking for test
      delete globalThis.window;

      const result = setJSON("any_key", { data: true });
      expect(result).toBe(false);

      // Restore
      globalThis.window = original;
    });

    test("removeJSON returns false when window undefined", () => {
      const original = globalThis.window;
      // @ts-expect-error - intentionally breaking for test
      delete globalThis.window;

      const result = removeJSON("any_key");
      expect(result).toBe(false);

      // Restore
      globalThis.window = original;
    });
  });
});

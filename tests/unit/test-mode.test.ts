/**
 * Test Mode Unit Tests
 *
 * Tests for the test-mode helper functions.
 * Uses bun's test runner (no vitest mocking utilities).
 */
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import {
  isTestMode,
  isFakeYouTube,
  isFakeStripe,
  isRateLimitDisabled,
  requireTestMode,
  getTestUserCredentials,
} from "@/lib/test-mode";

describe("Test Mode Helpers", () => {
  // Store original env values
  const originalAppTestMode = process.env.APP_TEST_MODE;
  const originalFakeYouTube = process.env.FAKE_YOUTUBE;
  const originalFakeStripe = process.env.FAKE_STRIPE;
  const originalDisableRateLimits = process.env.DISABLE_RATE_LIMITS;
  const originalTestUserEmail = process.env.TEST_USER_EMAIL;
  const originalTestUserPassword = process.env.TEST_USER_PASSWORD;

  afterAll(() => {
    // Restore original env
    if (originalAppTestMode !== undefined) {
      process.env.APP_TEST_MODE = originalAppTestMode;
    } else {
      delete process.env.APP_TEST_MODE;
    }
    if (originalFakeYouTube !== undefined) {
      process.env.FAKE_YOUTUBE = originalFakeYouTube;
    } else {
      delete process.env.FAKE_YOUTUBE;
    }
    if (originalFakeStripe !== undefined) {
      process.env.FAKE_STRIPE = originalFakeStripe;
    } else {
      delete process.env.FAKE_STRIPE;
    }
    if (originalDisableRateLimits !== undefined) {
      process.env.DISABLE_RATE_LIMITS = originalDisableRateLimits;
    } else {
      delete process.env.DISABLE_RATE_LIMITS;
    }
    if (originalTestUserEmail !== undefined) {
      process.env.TEST_USER_EMAIL = originalTestUserEmail;
    } else {
      delete process.env.TEST_USER_EMAIL;
    }
    if (originalTestUserPassword !== undefined) {
      process.env.TEST_USER_PASSWORD = originalTestUserPassword;
    } else {
      delete process.env.TEST_USER_PASSWORD;
    }
  });

  describe("isTestMode", () => {
    it("returns true when APP_TEST_MODE is 1", () => {
      process.env.APP_TEST_MODE = "1";
      expect(isTestMode()).toBe(true);
    });

    it("returns false when APP_TEST_MODE is not 1", () => {
      process.env.APP_TEST_MODE = "false";
      expect(isTestMode()).toBe(false);
    });

    it("returns false when APP_TEST_MODE is undefined", () => {
      delete process.env.APP_TEST_MODE;
      expect(isTestMode()).toBe(false);
    });
  });

  describe("isFakeYouTube", () => {
    it("returns true when FAKE_YOUTUBE is 1", () => {
      process.env.FAKE_YOUTUBE = "1";
      expect(isFakeYouTube()).toBe(true);
    });

    it("returns false when FAKE_YOUTUBE is not 1", () => {
      delete process.env.FAKE_YOUTUBE;
      expect(isFakeYouTube()).toBe(false);
    });
  });

  describe("isFakeStripe", () => {
    it("returns true when FAKE_STRIPE is 1", () => {
      process.env.FAKE_STRIPE = "1";
      expect(isFakeStripe()).toBe(true);
    });

    it("returns false when FAKE_STRIPE is not 1", () => {
      delete process.env.FAKE_STRIPE;
      expect(isFakeStripe()).toBe(false);
    });
  });

  describe("isRateLimitDisabled", () => {
    it("returns true when DISABLE_RATE_LIMITS is 1", () => {
      process.env.DISABLE_RATE_LIMITS = "1";
      expect(isRateLimitDisabled()).toBe(true);
    });

    it("returns false when DISABLE_RATE_LIMITS is not 1", () => {
      delete process.env.DISABLE_RATE_LIMITS;
      expect(isRateLimitDisabled()).toBe(false);
    });
  });

  describe("requireTestMode", () => {
    it("returns null when in test mode", () => {
      process.env.APP_TEST_MODE = "1";
      const result = requireTestMode();
      expect(result).toBeNull();
    });

    it("returns Response when not in test mode", () => {
      delete process.env.APP_TEST_MODE;
      const result = requireTestMode();
      expect(result).toBeInstanceOf(Response);
    });
  });

  describe("getTestUserCredentials", () => {
    it("returns default credentials when env not set", () => {
      delete process.env.TEST_USER_EMAIL;
      delete process.env.TEST_USER_PASSWORD;
      const creds = getTestUserCredentials();
      expect(creds.email).toBe("e2e@example.com");
      expect(creds.password).toBe("Password123!");
    });

    it("returns custom credentials from env", () => {
      process.env.TEST_USER_EMAIL = "custom@test.com";
      process.env.TEST_USER_PASSWORD = "CustomPass123!";
      const creds = getTestUserCredentials();
      expect(creds.email).toBe("custom@test.com");
      expect(creds.password).toBe("CustomPass123!");
    });
  });
});

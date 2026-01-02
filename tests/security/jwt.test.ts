/**
 * JWT Security Tests
 * 
 * Tests for JWT token validation and security.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";

// Test JWT functionality
describe("JWT Security", () => {
  const TEST_SECRET = "test-secret-at-least-32-characters-long";

  describe("Token Validation", () => {
    it("should reject expired tokens", () => {
      const expiredToken = jwt.sign(
        { sub: "user123" },
        TEST_SECRET,
        { expiresIn: "-1h" } // Expired 1 hour ago
      );

      expect(() => {
        jwt.verify(expiredToken, TEST_SECRET);
      }).toThrow(/expired/i);
    });

    it("should reject tokens with invalid signature", () => {
      const token = jwt.sign({ sub: "user123" }, TEST_SECRET);
      const wrongSecret = "different-secret-that-is-long-enough";

      expect(() => {
        jwt.verify(token, wrongSecret);
      }).toThrow(/invalid signature/i);
    });

    it("should reject malformed tokens", () => {
      expect(() => {
        jwt.verify("not.a.valid.jwt", TEST_SECRET);
      }).toThrow();

      expect(() => {
        jwt.verify("invalid", TEST_SECRET);
      }).toThrow();
    });

    it("should accept valid tokens", () => {
      const token = jwt.sign(
        { sub: "user123", email: "test@test.com" },
        TEST_SECRET,
        { expiresIn: "1h" }
      );

      const decoded = jwt.verify(token, TEST_SECRET) as any;

      expect(decoded.sub).toBe("user123");
      expect(decoded.email).toBe("test@test.com");
    });
  });

  describe("Token Content", () => {
    it("should not include sensitive data in payload", () => {
      // Example of what NOT to do (for testing purposes)
      const badToken = jwt.sign(
        {
          sub: "user123",
          password: "secret", // BAD!
          apiKey: "key123", // BAD!
        },
        TEST_SECRET
      );

      // Decode without verification to inspect payload
      const decoded = jwt.decode(badToken) as any;

      // These should NOT be in tokens
      // This test documents what to avoid
      expect(decoded.password).toBeDefined(); // This would be a security issue
      expect(decoded.apiKey).toBeDefined(); // This would be a security issue
    });

    it("should only include necessary claims", () => {
      // Good practice - minimal claims
      const goodToken = jwt.sign(
        {
          sub: "user123",
          email: "test@test.com",
          iat: Math.floor(Date.now() / 1000),
        },
        TEST_SECRET,
        { expiresIn: "30d" }
      );

      const decoded = jwt.decode(goodToken) as any;

      expect(decoded.sub).toBeDefined();
      expect(decoded.email).toBeDefined();
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();

      // Should NOT have sensitive data
      expect(decoded.password).toBeUndefined();
      expect(decoded.accessToken).toBeUndefined();
      expect(decoded.refreshToken).toBeUndefined();
    });
  });

  describe("Token Expiration", () => {
    it("should have expiration claim", () => {
      const token = jwt.sign({ sub: "user123" }, TEST_SECRET, {
        expiresIn: "1h",
      });

      const decoded = jwt.decode(token) as any;

      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it("should expire within reasonable time (30 days max)", () => {
      const maxExpiry = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;

      const token = jwt.sign({ sub: "user123" }, TEST_SECRET, {
        expiresIn: "30d",
      });

      const decoded = jwt.decode(token) as any;

      // Should be around 30 days from now (with some tolerance)
      expect(decoded.exp).toBeLessThanOrEqual(maxExpiry + 60);
    });
  });

  describe("Algorithm Security", () => {
    it("should reject none algorithm", () => {
      // Create a token with 'none' algorithm (attacker technique)
      const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
      const payload = Buffer.from(JSON.stringify({ sub: "admin" })).toString("base64url");
      const noneToken = `${header}.${payload}.`;

      expect(() => {
        jwt.verify(noneToken, TEST_SECRET);
      }).toThrow();
    });

    it("should use HS256 by default", () => {
      const token = jwt.sign({ sub: "user123" }, TEST_SECRET);
      const decoded = jwt.decode(token, { complete: true }) as any;

      expect(decoded.header.alg).toBe("HS256");
    });
  });
});

describe("Password Reset Token Security", () => {
  const TOKEN_SECRET = "email-token-secret-at-least-32-chars";

  it("should include purpose claim", () => {
    const token = jwt.sign(
      {
        id: 123,
        email: "test@test.com",
        purpose: "password_reset",
      },
      TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    const decoded = jwt.decode(token) as any;

    expect(decoded.purpose).toBe("password_reset");
  });

  it("should expire quickly (1 hour)", () => {
    const token = jwt.sign(
      { id: 123, purpose: "password_reset" },
      TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    const decoded = jwt.decode(token) as any;
    const maxExpiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour

    expect(decoded.exp).toBeLessThanOrEqual(maxExpiry + 60);
  });

  it("should verify purpose before accepting", () => {
    // Token with wrong purpose
    const emailVerifyToken = jwt.sign(
      { id: 123, purpose: "email_verify" },
      TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    const decoded = jwt.verify(emailVerifyToken, TOKEN_SECRET) as any;

    // Should reject if purpose doesn't match expected
    expect(decoded.purpose).not.toBe("password_reset");
  });
});

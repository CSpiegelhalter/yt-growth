/**
 * Log Redaction Security Tests
 * 
 * Verifies that sensitive data is properly redacted from logs.
 */
import { describe, it, expect } from "vitest";
import {
  redactValue,
  redactPatterns,
  redactDeep,
  safeStringify,
  redactHeaders,
  assertNoSensitiveData,
  REDACT_KEYS,
} from "@/lib/security/redaction";

describe("Redaction - redactValue", () => {
  it("should redact long strings with first/last chars", () => {
    expect(redactValue("secretvalue")).toBe("se***ue");
  });

  it("should redact short strings completely", () => {
    expect(redactValue("abc")).toBe("***");
  });

  it("should handle null/undefined", () => {
    expect(redactValue(null)).toBe("[null]");
    expect(redactValue(undefined)).toBe("[null]");
  });

  it("should handle non-strings", () => {
    expect(redactValue(12345)).toBe("[redacted]");
    expect(redactValue({ a: 1 })).toBe("[redacted]");
  });
});

describe("Redaction - redactPatterns", () => {
  it("should redact JWT tokens", () => {
    const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
    expect(redactPatterns(jwt)).toBe("[REDACTED]");
  });

  it("should redact Stripe secret keys", () => {
    expect(redactPatterns("sk_live_abc123def456")).toBe("[REDACTED]");
    expect(redactPatterns("sk_test_abc123def456")).toBe("[REDACTED]");
    expect(redactPatterns("pk_live_abc123def456")).toBe("[REDACTED]");
    expect(redactPatterns("pk_test_abc123def456")).toBe("[REDACTED]");
  });

  it("should redact Stripe webhook secrets", () => {
    expect(redactPatterns("whsec_abc123def456")).toBe("[REDACTED]");
  });

  it("should redact OpenAI keys", () => {
    expect(redactPatterns("sk-abc123def456ghijklmnop")).toBe("[REDACTED]");
  });

  it("should redact Google access tokens", () => {
    expect(redactPatterns("ya29.a0AfH6SMBxyz123")).toBe("[REDACTED]");
  });

  it("should redact Google refresh tokens", () => {
    expect(redactPatterns("1//0gxyz123abc")).toBe("[REDACTED]");
  });

  it("should preserve non-sensitive text", () => {
    expect(redactPatterns("hello world")).toBe("hello world");
  });
});

describe("Redaction - redactDeep", () => {
  it("should redact known sensitive keys", () => {
    const input = {
      username: "john",
      password: "secret123",
      apiKey: "key-value",
    };

    const result = redactDeep(input);

    expect(result).toEqual({
      username: "john",
      password: "se***23",
      apiKey: "ke***ue",
    });
  });

  it("should redact nested objects", () => {
    const input = {
      user: {
        name: "john",
        credentials: {
          token: "mytoken123",
        },
      },
    };

    const result = redactDeep(input);

    expect((result as any).user.credentials.token).toBe("my***23");
  });

  it("should redact arrays with sensitive key names", () => {
    const input = {
      tokens: ["token1", "token2"],
    };

    const result = redactDeep(input);

    // Key "tokens" contains "token" so the whole value is redacted
    expect((result as any).tokens).toBe("[redacted]");
  });

  it("should preserve arrays with non-sensitive keys", () => {
    const input = {
      names: ["alice", "bob"],
    };

    const result = redactDeep(input);

    expect((result as any).names).toEqual(["alice", "bob"]);
  });

  it("should handle strings with sensitive patterns", () => {
    const input = {
      message: "Error with token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.xyz",
    };

    const result = redactDeep(input) as any;

    expect(result.message).toContain("[REDACTED]");
    expect(result.message).not.toContain("eyJ");
  });

  it("should handle max depth", () => {
    const input = {
      a: { b: { c: { d: { e: { f: { g: { h: "deep" } } } } } } },
    };

    const result = redactDeep(input, 0);
    // Should stop at some depth
    expect(result).toBeDefined();
  });
});

describe("Redaction - safeStringify", () => {
  it("should stringify with redaction", () => {
    const input = { password: "secret", name: "john" };
    const result = safeStringify(input);
    
    expect(result).toContain("john");
    expect(result).not.toContain("secret");
    expect(result).toContain("***");
  });

  it("should handle circular references gracefully", () => {
    const obj: any = { name: "test" };
    obj.self = obj;
    
    // Should not throw
    const result = safeStringify(obj);
    expect(result).toBeDefined();
  });
});

describe("Redaction - redactHeaders", () => {
  it("should redact authorization header", () => {
    const headers = {
      "authorization": "Bearer mytoken123",
      "content-type": "application/json",
    };

    const result = redactHeaders(headers);

    expect(result["authorization"]).toBe("Be***23");
    expect(result["content-type"]).toBe("application/json");
  });

  it("should redact cookie header", () => {
    const headers = {
      "cookie": "session=abc123; other=value",
    };

    const result = redactHeaders(headers);

    expect(result["cookie"]).toBe("se***ue");
  });

  it("should work with Headers object", () => {
    const headers = new Headers();
    headers.set("authorization", "Bearer token");
    headers.set("content-type", "application/json");

    const result = redactHeaders(headers);

    expect(result["authorization"]).toBe("Be***en");
  });
});

describe("Redaction - assertNoSensitiveData", () => {
  it("should pass for safe strings", () => {
    expect(() => assertNoSensitiveData("hello world")).not.toThrow();
    expect(() => assertNoSensitiveData("user123")).not.toThrow();
  });

  it("should throw for JWT tokens", () => {
    const jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.xyz";
    expect(() => assertNoSensitiveData(jwt)).toThrow();
  });

  it("should throw for API keys", () => {
    expect(() => assertNoSensitiveData("sk_live_abc123")).toThrow();
    expect(() => assertNoSensitiveData("sk-openaikey123456789012")).toThrow();
  });
});

describe("Redaction - REDACT_KEYS completeness", () => {
  it("should include all critical keys", () => {
    const criticalKeys = [
      "password",
      "authorization",
      "cookie",
      "token",
      "secret",
      "refresh_token",
      "access_token",
    ];

    for (const key of criticalKeys) {
      expect(REDACT_KEYS.has(key)).toBe(true);
    }
  });
});

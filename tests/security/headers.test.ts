/**
 * Security Headers Tests
 * 
 * Tests to verify security headers are correctly configured.
 */
import { describe, it, expect } from "vitest";
import {
  SECURITY_HEADERS,
  CSP_DIRECTIVES,
  buildCSP,
  getSecurityHeaders,
  getNextSecurityHeaders,
} from "@/lib/security/headers";

describe("Security Headers Configuration", () => {
  describe("SECURITY_HEADERS", () => {
    it("should include X-Frame-Options: DENY", () => {
      expect(SECURITY_HEADERS["X-Frame-Options"]).toBe("DENY");
    });

    it("should include X-Content-Type-Options: nosniff", () => {
      expect(SECURITY_HEADERS["X-Content-Type-Options"]).toBe("nosniff");
    });

    it("should include X-XSS-Protection", () => {
      expect(SECURITY_HEADERS["X-XSS-Protection"]).toBe("1; mode=block");
    });

    it("should include strict Referrer-Policy", () => {
      expect(SECURITY_HEADERS["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    });

    it("should include HSTS with 1 year max-age", () => {
      expect(SECURITY_HEADERS["Strict-Transport-Security"]).toContain("max-age=31536000");
      expect(SECURITY_HEADERS["Strict-Transport-Security"]).toContain("includeSubDomains");
    });

    it("should include restrictive Permissions-Policy", () => {
      const policy = SECURITY_HEADERS["Permissions-Policy"];
      expect(policy).toContain("camera=()");
      expect(policy).toContain("microphone=()");
      expect(policy).toContain("geolocation=()");
    });
  });

  describe("CSP Directives", () => {
    it("should have default-src 'self'", () => {
      expect(CSP_DIRECTIVES["default-src"]).toContain("'self'");
    });

    it("should prevent framing with frame-ancestors 'none'", () => {
      expect(CSP_DIRECTIVES["frame-ancestors"]).toContain("'none'");
    });

    it("should block object-src", () => {
      expect(CSP_DIRECTIVES["object-src"]).toContain("'none'");
    });

    it("should allow YouTube images", () => {
      expect(CSP_DIRECTIVES["img-src"]).toContain("https://*.ytimg.com");
      expect(CSP_DIRECTIVES["img-src"]).toContain("https://*.ggpht.com");
    });

    it("should allow Stripe frames", () => {
      expect(CSP_DIRECTIVES["frame-src"]).toContain("https://js.stripe.com");
      expect(CSP_DIRECTIVES["frame-src"]).toContain("https://checkout.stripe.com");
    });

    it("should allow necessary connect-src for APIs", () => {
      const connectSrc = CSP_DIRECTIVES["connect-src"];
      expect(connectSrc).toContain("https://api.stripe.com");
      expect(connectSrc).toContain("https://www.googleapis.com");
    });

    it("should restrict form-action to self", () => {
      expect(CSP_DIRECTIVES["form-action"]).toContain("'self'");
    });

    it("should restrict base-uri to self", () => {
      expect(CSP_DIRECTIVES["base-uri"]).toContain("'self'");
    });
  });

  describe("buildCSP", () => {
    it("should build valid CSP string", () => {
      const csp = buildCSP();

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain(";");
    });

    it("should accept custom directives", () => {
      const customDirectives = {
        "default-src": ["'self'"],
        "img-src": ["'self'", "https://example.com"],
      };

      const csp = buildCSP(customDirectives);

      expect(csp).toBe("default-src 'self'; img-src 'self' https://example.com");
    });
  });

  describe("getSecurityHeaders", () => {
    it("should return all security headers including CSP", () => {
      const headers = getSecurityHeaders();

      expect(headers).toHaveProperty("X-Frame-Options");
      expect(headers).toHaveProperty("X-Content-Type-Options");
      expect(headers).toHaveProperty("Strict-Transport-Security");
      expect(headers).toHaveProperty("Content-Security-Policy");
    });
  });

  describe("getNextSecurityHeaders", () => {
    it("should return headers in Next.js format", () => {
      const headers = getNextSecurityHeaders();

      expect(Array.isArray(headers)).toBe(true);
      expect(headers.length).toBeGreaterThan(0);

      const firstHeader = headers[0];
      expect(firstHeader).toHaveProperty("key");
      expect(firstHeader).toHaveProperty("value");
    });
  });
});

describe("Security Headers - Attack Prevention", () => {
  describe("Clickjacking Prevention", () => {
    it("should prevent framing via X-Frame-Options", () => {
      expect(SECURITY_HEADERS["X-Frame-Options"]).toBe("DENY");
    });

    it("should prevent framing via CSP frame-ancestors", () => {
      expect(CSP_DIRECTIVES["frame-ancestors"]).toContain("'none'");
    });
  });

  describe("XSS Prevention", () => {
    it("should enable XSS filter", () => {
      expect(SECURITY_HEADERS["X-XSS-Protection"]).toBe("1; mode=block");
    });

    it("should restrict script sources", () => {
      const scriptSrc = CSP_DIRECTIVES["script-src"];
      expect(scriptSrc).toContain("'self'");
      // Note: 'unsafe-inline' and 'unsafe-eval' are needed for Next.js
      // but restricted to trusted sources
    });
  });

  describe("MIME Sniffing Prevention", () => {
    it("should prevent MIME sniffing", () => {
      expect(SECURITY_HEADERS["X-Content-Type-Options"]).toBe("nosniff");
    });
  });

  describe("Transport Security", () => {
    it("should enforce HTTPS via HSTS", () => {
      const hsts = SECURITY_HEADERS["Strict-Transport-Security"];
      expect(hsts).toContain("max-age=31536000"); // 1 year
      expect(hsts).toContain("includeSubDomains");
    });
  });

  describe("Information Leakage Prevention", () => {
    it("should limit referrer information", () => {
      expect(SECURITY_HEADERS["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    });
  });
});

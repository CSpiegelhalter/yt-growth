/**
 * Input validation utilities
 *
 * Centralized validation schemas and helpers for security-critical inputs.
 */

import { z } from "zod";

/**
 * Common validation schemas
 */
export const schemas = {
  // Email validation
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(255, "Email too long")
    .transform((e) => e.toLowerCase().trim()),

  // Password validation (12 char minimum per CASA 2.1.1)
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(200, "Password too long"),

  // Channel ID (YouTube format)
  channelId: z
    .string()
    .min(1, "Channel ID required")
    .max(128, "Channel ID too long")
    .regex(/^UC[\w-]{22}$|^[\w-]+$/, "Invalid channel ID format"),

  // Video ID (YouTube format)
  videoId: z
    .string()
    .min(1, "Video ID required")
    .max(32, "Video ID too long")
    .regex(/^[\w-]+$/, "Invalid video ID format"),

  // UUID
  uuid: z.string().uuid("Invalid UUID"),

  // Positive integer
  positiveInt: z.coerce.number().int().positive(),

  // Date range (for analytics)
  dateRange: z.enum(["7d", "28d", "90d", "365d"]),

  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),

  // OAuth state (hex string)
  oauthState: z
    .string()
    .min(32, "Invalid state")
    .max(128, "Invalid state")
    .regex(/^[a-f0-9]+$/i, "Invalid state format"),

  // JWT token (format validation only, not verification)
  jwtToken: z
    .string()
    .min(1, "Token required")
    .regex(/^[\w-]+\.[\w-]+\.[\w-]+$/, "Invalid token format"),
};

/**
 * Sanitize string input (remove potential injection vectors)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim();
}

/**
 * Sanitize for email headers (prevent SMTP injection)
 */
export function sanitizeEmailInput(input: string): string {
  return input
    .replace(/[\r\n]/g, " ") // Remove newlines
    .replace(/Content-Type:/gi, "")
    .replace(/MIME-Version:/gi, "")
    .replace(/bcc:/gi, "")
    .replace(/cc:/gi, "")
    .replace(/to:/gi, "")
    .replace(/from:/gi, "")
    .trim();
}

/**
 * Validate and sanitize URL (prevent SSRF)
 */
export function validateExternalUrl(url: string): {
  valid: boolean;
  url?: string;
  error?: string;
} {
  try {
    const parsed = new URL(url);

    // Only allow HTTPS
    if (parsed.protocol !== "https:") {
      return { valid: false, error: "Only HTTPS URLs allowed" };
    }

    // Block internal/private IPs
    const hostname = parsed.hostname.toLowerCase();
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2\d|3[01])\./,
      /^192\.168\./,
      /^0\./,
      /^169\.254\./,
      /^\[::1\]$/,
      /^\[fc/i,
      /^\[fd/i,
      /^\[fe80:/i,
    ];

    if (blockedPatterns.some((p) => p.test(hostname))) {
      return { valid: false, error: "Internal URLs not allowed" };
    }

    // Allowlist for external services
    const allowedHosts = [
      "www.googleapis.com",
      "youtube.googleapis.com",
      "youtubeanalytics.googleapis.com",
      "oauth2.googleapis.com",
      "accounts.google.com",
      "api.stripe.com",
      "api.openai.com",
      "api.resend.com",
    ];

    if (!allowedHosts.includes(hostname)) {
      return { valid: false, error: `Host not in allowlist: ${hostname}` };
    }

    return { valid: true, url: parsed.toString() };
  } catch {
    return { valid: false, error: "Invalid URL" };
  }
}

/**
 * Validate redirect URL (prevent open redirect)
 */
export function validateRedirectUrl(
  url: string,
  baseUrl: string
): { valid: boolean; url: string } {
  try {
    // Relative URLs are always safe
    if (url.startsWith("/") && !url.startsWith("//")) {
      return { valid: true, url };
    }

    const parsed = new URL(url, baseUrl);
    const base = new URL(baseUrl);

    // Must be same origin
    if (parsed.origin !== base.origin) {
      return { valid: false, url: "/" };
    }

    return { valid: true, url: parsed.pathname + parsed.search };
  } catch {
    return { valid: false, url: "/" };
  }
}

/**
 * Rate limit key validation (prevent injection in cache keys)
 */
export function sanitizeRateLimitKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9:_-]/g, "_").slice(0, 256);
}

/**
 * Validate Content-Type header
 */
export function isValidContentType(
  contentType: string | null,
  expected: string[]
): boolean {
  if (!contentType) return false;
  return expected.some((e) => contentType.toLowerCase().includes(e));
}

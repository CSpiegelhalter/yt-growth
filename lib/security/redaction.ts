/**
 * Log redaction utilities
 *
 * Ensures sensitive data is never logged in plaintext.
 */

/**
 * Keys that should always be redacted in logs
 */
export const REDACT_KEYS = new Set([
  // Auth tokens
  "authorization",
  "cookie",
  "set-cookie",
  "refresh_token",
  "refreshtoken",
  "access_token",
  "accesstoken",
  "id_token",
  "idtoken",
  "bearer",
  "token",
  "jwt",
  "session",
  "sessiontoken",

  // Secrets
  "password",
  "passwordhash",
  "secret",
  "api_key",
  "apikey",
  "private_key",
  "privatekey",
  "client_secret",
  "clientsecret",

  // OAuth
  "code",
  "state",
  "nonce",

  // Payment
  "stripe-signature",
  "card",
  "cvv",
  "cvc",

  // Headers
  "x-forwarded-access-token",
  "x-api-key",
]);

/**
 * Patterns that should be redacted (regex)
 */
export const REDACT_PATTERNS = [
  // JWT tokens
  /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,

  // API keys (common formats)
  /sk_live_[a-zA-Z0-9]+/g, // Stripe live secret
  /sk_test_[a-zA-Z0-9]+/g, // Stripe test secret
  /pk_live_[a-zA-Z0-9]+/g, // Stripe live public
  /pk_test_[a-zA-Z0-9]+/g, // Stripe test public
  /whsec_[a-zA-Z0-9]+/g, // Stripe webhook
  /sk-[a-zA-Z0-9]{20,}/g, // OpenAI (min 20 chars to avoid false positives)
  /re_[a-zA-Z0-9_]+/g, // Resend

  // OAuth tokens (Google format)
  /ya29\.[a-zA-Z0-9_-]+/g,

  // Refresh tokens (Google format)
  /1\/\/[a-zA-Z0-9_-]+/g,
];

/**
 * Redact a single value
 */
export function redactValue(value: unknown): string {
  if (value == null) return "[null]";
  if (typeof value !== "string") return "[redacted]";
  if (value.length <= 4) return "***";
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

/**
 * Redact sensitive patterns from a string
 */
export function redactPatterns(str: string): string {
  let result = str;
  for (const pattern of REDACT_PATTERNS) {
    result = result.replace(pattern, "[REDACTED]");
  }
  return result;
}

/**
 * Deep redact an object
 */
export function redactDeep(input: unknown, depth = 0): unknown {
  if (depth > 6) return "[MaxDepth]";
  if (input == null) return input;

  if (typeof input === "string") {
    return redactPatterns(input);
  }

  if (Array.isArray(input)) {
    return input.map((v) => redactDeep(v, depth + 1));
  }

  if (typeof input !== "object") return input;

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    const keyLower = k.toLowerCase();

    // Check if key should be redacted
    if (REDACT_KEYS.has(keyLower)) {
      out[k] = redactValue(v);
      continue;
    }

    // Check for partial matches
    if (
      keyLower.includes("token") ||
      keyLower.includes("secret") ||
      keyLower.includes("password") ||
      keyLower.includes("key") ||
      keyLower.includes("auth")
    ) {
      out[k] = redactValue(v);
      continue;
    }

    out[k] = redactDeep(v, depth + 1);
  }
  return out;
}

/**
 * Safe JSON stringify with redaction
 */
export function safeStringify(value: unknown): string {
  try {
    const redacted = redactDeep(value);
    return JSON.stringify(redacted);
  } catch {
    return JSON.stringify({ error: "unserializable_log_payload" });
  }
}

/**
 * Create a redacted copy of headers
 */
export function redactHeaders(
  headers: Headers | Record<string, string>
): Record<string, string> {
  const result: Record<string, string> = {};

  const entries =
    headers instanceof Headers
      ? Array.from(headers.entries())
      : Object.entries(headers);

  for (const [key, value] of entries) {
    const keyLower = key.toLowerCase();
    if (
      REDACT_KEYS.has(keyLower) ||
      keyLower.includes("auth") ||
      keyLower.includes("token")
    ) {
      result[key] = redactValue(value);
    } else {
      result[key] = redactPatterns(value);
    }
  }

  return result;
}

/**
 * Assert that a string doesn't contain sensitive patterns
 * Use in tests to verify redaction
 */
export function assertNoSensitiveData(str: string): void {
  for (const pattern of REDACT_PATTERNS) {
    const match = str.match(pattern);
    if (match) {
      throw new Error(
        `Sensitive data found in string: ${match[0].slice(0, 10)}...`
      );
    }
  }

  // Check for common secret prefixes
  const sensitivePatterns = [
    /sk_live_/i,
    /sk_test_/i,
    /whsec_/i,
    /sk-/,
    /Bearer /i,
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(str)) {
      throw new Error(`Potential sensitive data found matching: ${pattern}`);
    }
  }
}

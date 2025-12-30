type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = Record<string, unknown>;

const REDACT_KEYS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-forwarded-access-token",
  "refresh_token",
  "access_token",
  "id_token",
  "code",
  "client_secret",
  "stripe-signature",
  "password",
  "passwordHash",
  "token",
]);

function redactValue(value: unknown): unknown {
  if (typeof value === "string") {
    if (value.length <= 4) return "***";
    return `${value.slice(0, 2)}***${value.slice(-2)}`;
  }
  return "***";
}

function redactDeep(input: unknown, depth = 0): unknown {
  if (depth > 6) return "[MaxDepth]";
  if (input == null) return input;
  if (Array.isArray(input)) return input.map((v) => redactDeep(v, depth + 1));
  if (typeof input !== "object") return input;

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (REDACT_KEYS.has(k.toLowerCase())) {
      out[k] = redactValue(v);
      continue;
    }
    out[k] = redactDeep(v, depth + 1);
  }
  return out;
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ error: "unserializable_log_payload" });
  }
}

export type Logger = {
  debug: (message: string, fields?: LogFields) => void;
  info: (message: string, fields?: LogFields) => void;
  warn: (message: string, fields?: LogFields) => void;
  error: (
    message: string,
    fields?: LogFields & { err?: unknown; stack?: string }
  ) => void;
};

function emit(level: LogLevel, message: string, fields?: LogFields) {
  const redacted = redactDeep(fields ?? {}) as Record<string, unknown>;
  const payload = {
    ts: new Date().toISOString(),
    level,
    msg: message,
    service: "yt-growth",
    env: process.env.NODE_ENV ?? "unknown",
    ...redacted,
  };
  // eslint-disable-next-line no-console
  console.log(safeJson(payload));
}

export function createLogger(baseFields?: LogFields): Logger {
  return {
    debug: (message, fields) => emit("debug", message, { ...baseFields, ...fields }),
    info: (message, fields) => emit("info", message, { ...baseFields, ...fields }),
    warn: (message, fields) => emit("warn", message, { ...baseFields, ...fields }),
    error: (message, fields) => {
      const err = (fields as any)?.err;
      const normalized =
        err instanceof Error
          ? { name: err.name, message: err.message, stack: err.stack }
          : err
          ? { message: String(err) }
          : undefined;
      emit("error", message, { ...baseFields, ...fields, err: normalized });
    },
  };
}

export const logger = createLogger();

/**
 * Backwards-compatible helper. Prefer `logger.info(...)`.
 */
export const log = (...args: any[]) => {
  const msg = args.map((a) => (typeof a === "string" ? a : safeJson(a))).join(" ");
  logger.info(msg);
};


class ApiClientError extends Error {
  status: number;
  code: string;
  requestId?: string;
  details?: unknown;

  constructor(input: {
    status: number;
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
  }) {
    super(input.message);
    this.name = "ApiClientError";
    this.status = input.status;
    this.code = input.code;
    this.requestId = input.requestId;
    this.details = input.details;
  }
}

export function isApiClientError(err: unknown): err is ApiClientError {
  return err instanceof ApiClientError;
}

function tryGetRequestIdFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const e = (body as any).error;
  if (!e || typeof e !== "object") return undefined;
  return typeof e.requestId === "string" ? e.requestId : undefined;
}

function tryGetMessageFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const e = (body as any).error;
  if (e && typeof e === "object" && typeof e.message === "string") return e.message;
  if (typeof (body as any).message === "string") return (body as any).message;
  return undefined;
}

function tryGetCodeFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const e = (body as any).error;
  if (e && typeof e === "object" && typeof e.code === "string") return e.code;
  // legacy surfaces (some routes still return `code` at top-level)
  if (typeof (body as any).code === "string") return (body as any).code;
  return undefined;
}

/**
 * Fetch JSON with consistent error handling:
 * - Parses JSON (if present)
 * - Throws ApiClientError with (status, code, requestId, details)
 */
export async function apiFetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit & { cache?: RequestCache }
): Promise<T> {
  const res = await fetch(input, init);

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  let body: unknown = null;
  if (isJson) {
    try {
      body = await res.json();
    } catch {
      body = null;
    }
  }

  if (!res.ok) {
    const requestId = tryGetRequestIdFromBody(body) ?? res.headers.get("x-request-id") ?? undefined;
    const code = tryGetCodeFromBody(body) ?? `HTTP_${res.status}`;
    const message =
      tryGetMessageFromBody(body) ??
      (typeof (body as any)?.error === "string" ? String((body as any).error) : undefined) ??
      `Request failed (${res.status})`;

    throw new ApiClientError({
      status: res.status,
      code,
      message,
      requestId,
      details: (body as any)?.details ?? body,
    });
  }

  // Successful non-json responses are not expected in this app.
  if (!isJson) {
    throw new ApiClientError({
      status: 500,
      code: "INTERNAL",
      message: "Unexpected non-JSON response",
      requestId: res.headers.get("x-request-id") ?? undefined,
    });
  }

  return body as T;
}



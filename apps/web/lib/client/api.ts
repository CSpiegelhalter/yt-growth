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

type JsonResponseBody = Record<string, unknown>;
type JsonErrorObject = Record<string, unknown>;

export function isApiClientError(err: unknown): err is ApiClientError {
  return err instanceof ApiClientError;
}

function tryGetRequestIdFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== "object") {return undefined;}
  const obj = body as JsonResponseBody;
  const e = obj.error;
  if (!e || typeof e !== "object") {return undefined;}
  const errObj = e as JsonErrorObject;
  return typeof errObj.requestId === "string" ? errObj.requestId : undefined;
}

function tryGetMessageFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== "object") {return undefined;}
  const obj = body as JsonResponseBody;
  const e = obj.error;
  if (e && typeof e === "object" && typeof (e as JsonErrorObject).message === "string") {return (e as JsonErrorObject).message as string;}
  if (typeof obj.message === "string") {return obj.message;}
  return undefined;
}

function tryGetCodeFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== "object") {return undefined;}
  const obj = body as JsonResponseBody;
  const e = obj.error;
  if (e && typeof e === "object" && typeof (e as JsonErrorObject).code === "string") {return (e as JsonErrorObject).code as string;}
  if (typeof obj.code === "string") {return obj.code;}
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
    const bodyObj = body as JsonResponseBody;
    const message =
      tryGetMessageFromBody(body) ??
      (typeof bodyObj?.error === "string" ? String(bodyObj.error) : undefined) ??
      `Request failed (${res.status})`;

    throw new ApiClientError({
      status: res.status,
      code,
      message,
      requestId,
      details: bodyObj?.details ?? body,
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



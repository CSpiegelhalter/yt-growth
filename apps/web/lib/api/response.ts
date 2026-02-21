import type { ApiErrorCode } from "./errors";

export function jsonOk<T>(data: T, init?: ResponseInit & { requestId?: string }) {
  const headers = new Headers(init?.headers);
  if (init?.requestId) {headers.set("x-request-id", init.requestId);}
  return Response.json(data, { ...init, headers });
}

export function jsonError(input: {
  status: number;
  code: ApiErrorCode;
  message: string;
  requestId: string;
  details?: unknown;
  headers?: HeadersInit;
}) {
  const headers = new Headers(input.headers);
  headers.set("x-request-id", input.requestId);
  return Response.json(
    {
      error: {
        code: input.code,
        message: input.message,
        requestId: input.requestId,
      },
      ...(input.details !== undefined ? { details: input.details } : {}),
    },
    { status: input.status, headers }
  );
}



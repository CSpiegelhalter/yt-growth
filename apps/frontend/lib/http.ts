export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function asApiResponse(err: unknown, defaultStatus = 500) {
  if (err instanceof ApiError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : String(err);
  console.error("[api-error]", message);
  return Response.json({ error: "Server error", detail: message }, { status: defaultStatus });
}

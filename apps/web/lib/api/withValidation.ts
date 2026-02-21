import type { NextRequest } from "next/server";
import type { z } from "zod";
import type { ApiRequestContext, NextRouteContext } from "./types";
import { ApiError } from "./errors";

// ── parseBody ──────────────────────────────────────────────────

type ParseBodyResult<T> =
  | { ok: true; data: T }
  | { ok: false; type: "json" }
  | { ok: false; type: "validation"; firstMessage: string; zodError: z.ZodError };

/**
 * Parse and validate a JSON request body against a Zod schema.
 * Returns a discriminated result so callers can map errors to any response shape.
 */
async function parseBody<T>(
  req: Request,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
): Promise<ParseBodyResult<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, type: "json" };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      ok: false,
      type: "validation",
      firstMessage: result.error.errors[0]?.message || "Invalid request",
      zodError: result.error,
    };
  }
  return { ok: true, data: result.data };
}

// ── withValidation ─────────────────────────────────────────────

type ValidationSchemas<P, Q, B> = {
  params?: z.ZodType<P, z.ZodTypeDef, unknown>;
  query?: z.ZodType<Q, z.ZodTypeDef, unknown>;
  body?: z.ZodType<B, z.ZodTypeDef, unknown>;
};

type Validated<P, Q, B> = {
  params?: P;
  query?: Q;
  body?: B;
};

/**
 * Middleware that validates request params, query, and/or body
 * before passing control to the inner handler.
 *
 * Generic over the API context type so it composes with
 * withAuth (ApiAuthContext) or bare createApiRoute (ApiRequestContext).
 */
export function withValidation<
  PIn,
  POut,
  QOut,
  BOut,
  Api extends ApiRequestContext = ApiRequestContext,
>(
  schemas: ValidationSchemas<POut, QOut, BOut>,
  handler: (
    req: NextRequest,
    ctx: NextRouteContext<PIn>,
    api: Api,
    validated: Validated<POut, QOut, BOut>,
  ) => Promise<Response>,
): (req: NextRequest, ctx: NextRouteContext<PIn>, api: Api) => Promise<Response> {
  return async (req, ctx, api) => {
    const validated: Validated<POut, QOut, BOut> = {};

    if (schemas.params) {
      const paramsRaw = await (ctx as any).params;
      const parsed = schemas.params.safeParse(paramsRaw);
      if (!parsed.success) {
        throw new ApiError({
          code: "VALIDATION_ERROR",
          status: 400,
          message: parsed.error.errors[0]?.message || "Invalid request",
          details: parsed.error.flatten(),
        });
      }
      validated.params = parsed.data;
    }

    if (schemas.query) {
      const url = new URL(req.url);
      const queryObj: Record<string, string> = {};
      url.searchParams.forEach((v, k) => (queryObj[k] = v));
      const parsed = schemas.query.safeParse(queryObj);
      if (!parsed.success) {
        throw new ApiError({
          code: "VALIDATION_ERROR",
          status: 400,
          message: parsed.error.errors[0]?.message || "Invalid request",
          details: parsed.error.flatten(),
        });
      }
      validated.query = parsed.data;
    }

    if (schemas.body) {
      const result = await parseBody(req, schemas.body);
      if (!result.ok) {
        throw new ApiError({
          code: "VALIDATION_ERROR",
          status: 400,
          message: result.type === "json" ? "Invalid JSON body" : result.firstMessage,
          ...(result.type === "validation" ? { details: result.zodError.flatten() } : {}),
        });
      }
      validated.body = result.data;
    }

    if (schemas.params && !validated.params) {
      throw new ApiError({
        code: "VALIDATION_ERROR",
        status: 400,
        message: "Invalid request",
      });
    }

    return handler(req, ctx, api, validated);
  };
}

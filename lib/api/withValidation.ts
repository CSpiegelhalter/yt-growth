import type { NextRequest } from "next/server";
import type { z } from "zod";
import type { ApiHandler, ApiRequestContext, NextRouteContext } from "./types";
import { ApiError } from "./errors";

export type ValidationSchemas<P, Q, B> = {
  params?: z.ZodType<P>;
  query?: z.ZodType<Q>;
  body?: z.ZodType<B>;
};

export type Validated<P, Q, B> = {
  params?: P;
  query?: Q;
  body?: B;
};

export function withValidation<PIn, QIn, BIn, POut, QOut, BOut>(
  schemas: ValidationSchemas<POut, QOut, BOut>,
  handler: (
    req: NextRequest,
    ctx: NextRouteContext<PIn>,
    api: ApiRequestContext,
    validated: Validated<POut, QOut, BOut>
  ) => Promise<Response>
): ApiHandler<PIn> {
  return async (req, ctx, api) => {
    const validated: Validated<POut, QOut, BOut> = {};

    if (schemas.params) {
      const paramsRaw = await (ctx as any).params;
      const parsed = schemas.params.safeParse(paramsRaw);
      if (!parsed.success) throw parsed.error;
      validated.params = parsed.data;
    }

    if (schemas.query) {
      const url = new URL(req.url);
      const queryObj: Record<string, string> = {};
      url.searchParams.forEach((v, k) => (queryObj[k] = v));
      const parsed = schemas.query.safeParse(queryObj);
      if (!parsed.success) throw parsed.error;
      validated.query = parsed.data;
    }

    if (schemas.body) {
      const bodyRaw = await req.json().catch(() => undefined);
      const parsed = schemas.body.safeParse(bodyRaw);
      if (!parsed.success) throw parsed.error;
      validated.body = parsed.data;
    }

    // Basic guard for routes that expect some params but didn't receive any
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



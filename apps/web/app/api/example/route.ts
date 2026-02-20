/**
 * GOLDEN PATH TEMPLATE — delete this route once real features exist.
 *
 * GET /api/example?query=...&limit=...
 *
 * Demonstrates the standard route pattern:
 *   1. createApiRoute wraps with requestContext + logging + errorHandling
 *   2. withAuth checks authentication
 *   3. withValidation parses query params against a Zod schema
 *   4. Use-case is called with validated input + injected adapter
 *   5. Result is returned via jsonOk
 *
 * The route is orchestration only — no business logic lives here.
 */

import { createApiRoute } from "@/lib/api/route";
import { withAuth, type ApiAuthContext } from "@/lib/api/withAuth";
import { withValidation } from "@/lib/api/withValidation";
import { jsonOk } from "@/lib/api/response";
import { DoThingQuerySchema } from "@/lib/features/example";
import { doThing } from "@/lib/features/example";
import { createExampleClient } from "@/lib/adapters/example/client";

export const GET = createApiRoute(
  { route: "/api/example" },
  withAuth(
    { mode: "required" },
    withValidation(
      { query: DoThingQuerySchema },
      async (_req, _ctx, api: ApiAuthContext, { query }) => {
        const port = createExampleClient(process.env.EXAMPLE_API_KEY ?? "");

        const result = await doThing(
          {
            userId: api.userId!,
            query: query!.query,
            limit: query!.limit,
          },
          port,
        );

        return jsonOk(result, { requestId: api.requestId });
      },
    ),
  ),
);

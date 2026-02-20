/**
 * GOLDEN PATH TEMPLATE — delete this folder once real features exist.
 *
 * Zod schemas for the "example" feature.
 * Used by route handlers via withValidation().
 */

import { z } from "zod";

export const DoThingQuerySchema = z.object({
  query: z.string().min(1, "Query is required").max(200),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export type DoThingQuery = z.infer<typeof DoThingQuerySchema>;

/**
 * Competitor Video Detail - Validation
 *
 * Zod schemas for request validation.
 */

import { z } from "zod";

export const ParamsSchema = z.object({
  videoId: z.string().min(1, "Video ID is required"),
});

export const QuerySchema = z.object({
  channelId: z.string().min(1, "Channel ID is required"),
  includeMoreFromChannel: z
    .union([z.literal("0"), z.literal("1")])
    .optional()
    .default("1"),
});

export type ValidatedParams = z.infer<typeof ParamsSchema>;
export type ValidatedQuery = z.infer<typeof QuerySchema>;

/**
 * Parse and validate route params.
 * Returns validated params or throws VideoDetailError.
 */
export function parseParams(params: Record<string, string>): ValidatedParams {
  const result = ParamsSchema.safeParse(params);
  if (!result.success) {
    throw new Error(`Invalid video ID: ${result.error.message}`);
  }
  return result.data;
}

/**
 * Parse and validate query params from URL.
 * Returns validated query or throws VideoDetailError.
 */
export function parseQuery(url: URL): ValidatedQuery {
  const result = QuerySchema.safeParse({
    channelId: url.searchParams.get("channelId") ?? "",
    includeMoreFromChannel:
      (url.searchParams.get("includeMoreFromChannel") as "0" | "1" | null) ??
      undefined,
  });
  if (!result.success) {
    throw new Error(`channelId query parameter required`);
  }
  return result.data;
}

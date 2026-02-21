/**
 * Competitor Video Detail - Validation
 *
 * Zod schemas for request validation.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared channel + video param schemas (used by owned-video insights routes)
// ---------------------------------------------------------------------------

const channelIdSchema = z.string().min(1);

export const channelParamsSchema = z.object({
  channelId: channelIdSchema,
});

import { z } from "zod";

export const SuggestionParamsSchema = z.object({
  channelId: z.string().min(1),
});

export const SuggestionActionParamsSchema = z.object({
  channelId: z.string().min(1),
  suggestionId: z.string().min(1),
});

export const SuggestionActionBodySchema = z.object({
  action: z.enum(["save", "dismiss", "use"]),
});

import { z } from "zod";

import { parseYouTubeVideoId } from "@/lib/shared/youtube-video-id";

export const ExtractTagsBodySchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .refine((val) => parseYouTubeVideoId(val) !== null, {
      message: "Invalid YouTube URL",
    }),
});

import { z } from "zod";
import { parseYouTubeVideoId } from "@/lib/shared/youtube-video-id";

export const GenerateTagsBodySchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must be at most 120 characters"),
  description: z
    .string()
    .trim()
    .max(4000, "Description must be at most 4000 characters")
    .optional(),
  referenceYoutubeUrl: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => {
        if (!val) {return true;}
        return parseYouTubeVideoId(val) !== null;
      },
      { message: "Invalid YouTube URL" },
    ),
});

export const ExtractTagsBodySchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .refine((val) => parseYouTubeVideoId(val) !== null, {
      message: "Invalid YouTube URL",
    }),
});

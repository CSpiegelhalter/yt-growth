import { z } from "zod";
import { editorStateV1Schema } from "./editor/editorState";

export const GenerateThumbnailBodySchema = z.object({
  style: z.enum(["compare", "subject", "object", "hold"]),
  prompt: z.string().trim().min(3).max(500),
  includeIdentity: z.boolean().optional().default(false),
  identityModelId: z.string().uuid().optional(),
  variants: z.number().int().min(1).max(4).optional().default(3),
});

export const GenerateImg2ImgBodySchema = z.object({
  inputImageUrl: z.string().url(),
  parentJobId: z.string().uuid(),
  prompt: z.string().trim().min(3).max(500).optional(),
  strength: z.number().min(0.1).max(1.0).optional().default(0.75),
});

export const CreateProjectBodySchema = z.object({
  thumbnailJobId: z.string().uuid(),
  baseImageUrl: z.string().url(),
});

export const ProjectParamsSchema = z.object({
  projectId: z.string().uuid(),
});

export const UpdateProjectBodySchema = z.object({
  editorState: editorStateV1Schema,
});

export const ExportProjectBodySchema = z.object({
  dataUrl: z.string().min(32),
  format: z.enum(["png", "jpg"]),
});

export const ThumbnailJobParamsSchema = z.object({
  id: z.string().uuid(),
});

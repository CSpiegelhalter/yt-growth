import { z } from "zod";

export const editorStateV1Schema = z.object({
  version: z.literal(1),
  canvas: z.object({
    width: z.literal(1280),
    height: z.literal(720),
  }),
  objects: z
    .array(
      z.object({
        id: z.string().min(1),
        type: z.enum(["text", "arrow", "ellipse", "image"]),
        x: z.number(),
        y: z.number(),
        width: z.number().optional(),
        height: z.number().optional(),
        rotation: z.number().optional().default(0),
        zIndex: z.number().int().default(0),

        // text
        text: z.string().optional(),
        fontFamily: z.string().optional(),
        fontSize: z.number().optional(),
        fontWeight: z.union([z.number(), z.string()]).optional(),
        fill: z.string().optional(),
        stroke: z.string().optional(),
        strokeWidth: z.number().optional(),
        shadowColor: z.string().optional(),
        shadowBlur: z.number().optional(),
        shadowOffsetX: z.number().optional(),
        shadowOffsetY: z.number().optional(),

        // arrow
        mode: z.enum(["straight", "curved", "path"]).optional(),
        points: z.array(z.number()).optional(),
        color: z.string().optional(),
        thickness: z.number().optional(),
        dashed: z.boolean().optional(),

        // ellipse
        radiusX: z.number().optional(),
        radiusY: z.number().optional(),

        // image
        srcUrl: z.string().url().optional(),
        opacity: z.number().min(0).max(1).optional(),
      })
    )
    .default([]),
});

export type EditorStateV1 = z.infer<typeof editorStateV1Schema>;

export function defaultEditorState(): EditorStateV1 {
  return {
    version: 1,
    canvas: { width: 1280, height: 720 },
    objects: [],
  };
}


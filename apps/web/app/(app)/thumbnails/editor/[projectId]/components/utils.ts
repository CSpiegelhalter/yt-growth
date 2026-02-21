/**
 * Thumbnail Editor Utility Functions
 */

import type { EditorObject, EditorDocument, ArrowObject, ImageObject } from "./types";
import { DEFAULT_DOCUMENT } from "./types";
import { CANVAS_WIDTH, CANVAS_HEIGHT, SNAP_THRESHOLD } from "./constants";

// ============================================================================
// ID GENERATION
// ============================================================================

export function generateId(): string {
  return globalThis.crypto.randomUUID();
}

// ============================================================================
// OBJECT HELPERS
// ============================================================================

export function getNextZIndex(objects: EditorObject[]): number {
  if (objects.length === 0) {return 1;}
  return Math.max(...objects.map((o) => o.zIndex)) + 1;
}

export function sortByZIndex(objects: EditorObject[]): EditorObject[] {
  return [...objects].sort((a, b) => a.zIndex - b.zIndex);
}

// ============================================================================
// SNAPPING
// ============================================================================

function snapToValue(value: number, target: number, threshold = SNAP_THRESHOLD): number {
  return Math.abs(value - target) <= threshold ? target : value;
}

export function snapToCenter(x: number, y: number): { x: number; y: number } {
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;
  return {
    x: snapToValue(x, centerX),
    y: snapToValue(y, centerY),
  };
}

// ============================================================================
// IMAGE HELPERS
// ============================================================================

interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * Calculate dimensions to fit image inside container while preserving aspect ratio
 */
export function fitImageContain(
  imgWidth: number,
  imgHeight: number,
  containerWidth: number = CANVAS_WIDTH,
  containerHeight: number = CANVAS_HEIGHT
): ImageDimensions {
  const imgRatio = imgWidth / imgHeight;
  const containerRatio = containerWidth / containerHeight;

  if (imgRatio > containerRatio) {
    // Image is wider - fit to width
    return {
      width: containerWidth,
      height: containerWidth / imgRatio,
    };
  } 
    // Image is taller - fit to height
    return {
      width: containerHeight * imgRatio,
      height: containerHeight,
    };
  
}

/**
 * Calculate dimensions to cover container while preserving aspect ratio
 */
export function fitImageCover(
  imgWidth: number,
  imgHeight: number,
  containerWidth: number = CANVAS_WIDTH,
  containerHeight: number = CANVAS_HEIGHT
): ImageDimensions {
  const imgRatio = imgWidth / imgHeight;
  const containerRatio = containerWidth / containerHeight;

  if (imgRatio > containerRatio) {
    // Image is wider - fit to height
    return {
      width: containerHeight * imgRatio,
      height: containerHeight,
    };
  } 
    // Image is taller - fit to width
    return {
      width: containerWidth,
      height: containerWidth / imgRatio,
    };
  
}

/**
 * Calculate position to center image in canvas
 */
export function centerInCanvas(width: number, height: number): { x: number; y: number } {
  return {
    x: (CANVAS_WIDTH - width) / 2,
    y: (CANVAS_HEIGHT - height) / 2,
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

// ============================================================================
// STATE MIGRATION
// ============================================================================

/**
 * Migrate from V1 editor state to V2 document format
 */
export function migrateFromV1(v1State: unknown): EditorDocument {
  if (!v1State || typeof v1State !== "object") {
    return DEFAULT_DOCUMENT;
  }

  const state = v1State as Record<string, unknown>;
  
  // Check if it's already V2
  if (state.version === 2) {
    return state as unknown as EditorDocument;
  }

  // V1 migration
  const objects: EditorObject[] = [];
  const v1Objects = Array.isArray(state.objects) ? state.objects : [];

  for (const obj of v1Objects) {
    if (!obj || typeof obj !== "object") {continue;}
    const o = obj as Record<string, unknown>;

    switch (o.type) {
      case "text":
        objects.push({
          id: String(o.id || generateId()),
          type: "text",
          x: Number(o.x) || 0,
          y: Number(o.y) || 0,
          rotation: Number(o.rotation) || 0,
          zIndex: Number(o.zIndex) || 0,
          opacity: 1,
          text: String(o.text || ""),
          fontFamily: String(o.fontFamily || "Inter, sans-serif"),
          fontSize: Number(o.fontSize) || 64,
          fontWeight: String(o.fontWeight || "800"),
          letterSpacing: 0,
          lineHeight: 1.1,
          textAlign: "left",
          fill: String(o.fill || "#FFFFFF"),
          stroke: String(o.stroke || "#000000"),
          strokeWidth: Number(o.strokeWidth) || 0,
          shadowEnabled: Boolean(o.shadowColor),
          shadowColor: String(o.shadowColor || "rgba(0,0,0,0.5)"),
          shadowBlur: Number(o.shadowBlur) || 10,
          shadowOffsetX: Number(o.shadowOffsetX) || 4,
          shadowOffsetY: Number(o.shadowOffsetY) || 4,
          backgroundEnabled: false,
          backgroundColor: "#000000",
          backgroundPadding: 16,
          backgroundRadius: 8,
        });
        break;

      case "arrow":
        objects.push({
          id: String(o.id || generateId()),
          type: "arrow",
          x: Number(o.x) || 0,
          y: Number(o.y) || 0,
          rotation: Number(o.rotation) || 0,
          zIndex: Number(o.zIndex) || 0,
          opacity: 1,
          points: Array.isArray(o.points) ? o.points.map(Number) : [300, 360, 980, 360],
          isCurved: o.mode === "curved",
          style: "classic",
          color: String(o.color || "#FFCC00"),
          thickness: Number(o.thickness) || 16,
          arrowheadSize: 1.5,
          arrowheadAtStart: false,
          arrowheadAtEnd: true,
          outlineEnabled: false,
          outlineColor: "#000000",
          outlineWidth: 4,
          shadowEnabled: false,
          shadowColor: "rgba(0,0,0,0.5)",
          shadowBlur: 10,
          dashed: Boolean(o.dashed),
          dashLength: 20,
          dashGap: 10,
        } as ArrowObject);
        break;

      case "ellipse":
        objects.push({
          id: String(o.id || generateId()),
          type: "shape",
          x: Number(o.x) || 0,
          y: Number(o.y) || 0,
          rotation: Number(o.rotation) || 0,
          zIndex: Number(o.zIndex) || 0,
          opacity: 1,
          shapeType: "ellipse",
          width: Number(o.radiusX) * 2 || 200,
          height: Number(o.radiusY) * 2 || 200,
          fill: String(o.fill || "transparent"),
          fillEnabled: Boolean(o.fill && o.fill !== "transparent" && o.fill !== "rgba(0,0,0,0)"),
          stroke: String(o.stroke || "#FFCC00"),
          strokeWidth: Number(o.strokeWidth) || 8,
          strokeEnabled: true,
          cornerRadius: 0,
          shadowEnabled: false,
          shadowColor: "rgba(0,0,0,0.5)",
          shadowBlur: 10,
          shadowOffsetX: 4,
          shadowOffsetY: 4,
        });
        break;

      case "image":
        objects.push({
          id: String(o.id || generateId()),
          type: "image",
          x: Number(o.x) || 0,
          y: Number(o.y) || 0,
          rotation: Number(o.rotation) || 0,
          zIndex: Number(o.zIndex) || 0,
          opacity: Number(o.opacity) ?? 1,
          srcUrl: String(o.srcUrl || ""),
          originalWidth: Number(o.width) || 300,
          originalHeight: Number(o.height) || 300,
          width: Number(o.width) || 300,
          height: Number(o.height) || 300,
          cropX: 0,
          cropY: 0,
          cropWidth: 0,
          cropHeight: 0,
        } as ImageObject);
        break;
    }
  }

  return {
    version: 2,
    settings: {
      width: 1280,
      height: 720,
      backgroundColor: "#1a1a1a",
      backgroundTransparent: false,
      safeAreaEnabled: false,
      safeAreaMargin: 5,
    },
    objects,
  };
}

/**
 * Convert V2 document back to V1 format for API compatibility
 */
export function convertToV1(doc: EditorDocument): unknown {
  return {
    version: 1,
    canvas: { width: 1280, height: 720 },
    objects: doc.objects.map((obj) => {
      switch (obj.type) {
        case "text":
          return {
            id: obj.id,
            type: "text",
            x: obj.x,
            y: obj.y,
            rotation: obj.rotation,
            zIndex: obj.zIndex,
            text: obj.text,
            fontFamily: obj.fontFamily,
            fontSize: obj.fontSize,
            fontWeight: obj.fontWeight,
            fill: obj.fill,
            stroke: obj.stroke,
            strokeWidth: obj.strokeWidth,
            shadowColor: obj.shadowEnabled ? obj.shadowColor : undefined,
            shadowBlur: obj.shadowEnabled ? obj.shadowBlur : undefined,
            shadowOffsetX: obj.shadowEnabled ? obj.shadowOffsetX : undefined,
            shadowOffsetY: obj.shadowEnabled ? obj.shadowOffsetY : undefined,
          };

        case "arrow": {
          // Determine mode based on points count and curved flag
          let mode: "straight" | "curved" | "path" = "straight";
          if (obj.points.length > 4) {
            mode = "path"; // Multiple points = path
          } else if (obj.isCurved) {
            mode = "curved";
          }
          return {
            id: obj.id,
            type: "arrow",
            x: obj.x,
            y: obj.y,
            rotation: obj.rotation,
            zIndex: obj.zIndex,
            mode,
            points: obj.points,
            color: obj.color,
            thickness: obj.thickness,
            dashed: obj.dashed,
          };
        }

        case "shape":
          if (obj.shapeType === "ellipse") {
            return {
              id: obj.id,
              type: "ellipse",
              x: obj.x,
              y: obj.y,
              rotation: obj.rotation,
              zIndex: obj.zIndex,
              radiusX: obj.width / 2,
              radiusY: obj.height / 2,
              stroke: obj.stroke,
              strokeWidth: obj.strokeWidth,
              fill: obj.fillEnabled ? obj.fill : "rgba(0,0,0,0)",
              dashed: false,
            };
          }
          // Other shapes not in V1, skip or convert to generic
          return null;

        case "image":
          return {
            id: obj.id,
            type: "image",
            x: obj.x,
            y: obj.y,
            rotation: obj.rotation,
            zIndex: obj.zIndex,
            width: obj.width,
            height: obj.height,
            srcUrl: obj.srcUrl,
            opacity: obj.opacity,
          };

        default:
          return null;
      }
    }).filter(Boolean),
  };
}

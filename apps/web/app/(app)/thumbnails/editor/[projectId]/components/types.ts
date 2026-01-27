/**
 * Thumbnail Editor Type Definitions
 * 
 * Architecture: Konva.js-based canvas editor for YouTube thumbnail creation.
 * All coordinates and dimensions are in canvas units (1280x720 base).
 */

// ============================================================================
// TOOL MODES
// ============================================================================

export type ToolMode = 
  | "select"    // Default: click to select, drag to move
  | "pan"       // Hand tool: drag canvas to pan
  | "text"      // Click to add text
  | "arrow"     // Drag to create arrow
  | "line"      // Drag to create line (no arrowhead)
  | "shape"     // Click to add shape
  | "image";    // Trigger image upload

// ============================================================================
// BASE OBJECT TYPES
// ============================================================================

export interface BaseObject {
  id: string;
  type: "text" | "arrow" | "image" | "shape";
  x: number;
  y: number;
  rotation: number;
  zIndex: number;
  opacity: number;
  locked?: boolean;
}

// ============================================================================
// TEXT OBJECT
// ============================================================================

export interface TextObject extends BaseObject {
  type: "text";
  text: string;
  // Typography
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  letterSpacing: number;
  lineHeight: number;
  textAlign: "left" | "center" | "right";
  // Colors
  fill: string;
  // Stroke/Outline
  stroke: string;
  strokeWidth: number;
  // Shadow
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  // Background pill
  backgroundEnabled: boolean;
  backgroundColor: string;
  backgroundPadding: number;
  backgroundRadius: number;
}

export const DEFAULT_TEXT: Omit<TextObject, "id" | "x" | "y" | "zIndex"> = {
  type: "text",
  text: "Add text",
  fontFamily: "Inter, system-ui, -apple-system, sans-serif",
  fontSize: 96,
  fontWeight: "800",
  letterSpacing: 0,
  lineHeight: 1.1,
  textAlign: "left",
  fill: "#FFFFFF",
  stroke: "#000000",
  strokeWidth: 8,
  shadowEnabled: true,
  shadowColor: "rgba(0,0,0,0.6)",
  shadowBlur: 12,
  shadowOffsetX: 4,
  shadowOffsetY: 4,
  backgroundEnabled: false,
  backgroundColor: "#000000",
  backgroundPadding: 16,
  backgroundRadius: 8,
  rotation: 0,
  opacity: 1,
};

// ============================================================================
// ARROW OBJECT
// ============================================================================

export type ArrowStyle = 
  | "classic"     // Standard uniform thickness
  | "uniform"     // Same as classic (alias)
  | "tapered"     // Fat base, thin tip
  | "thick"       // Bold uniform arrow
  | "outlined"    // With outline effect
  | "glow"        // Arrow with glow effect
  | "neon"        // Bright neon glow
  | "sketch"      // Hand-drawn style
  | "double";     // Double line

export interface ArrowObject extends BaseObject {
  type: "arrow";
  // Geometry: [x1, y1, x2, y2] for straight, [x1,y1,cx,cy,x2,y2] for curved
  points: number[];
  isCurved: boolean;
  // Styling
  style: ArrowStyle;
  color: string;
  thickness: number;
  // Arrowhead
  arrowheadSize: number; // multiplier relative to thickness
  arrowheadAtStart: boolean;
  arrowheadAtEnd: boolean;
  // Outline
  outlineEnabled: boolean;
  outlineColor: string;
  outlineWidth: number;
  // Shadow/Glow
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  // Dashed
  dashed: boolean;
  dashLength: number;
  dashGap: number;
}

export const DEFAULT_ARROW: Omit<ArrowObject, "id" | "x" | "y" | "zIndex" | "points"> = {
  type: "arrow",
  isCurved: false,
  style: "classic",
  color: "#FFCC00",
  thickness: 16,
  arrowheadSize: 1.5,
  arrowheadAtStart: false,
  arrowheadAtEnd: true,
  outlineEnabled: false,
  outlineColor: "#000000",
  outlineWidth: 4,
  shadowEnabled: false,
  shadowColor: "rgba(0,0,0,0.5)",
  shadowBlur: 10,
  dashed: false,
  dashLength: 20,
  dashGap: 10,
  rotation: 0,
  opacity: 1,
};

// ============================================================================
// IMAGE OBJECT
// ============================================================================

export interface ImageObject extends BaseObject {
  type: "image";
  srcUrl: string;
  // Original dimensions (for aspect ratio calculation)
  originalWidth: number;
  originalHeight: number;
  // Display dimensions
  width: number;
  height: number;
  // Crop settings
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  // Filters (optional future enhancement)
  brightness?: number;
  contrast?: number;
  saturation?: number;
}

export const DEFAULT_IMAGE: Omit<ImageObject, "id" | "x" | "y" | "zIndex" | "srcUrl" | "originalWidth" | "originalHeight" | "width" | "height"> = {
  type: "image",
  cropX: 0,
  cropY: 0,
  cropWidth: 0, // 0 means full image
  cropHeight: 0,
  rotation: 0,
  opacity: 1,
};

// ============================================================================
// SHAPE OBJECT
// ============================================================================

export type ShapeType = "rectangle" | "ellipse" | "triangle";

export interface ShapeObject extends BaseObject {
  type: "shape";
  shapeType: ShapeType;
  width: number;
  height: number;
  // Fill
  fill: string;
  fillEnabled: boolean;
  // Stroke
  stroke: string;
  strokeWidth: number;
  strokeEnabled: boolean;
  // Corner radius (for rectangle)
  cornerRadius: number;
  // Shadow
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
}

export const DEFAULT_SHAPE: Omit<ShapeObject, "id" | "x" | "y" | "zIndex"> = {
  type: "shape",
  shapeType: "ellipse",
  width: 200,
  height: 200,
  fill: "rgba(255,204,0,0.3)",
  fillEnabled: true,
  stroke: "#FFCC00",
  strokeWidth: 8,
  strokeEnabled: true,
  cornerRadius: 0,
  shadowEnabled: false,
  shadowColor: "rgba(0,0,0,0.5)",
  shadowBlur: 10,
  shadowOffsetX: 4,
  shadowOffsetY: 4,
  rotation: 0,
  opacity: 1,
};

// ============================================================================
// UNION TYPE
// ============================================================================

export type EditorObject = TextObject | ArrowObject | ImageObject | ShapeObject;

// ============================================================================
// DOCUMENT STATE
// ============================================================================

export interface DocumentSettings {
  width: 1280;
  height: 720;
  backgroundColor: string;
  backgroundTransparent: boolean;
  safeAreaEnabled: boolean;
  safeAreaMargin: number; // percentage
}

export interface EditorDocument {
  version: 2;
  settings: DocumentSettings;
  objects: EditorObject[];
}

export const DEFAULT_DOCUMENT: EditorDocument = {
  version: 2,
  settings: {
    width: 1280,
    height: 720,
    backgroundColor: "#1a1a1a",
    backgroundTransparent: false,
    safeAreaEnabled: true,
    safeAreaMargin: 5,
  },
  objects: [],
};

// ============================================================================
// EDITOR STATE (UI STATE)
// ============================================================================

export interface EditorUIState {
  selectedId: string | null;
  tool: ToolMode;
  zoom: number;
  panX: number;
  panY: number;
  isSpacePressed: boolean; // for spacebar pan
  isPanning: boolean;
  showSafeArea: boolean;
}

export const DEFAULT_UI_STATE: EditorUIState = {
  selectedId: null,
  tool: "select",
  zoom: 1,
  panX: 0,
  panY: 0,
  isSpacePressed: false,
  isPanning: false,
  showSafeArea: true,
};

// ============================================================================
// HISTORY
// ============================================================================

export interface HistoryEntry {
  document: EditorDocument;
  timestamp: number;
  description?: string;
}

export interface HistoryState {
  past: HistoryEntry[];
  present: HistoryEntry;
  future: HistoryEntry[];
  maxSize: number;
}

// ============================================================================
// FONTS
// ============================================================================

// Font options - system fonts + Google Fonts
// Google Fonts are loaded dynamically in the editor
export const FONT_OPTIONS = [
  // System/Web-safe fonts (always available)
  { label: "Arial", value: "Arial, Helvetica, sans-serif", google: false },
  { label: "Arial Black", value: "'Arial Black', Gadget, sans-serif", google: false },
  { label: "Impact", value: "Impact, Charcoal, sans-serif", google: false },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif", google: false },
  { label: "Georgia", value: "Georgia, serif", google: false },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif", google: false },
  { label: "Comic Sans", value: "'Comic Sans MS', cursive", google: false },
  { label: "System UI", value: "system-ui, -apple-system, sans-serif", google: false },
  // Popular Google Fonts for thumbnails
  { label: "Bebas Neue", value: "'Bebas Neue', sans-serif", google: true },
  { label: "Oswald", value: "'Oswald', sans-serif", google: true },
  { label: "Montserrat", value: "'Montserrat', sans-serif", google: true },
  { label: "Poppins", value: "'Poppins', sans-serif", google: true },
  { label: "Roboto", value: "'Roboto', sans-serif", google: true },
  { label: "Roboto Condensed", value: "'Roboto Condensed', sans-serif", google: true },
  { label: "Open Sans", value: "'Open Sans', sans-serif", google: true },
  { label: "Lato", value: "'Lato', sans-serif", google: true },
  { label: "Inter", value: "'Inter', sans-serif", google: true },
  { label: "Raleway", value: "'Raleway', sans-serif", google: true },
  { label: "Nunito", value: "'Nunito', sans-serif", google: true },
  { label: "Anton", value: "'Anton', sans-serif", google: true },
  { label: "Bangers", value: "'Bangers', cursive", google: true },
  { label: "Bungee", value: "'Bungee', cursive", google: true },
  { label: "Permanent Marker", value: "'Permanent Marker', cursive", google: true },
  { label: "Russo One", value: "'Russo One', sans-serif", google: true },
  { label: "Black Ops One", value: "'Black Ops One', cursive", google: true },
  { label: "Creepster", value: "'Creepster', cursive", google: true },
  { label: "Alfa Slab One", value: "'Alfa Slab One', serif", google: true },
  { label: "Righteous", value: "'Righteous', cursive", google: true },
  { label: "Fredoka One", value: "'Fredoka One', cursive", google: true },
  { label: "Pacifico", value: "'Pacifico', cursive", google: true },
  { label: "Lobster", value: "'Lobster', cursive", google: true },
  { label: "Press Start 2P", value: "'Press Start 2P', cursive", google: true },
  { label: "Titan One", value: "'Titan One', cursive", google: true },
] as const;

// Extract Google Font names for loading
export const GOOGLE_FONTS = FONT_OPTIONS
  .filter((f) => f.google)
  .map((f) => f.label);

// ============================================================================
// ARROW PRESETS
// ============================================================================

export const ARROW_PRESETS: Record<ArrowStyle, Partial<ArrowObject>> = {
  classic: {
    thickness: 16,
    outlineEnabled: false,
    shadowEnabled: false,
  },
  uniform: {
    thickness: 16,
    outlineEnabled: false,
    shadowEnabled: false,
  },
  tapered: {
    thickness: 32, // Thicker base for tapered
    outlineEnabled: false,
    shadowEnabled: false,
  },
  thick: {
    thickness: 32,
    outlineEnabled: false,
    shadowEnabled: false,
  },
  outlined: {
    thickness: 16,
    outlineEnabled: true,
    outlineWidth: 4,
    outlineColor: "#000000",
    shadowEnabled: false,
  },
  glow: {
    thickness: 16,
    outlineEnabled: false,
    shadowEnabled: true,
    shadowColor: "rgba(255,255,255,0.8)",
    shadowBlur: 25,
  },
  neon: {
    thickness: 12,
    color: "#00ff88",
    outlineEnabled: false,
    shadowEnabled: true,
    shadowColor: "#00ff88",
    shadowBlur: 30,
  },
  sketch: {
    thickness: 8,
    dashed: true,
    dashLength: 15,
    dashGap: 8,
    outlineEnabled: false,
    shadowEnabled: false,
  },
  double: {
    thickness: 20,
    outlineEnabled: true,
    outlineWidth: 6,
    outlineColor: "#ffffff",
    shadowEnabled: false,
  },
};

/**
 * Thumbnail Editor Constants
 */

// Canvas dimensions (YouTube thumbnail standard)
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;
export const ASPECT_RATIO = 16 / 9;

// Safe area margin (percentage from edge)
export const SAFE_AREA_MARGIN = 0.05; // 5%

// Zoom limits
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 3;
export const ZOOM_STEP = 0.1;

// Snap thresholds
export const SNAP_THRESHOLD = 8;
export const ROTATION_SNAP_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
export const ROTATION_SNAP_THRESHOLD = 5;

// Hit area for thin objects like arrows
export const MIN_HIT_STROKE_WIDTH = 20;

// History
export const MAX_HISTORY_SIZE = 50;

// Upload limits
export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_IMAGE_DIMENSION = 4096;
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

// Export quality
export const EXPORT_PNG_QUALITY = 1;
export const EXPORT_JPG_QUALITY = 0.92;

// Colors for presets
export const COLOR_PRESETS = [
  "#FFFFFF", // White
  "#000000", // Black
  "#FF0000", // Red
  "#FFCC00", // Yellow
  "#00FF00", // Green
  "#00CCFF", // Cyan
  "#0066FF", // Blue
  "#FF00FF", // Magenta
  "#FF6600", // Orange
  "#9933FF", // Purple
];

// Stroke width presets
export const STROKE_WIDTH_PRESETS = [0, 2, 4, 6, 8, 12, 16, 24];

// Font size presets
export const FONT_SIZE_PRESETS = [24, 36, 48, 64, 80, 96, 128, 160, 200];

// Arrow thickness presets
export const ARROW_THICKNESS_PRESETS = [8, 12, 16, 24, 32, 48];

// Keyboard shortcuts info
export const KEYBOARD_SHORTCUTS = {
  delete: ["Delete", "Backspace"],
  undo: ["Cmd+Z", "Ctrl+Z"],
  redo: ["Cmd+Shift+Z", "Ctrl+Shift+Z"],
  pan: ["Space (hold)"],
  deselect: ["Escape"],
  nudge: ["Arrow keys"],
  nudgeFast: ["Shift + Arrow keys"],
} as const;

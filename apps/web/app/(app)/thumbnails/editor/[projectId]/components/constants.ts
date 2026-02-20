/**
 * Thumbnail Editor Constants
 */

// Canvas dimensions (YouTube thumbnail standard)
export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;
// Zoom limits
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 3;

// Snap thresholds
export const SNAP_THRESHOLD = 8;
// Hit area for thin objects like arrows
export const MIN_HIT_STROKE_WIDTH = 20;

// History
export const MAX_HISTORY_SIZE = 50;

// Upload limits
export const MAX_IMAGE_SIZE_MB = 10;
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

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


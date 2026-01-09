/**
 * Base Template Utilities (Concept-Driven)
 *
 * Shared utilities for all concept-based thumbnail templates.
 * Handles hook text rendering, composition, and overlay generation.
 */

import type { ConceptSpec, ThumbnailPalette, ConceptPlan } from "../types";
import { svgEscape, svgTextWithOutline, svgDropShadowFilter } from "../svg";
import { generateAllOverlays } from "../overlays";

// ============================================
// CONSTANTS
// ============================================

export const THUMBNAIL_WIDTH = 1280;
export const THUMBNAIL_HEIGHT = 720;

// Safe zones (avoid YouTube overlays)
export const SAFE_MARGIN = {
  top: 40,
  bottom: 60, // Extra space for timestamp/duration
  left: 40,
  right: 40,
};

// ============================================
// SPEC RESOLUTION
// ============================================

/**
 * Resolve the final values from spec (edits override plan).
 */
export function resolveSpec(spec: ConceptSpec): {
  hookText: string;
  subHook?: string;
  badgeText?: string;
  palette: ThumbnailPalette;
  align: "left" | "center" | "right";
  outline: boolean;
  shadow: boolean;
  showBadges: boolean;
  showSymbol: boolean;
  showHighlights: boolean;
} {
  return {
    hookText: spec.hookText ?? spec.plan.hookText,
    subHook: spec.subHook ?? spec.plan.subHook,
    badgeText: spec.badgeText,
    palette: {
      ...spec.plan.palette,
      ...spec.palette,
    },
    align: spec.align ?? "left",
    outline: spec.outline ?? true,
    shadow: spec.shadow ?? true,
    showBadges: spec.showBadges ?? true,
    showSymbol: spec.showSymbol ?? true,
    showHighlights: spec.showHighlights ?? true,
  };
}

// ============================================
// HOOK TEXT POSITIONING
// ============================================

export type HookPosition = {
  x: number;
  y: number;
  maxWidth: number;
  anchor: "start" | "middle" | "end";
};

/**
 * Get hook text position based on composition.
 */
export function getHookPosition(plan: ConceptPlan): HookPosition {
  const { textSafeArea } = plan.composition;

  // Default positions by safe area
  switch (textSafeArea) {
    case "left":
      return {
        x: SAFE_MARGIN.left,
        y: THUMBNAIL_HEIGHT * 0.45,
        maxWidth: THUMBNAIL_WIDTH * 0.45,
        anchor: "start",
      };
    case "right":
      return {
        x: THUMBNAIL_WIDTH - SAFE_MARGIN.right,
        y: THUMBNAIL_HEIGHT * 0.45,
        maxWidth: THUMBNAIL_WIDTH * 0.45,
        anchor: "end",
      };
    case "top":
      return {
        x: SAFE_MARGIN.left,
        y: SAFE_MARGIN.top + 80,
        maxWidth: THUMBNAIL_WIDTH * 0.7,
        anchor: "start",
      };
    case "bottom":
      return {
        x: SAFE_MARGIN.left,
        y: THUMBNAIL_HEIGHT - SAFE_MARGIN.bottom - 60,
        maxWidth: THUMBNAIL_WIDTH * 0.7,
        anchor: "start",
      };
    case "center":
    default:
      return {
        x: THUMBNAIL_WIDTH / 2,
        y: THUMBNAIL_HEIGHT * 0.45,
        maxWidth: THUMBNAIL_WIDTH * 0.8,
        anchor: "middle",
      };
  }
}

/**
 * Get sub-hook position relative to hook.
 */
export function getSubHookPosition(hookPos: HookPosition, hookFontSize: number): HookPosition {
  return {
    x: hookPos.x,
    y: hookPos.y + hookFontSize + 20,
    maxWidth: hookPos.maxWidth,
    anchor: hookPos.anchor,
  };
}

// ============================================
// FONT SIZE CALCULATION
// ============================================

/**
 * Calculate optimal font size for hook text.
 */
export function calculateHookFontSize(
  text: string,
  maxWidth: number,
  maxFontSize: number = 96,
  minFontSize: number = 48
): number {
  const charWidthRatio = 0.6; // Approximate for bold sans-serif

  for (let size = maxFontSize; size >= minFontSize; size -= 4) {
    const estimatedWidth = text.length * size * charWidthRatio;
    if (estimatedWidth <= maxWidth) {
      return size;
    }
  }

  return minFontSize;
}

/**
 * Word-wrap text to fit within max width.
 */
export function wrapText(
  text: string,
  fontSize: number,
  maxWidth: number
): string[] {
  const charWidthRatio = 0.6;
  const charWidth = fontSize * charWidthRatio;
  const maxChars = Math.floor(maxWidth / charWidth);

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxChars) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);

  return lines;
}

// ============================================
// SVG TEXT RENDERING
// ============================================

/**
 * Generate hook text SVG with proper styling.
 */
export function generateHookTextSvg(options: {
  text: string;
  position: HookPosition;
  palette: ThumbnailPalette;
  outline: boolean;
  shadow: boolean;
  fontWeight?: number;
}): string {
  const {
    text,
    position,
    palette,
    outline,
    shadow,
    fontWeight = 900,
  } = options;

  // Calculate font size to fit
  const fontSize = calculateHookFontSize(text, position.maxWidth);
  const lines = wrapText(text, fontSize, position.maxWidth);

  const elements: string[] = [];

  // Add drop shadow filter if needed
  if (shadow) {
    elements.push(
      svgDropShadowFilter("hookShadow", { dx: 4, dy: 6, blur: 10, opacity: 0.7 })
    );
  }

  const lineHeight = fontSize * 1.1;
  const totalHeight = lines.length * lineHeight;
  const startY = position.y - (totalHeight - lineHeight) / 2;

  const filterAttr = shadow ? 'filter="url(#hookShadow)"' : "";

  for (let i = 0; i < lines.length; i++) {
    const y = startY + i * lineHeight;
    const content = lines[i];

    if (outline) {
      elements.push(`
        <g ${filterAttr}>
          ${svgTextWithOutline(content, {
            x: position.x,
            y,
            fontSize,
            fontWeight,
            fill: palette.text,
            stroke: "#000000",
            strokeWidth: 5,
            textAnchor: position.anchor,
            fontFamily: "system-ui, -apple-system, sans-serif",
          })}
        </g>
      `);
    } else {
      elements.push(`
        <g ${filterAttr}>
          <text 
            x="${position.x}" 
            y="${y}" 
            font-size="${fontSize}" 
            font-weight="${fontWeight}" 
            font-family="system-ui, -apple-system, sans-serif" 
            fill="${svgEscape(palette.text)}" 
            text-anchor="${position.anchor}"
          >${svgEscape(content)}</text>
        </g>
      `);
    }
  }

  return elements.join("\n");
}

/**
 * Generate sub-hook text SVG.
 */
export function generateSubHookSvg(options: {
  text: string;
  position: HookPosition;
  palette: ThumbnailPalette;
  outline: boolean;
  shadow: boolean;
}): string {
  const { text, position, palette, outline, shadow } = options;

  const fontSize = 32;
  const filterAttr = shadow ? 'filter="url(#hookShadow)"' : "";

  if (outline) {
    return `
      <g ${filterAttr}>
        ${svgTextWithOutline(text, {
          x: position.x,
          y: position.y,
          fontSize,
          fontWeight: 600,
          fill: palette.text,
          stroke: "#000000",
          strokeWidth: 3,
          textAnchor: position.anchor,
          fontFamily: "system-ui, -apple-system, sans-serif",
        })}
      </g>
    `;
  }

  return `
    <g ${filterAttr}>
      <text 
        x="${position.x}" 
        y="${position.y}" 
        font-size="${fontSize}" 
        font-weight="600" 
        font-family="system-ui, -apple-system, sans-serif" 
        fill="${svgEscape(palette.text)}" 
        text-anchor="${position.anchor}"
      >${svgEscape(text)}</text>
    </g>
  `;
}

// ============================================
// COMPLETE OVERLAY GENERATION
// ============================================

/**
 * Generate the complete SVG overlay for a concept spec.
 */
export function generateConceptOverlay(spec: ConceptSpec): string {
  const resolved = resolveSpec(spec);
  const plan = spec.plan;

  const elements: string[] = [];

  // Get text positioning
  const hookPos = getHookPosition(plan);
  const hookFontSize = calculateHookFontSize(resolved.hookText, hookPos.maxWidth);

  // 1. Add attention overlays (highlights, symbols, badges)
  elements.push(
    generateAllOverlays({
      badges: plan.overlayDirectives.badges,
      highlights: plan.overlayDirectives.highlights,
      bigSymbol: plan.overlayDirectives.bigSymbol,
      palette: resolved.palette,
      showBadges: resolved.showBadges,
      showSymbol: resolved.showSymbol,
      showHighlights: resolved.showHighlights,
    })
  );

  // 2. Add hook text (main headline)
  elements.push(
    generateHookTextSvg({
      text: resolved.hookText.toUpperCase(), // Hooks are typically uppercase
      position: hookPos,
      palette: resolved.palette,
      outline: resolved.outline,
      shadow: resolved.shadow,
    })
  );

  // 3. Add sub-hook if present
  if (resolved.subHook) {
    const subHookPos = getSubHookPosition(hookPos, hookFontSize);
    elements.push(
      generateSubHookSvg({
        text: resolved.subHook,
        position: subHookPos,
        palette: resolved.palette,
        outline: resolved.outline,
        shadow: resolved.shadow,
      })
    );
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${THUMBNAIL_WIDTH}" height="${THUMBNAIL_HEIGHT}" viewBox="0 0 ${THUMBNAIL_WIDTH} ${THUMBNAIL_HEIGHT}">
    <defs>
      ${elements.filter((e) => e.includes("<filter")).join("")}
      ${elements.filter((e) => e.includes("<linearGradient") || e.includes("<radialGradient")).join("")}
    </defs>
    ${elements.filter((e) => !e.includes("<filter") && !e.includes("Gradient")).join("\n")}
  </svg>`;
}

// ============================================
// GRADIENT BACKGROUND (for previews only)
// ============================================

/**
 * Generate an SVG gradient background.
 * Note: This is only used for palette previews, NOT for thumbnails.
 * AI image generation is required for actual thumbnails.
 */
export function generateGradientBackground(
  palette: ThumbnailPalette,
  width: number = THUMBNAIL_WIDTH,
  height: number = THUMBNAIL_HEIGHT,
  _conceptId?: string
): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${svgEscape(palette.bg1)};stop-opacity:1"/>
        <stop offset="100%" style="stop-color:${svgEscape(palette.bg2)};stop-opacity:1"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
  </svg>`;
}

// ============================================
// LEGACY EXPORTS
// ============================================

export { generateConceptOverlay as generateOverlaySvg };

/** @deprecated Use generateConceptOverlay */
export function generateOverlay(spec: ConceptSpec): string {
  return generateConceptOverlay(spec);
}

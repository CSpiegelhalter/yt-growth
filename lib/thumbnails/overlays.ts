/**
 * Attention Overlay Utilities
 *
 * SVG generators for visual attention elements:
 * - Arrows, circles, glows
 * - Big symbols (X, CHECK, VS)
 * - Badges (pill, stamp, corner-flag)
 * - Split lines, blur regions
 *
 * These transform plain thumbnails into compelling visual stories.
 */

import type {
  BadgeDirective,
  HighlightDirective,
  BigSymbolType,
  ThumbnailPalette,
} from "./types";
import { svgEscape } from "./svg";

// ============================================
// CONSTANTS
// ============================================

export const THUMBNAIL_WIDTH = 1280;
export const THUMBNAIL_HEIGHT = 720;

// ============================================
// BIG SYMBOL OVERLAYS
// ============================================

/**
 * Generate a big X symbol overlay (for "mistake" thumbnails).
 */
export function generateBigX(options: {
  color?: string;
  strokeWidth?: number;
  size?: number;
  x?: number;
  y?: number;
  rotation?: number;
}): string {
  const {
    color = "#FF0000",
    strokeWidth = 32,
    size = 300,
    x = THUMBNAIL_WIDTH / 2,
    y = THUMBNAIL_HEIGHT / 2,
    rotation = 0,
  } = options;

  const half = size / 2;

  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation})">
      <!-- X shadow -->
      <line 
        x1="${-half + 4}" y1="${-half + 4}" 
        x2="${half + 4}" y2="${half + 4}" 
        stroke="rgba(0,0,0,0.4)" 
        stroke-width="${strokeWidth + 4}" 
        stroke-linecap="round"
      />
      <line 
        x1="${half + 4}" y1="${-half + 4}" 
        x2="${-half + 4}" y2="${half + 4}" 
        stroke="rgba(0,0,0,0.4)" 
        stroke-width="${strokeWidth + 4}" 
        stroke-linecap="round"
      />
      <!-- X main -->
      <line 
        x1="${-half}" y1="${-half}" 
        x2="${half}" y2="${half}" 
        stroke="${svgEscape(color)}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round"
      />
      <line 
        x1="${half}" y1="${-half}" 
        x2="${-half}" y2="${half}" 
        stroke="${svgEscape(color)}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round"
      />
    </g>
  `;
}

/**
 * Generate a big checkmark symbol overlay.
 */
export function generateBigCheck(options: {
  color?: string;
  strokeWidth?: number;
  size?: number;
  x?: number;
  y?: number;
}): string {
  const {
    color = "#00FF00",
    strokeWidth = 28,
    size = 280,
    x = THUMBNAIL_WIDTH / 2,
    y = THUMBNAIL_HEIGHT / 2,
  } = options;

  // Checkmark proportions
  const scale = size / 100;

  return `
    <g transform="translate(${x - size / 2}, ${y - size / 3})">
      <!-- Check shadow -->
      <path 
        d="M ${10 * scale + 3} ${50 * scale + 3} L ${40 * scale + 3} ${80 * scale + 3} L ${90 * scale + 3} ${15 * scale + 3}" 
        fill="none" 
        stroke="rgba(0,0,0,0.4)" 
        stroke-width="${strokeWidth + 4}" 
        stroke-linecap="round" 
        stroke-linejoin="round"
      />
      <!-- Check main -->
      <path 
        d="M ${10 * scale} ${50 * scale} L ${40 * scale} ${80 * scale} L ${90 * scale} ${15 * scale}" 
        fill="none" 
        stroke="${svgEscape(color)}" 
        stroke-width="${strokeWidth}" 
        stroke-linecap="round" 
        stroke-linejoin="round"
      />
    </g>
  `;
}

/**
 * Generate a VS badge overlay (for comparison thumbnails).
 */
export function generateVsBadge(options: {
  bgColor?: string;
  textColor?: string;
  size?: number;
  x?: number;
  y?: number;
}): string {
  const {
    bgColor = "#FF0000",
    textColor = "#FFFFFF",
    size = 120,
    x = THUMBNAIL_WIDTH / 2,
    y = THUMBNAIL_HEIGHT / 2,
  } = options;

  const fontSize = size * 0.45;

  return `
    <g transform="translate(${x}, ${y})">
      <!-- VS circle shadow -->
      <circle 
        cx="4" cy="6" r="${size / 2}" 
        fill="rgba(0,0,0,0.5)"
      />
      <!-- VS circle -->
      <circle 
        cx="0" cy="0" r="${size / 2}" 
        fill="${svgEscape(bgColor)}"
        stroke="${svgEscape(textColor)}"
        stroke-width="4"
      />
      <!-- VS text -->
      <text 
        x="0" y="${fontSize * 0.35}" 
        font-size="${fontSize}" 
        font-weight="900" 
        font-family="system-ui, -apple-system, sans-serif" 
        fill="${svgEscape(textColor)}" 
        text-anchor="middle"
        style="letter-spacing: -2px"
      >VS</text>
    </g>
  `;
}

/**
 * Generate a question mark overlay.
 */
export function generateQuestionMark(options: {
  color?: string;
  size?: number;
  x?: number;
  y?: number;
}): string {
  const {
    color = "#FFD700",
    size = 200,
    x = THUMBNAIL_WIDTH - 150,
    y = THUMBNAIL_HEIGHT / 2,
  } = options;

  const fontSize = size;

  return `
    <g transform="translate(${x}, ${y})">
      <!-- Question shadow -->
      <text 
        x="4" y="${fontSize * 0.35 + 4}" 
        font-size="${fontSize}" 
        font-weight="900" 
        font-family="system-ui, -apple-system, sans-serif" 
        fill="rgba(0,0,0,0.5)" 
        text-anchor="middle"
      >?</text>
      <!-- Question main -->
      <text 
        x="0" y="${fontSize * 0.35}" 
        font-size="${fontSize}" 
        font-weight="900" 
        font-family="system-ui, -apple-system, sans-serif" 
        fill="${svgEscape(color)}" 
        text-anchor="middle"
      >?</text>
    </g>
  `;
}

/**
 * Generate a big arrow overlay.
 */
export function generateBigArrow(options: {
  color?: string;
  direction?: "right" | "left" | "up" | "down";
  size?: number;
  x?: number;
  y?: number;
}): string {
  const {
    color = "#FFFF00",
    direction = "right",
    size = 100,
    x = THUMBNAIL_WIDTH / 2,
    y = THUMBNAIL_HEIGHT / 2,
  } = options;

  const rotations = {
    right: 0,
    down: 90,
    left: 180,
    up: 270,
  };

  return `
    <g transform="translate(${x}, ${y}) rotate(${rotations[direction]})">
      <!-- Arrow shadow -->
      <path 
        d="M ${-size / 2 + 4} 0 L ${size / 4 + 4} ${-size / 3} L ${size / 4 + 4} ${-size / 6} L ${size / 2 + 4} ${-size / 6} L ${size / 2 + 4} ${size / 6} L ${size / 4 + 4} ${size / 6} L ${size / 4 + 4} ${size / 3} Z" 
        fill="rgba(0,0,0,0.4)"
      />
      <!-- Arrow main -->
      <path 
        d="M ${-size / 2} 0 L ${size / 4} ${-size / 3} L ${size / 4} ${-size / 6} L ${size / 2} ${-size / 6} L ${size / 2} ${size / 6} L ${size / 4} ${size / 6} L ${size / 4} ${size / 3} Z" 
        fill="${svgEscape(color)}"
      />
    </g>
  `;
}

/**
 * Generate big symbol based on type.
 */
export function generateBigSymbol(
  type: BigSymbolType,
  options: {
    color?: string;
    x?: number;
    y?: number;
    size?: number;
  } = {}
): string {
  switch (type) {
    case "X":
      return generateBigX(options);
    case "CHECK":
      return generateBigCheck({ ...options, color: options.color || "#00CC00" });
    case "VS":
      return generateVsBadge(options);
    case "QUESTION":
      return generateQuestionMark(options);
    case "ARROW":
      return generateBigArrow(options);
    case "NONE":
    default:
      return "";
  }
}

// ============================================
// HIGHLIGHT OVERLAYS
// ============================================

/**
 * Generate a circle highlight overlay.
 */
export function generateCircleHighlight(options: {
  x?: number;
  y?: number;
  radius?: number;
  color?: string;
  strokeWidth?: number;
  dashed?: boolean;
}): string {
  const {
    x = THUMBNAIL_WIDTH / 2,
    y = THUMBNAIL_HEIGHT / 2,
    radius = 100,
    color = "#FFFF00",
    strokeWidth = 8,
    dashed = false,
  } = options;

  const dashAttr = dashed ? `stroke-dasharray="${strokeWidth * 2} ${strokeWidth}"` : "";

  return `
    <circle 
      cx="${x}" cy="${y}" r="${radius}" 
      fill="none" 
      stroke="${svgEscape(color)}" 
      stroke-width="${strokeWidth}"
      ${dashAttr}
    />
  `;
}

/**
 * Generate an arrow pointer overlay.
 */
export function generateArrowPointer(options: {
  fromX?: number;
  fromY?: number;
  toX?: number;
  toY?: number;
  color?: string;
  strokeWidth?: number;
  curved?: boolean;
}): string {
  const {
    fromX = 100,
    fromY = 100,
    toX = 300,
    toY = 300,
    color = "#FFFF00",
    strokeWidth = 6,
    curved = true,
  } = options;

  const arrowSize = strokeWidth * 3;

  // Calculate arrow head
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const headX1 = toX - arrowSize * Math.cos(angle - Math.PI / 6);
  const headY1 = toY - arrowSize * Math.sin(angle - Math.PI / 6);
  const headX2 = toX - arrowSize * Math.cos(angle + Math.PI / 6);
  const headY2 = toY - arrowSize * Math.sin(angle + Math.PI / 6);

  const path = curved
    ? `M ${fromX} ${fromY} Q ${(fromX + toX) / 2 + 50} ${(fromY + toY) / 2 - 50} ${toX} ${toY}`
    : `M ${fromX} ${fromY} L ${toX} ${toY}`;

  return `
    <g>
      <!-- Arrow line shadow -->
      <path 
        d="${path}" 
        fill="none" 
        stroke="rgba(0,0,0,0.4)" 
        stroke-width="${strokeWidth + 4}"
        stroke-linecap="round"
      />
      <!-- Arrow line -->
      <path 
        d="${path}" 
        fill="none" 
        stroke="${svgEscape(color)}" 
        stroke-width="${strokeWidth}"
        stroke-linecap="round"
      />
      <!-- Arrow head -->
      <polygon 
        points="${toX},${toY} ${headX1},${headY1} ${headX2},${headY2}" 
        fill="${svgEscape(color)}"
      />
    </g>
  `;
}

/**
 * Generate a glow effect overlay.
 */
export function generateGlowEffect(options: {
  x?: number;
  y?: number;
  radius?: number;
  color?: string;
  intensity?: number;
}): string {
  const {
    x = THUMBNAIL_WIDTH * 0.7,
    y = THUMBNAIL_HEIGHT * 0.5,
    radius = 150,
    color = "#FFFFFF",
    intensity = 0.6,
  } = options;

  return `
    <defs>
      <radialGradient id="glow-${x}-${y}">
        <stop offset="0%" style="stop-color:${svgEscape(color)};stop-opacity:${intensity}" />
        <stop offset="100%" style="stop-color:${svgEscape(color)};stop-opacity:0" />
      </radialGradient>
    </defs>
    <circle 
      cx="${x}" cy="${y}" r="${radius}" 
      fill="url(#glow-${x}-${y})"
    />
  `;
}

/**
 * Generate a blur region overlay (for mystery/secret concepts).
 */
export function generateBlurRegion(options: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  blurAmount?: number;
}): string {
  const {
    x = THUMBNAIL_WIDTH * 0.5,
    y = THUMBNAIL_HEIGHT * 0.3,
    width = 200,
    height = 200,
    blurAmount = 20,
  } = options;

  const filterId = `blur-${x}-${y}`;

  return `
    <defs>
      <filter id="${filterId}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="${blurAmount}" />
      </filter>
    </defs>
    <rect 
      x="${x - width / 2}" y="${y - height / 2}" 
      width="${width}" height="${height}" 
      fill="rgba(0,0,0,0.5)"
      rx="10"
    />
    <text 
      x="${x}" y="${y + 10}" 
      font-size="32" 
      font-weight="700" 
      font-family="system-ui, -apple-system, sans-serif" 
      fill="#FFFFFF" 
      text-anchor="middle"
    >CENSORED</text>
  `;
}

/**
 * Generate a split line overlay (for before/after, vs concepts).
 */
export function generateSplitLine(options: {
  position?: number; // 0-1 as percentage from left
  color?: string;
  strokeWidth?: number;
  style?: "solid" | "lightning" | "gradient";
}): string {
  const {
    position = 0.5,
    color = "#FFFFFF",
    strokeWidth = 8,
    style = "solid",
  } = options;

  const x = THUMBNAIL_WIDTH * position;

  if (style === "lightning") {
    // Zigzag lightning bolt style
    const points: string[] = [];
    let y = 0;
    let zigRight = true;
    while (y < THUMBNAIL_HEIGHT) {
      points.push(`${x + (zigRight ? 20 : -20)},${y}`);
      y += 40;
      zigRight = !zigRight;
    }
    return `
      <polyline 
        points="${points.join(" ")}" 
        fill="none" 
        stroke="${svgEscape(color)}" 
        stroke-width="${strokeWidth}"
        stroke-linejoin="round"
      />
    `;
  }

  if (style === "gradient") {
    return `
      <defs>
        <linearGradient id="split-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${svgEscape(color)};stop-opacity:0" />
          <stop offset="30%" style="stop-color:${svgEscape(color)};stop-opacity:1" />
          <stop offset="70%" style="stop-color:${svgEscape(color)};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${svgEscape(color)};stop-opacity:0" />
        </linearGradient>
      </defs>
      <line 
        x1="${x}" y1="0" 
        x2="${x}" y2="${THUMBNAIL_HEIGHT}" 
        stroke="url(#split-grad)" 
        stroke-width="${strokeWidth}"
      />
    `;
  }

  // Solid
  return `
    <line 
      x1="${x}" y1="0" 
      x2="${x}" y2="${THUMBNAIL_HEIGHT}" 
      stroke="${svgEscape(color)}" 
      stroke-width="${strokeWidth}"
    />
  `;
}

/**
 * Generate highlight based on directive.
 */
export function generateHighlight(
  highlight: HighlightDirective,
  palette: ThumbnailPalette
): string {
  const color = highlight.color || palette.accent;

  switch (highlight.type) {
    case "circle":
      return generateCircleHighlight({ color });
    case "arrow":
      return generateArrowPointer({
        color,
        fromX: 200,
        fromY: 200,
        toX: THUMBNAIL_WIDTH * 0.65,
        toY: THUMBNAIL_HEIGHT * 0.5,
      });
    case "glow":
      return generateGlowEffect({ color });
    case "blur-region":
      return generateBlurRegion({});
    case "split-line":
      return generateSplitLine({ color });
    default:
      return "";
  }
}

// ============================================
// BADGE OVERLAYS
// ============================================

/**
 * Generate a pill-style badge.
 */
export function generatePillBadge(options: {
  text: string;
  x?: number;
  y?: number;
  bgColor?: string;
  textColor?: string;
  fontSize?: number;
}): string {
  const {
    text,
    x = 80,
    y = 80,
    bgColor = "#FF0000",
    textColor = "#FFFFFF",
    fontSize = 24,
  } = options;

  const padding = fontSize * 0.7;
  const textWidth = text.length * fontSize * 0.6;
  const width = textWidth + padding * 2;
  const height = fontSize + padding * 1.4;

  return `
    <g transform="translate(${x}, ${y})">
      <!-- Badge shadow -->
      <rect 
        x="3" y="5" 
        width="${width}" height="${height}" 
        rx="${height / 2}" 
        fill="rgba(0,0,0,0.4)"
      />
      <!-- Badge bg -->
      <rect 
        x="0" y="0" 
        width="${width}" height="${height}" 
        rx="${height / 2}" 
        fill="${svgEscape(bgColor)}"
      />
      <!-- Badge text -->
      <text 
        x="${width / 2}" y="${height / 2 + fontSize * 0.35}" 
        font-size="${fontSize}" 
        font-weight="700" 
        font-family="system-ui, -apple-system, sans-serif" 
        fill="${svgEscape(textColor)}" 
        text-anchor="middle"
      >${svgEscape(text)}</text>
    </g>
  `;
}

/**
 * Generate a stamp-style badge (rotated, rough).
 */
export function generateStampBadge(options: {
  text: string;
  x?: number;
  y?: number;
  bgColor?: string;
  textColor?: string;
  fontSize?: number;
  rotation?: number;
}): string {
  const {
    text,
    x = 100,
    y = 100,
    bgColor = "#FF0000",
    textColor = "#FFFFFF",
    fontSize = 28,
    rotation = -15,
  } = options;

  const padding = fontSize * 0.5;
  const textWidth = text.length * fontSize * 0.6;
  const width = textWidth + padding * 2;
  const height = fontSize + padding * 1.2;

  return `
    <g transform="translate(${x}, ${y}) rotate(${rotation})">
      <!-- Stamp border -->
      <rect 
        x="${-width / 2 - 4}" y="${-height / 2 - 4}" 
        width="${width + 8}" height="${height + 8}" 
        fill="none"
        stroke="${svgEscape(bgColor)}"
        stroke-width="4"
        stroke-dasharray="8 4"
      />
      <!-- Stamp bg -->
      <rect 
        x="${-width / 2}" y="${-height / 2}" 
        width="${width}" height="${height}" 
        fill="${svgEscape(bgColor)}"
        opacity="0.9"
      />
      <!-- Stamp text -->
      <text 
        x="0" y="${fontSize * 0.35}" 
        font-size="${fontSize}" 
        font-weight="900" 
        font-family="system-ui, -apple-system, sans-serif" 
        fill="${svgEscape(textColor)}" 
        text-anchor="middle"
        style="letter-spacing: 2px"
      >${svgEscape(text)}</text>
    </g>
  `;
}

/**
 * Generate a corner flag badge.
 */
export function generateCornerFlagBadge(options: {
  text: string;
  corner?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  bgColor?: string;
  textColor?: string;
  fontSize?: number;
}): string {
  const {
    text,
    corner = "top-left",
    bgColor = "#FF0000",
    textColor = "#FFFFFF",
    fontSize = 20,
  } = options;

  const ribbonWidth = 200;
  const ribbonHeight = 36;

  const transforms = {
    "top-left": `translate(0, 60) rotate(-45, 0, 0)`,
    "top-right": `translate(${THUMBNAIL_WIDTH}, 60) rotate(45, 0, 0)`,
    "bottom-left": `translate(0, ${THUMBNAIL_HEIGHT - 60}) rotate(45, 0, 0)`,
    "bottom-right": `translate(${THUMBNAIL_WIDTH}, ${THUMBNAIL_HEIGHT - 60}) rotate(-45, 0, 0)`,
  };

  return `
    <g transform="${transforms[corner]}">
      <!-- Ribbon -->
      <rect 
        x="${-ribbonWidth / 2}" y="0" 
        width="${ribbonWidth}" height="${ribbonHeight}" 
        fill="${svgEscape(bgColor)}"
      />
      <!-- Text -->
      <text 
        x="0" y="${ribbonHeight / 2 + fontSize * 0.35}" 
        font-size="${fontSize}" 
        font-weight="700" 
        font-family="system-ui, -apple-system, sans-serif" 
        fill="${svgEscape(textColor)}" 
        text-anchor="middle"
      >${svgEscape(text)}</text>
    </g>
  `;
}

/**
 * Generate a circle badge.
 */
export function generateCircleBadge(options: {
  text: string;
  x?: number;
  y?: number;
  bgColor?: string;
  textColor?: string;
  size?: number;
}): string {
  const {
    text,
    x = 100,
    y = 100,
    bgColor = "#FF0000",
    textColor = "#FFFFFF",
    size = 80,
  } = options;

  const fontSize = size * 0.35;

  return `
    <g transform="translate(${x}, ${y})">
      <!-- Circle shadow -->
      <circle cx="3" cy="5" r="${size / 2}" fill="rgba(0,0,0,0.4)" />
      <!-- Circle bg -->
      <circle cx="0" cy="0" r="${size / 2}" fill="${svgEscape(bgColor)}" />
      <!-- Text -->
      <text 
        x="0" y="${fontSize * 0.35}" 
        font-size="${fontSize}" 
        font-weight="700" 
        font-family="system-ui, -apple-system, sans-serif" 
        fill="${svgEscape(textColor)}" 
        text-anchor="middle"
      >${svgEscape(text)}</text>
    </g>
  `;
}

/**
 * Generate badge based on directive.
 */
export function generateBadge(
  directive: BadgeDirective,
  palette: ThumbnailPalette,
  index: number = 0
): string {
  const positions = {
    "top-left": { x: 60, y: 60 },
    "top-right": { x: THUMBNAIL_WIDTH - 120, y: 60 },
    "bottom-left": { x: 60, y: THUMBNAIL_HEIGHT - 80 },
    "bottom-right": { x: THUMBNAIL_WIDTH - 120, y: THUMBNAIL_HEIGHT - 80 },
  };

  const pos = directive.position
    ? positions[directive.position]
    : positions["top-left"];

  // Offset multiple badges
  const offsetY = index * 50;

  const commonOptions = {
    text: directive.text,
    x: pos.x,
    y: pos.y + offsetY,
    bgColor: palette.accent,
    textColor: palette.text,
  };

  switch (directive.style) {
    case "pill":
      return generatePillBadge(commonOptions);
    case "stamp":
      return generateStampBadge(commonOptions);
    case "corner-flag":
      return generateCornerFlagBadge({
        ...commonOptions,
        corner: directive.position,
      });
    case "circle":
      return generateCircleBadge(commonOptions);
    case "ribbon":
      return generateCornerFlagBadge({
        ...commonOptions,
        corner: directive.position,
      });
    default:
      return generatePillBadge(commonOptions);
  }
}

// ============================================
// COMBINED OVERLAY GENERATOR
// ============================================

/**
 * Generate all overlay elements for a concept.
 */
export function generateAllOverlays(options: {
  badges: BadgeDirective[];
  highlights: HighlightDirective[];
  bigSymbol: BigSymbolType;
  palette: ThumbnailPalette;
  showBadges?: boolean;
  showSymbol?: boolean;
  showHighlights?: boolean;
}): string {
  const {
    badges,
    highlights,
    bigSymbol,
    palette,
    showBadges = true,
    showSymbol = true,
    showHighlights = true,
  } = options;

  const elements: string[] = [];

  // Add highlights first (behind other elements)
  if (showHighlights) {
    for (const highlight of highlights) {
      elements.push(generateHighlight(highlight, palette));
    }
  }

  // Add big symbol
  if (showSymbol && bigSymbol !== "NONE") {
    elements.push(
      generateBigSymbol(bigSymbol, {
        color: palette.accent,
      })
    );
  }

  // Add badges last (on top)
  if (showBadges) {
    badges.forEach((badge, index) => {
      elements.push(generateBadge(badge, palette, index));
    });
  }

  return elements.join("\n");
}

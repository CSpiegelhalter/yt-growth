/**
 * Before/After Split Template
 *
 * Split-screen layout showing transformation:
 * - Left side: "before" state (darker, desaturated)
 * - Right side: "after" state (brighter, more vibrant)
 * - Vertical divider in center
 * - Hook text at top spanning both sides
 */

import type { ConceptSpec } from "../types";
import {
  resolveSpec,
  generateHookTextSvg,
  generateSubHookSvg,
  calculateHookFontSize,
  THUMBNAIL_WIDTH,
  THUMBNAIL_HEIGHT,
  SAFE_MARGIN,
} from "./base";
import { generateSplitLine, generateBigArrow, generatePillBadge } from "../overlays";

/**
 * Generate Before/After Split overlay SVG.
 */
export function generateBeforeAfterSplitOverlay(spec: ConceptSpec): string {
  const resolved = resolveSpec(spec);
  const plan = spec.plan;

  const elements: string[] = [];

  // 1. Gradient overlays on each half to enhance contrast
  elements.push(`
    <defs>
      <!-- Left side: darker overlay for "before" -->
      <linearGradient id="beforeOverlay" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#000000;stop-opacity:0.3" />
        <stop offset="100%" style="stop-color:#000000;stop-opacity:0.1" />
      </linearGradient>
      <!-- Right side: brighter, cleaner -->
      <linearGradient id="afterOverlay" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#FFFFFF;stop-opacity:0.05" />
        <stop offset="100%" style="stop-color:#FFFFFF;stop-opacity:0" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${THUMBNAIL_WIDTH / 2}" height="${THUMBNAIL_HEIGHT}" fill="url(#beforeOverlay)" />
    <rect x="${THUMBNAIL_WIDTH / 2}" y="0" width="${THUMBNAIL_WIDTH / 2}" height="${THUMBNAIL_HEIGHT}" fill="url(#afterOverlay)" />
  `);

  // 2. Split line in center
  if (resolved.showHighlights) {
    elements.push(
      generateSplitLine({
        position: 0.5,
        color: "#FFFFFF",
        strokeWidth: 6,
        style: "gradient",
      })
    );
  }

  // 3. Arrow pointing from left to right (transformation direction)
  if (resolved.showSymbol && plan.overlayDirectives.bigSymbol === "ARROW") {
    elements.push(
      generateBigArrow({
        color: resolved.palette.accent,
        direction: "right",
        size: 80,
        x: THUMBNAIL_WIDTH / 2,
        y: THUMBNAIL_HEIGHT / 2,
      })
    );
  }

  // 4. "BEFORE" and "AFTER" labels
  if (resolved.showBadges) {
    elements.push(
      generatePillBadge({
        text: "BEFORE",
        x: SAFE_MARGIN.left,
        y: THUMBNAIL_HEIGHT - SAFE_MARGIN.bottom - 40,
        bgColor: "#666666",
        textColor: "#FFFFFF",
        fontSize: 18,
      })
    );
    elements.push(
      generatePillBadge({
        text: "AFTER",
        x: THUMBNAIL_WIDTH - 140,
        y: THUMBNAIL_HEIGHT - SAFE_MARGIN.bottom - 40,
        bgColor: resolved.palette.accent,
        textColor: "#FFFFFF",
        fontSize: 18,
      })
    );
  }

  // 5. Hook text at top center
  const hookPos = {
    x: THUMBNAIL_WIDTH / 2,
    y: SAFE_MARGIN.top + 70,
    maxWidth: THUMBNAIL_WIDTH * 0.8,
    anchor: "middle" as const,
  };

  const hookFontSize = calculateHookFontSize(resolved.hookText, hookPos.maxWidth);

  elements.push(
    generateHookTextSvg({
      text: resolved.hookText.toUpperCase(),
      position: hookPos,
      palette: resolved.palette,
      outline: resolved.outline,
      shadow: resolved.shadow,
    })
  );

  // 6. Sub-hook if present
  if (resolved.subHook) {
    const subHookPos = {
      x: THUMBNAIL_WIDTH / 2,
      y: hookPos.y + hookFontSize + 15,
      maxWidth: hookPos.maxWidth,
      anchor: "middle" as const,
    };
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
    ${elements.join("\n")}
  </svg>`;
}

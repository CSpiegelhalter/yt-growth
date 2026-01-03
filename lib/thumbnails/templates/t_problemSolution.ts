/**
 * Problem/Solution Template
 *
 * Visual representation of problem vs solution.
 * Can show X on problem area, CHECK on solution.
 * Or arrow pointing from problem to solution.
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
import { generateBigX, generateBigCheck, generateArrowPointer, generatePillBadge } from "../overlays";

/**
 * Generate Problem/Solution overlay SVG.
 */
export function generateProblemSolutionOverlay(spec: ConceptSpec): string {
  const resolved = resolveSpec(spec);
  const plan = spec.plan;

  const elements: string[] = [];

  // Determine which symbol to show based on plan
  const bigSymbol = plan.overlayDirectives.bigSymbol;
  const showBothXAndCheck = bigSymbol === "CHECK" || bigSymbol === "ARROW";

  // 1. Problem area (typically left) with subtle red tint
  elements.push(`
    <defs>
      <linearGradient id="problemTint" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#FF0000;stop-opacity:0.08" />
        <stop offset="100%" style="stop-color:#FF0000;stop-opacity:0" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${THUMBNAIL_WIDTH * 0.4}" height="${THUMBNAIL_HEIGHT}" fill="url(#problemTint)" />
  `);

  // 2. Solution area (right) with subtle green tint
  elements.push(`
    <defs>
      <linearGradient id="solutionTint" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#00FF00;stop-opacity:0" />
        <stop offset="100%" style="stop-color:#00FF00;stop-opacity:0.08" />
      </linearGradient>
    </defs>
    <rect x="${THUMBNAIL_WIDTH * 0.6}" y="0" width="${THUMBNAIL_WIDTH * 0.4}" height="${THUMBNAIL_HEIGHT}" fill="url(#solutionTint)" />
  `);

  // 3. Arrow from problem to solution (if specified)
  if (resolved.showHighlights && (bigSymbol === "ARROW" || bigSymbol === "CHECK")) {
    elements.push(
      generateArrowPointer({
        fromX: THUMBNAIL_WIDTH * 0.35,
        fromY: THUMBNAIL_HEIGHT * 0.65,
        toX: THUMBNAIL_WIDTH * 0.65,
        toY: THUMBNAIL_HEIGHT * 0.45,
        color: resolved.palette.accent,
        strokeWidth: 8,
        curved: true,
      })
    );
  }

  // 4. X on problem (small, positioned lower-left)
  if (resolved.showSymbol && (bigSymbol === "X" || showBothXAndCheck)) {
    elements.push(
      generateBigX({
        color: "#FF0000",
        strokeWidth: 20,
        size: 100,
        x: THUMBNAIL_WIDTH * 0.18,
        y: THUMBNAIL_HEIGHT * 0.7,
        rotation: 0,
      })
    );
  }

  // 5. Check on solution (positioned lower-right)
  if (resolved.showSymbol && showBothXAndCheck) {
    elements.push(
      generateBigCheck({
        color: "#00CC00",
        strokeWidth: 18,
        size: 110,
        x: THUMBNAIL_WIDTH * 0.82,
        y: THUMBNAIL_HEIGHT * 0.6,
      })
    );
  }

  // 6. Problem/Solution badges
  if (resolved.showBadges) {
    elements.push(
      generatePillBadge({
        text: "PROBLEM",
        x: SAFE_MARGIN.left,
        y: THUMBNAIL_HEIGHT - SAFE_MARGIN.bottom - 30,
        bgColor: "#CC0000",
        textColor: "#FFFFFF",
        fontSize: 16,
      })
    );
    elements.push(
      generatePillBadge({
        text: "SOLUTION",
        x: THUMBNAIL_WIDTH - 140,
        y: THUMBNAIL_HEIGHT - SAFE_MARGIN.bottom - 30,
        bgColor: "#00AA00",
        textColor: "#FFFFFF",
        fontSize: 16,
      })
    );
  }

  // 7. Hook text at top
  const hookPos = {
    x: THUMBNAIL_WIDTH / 2,
    y: SAFE_MARGIN.top + 70,
    maxWidth: THUMBNAIL_WIDTH * 0.85,
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

  // 8. Sub-hook if present
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

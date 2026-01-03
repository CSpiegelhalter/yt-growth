/**
 * Clean Hero Template
 *
 * Simple, elegant hero shot with minimal distraction.
 * Hook text on one side, focal subject on the other.
 * The default/fallback template for general content.
 */

import type { ConceptSpec } from "../types";
import {
  resolveSpec,
  getHookPosition,
  getSubHookPosition,
  calculateHookFontSize,
  generateHookTextSvg,
  generateSubHookSvg,
  THUMBNAIL_WIDTH,
  THUMBNAIL_HEIGHT,
} from "./base";
import { generateAllOverlays } from "../overlays";

/**
 * Generate Clean Hero overlay SVG.
 */
export function generateCleanHeroOverlay(spec: ConceptSpec): string {
  const resolved = resolveSpec(spec);
  const plan = spec.plan;

  const elements: string[] = [];

  // Get text positioning
  const hookPos = getHookPosition(plan);
  const hookFontSize = calculateHookFontSize(resolved.hookText, hookPos.maxWidth);

  // 1. Optional subtle glow behind subject area (right side)
  if (resolved.showHighlights) {
    elements.push(`
      <defs>
        <radialGradient id="heroGlow">
          <stop offset="0%" style="stop-color:${resolved.palette.accent};stop-opacity:0.15" />
          <stop offset="100%" style="stop-color:${resolved.palette.accent};stop-opacity:0" />
        </radialGradient>
      </defs>
      <circle cx="${THUMBNAIL_WIDTH * 0.72}" cy="${THUMBNAIL_HEIGHT * 0.5}" r="250" fill="url(#heroGlow)" />
    `);
  }

  // 2. Add attention overlays (badges only for clean hero)
  elements.push(
    generateAllOverlays({
      badges: plan.overlayDirectives.badges,
      highlights: [], // Clean hero doesn't use highlights
      bigSymbol: "NONE", // Clean hero doesn't use big symbols
      palette: resolved.palette,
      showBadges: resolved.showBadges,
      showSymbol: false,
      showHighlights: false,
    })
  );

  // 3. Add hook text
  elements.push(
    generateHookTextSvg({
      text: resolved.hookText.toUpperCase(),
      position: hookPos,
      palette: resolved.palette,
      outline: resolved.outline,
      shadow: resolved.shadow,
    })
  );

  // 4. Add sub-hook if present
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
    ${elements.join("\n")}
  </svg>`;
}

/**
 * Mistake X Template
 *
 * Single focal object with big red X overlay.
 * "DON'T do this" / warning style.
 * Hook text typically at top or corner.
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
import { generateBigX, generateCircleHighlight, generateStampBadge } from "../overlays";

/**
 * Generate Mistake X overlay SVG.
 */
export function generateMistakeXOverlay(spec: ConceptSpec): string {
  const resolved = resolveSpec(spec);
  const plan = spec.plan;

  const elements: string[] = [];

  // 1. Subtle red vignette for warning mood
  elements.push(`
    <defs>
      <radialGradient id="warningVignette" cx="50%" cy="50%" r="70%">
        <stop offset="60%" style="stop-color:#000000;stop-opacity:0" />
        <stop offset="100%" style="stop-color:#FF0000;stop-opacity:0.15" />
      </radialGradient>
    </defs>
    <rect width="${THUMBNAIL_WIDTH}" height="${THUMBNAIL_HEIGHT}" fill="url(#warningVignette)" />
  `);

  // 2. Circle highlight around the problematic item (center)
  if (resolved.showHighlights) {
    elements.push(
      generateCircleHighlight({
        x: THUMBNAIL_WIDTH * 0.55,
        y: THUMBNAIL_HEIGHT * 0.55,
        radius: 140,
        color: "#FF0000",
        strokeWidth: 6,
        dashed: true,
      })
    );
  }

  // 3. Big X overlay (the main visual element)
  if (resolved.showSymbol) {
    elements.push(
      generateBigX({
        color: "#FF0000",
        strokeWidth: 36,
        size: 320,
        x: THUMBNAIL_WIDTH * 0.55,
        y: THUMBNAIL_HEIGHT * 0.55,
        rotation: 0,
      })
    );
  }

  // 4. "DON'T" or "STOP" stamp badge
  if (resolved.showBadges) {
    const badgeText = plan.overlayDirectives.badges[0]?.text || "DON'T";
    elements.push(
      generateStampBadge({
        text: badgeText,
        x: THUMBNAIL_WIDTH - 150,
        y: 90,
        bgColor: "#FF0000",
        textColor: "#FFFFFF",
        fontSize: 26,
        rotation: 12,
      })
    );
  }

  // 5. Hook text at top left
  const hookPos = {
    x: SAFE_MARGIN.left,
    y: SAFE_MARGIN.top + 80,
    maxWidth: THUMBNAIL_WIDTH * 0.5,
    anchor: "start" as const,
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
      x: SAFE_MARGIN.left,
      y: hookPos.y + hookFontSize + 15,
      maxWidth: hookPos.maxWidth,
      anchor: "start" as const,
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

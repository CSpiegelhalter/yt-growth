/**
 * VS Face-Off Template
 *
 * Two competing items with VS badge in center.
 * Split composition with each item on opposite sides.
 * High tension, dramatic comparison style.
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
import { generateVsBadge, generateSplitLine, generateGlowEffect } from "../overlays";

/**
 * Generate VS Face-Off overlay SVG.
 */
export function generateVsOverlay(spec: ConceptSpec): string {
  const resolved = resolveSpec(spec);
  const plan = spec.plan;

  const elements: string[] = [];

  // 1. Dramatic color tints on each side
  elements.push(`
    <defs>
      <!-- Left side: cool tone (blue) -->
      <linearGradient id="leftTint" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#0066FF;stop-opacity:0.15" />
        <stop offset="100%" style="stop-color:#0066FF;stop-opacity:0" />
      </linearGradient>
      <!-- Right side: warm tone (red/orange) -->
      <linearGradient id="rightTint" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" style="stop-color:#FF3300;stop-opacity:0" />
        <stop offset="100%" style="stop-color:#FF3300;stop-opacity:0.15" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${THUMBNAIL_WIDTH / 2}" height="${THUMBNAIL_HEIGHT}" fill="url(#leftTint)" />
    <rect x="${THUMBNAIL_WIDTH / 2}" y="0" width="${THUMBNAIL_WIDTH / 2}" height="${THUMBNAIL_HEIGHT}" fill="url(#rightTint)" />
  `);

  // 2. Split line in center (lightning style for drama)
  if (resolved.showHighlights) {
    elements.push(
      generateSplitLine({
        position: 0.5,
        color: "#FFFFFF",
        strokeWidth: 4,
        style: "lightning",
      })
    );
  }

  // 3. Glow effects behind each competitor
  if (resolved.showHighlights) {
    elements.push(
      generateGlowEffect({
        x: THUMBNAIL_WIDTH * 0.25,
        y: THUMBNAIL_HEIGHT * 0.5,
        radius: 200,
        color: "#0066FF",
        intensity: 0.3,
      })
    );
    elements.push(
      generateGlowEffect({
        x: THUMBNAIL_WIDTH * 0.75,
        y: THUMBNAIL_HEIGHT * 0.5,
        radius: 200,
        color: "#FF3300",
        intensity: 0.3,
      })
    );
  }

  // 4. VS badge in center (the main visual element)
  if (resolved.showSymbol) {
    elements.push(
      generateVsBadge({
        bgColor: resolved.palette.accent,
        textColor: "#FFFFFF",
        size: 130,
        x: THUMBNAIL_WIDTH / 2,
        y: THUMBNAIL_HEIGHT / 2,
      })
    );
  }

  // 5. Hook text at top
  const hookPos = {
    x: THUMBNAIL_WIDTH / 2,
    y: SAFE_MARGIN.top + 65,
    maxWidth: THUMBNAIL_WIDTH * 0.9,
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

  // 7. Optional competitor labels at bottom
  if (resolved.showBadges && plan.overlayDirectives.badges.length >= 2) {
    // Left competitor
    elements.push(`
      <text 
        x="${THUMBNAIL_WIDTH * 0.25}" 
        y="${THUMBNAIL_HEIGHT - SAFE_MARGIN.bottom}" 
        font-size="28" 
        font-weight="700" 
        font-family="system-ui, -apple-system, sans-serif" 
        fill="#FFFFFF" 
        text-anchor="middle"
        style="text-shadow: 2px 2px 4px rgba(0,0,0,0.5)"
      >${plan.overlayDirectives.badges[0]?.text || "OPTION A"}</text>
    `);
    // Right competitor
    elements.push(`
      <text 
        x="${THUMBNAIL_WIDTH * 0.75}" 
        y="${THUMBNAIL_HEIGHT - SAFE_MARGIN.bottom}" 
        font-size="28" 
        font-weight="700" 
        font-family="system-ui, -apple-system, sans-serif" 
        fill="#FFFFFF" 
        text-anchor="middle"
        style="text-shadow: 2px 2px 4px rgba(0,0,0,0.5)"
      >${plan.overlayDirectives.badges[1]?.text || "OPTION B"}</text>
    `);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${THUMBNAIL_WIDTH}" height="${THUMBNAIL_HEIGHT}" viewBox="0 0 ${THUMBNAIL_WIDTH} ${THUMBNAIL_HEIGHT}">
    ${elements.join("\n")}
  </svg>`;
}

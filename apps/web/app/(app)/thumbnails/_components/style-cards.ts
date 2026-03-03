/**
 * Style card configuration data for the thumbnail workflow.
 */

import type { StyleCardData, StyleV2 } from "../thumbnail-types";

export const STYLE_CARDS: StyleCardData[] = [
  {
    id: "compare",
    title: "Compare",
    desc: "Two things head-to-head. Strong contrast, clean split.",
    examples: [
      "My old setup vs my new setup",
      "Cheap mic vs pro mic",
      "Before vs after",
    ],
  },
  {
    id: "subject",
    title: "Subject",
    desc: "A single expressive subject. Great for personality channels.",
    examples: [
      "Shocked creator reacting to analytics spike",
      "Confident creator holding a laptop",
      "Close-up with clean background space",
    ],
  },
  {
    id: "object",
    title: "Object",
    desc: "One hero object. Crisp lighting, product-style focus.",
    examples: [
      "A camera on a desk with dramatic lighting",
      "A gold trophy with glow and particles",
      "A keyboard exploding into neon shards",
    ],
  },
  {
    id: "hold",
    title: "Holding Object",
    desc: "Subject holding a prop toward camera. Very clickable framing.",
    examples: [
      "Creator holding a YouTube play button toward camera",
      "Hands holding a broken phone with sparks",
      "Person holding a giant red X sign",
    ],
  },
];

export function getExamplesForStyle(style: StyleV2): string[] {
  return STYLE_CARDS.find((c) => c.id === style)?.examples ?? [];
}

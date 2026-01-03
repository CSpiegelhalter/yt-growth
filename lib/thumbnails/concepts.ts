/**
 * Thumbnail Concept Library
 *
 * Proven thumbnail patterns that create visual stories.
 * Each concept defines composition rules, required elements,
 * and prompt scaffolding for AI image generation.
 */

// ============================================
// CONCEPT IDS
// ============================================

export const CONCEPT_IDS = [
  "before-after-split",
  "mistake-x",
  "secret-reveal",
  "vs-face-off",
  "big-number",
  "shock-reaction",
  "simple-diagram",
  "tool-spotlight",
  "problem-solution",
  "timeline-step",
  "clean-hero",
  "mystery-blur",
] as const;

export type ConceptId = (typeof CONCEPT_IDS)[number];

// ============================================
// CONCEPT DEFINITION
// ============================================

export type TextSafeArea = "left" | "right" | "top" | "bottom" | "center";
export type FocalPosition = "left" | "right" | "center" | "split";
export type BackgroundComplexity = "low" | "medium" | "high";

export type OverlayElementType =
  | "arrow"
  | "circle"
  | "glow"
  | "blur-region"
  | "split-line"
  | "badge"
  | "big-symbol";

export type BigSymbolType = "X" | "CHECK" | "VS" | "ARROW" | "QUESTION" | "NONE";

export type BadgeStyle =
  | "pill"
  | "corner-flag"
  | "stamp"
  | "ribbon"
  | "circle";

export type ConceptDefinition = {
  id: ConceptId;
  name: string;
  description: string;
  /** When to use this concept (heuristics for LLM/scoring) */
  whenToUse: string[];
  /** Required visual elements */
  requiredElements: {
    subject: string; // What should be in the image
    props?: string[]; // Additional props/objects
    allowsBadge: boolean;
    allowsSymbol: boolean;
    symbolOptions?: BigSymbolType[];
  };
  /** Overlay style guidance */
  overlayStyle: {
    textSafeArea: TextSafeArea;
    hookPlacement: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
    badgeStyle?: BadgeStyle;
    allowedHighlights: OverlayElementType[];
  };
  /** How to construct the base image prompt */
  promptScaffold: {
    prefix: string; // Start of prompt
    subjectGuidance: string; // How to describe the subject
    compositionGuidance: string; // Framing/composition
    suffix: string; // End of prompt (safety)
  };
  /** Composition constraints */
  constraints: {
    focalPosition: FocalPosition;
    backgroundComplexity: BackgroundComplexity;
    emptySpaceNote: string; // Where to leave space for text
    colorGuidance: string;
  };
};

// ============================================
// CONCEPT LIBRARY
// ============================================

export const CONCEPT_LIBRARY: Record<ConceptId, ConceptDefinition> = {
  "before-after-split": {
    id: "before-after-split",
    name: "Before/After Split",
    description: "Left: 'bad' state, right: 'good' state; big contrast; minimal text",
    whenToUse: [
      "transformation content",
      "tutorials showing results",
      "weight loss / makeover",
      "before and after comparisons",
      "productivity improvements",
    ],
    requiredElements: {
      subject: "split scene showing contrast between two states",
      props: ["contrasting elements"],
      allowsBadge: true,
      allowsSymbol: true,
      symbolOptions: ["ARROW", "CHECK"],
    },
    overlayStyle: {
      textSafeArea: "top",
      hookPlacement: "top-left",
      badgeStyle: "pill",
      allowedHighlights: ["split-line", "arrow", "badge"],
    },
    promptScaffold: {
      prefix: "A split-screen image showing transformation:",
      subjectGuidance: "left side shows the 'before' (messy/old/broken), right side shows the 'after' (clean/new/fixed)",
      compositionGuidance: "clear vertical divide in the middle, dramatic lighting contrast between halves",
      suffix: "high contrast, clean composition, no text, no words, no letters, no watermark, no logos",
    },
    constraints: {
      focalPosition: "split",
      backgroundComplexity: "medium",
      emptySpaceNote: "leave top 25% relatively clear for hook text",
      colorGuidance: "muted/negative tones on left, vibrant/positive tones on right",
    },
  },

  "mistake-x": {
    id: "mistake-x",
    name: "Mistake X",
    description: "One focal object + big red X overlay, 'DON'T' style warning",
    whenToUse: [
      "common mistakes content",
      "what NOT to do videos",
      "warning/danger topics",
      "myth busting",
      "debunking",
    ],
    requiredElements: {
      subject: "single focal object or scene representing the mistake",
      props: ["the problematic item/action"],
      allowsBadge: true,
      allowsSymbol: true,
      symbolOptions: ["X"],
    },
    overlayStyle: {
      textSafeArea: "top",
      hookPlacement: "top-left",
      badgeStyle: "stamp",
      allowedHighlights: ["big-symbol", "circle", "badge"],
    },
    promptScaffold: {
      prefix: "A clear photo/illustration of",
      subjectGuidance: "the problematic item or action, shown prominently in center",
      compositionGuidance: "centered composition with space around subject for overlay elements",
      suffix: "dramatic lighting, high contrast, clean background, no text, no words, no letters, no watermark, no logos",
    },
    constraints: {
      focalPosition: "center",
      backgroundComplexity: "low",
      emptySpaceNote: "leave space around subject for large X overlay, top area for text",
      colorGuidance: "slightly desaturated or ominous tones, will be paired with red X",
    },
  },

  "secret-reveal": {
    id: "secret-reveal",
    name: "Secret Reveal",
    description: "Blurred/covered element + 'SECRET' badge + curiosity inducing",
    whenToUse: [
      "insider knowledge",
      "hidden tips",
      "exclusive content",
      "reveals and discoveries",
      "behind the scenes",
    ],
    requiredElements: {
      subject: "partially obscured or mysterious element",
      props: ["censored/blurred/covered object"],
      allowsBadge: true,
      allowsSymbol: true,
      symbolOptions: ["QUESTION"],
    },
    overlayStyle: {
      textSafeArea: "left",
      hookPlacement: "top-left",
      badgeStyle: "stamp",
      allowedHighlights: ["blur-region", "badge", "glow"],
    },
    promptScaffold: {
      prefix: "A mysterious scene with",
      subjectGuidance: "an important object or document partially visible, creating intrigue",
      compositionGuidance: "subject positioned right-center, dramatic shadows, sense of secrecy",
      suffix: "mysterious atmosphere, dramatic lighting, no text, no words, no letters, no watermark, no logos",
    },
    constraints: {
      focalPosition: "right",
      backgroundComplexity: "low",
      emptySpaceNote: "leave left third empty for text and 'SECRET' badge",
      colorGuidance: "dark mysterious tones with spotlight on hidden element",
    },
  },

  "vs-face-off": {
    id: "vs-face-off",
    name: "VS Face-Off",
    description: "Two competing items/faces with 'VS' badge in center",
    whenToUse: [
      "comparison content",
      "versus videos",
      "product comparisons",
      "debates",
      "competition/battles",
    ],
    requiredElements: {
      subject: "two competing items or concepts facing each other",
      props: ["item A on left", "item B on right"],
      allowsBadge: true,
      allowsSymbol: true,
      symbolOptions: ["VS"],
    },
    overlayStyle: {
      textSafeArea: "top",
      hookPlacement: "top-left",
      badgeStyle: "circle",
      allowedHighlights: ["big-symbol", "split-line", "glow"],
    },
    promptScaffold: {
      prefix: "A dramatic face-off composition showing",
      subjectGuidance: "two competing subjects on opposite sides, facing each other",
      compositionGuidance: "symmetric layout, each subject occupying its half, tension in the middle",
      suffix: "dramatic lighting, epic atmosphere, no text, no words, no letters, no watermark, no logos",
    },
    constraints: {
      focalPosition: "split",
      backgroundComplexity: "medium",
      emptySpaceNote: "center area for VS badge, top for hook text",
      colorGuidance: "contrasting colors for each side (e.g., blue vs red)",
    },
  },

  "big-number": {
    id: "big-number",
    name: "Big Number List",
    description: "Huge number overlay + one relevant prop, '3 TIPS' style",
    whenToUse: [
      "list content",
      "tips and tricks",
      "numbered guides",
      "rankings",
      "statistics",
    ],
    requiredElements: {
      subject: "single relevant object or scene representing the topic",
      props: ["icon or object related to list content"],
      allowsBadge: true,
      allowsSymbol: false,
    },
    overlayStyle: {
      textSafeArea: "left",
      hookPlacement: "bottom-left",
      badgeStyle: "pill",
      allowedHighlights: ["badge", "glow"],
    },
    promptScaffold: {
      prefix: "A clean, focused image of",
      subjectGuidance: "a single representative object or scene for the topic",
      compositionGuidance: "subject on the right side, large empty space on left for number overlay",
      suffix: "clean background, professional lighting, no text, no words, no letters, no watermark, no logos",
    },
    constraints: {
      focalPosition: "right",
      backgroundComplexity: "low",
      emptySpaceNote: "leave entire left half empty for big number and hook text",
      colorGuidance: "bold, saturated colors that will contrast with large number overlay",
    },
  },

  "shock-reaction": {
    id: "shock-reaction",
    name: "Shock Reaction",
    description: "Face/silhouette + highlighted shocking object, 'WHAT?!' vibe",
    whenToUse: [
      "surprising content",
      "shocking discoveries",
      "reaction videos",
      "unbelievable facts",
      "dramatic reveals",
    ],
    requiredElements: {
      subject: "person reacting or dramatic scene",
      props: ["shocking element", "surprised face/expression"],
      allowsBadge: true,
      allowsSymbol: true,
      symbolOptions: ["QUESTION"],
    },
    overlayStyle: {
      textSafeArea: "top",
      hookPlacement: "top-left",
      badgeStyle: "stamp",
      allowedHighlights: ["circle", "arrow", "glow", "badge"],
    },
    promptScaffold: {
      prefix: "A dramatic scene capturing",
      subjectGuidance: "a moment of surprise or shock, showing the surprising element prominently",
      compositionGuidance: "dynamic angle, dramatic lighting, focus on the surprising element",
      suffix: "high contrast, dramatic atmosphere, no text, no words, no letters, no watermark, no logos",
    },
    constraints: {
      focalPosition: "center",
      backgroundComplexity: "medium",
      emptySpaceNote: "leave top area for hook text, may circle/highlight the surprising element",
      colorGuidance: "high contrast, dramatic shadows, spotlight effect on key element",
    },
  },

  "simple-diagram": {
    id: "simple-diagram",
    name: "Simple Diagram",
    description: "Base includes simple shapes/space, overlay adds arrows and labels",
    whenToUse: [
      "educational content",
      "how-to guides",
      "process explanations",
      "technical tutorials",
      "step-by-step instructions",
    ],
    requiredElements: {
      subject: "clean scene with clear elements to annotate",
      props: ["simple objects or concepts"],
      allowsBadge: true,
      allowsSymbol: true,
      symbolOptions: ["ARROW", "CHECK"],
    },
    overlayStyle: {
      textSafeArea: "top",
      hookPlacement: "top-left",
      badgeStyle: "pill",
      allowedHighlights: ["arrow", "circle", "badge"],
    },
    promptScaffold: {
      prefix: "A clean, educational illustration showing",
      subjectGuidance: "the concept or process elements arranged clearly",
      compositionGuidance: "clean layout with clear visual elements, space between items for annotation",
      suffix: "minimalist style, clear contrast, no text, no words, no letters, no watermark, no logos",
    },
    constraints: {
      focalPosition: "center",
      backgroundComplexity: "low",
      emptySpaceNote: "space between elements for arrows/labels, top area for hook",
      colorGuidance: "clean, professional colors with good contrast for annotations",
    },
  },

  "tool-spotlight": {
    id: "tool-spotlight",
    name: "Tool Spotlight",
    description: "Single 'hero' object with glow effect, clean background",
    whenToUse: [
      "product reviews",
      "tool recommendations",
      "app showcases",
      "gear guides",
      "featured items",
    ],
    requiredElements: {
      subject: "single hero object or product",
      allowsBadge: true,
      allowsSymbol: false,
    },
    overlayStyle: {
      textSafeArea: "left",
      hookPlacement: "top-left",
      badgeStyle: "corner-flag",
      allowedHighlights: ["glow", "badge"],
    },
    promptScaffold: {
      prefix: "A dramatic product shot of",
      subjectGuidance: "a single hero object, professionally lit, floating or on clean surface",
      compositionGuidance: "subject on the right side, dramatic lighting with glow effect",
      suffix: "studio lighting, clean background, professional product photography, no text, no words, no letters, no watermark, no logos",
    },
    constraints: {
      focalPosition: "right",
      backgroundComplexity: "low",
      emptySpaceNote: "leave left side empty for hook text",
      colorGuidance: "dark or gradient background to make product pop, subtle glow around subject",
    },
  },

  "problem-solution": {
    id: "problem-solution",
    name: "Problem/Solution",
    description: "Clear 'problem' visual vs 'solution' visual with icons",
    whenToUse: [
      "how to fix content",
      "solving problems",
      "troubleshooting",
      "improvement guides",
      "before/after fixes",
    ],
    requiredElements: {
      subject: "visual representation of the problem and solution",
      props: ["problem indicator", "solution indicator"],
      allowsBadge: true,
      allowsSymbol: true,
      symbolOptions: ["X", "CHECK", "ARROW"],
    },
    overlayStyle: {
      textSafeArea: "top",
      hookPlacement: "top-left",
      badgeStyle: "pill",
      allowedHighlights: ["big-symbol", "arrow", "circle", "badge"],
    },
    promptScaffold: {
      prefix: "A clear visual showing",
      subjectGuidance: "a problem scenario or broken/messy state that needs fixing",
      compositionGuidance: "centered composition with clear subject matter",
      suffix: "clear visual storytelling, high contrast, no text, no words, no letters, no watermark, no logos",
    },
    constraints: {
      focalPosition: "center",
      backgroundComplexity: "low",
      emptySpaceNote: "top area for hook, space for X/CHECK overlays",
      colorGuidance: "can use red tones for problem, green for solution area",
    },
  },

  "timeline-step": {
    id: "timeline-step",
    name: "Timeline Step",
    description: "1→2→3 progression using overlay elements",
    whenToUse: [
      "step-by-step guides",
      "process content",
      "progression videos",
      "timeline content",
      "journey documentation",
    ],
    requiredElements: {
      subject: "scene representing a process or journey",
      props: ["sequential elements"],
      allowsBadge: true,
      allowsSymbol: true,
      symbolOptions: ["ARROW"],
    },
    overlayStyle: {
      textSafeArea: "top",
      hookPlacement: "top-left",
      badgeStyle: "circle",
      allowedHighlights: ["arrow", "badge", "circle"],
    },
    promptScaffold: {
      prefix: "A clean scene showing",
      subjectGuidance: "elements that suggest a process or progression",
      compositionGuidance: "horizontal layout suggesting left-to-right flow",
      suffix: "clean composition, space for step indicators, no text, no words, no letters, no watermark, no logos",
    },
    constraints: {
      focalPosition: "center",
      backgroundComplexity: "low",
      emptySpaceNote: "space for numbered step overlays, top for hook",
      colorGuidance: "professional, clean colors that allow step numbers to stand out",
    },
  },

  "clean-hero": {
    id: "clean-hero",
    name: "Clean Hero",
    description: "Simple, elegant hero shot with minimal distraction",
    whenToUse: [
      "general content",
      "professional topics",
      "business content",
      "lifestyle videos",
      "default/fallback concept",
    ],
    requiredElements: {
      subject: "relevant focal point or scene",
      allowsBadge: true,
      allowsSymbol: false,
    },
    overlayStyle: {
      textSafeArea: "left",
      hookPlacement: "top-left",
      badgeStyle: "pill",
      allowedHighlights: ["badge", "glow"],
    },
    promptScaffold: {
      prefix: "A professional, clean image of",
      subjectGuidance: "the main subject, well-lit and positioned for impact",
      compositionGuidance: "subject on right, clean background, professional composition",
      suffix: "high quality, professional photography, no text, no words, no letters, no watermark, no logos",
    },
    constraints: {
      focalPosition: "right",
      backgroundComplexity: "low",
      emptySpaceNote: "leave left third empty for hook text",
      colorGuidance: "clean, professional colors, good contrast for text readability",
    },
  },

  "mystery-blur": {
    id: "mystery-blur",
    name: "Mystery Blur",
    description: "Partially blurred/pixelated reveal for curiosity",
    whenToUse: [
      "teaser content",
      "mystery reveals",
      "coming soon content",
      "censored content previews",
      "suspense building",
    ],
    requiredElements: {
      subject: "intriguing scene with mystery element",
      props: ["hidden/blurred focal point"],
      allowsBadge: true,
      allowsSymbol: true,
      symbolOptions: ["QUESTION"],
    },
    overlayStyle: {
      textSafeArea: "left",
      hookPlacement: "top-left",
      badgeStyle: "stamp",
      allowedHighlights: ["blur-region", "badge", "glow"],
    },
    promptScaffold: {
      prefix: "An intriguing scene with",
      subjectGuidance: "a mysterious or partially revealed element, creating curiosity",
      compositionGuidance: "subject slightly right of center, atmospheric lighting",
      suffix: "mysterious atmosphere, intrigue, no text, no words, no letters, no watermark, no logos",
    },
    constraints: {
      focalPosition: "right",
      backgroundComplexity: "low",
      emptySpaceNote: "left area for hook text and mystery badge",
      colorGuidance: "mysterious, dark tones with highlight on the hidden element",
    },
  },
};

// ============================================
// CONCEPT SELECTION HELPERS
// ============================================

/**
 * Get a concept definition by ID.
 */
export function getConcept(id: ConceptId): ConceptDefinition {
  return CONCEPT_LIBRARY[id];
}

/**
 * Get all concept IDs.
 */
export function getAllConceptIds(): ConceptId[] {
  return [...CONCEPT_IDS];
}

/**
 * Check if a string is a valid concept ID.
 */
export function isValidConceptId(id: string): id is ConceptId {
  return CONCEPT_IDS.includes(id as ConceptId);
}

/**
 * Get the default/fallback concept.
 */
export function getDefaultConcept(): ConceptDefinition {
  return CONCEPT_LIBRARY["clean-hero"];
}

/**
 * Match keywords to suggest concepts.
 */
export function suggestConceptsForKeywords(keywords: string[]): ConceptId[] {
  const scores = new Map<ConceptId, number>();
  const lowerKeywords = keywords.map((k) => k.toLowerCase());

  for (const concept of Object.values(CONCEPT_LIBRARY)) {
    let score = 0;
    for (const whenToUse of concept.whenToUse) {
      const lowerWhen = whenToUse.toLowerCase();
      for (const keyword of lowerKeywords) {
        if (lowerWhen.includes(keyword) || keyword.includes(lowerWhen.split(" ")[0])) {
          score += 1;
        }
      }
    }
    if (score > 0) {
      scores.set(concept.id, score);
    }
  }

  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
}

/**
 * Get concept metadata for UI display.
 */
export function getConceptMeta(id: ConceptId): {
  name: string;
  description: string;
  bestFor: string;
} {
  const concept = getConcept(id);
  return {
    name: concept.name,
    description: concept.description,
    bestFor: concept.whenToUse.slice(0, 3).join(", "),
  };
}

/**
 * Get all concepts with metadata for UI.
 */
export function getAllConceptsMeta(): Array<{
  id: ConceptId;
  name: string;
  description: string;
  bestFor: string;
}> {
  return CONCEPT_IDS.map((id) => ({
    id,
    ...getConceptMeta(id),
  }));
}

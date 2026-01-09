/**
 * Edit Intent Builder
 *
 * Converts an EditRequest into an EditIntent with processed constraints.
 * Prioritizes: user feedback > locks > best practices > defaults
 */

import type {
  EditRequest,
  EditIntent,
  BogyColorOption,
} from "./editTypes";
import type { ConceptPlan } from "./types";

// ============================================
// TOPIC ANCHOR EXTRACTION
// ============================================

/**
 * Extract topic anchors from title + description.
 * These are nouns/concepts that MUST appear in the thumbnail.
 */
function extractTopicAnchors(title: string, description: string): string[] {
  const combined = `${title} ${description}`.toLowerCase();
  const anchors: string[] = [];

  // Common patterns to extract
  const patterns = [
    // Numbers (e.g., "10 mistakes")
    /\b(\d+)\s+(tips?|mistakes?|ways?|secrets?|steps?|things?|reasons?)\b/gi,
    // Tech terms
    /\b(react|javascript|python|css|api|database|oauth|login|auth)\b/gi,
    // Action words that imply visuals
    /\b(build|create|design|grow|earn|lose|start|stop|avoid|fix)\b/gi,
    // Objects/props
    /\b(laptop|computer|phone|camera|money|chart|code|screen|video)\b/gi,
  ];

  for (const pattern of patterns) {
    const matches = combined.match(pattern);
    if (matches) {
      anchors.push(...matches.map((m) => m.toLowerCase()));
    }
  }

  // Extract key nouns from title (first 5 significant words)
  const titleWords = title
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 3 &&
        !["this", "that", "your", "with", "from", "have", "will", "what"].includes(
          w.toLowerCase()
        )
    )
    .slice(0, 5);
  anchors.push(...titleWords.map((w) => w.toLowerCase()));

  // Deduplicate
  return [...new Set(anchors)].slice(0, 6);
}

// ============================================
// FEEDBACK PARSING
// ============================================

/**
 * Parse user free-form feedback into structured constraints.
 */
function parseUserFeedback(
  likes: string | undefined,
  dislikes: string | undefined,
  emphasize: string | undefined,
  mustAvoid: string | undefined
): { keep: string[]; change: string[]; avoid: string[] } {
  const keep: string[] = [];
  const change: string[] = [];
  const avoid: string[] = [];

  // Parse likes -> keep
  if (likes?.trim()) {
    const likeItems = likes
      .split(/[,;.]/)
      .map((s) => s.trim())
      .filter(Boolean);
    keep.push(...likeItems.map((s) => `Keep: ${s}`));
  }

  // Parse dislikes -> change
  if (dislikes?.trim()) {
    const dislikeItems = dislikes
      .split(/[,;.]/)
      .map((s) => s.trim())
      .filter(Boolean);
    change.push(...dislikeItems.map((s) => `Change: ${s}`));
  }

  // Parse emphasize -> keep (as priority)
  if (emphasize?.trim()) {
    const emphItems = emphasize
      .split(/[,;.]/)
      .map((s) => s.trim())
      .filter(Boolean);
    keep.push(...emphItems.map((s) => `Emphasize: ${s}`));
  }

  // Parse mustAvoid -> avoid
  if (mustAvoid?.trim()) {
    const avoidItems = mustAvoid
      .split(/[,;.]/)
      .map((s) => s.trim())
      .filter(Boolean);
    avoid.push(...avoidItems);
  }

  return { keep, change, avoid };
}

// ============================================
// LAYOUT DIRECTION
// ============================================

/**
 * Convert layout settings to a direction string for the prompt.
 */
function getLayoutDirection(
  layout: EditRequest["composition"]["layout"],
  crop: EditRequest["composition"]["crop"],
  clutter: EditRequest["composition"]["clutter"]
): string {
  const parts: string[] = [];

  switch (layout) {
    case "flip-horizontal":
      parts.push("Mirror the composition horizontally");
      break;
    case "center-subject":
      parts.push("Place subject in center");
      break;
    case "more-negative-space":
      parts.push("Increase negative space for text");
      break;
    default:
      parts.push("Maintain current layout");
  }

  switch (crop) {
    case "zoom-in":
      parts.push("tighter crop on subject");
      break;
    case "zoom-out":
      parts.push("wider shot showing more context");
      break;
    case "rule-of-thirds":
      parts.push("strong rule-of-thirds composition");
      break;
  }

  switch (clutter) {
    case "simplify":
      parts.push("simplify background, fewer elements");
      break;
    case "add-context":
      parts.push("add more contextual elements");
      break;
  }

  return parts.join(", ");
}

// ============================================
// SUBJECT DESCRIPTION
// ============================================

/**
 * Build subject description from settings.
 */
function getSubjectDescription(
  settings: EditRequest["subject"],
  referencePlan?: ConceptPlan
): string {
  const parts: string[] = [];

  if (settings.changeSubjectTo?.trim()) {
    // User explicitly wants a different subject
    parts.push(settings.changeSubjectTo);
  } else if (settings.keepSubject && referencePlan?.subjects) {
    // Keep reference subject
    parts.push(referencePlan.subjects);
  } else {
    // Build from type
    switch (settings.subjectType) {
      case "face":
        parts.push("expressive human face, close-up");
        break;
      case "object":
        parts.push("clear focal object related to topic");
        break;
      case "mascot":
        parts.push("friendly mascot or character");
        break;
      case "icon-only":
        parts.push("bold icon or symbol");
        break;
      default:
        parts.push("clear focal subject");
    }
  }

  // Add expression if face
  if (settings.expression && settings.subjectType !== "icon-only") {
    parts.push(`showing ${settings.expression} expression`);
  }

  // Add size modifier
  switch (settings.subjectSize) {
    case "small":
      parts.push("smaller in frame");
      break;
    case "large":
      parts.push("prominent, filling much of the frame");
      break;
  }

  return parts.join(", ");
}

// ============================================
// HEADLINE GENERATION
// ============================================

/**
 * Generate a headline from title if not provided.
 * Uses proven patterns for attention-grabbing hooks.
 */
function generateHeadline(
  title: string,
  existingHeadline?: string,
  maxChars: number = 20
): string {
  if (existingHeadline?.trim()) {
    return existingHeadline.slice(0, maxChars);
  }

  const lower = title.toLowerCase();

  // Pattern matching for punchy hooks
  if (lower.includes("mistake") || lower.includes("wrong")) {
    return "STOP THIS";
  }
  if (lower.includes("how to") || lower.includes("tutorial")) {
    return "DO THIS";
  }
  if (lower.includes("money") || lower.includes("$")) {
    return "IT WORKS";
  }
  if (lower.includes(" vs ")) {
    return "WHO WINS?";
  }
  if (lower.includes("best") || lower.includes("top")) {
    return "THE BEST";
  }

  // Extract numbers
  const numMatch = title.match(/\b(\d+)\b/);
  if (numMatch) {
    return `${numMatch[1]} SECRETS`;
  }

  // Fallback: first 2-3 impactful words
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "to",
    "for",
    "of",
    "in",
    "on",
    "with",
    "is",
    "are",
    "your",
    "you",
  ]);
  const words = title.split(/\s+/).filter((w) => !stopWords.has(w.toLowerCase()));
  return words.slice(0, 2).join(" ").toUpperCase().slice(0, maxChars);
}

// ============================================
// MAIN BUILDER
// ============================================

/**
 * Build an EditIntent from an EditRequest.
 * This is the main function that processes all user settings into
 * constraints for the prompt builder.
 */
export function buildEditIntent(
  request: EditRequest,
  referencePlan?: ConceptPlan
): EditIntent {
  // Parse user feedback
  const { keep, change, avoid } = parseUserFeedback(
    request.userLikes,
    request.userDislikes,
    request.emphasize,
    request.mustAvoid
  );

  // Extract topic anchors
  const requiredAnchors = extractTopicAnchors(request.title, request.description);

  // Add locks to keep list
  for (const lock of request.locks) {
    switch (lock) {
      case "palette":
        keep.push("Keep exact color palette");
        break;
      case "layout":
        keep.push("Keep exact layout and composition");
        break;
      case "subject-identity":
        keep.push("Keep same main subject");
        break;
      case "background-style":
        keep.push("Keep background style");
        break;
      case "headline-style":
        keep.push("Keep headline typography style");
        break;
      case "callout-style":
        keep.push("Keep callout/graphic style");
        break;
    }
  }

  // Build risk reductions from subject settings
  const riskReductions = {
    avoidHands: request.subject.avoidHands,
    avoidScreens: request.subject.avoidScreens,
    avoidTextInImage: request.subject.avoidTextInImage,
    simplifyScene: request.composition.clutter === "simplify",
  };

  // Add risk-based avoidances
  if (riskReductions.avoidHands) {
    avoid.push("hands", "fingers", "visible hands");
  }
  if (riskReductions.avoidScreens) {
    avoid.push("detailed screens", "computer monitors with text", "readable UI");
  }
  if (riskReductions.avoidTextInImage) {
    avoid.push("text in base image", "words", "letters", "typography");
  }

  // Layout direction
  const layoutDirection = getLayoutDirection(
    request.composition.layout,
    request.composition.crop,
    request.composition.clutter
  );

  // Subject description
  const subjectDescription = getSubjectDescription(request.subject, referencePlan);

  // Headline
  const headline = generateHeadline(
    request.title,
    request.text.headlineText,
    request.text.maxChars
  );

  return {
    keep,
    change,
    avoid,
    requiredAnchors,
    riskReductions,
    layoutDirection,
    palette: {
      primary: request.color.primaryColor,
      accent: request.color.accentColor,
      boostContrast: request.color.boostContrast,
      boostSaturation: request.color.boostSaturation,
    },
    background: {
      style: request.background.style,
      depth: request.background.depth,
      cleanliness: request.background.cleanliness,
    },
    subject: {
      description: subjectDescription,
      size: request.subject.subjectSize,
      expression: request.subject.expression,
    },
    text: {
      headline,
      placement: request.text.textPlacement,
      treatment: request.text.textTreatment,
      sizeMultiplier: request.text.textSizeMultiplier,
    },
    graphics: {
      calloutType: request.graphics.calloutType,
      target: request.graphics.calloutTarget,
      intensity: request.graphics.calloutIntensity,
    },
    locks: request.locks,
  };
}

// ============================================
// PROMPT BUILDING FROM EDIT INTENT
// ============================================

/**
 * Build a base visual prompt from EditIntent.
 * NO TEXT in base image - compositor handles headline.
 */
export function buildEditPrompt(intent: EditIntent): {
  prompt: string;
  negativePrompt: string;
} {
  const sections: string[] = [];

  // 1. Base instruction
  sections.push(
    `Create a YouTube thumbnail base image (no words, no text), 16:9 aspect ratio, 1280x720.`
  );

  // 2. Topic anchors (must show)
  if (intent.requiredAnchors.length > 0) {
    sections.push(
      `MUST SHOW (topic anchors): ${intent.requiredAnchors.join(", ")}.`
    );
  }

  // 3. Keep constraints (from locks + likes)
  if (intent.keep.length > 0) {
    sections.push(`KEEP THESE: ${intent.keep.join("; ")}.`);
  }

  // 4. Change constraints (from dislikes)
  if (intent.change.length > 0) {
    sections.push(`CHANGE THESE: ${intent.change.join("; ")}.`);
  }

  // 5. Avoid constraints
  if (intent.avoid.length > 0) {
    sections.push(`DO NOT INCLUDE: ${intent.avoid.join(", ")}.`);
  }

  // 6. Subject
  sections.push(`SUBJECT: ${intent.subject.description}.`);

  // 7. Background
  const bgParts = [
    intent.background.style.replace(/-/g, " "),
    `${intent.background.depth} depth`,
    `${intent.background.cleanliness} detail level`,
  ];
  sections.push(`BACKGROUND: ${bgParts.join(", ")}.`);

  // 8. Color palette
  const colorParts = [
    `BOGY palette: ${intent.palette.primary.toUpperCase()} primary, ${intent.palette.accent.toUpperCase()} accent`,
  ];
  if (intent.palette.boostContrast) {
    colorParts.push("high contrast");
  }
  if (intent.palette.boostSaturation) {
    colorParts.push("vibrant saturation");
  }
  colorParts.push("avoid heavy red/white/black dominance");
  sections.push(`COLORS: ${colorParts.join(", ")}.`);

  // 9. Composition
  sections.push(
    `COMPOSITION: ${intent.layoutDirection}. Leave clean negative space on ${intent.text.placement} for headline overlay.`
  );

  // 10. Graphics/callouts
  if (intent.graphics.calloutType !== "none") {
    sections.push(
      `GRAPHIC ACCENT: ${intent.graphics.calloutType.replace(/-/g, " ")} with ${intent.graphics.intensity} intensity targeting ${intent.graphics.target.replace(/-/g, " ")}.`
    );
  }

  // 11. Quality + anti-artifact constraints (CRITICAL)
  sections.push(
    `QUALITY: Professional, 4K sharp details, dramatic cinematic lighting with rim light, crisp edges.`
  );

  sections.push(
    `REALISM CONSTRAINTS: Believable objects, correct anatomy, no extra fingers/limbs, no distorted faces. If screen/UI present: simplified blurred blocks only, no readable text.`
  );

  const prompt = sections.join("\n\n");

  // Build negative prompt
  const negatives = [
    "text",
    "words",
    "letters",
    "watermark",
    "logo",
    "deformed",
    "extra fingers",
    "extra limbs",
    "malformed hands",
    "distorted face",
    "duplicate objects",
    "impossible perspective",
    "warped screens",
    "gibberish UI",
    "low contrast",
    "flat background",
    "clutter",
    "blurry",
    "amateur quality",
  ];

  // Add user's mustAvoid to negatives
  negatives.push(...intent.avoid.filter((a) => a.length < 30));

  const negativePrompt = negatives.join(", ");

  return { prompt, negativePrompt };
}

/**
 * Generate variant prompts from EditIntent.
 * Respects locks - only varies unlocked aspects.
 */
export function generateEditVariants(
  intent: EditIntent,
  count: number = 4
): Array<{ prompt: string; negativePrompt: string; variationNote: string }> {
  const variations: Array<{
    paletteOverride?: { primary: BogyColorOption; accent: BogyColorOption };
    layoutNote?: string;
    lightingNote?: string;
    variationNote: string;
  }> = [];

  // Define variation dimensions based on what's NOT locked
  const canVaryPalette = !intent.locks.includes("palette");
  const canVaryLayout = !intent.locks.includes("layout");

  if (count >= 1) {
    variations.push({ variationNote: "Base variation (user's exact request)" });
  }

  if (count >= 2 && canVaryLayout) {
    variations.push({
      layoutNote: "tighter crop, more dramatic close-up",
      variationNote: "Tighter crop variation",
    });
  } else if (count >= 2) {
    variations.push({
      lightingNote: "warmer lighting",
      variationNote: "Warmer lighting variation",
    });
  }

  if (count >= 3 && canVaryPalette) {
    // Swap primary and accent
    variations.push({
      paletteOverride: {
        primary: intent.palette.accent,
        accent: intent.palette.primary,
      },
      variationNote: `Swapped palette (${intent.palette.accent}/${intent.palette.primary})`,
    });
  } else if (count >= 3) {
    variations.push({
      lightingNote: "cooler lighting, more dramatic shadows",
      variationNote: "Cooler lighting variation",
    });
  }

  if (count >= 4 && canVaryLayout) {
    variations.push({
      layoutNote: "wider shot showing more context",
      variationNote: "Wider shot variation",
    });
  } else if (count >= 4) {
    variations.push({
      lightingNote: "softer, more even lighting",
      variationNote: "Softer lighting variation",
    });
  }

  // Build prompts for each variation
  return variations.slice(0, count).map((v) => {
    // Clone intent and apply overrides
    const variantIntent: EditIntent = {
      ...intent,
      palette: v.paletteOverride
        ? { ...intent.palette, ...v.paletteOverride }
        : intent.palette,
      layoutDirection: v.layoutNote
        ? `${intent.layoutDirection}, ${v.layoutNote}`
        : intent.layoutDirection,
    };

    const { prompt, negativePrompt } = buildEditPrompt(variantIntent);

    // Add lighting note if present
    const finalPrompt = v.lightingNote
      ? prompt + `\n\nLIGHTING VARIATION: ${v.lightingNote}`
      : prompt;

    return {
      prompt: finalPrompt,
      negativePrompt,
      variationNote: v.variationNote,
    };
  });
}

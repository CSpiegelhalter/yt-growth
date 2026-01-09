/**
 * LLM Concept Planner (V2 - Enhanced Controls)
 *
 * Uses OpenAI to generate concept-driven thumbnail plans.
 * Focus: Visual storytelling with explicit style control.
 *
 * V2 Changes:
 * - Meme styles (rageComic, reactionFace, etc.) have STRONG influence on prompts
 * - Character identity controls (gender, age, style)
 * - Screen/UI constraints to prevent nonsense screens
 * - Style recipes override generic "bold modern" language
 *
 * The LLM must:
 * 1. Extract intent: what is the video REALLY about?
 * 2. Pick a concept pattern that communicates it fast
 * 3. Rewrite the title into a short hook (2-5 words)
 * 4. Specify subjects/props that visually represent the idea
 * 5. RESPECT user style controls (meme style > visual style)
 */

import { callLLM } from "@/lib/llm";
import type { ConceptPlan, ThumbnailJobInput } from "./types";
import type { GenerationControls } from "./generationControls";
import {
  getDefaultControls,
  sanitizeInspirationText,
  getMemeInspirationDescription,
} from "./generationControls";
import {
  CONCEPT_IDS,
  getAllConceptsMeta,
  getConcept,
  isValidConceptId,
  type ConceptId,
} from "./concepts";
import { ensurePromptSafety } from "./schemas";
import { validateAndRepairPlans } from "./planValidator";

// ============================================
// SYSTEM PROMPT - CONCEPT-DRIVEN PLANNING
// ============================================

const SYSTEM_PROMPT = `You are an expert YouTube thumbnail strategist and prompt engineer. Your job is to create CONCEPT PLANS with DETAILED, VERBOSE basePrompts that produce click-worthy images WITHOUT common AI artifacts.

=== CRITICAL: BE VERBOSE AND EXPLICIT ===
The basePrompt is sent directly to an image AI. It needs to be LONG and DETAILED - at least 4-5 sentences describing:
- The FULL SCENE with environment, props, and atmosphere (NOT just a face)
- The subject's appearance, expression, pose, and framing
- SPECIFIC PROPS related to the video topic
- What is NOT in the image (hands, text, etc.)
- The art style and quality markers
DO NOT be brief. DO NOT just describe a face close-up. Describe a COMPLETE SCENE.

=== VARIETY IN SHOT TYPES (CRITICAL) ===
DO NOT generate only close-up face shots. Mix these shot types across plans:
1. WIDE SHOT: Full body or 3/4 body with environment visible, props in scene
2. MEDIUM SHOT: Waist-up with desk/workspace/props around subject
3. OVER-THE-SHOULDER: Subject looking at something (screen, object, horizon)
4. ENVIRONMENTAL: Subject small in frame, dramatic environment dominates
5. SPLIT COMPOSITION: Subject on one side, key prop/symbol on other side

=== PROPS ARE REQUIRED ===
Every thumbnail MUST include at least 1-2 relevant props. Examples:
- Tech videos: glowing monitors, keyboards, code on screens (abstract colors), server racks
- Money videos: stacks of cash, gold bars, luxury items, revenue graphs
- Gaming: controllers, gaming chair, RGB lights, game characters
- Education: books, whiteboard, graduation cap, lightbulb
- Fitness: dumbbells, gym equipment, protein shake, stopwatch
- Travel: suitcase, passport, airplane, landmarks
- Food: cooking equipment, ingredients, plated dishes
Props make thumbnails MORE INTERESTING and CLICKABLE than just a face.

=== ABSOLUTELY NO HANDS - CRITICAL ===
AI image generators FAIL at hands. They produce extra fingers, merged fingers, twisted wrists, impossible poses.
SOLUTION: Never show hands in the image. Use these exact phrases in EVERY basePrompt:
- "arms cropped above the wrists, hands not visible in frame"
- "hands hidden behind desk/object/frame edge"
- "close-up framing that excludes hands entirely"
- "subject's arms folded behind back, hands not visible"
ALSO add to negativePrompt: "hands, fingers, visible hands, visible fingers, hand in frame, wrist, palm"

=== ABSOLUTELY NO TEXT IN IMAGE - CRITICAL ===  
AI generates gibberish text, random letters, and unreadable symbols.
SOLUTION: Explicitly forbid ALL text in the basePrompt AND negativePrompt:
- basePrompt MUST end with: "absolutely no text, no words, no letters, no numbers, no writing, no captions, no watermarks, no logos, no signs, no labels anywhere in the image"
- negativePrompt MUST include: "text, words, letters, numbers, writing, caption, watermark, logo, sign, label, gibberish, random letters, symbols, UI text"
The hook text will be added LATER by our renderer - the AI image must be completely text-free.

=== EYES AND FACE - CRITICAL ===
AI often generates asymmetrical eyes, missing pupils, extra teeth, or uncanny expressions.
SOLUTION: Be explicit about facial features in basePrompt:
- "symmetrical eyes with matching pupils, natural eye spacing"
- "both eyes clearly visible with identical pupils and iris color"
- "natural facial proportions, symmetrical features"
- "clean expression without distortion or melting"
Add to negativePrompt: "asymmetrical eyes, missing pupil, extra teeth, melted face, distorted features, uncanny valley, crossed eyes"

=== SCREEN/LAPTOP RULES ===
If showing a laptop or screen:
- "front-facing laptop with keyboard at bottom, hinged screen above showing ONLY solid color or abstract color gradient, no UI, no icons, no text on screen"
- Add to negativePrompt: "text on screen, UI elements, icons, readable content, fake interface"

=== STYLE ADAPTER ===
BOLD/DEFAULT: high-contrast, simplified forms, dramatic lighting, poster-like clarity
PHOTOREALISTIC: natural lighting, realistic textures, avoid plastic skin
CARTOON: consistent line weight, cel shading, unified style
CINEMATIC: film color grading, dramatic rim lighting

=== COLOR - BOGY PALETTE ===
Use Blue, Orange, Green, Yellow as dominant colors:
- Tech: Blue + Orange
- Finance: Green + Yellow  
- Gaming: Orange + Yellow
- Education: Blue + Green

AVAILABLE CONCEPT PATTERNS:
${getAllConceptsMeta()
  .map((c) => `- ${c.id}: ${c.description} (best for: ${c.bestFor})`)
  .join("\n")}

=== HOOK TEXT RULES ===
1. 2-5 punchy words that trigger emotion
2. Transform the title into curiosity/shock/urgency
3. Use: Numbers ("$50K"), Challenges ("YOU'RE WRONG"), Promises ("GAME CHANGER"), Shock ("THEY LIED")
4. NEVER use generic phrases or the exact video title

=== BASE PROMPT STRUCTURE (MUST BE VERBOSE - 4-5 SENTENCES MINIMUM) ===
Write basePrompt as a detailed paragraph including ALL of these:
1. SHOT TYPE: Specify "wide shot", "medium shot", "three-quarter body", etc. - NOT always close-up
2. ENVIRONMENT: Rich scene description (office, studio, outdoor, etc.) with atmosphere
3. PROPS: 1-2 specific props relevant to the topic (cash stacks, monitors, trophies, etc.)
4. SUBJECT: Expression, pose, body position, clothing style
5. FRAMING: "Arms cropped above wrists, hands not visible" OR "hands behind back/hidden"
6. LIGHTING: Dramatic, cinematic, neon, natural - be specific
7. COMPOSITION: Where subject is positioned, where negative space is for text
8. End with: "absolutely no text, no words, no letters, no numbers, no writing, no captions, no watermarks, no logos, no signs anywhere in the image"

EXAMPLE GOOD basePrompt:
"Wide shot of a young entrepreneur in a sleek modern office, waist-up framing with arms crossed behind back hiding hands. Subject has an excited expression with wide eyes and confident smile, wearing a casual blazer. On the desk in front: stacks of hundred dollar bills and a laptop showing abstract green gradient. Dramatic rim lighting from the side creates depth, dark moody background with city skyline visible through floor-to-ceiling windows. Clean negative space on the left third for text overlay. Cinematic color grading with blue and orange tones. Absolutely no text, no words, no letters, no numbers, no writing, no captions, no watermarks, no logos, no signs anywhere in the image."

EXAMPLE BAD basePrompt (too simple, no scene):
"Close-up of shocked face with wide eyes, blue background, no text" - THIS IS BAD, TOO SIMPLE

=== NEGATIVE PROMPT (MUST BE COMPREHENSIVE) ===
Always include these in negativePrompt:
"text, words, letters, numbers, writing, caption, watermark, logo, sign, label, gibberish text, random letters, hands, fingers, visible hands, palm, wrist, asymmetrical eyes, missing pupil, extra teeth, melted face, distorted features, uncanny valley, duplicate objects, extra limbs, deformed, blurry, low quality"

OUTPUT FORMAT:
Return ONLY valid JSON with a "plans" array of ConceptPlan objects.
Each plan must have these exact fields:
{
  "conceptId": "one of the concept IDs listed above",
  "hookText": "2-5 punchy words",
  "subHook": "optional secondary text",
  "emotionTone": "urgent|curious|clean|dramatic|playful|professional|shocking|mysterious",
  "palette": { 
    "bg1": "#HEX (BOGY color)", 
    "bg2": "#HEX (complement)", 
    "accent": "#HEX (contrast)", 
    "text": "#FFFFFF or #000000" 
  },
  "composition": {
    "textSafeArea": "left|right|top|bottom|center",
    "focalSubjectPosition": "left|right|center|split",
    "backgroundComplexity": "low|medium|high"
  },
  "basePrompt": "MUST BE VERBOSE - A detailed 3-4 sentence paragraph describing the scene, subject with 'arms cropped above wrists hands not visible', lighting, style, clean negative space location, ending with 'absolutely no text, no words, no letters, no numbers, no writing, no captions, no watermarks, no logos, no signs anywhere in the image'",
  "negativePrompt": "text, words, letters, numbers, writing, caption, watermark, logo, sign, label, gibberish text, random letters, hands, fingers, visible hands, palm, wrist, asymmetrical eyes, missing pupil, extra teeth, melted face, distorted features, uncanny valley, duplicate objects, extra limbs, deformed, blurry, low quality",
  "overlayDirectives": {
    "badges": [{ "text": "...", "style": "pill|corner-flag|stamp|ribbon|circle" }],
    "highlights": [{ "type": "arrow|circle|glow|blur-region|split-line" }],
    "bigSymbol": "X|CHECK|VS|ARROW|QUESTION|NONE"
  },
  "subjects": "Main subject and props description"
}`;

// ============================================
// STYLE-SPECIFIC INSTRUCTIONS FOR LLM
// ============================================

/**
 * Get style-specific instructions that tell the LLM how to write the basePrompt.
 * These are CRITICAL for ensuring meme styles actually produce meme-looking outputs.
 */
function getStyleInstructions(ctrl: GenerationControls): string {
  const { memeStyle, visualStyle } = ctrl;

  // Meme style takes absolute priority
  if (memeStyle && memeStyle !== "off") {
    switch (memeStyle) {
      case "rageComic":
        return `
STYLE INSTRUCTION (MANDATORY - RAGE COMIC):
The basePrompt MUST describe a rage-comic-inspired image:
- "black-and-white rage-comic-inspired webcomic line art"
- "thick uneven ink outlines, simple crude shading, 2D flat drawing"
- "extremely exaggerated facial features, face is the focal point"
- "early 2010s forum comic or MS Paint webcomic aesthetic"
- "ORIGINAL face design, NOT a copy of trollface/rage guy/any known meme"
DO NOT include: "photorealistic", "cinematic", "3D", "smooth gradients", "realistic lighting"
The basePrompt must NOT have any generic "bold modern thumbnail" language.`;

      case "reactionFace":
        return `
STYLE INSTRUCTION (MANDATORY - REACTION FACE):
The basePrompt MUST describe a sticker-cutout reaction face:
- "clean sticker-cutout reaction face with bold thick outline"
- "high saturation accent colors, simple flat shading"
- "original expressive face design, NOT photorealistic"
- "exaggerated facial expression, face clearly separated from background"
DO NOT include: "photorealistic skin texture", "hyperrealistic", "soft blended edges"`;

      case "wojakLike":
        return `
STYLE INSTRUCTION (MANDATORY - WOJAK-LIKE):
The basePrompt MUST describe minimalist line art:
- "minimalistic 2D line art portrait, simple web comic style"
- "muted but high-contrast palette, simple geometric shapes"
- "expressive emotion through minimal lines"
- "ORIGINAL character design, NOT a copy of wojak/feels guy"
DO NOT include: "photorealistic", "detailed shading", "3D render"`;

      case "surrealCursed":
        return `
STYLE INSTRUCTION (MANDATORY - SURREAL CURSED):
The basePrompt MUST describe surreal absurdist imagery:
- "surreal absurdist internet meme aesthetic"
- "slightly unsettling but funny, unexpected object combinations"
- "bold color pops, simple composition with clear subject"
- "dreamlike or 'slightly wrong' feeling"
DO NOT include: "body horror", "grotesque", "realistic", "stock photo"`;

      case "deepFried":
        return `
STYLE INSTRUCTION (MANDATORY - DEEP FRIED):
The basePrompt MUST describe deep-fried meme aesthetic:
- "deep-fried meme aesthetic, over-sharpened edges"
- "heavy contrast, posterized colors with reduced color depth"
- "slight JPEG artifact texture, red/orange color cast"
- "still readable and recognizable at thumbnail size"
DO NOT include: "clean crisp edges", "smooth gradients", "professional photography"`;
    }
  }

  // Visual style (if no meme style)
  if (visualStyle !== "auto") {
    switch (visualStyle) {
      case "photoreal":
      case "cinematic":
        return `
STYLE: Photorealistic or cinematic quality. Natural lighting, realistic textures, professional photography or high-end digital art aesthetic.`;
      case "cartoon":
      case "comic-ink":
        return `
STYLE: Clean cartoon or comic illustration. Bold outlines, vibrant colors, simplified shapes. Expressive but consistent style.`;
      case "anime":
        return `
STYLE: Anime/manga illustration. Large expressive eyes, dynamic poses, cel-shaded coloring, Japanese animation aesthetic.`;
      case "3d-mascot":
        return `
STYLE: 3D rendered mascot character. Smooth surfaces, soft shadows, friendly appealing design.`;
      case "vector-flat":
        return `
STYLE: Flat vector illustration. Bold shapes, minimal shading, clean geometric forms.`;
    }
  }

  return "";
}

// ============================================
// CONTROLS-TO-INSTRUCTIONS BUILDER (V2)
// ============================================

/**
 * Convert GenerationControls into LLM-friendly instructions.
 * V2: Stronger enforcement of meme styles and character controls.
 */
function buildControlsInstructions(ctrl: GenerationControls): string {
  const instructions: string[] = [];

  // MEME STYLE (highest priority - goes first)
  const styleInstruction = getStyleInstructions(ctrl);
  if (styleInstruction) {
    instructions.push(styleInstruction);
  }

  // SUBJECT PRESENCE
  if (!ctrl.includePerson) {
    instructions.push(
      `- PERSON/FACE: ABSOLUTELY NO PEOPLE OR FACES. Focus on objects, icons, or environment.`
    );
  } else if (ctrl.subjectType === "person-face") {
    instructions.push(
      `- PERSON/FACE: Include a person with visible face as main subject`
    );
  } else if (ctrl.subjectType === "mascot-character") {
    instructions.push(
      `- SUBJECT: Use an original mascot/character (non-human or stylized character)`
    );
  } else if (ctrl.subjectType === "object-icon") {
    instructions.push(
      `- SUBJECT: Focus on objects/icons related to the topic. No people.`
    );
  } else if (ctrl.subjectType === "environment-only") {
    instructions.push(
      `- SUBJECT: Focus on environment/scene. No specific focal subject.`
    );
  }

  // CHARACTER IDENTITY (V2 - new controls)
  if (ctrl.characterEnabled && ctrl.includePerson) {
    // Gender
    if (ctrl.characterGender && ctrl.characterGender !== "auto") {
      const genderMap: Record<string, string> = {
        male: "clearly MALE-presenting with masculine features",
        female: "clearly FEMALE-presenting with feminine features",
        neutral: "GENDER-NEUTRAL with androgynous features",
      };
      instructions.push(
        `- CHARACTER GENDER: ${
          genderMap[ctrl.characterGender] || "auto"
        } (MANDATORY - do not make ambiguous)`
      );
    }

    // Age
    if (ctrl.characterAge && ctrl.characterAge !== "auto") {
      const ageMap: Record<string, string> = {
        young: "young adult in their 20s",
        adult: "adult in their 30s-40s",
        older: "mature adult 50+",
      };
      instructions.push(
        `- CHARACTER AGE: ${ageMap[ctrl.characterAge] || "adult"}`
      );
    }
  }

  // PERSONA VIBE (if person included)
  if (ctrl.includePerson && ctrl.personaVibe !== "auto") {
    const vibeMap: Record<string, string> = {
      serious: "serious, focused, professional expression",
      confident: "confident, powerful, assured stance",
      curious: "curious, intrigued, raised eyebrow",
      shocked: "shocked, surprised, wide eyes, jaw drop",
      silly: "silly, playful, goofy expression",
      chaotic: "wild, unhinged, extreme expression",
      deadpan: "deadpan, neutral, understated look",
    };
    instructions.push(
      `- EXPRESSION/VIBE: Person should have ${
        vibeMap[ctrl.personaVibe] || ctrl.personaVibe
      }`
    );
  }

  // FACE STYLE (for cartoon/comic)
  if (
    ctrl.includePerson &&
    (ctrl.visualStyle === "cartoon" || ctrl.visualStyle === "comic-ink") &&
    ctrl.faceStyle !== "auto"
  ) {
    const faceMap: Record<string, string> = {
      "emoji-like": "emoji-inspired simple face, round features",
      "expressive-cartoon":
        "highly expressive cartoon face, exaggerated features",
      "meme-face-vibe": "meme-style reaction face, internet culture aesthetic",
      "cute-mascot": "cute mascot face, big eyes, friendly",
    };
    instructions.push(
      `- FACE STYLE: ${faceMap[ctrl.faceStyle] || ctrl.faceStyle}`
    );
  }

  // HAND AVOIDANCE
  if (ctrl.avoidHands && ctrl.includePerson) {
    instructions.push(
      `- HANDS: NO VISIBLE HANDS in the image. Crop above wrists or hide hands behind objects/frame edge.`
    );
  }

  // SCREEN/UI CONSTRAINTS (V2 - new controls)
  if (ctrl.avoidScreens) {
    instructions.push(
      `- SCREENS: ABSOLUTELY NO laptops, monitors, screens, phones, tablets, or computer displays.`
    );
  } else if (ctrl.uiMode === "none") {
    instructions.push(
      `- SCREENS: NO screens or digital displays in the image.`
    );
  } else if (ctrl.uiMode === "abstractBlocks") {
    instructions.push(
      `- SCREENS: If showing a laptop/screen, UI must be ABSTRACT COLOR BLOCKS only. NO readable text. Single front-facing screen with correct hinge.`
    );
  } else if (ctrl.uiMode === "blurredMockUI") {
    instructions.push(
      `- SCREENS: If showing a screen, UI must be BLURRED MOCKUP only. NO readable text. Single correctly-oriented device.`
    );
  }

  // DIVERSITY
  if (ctrl.diversityVariety && ctrl.includePerson) {
    instructions.push(
      `- DIVERSITY: Vary appearance across variants (hair, clothing, accessories). Keep it natural and non-stereotyping.`
    );
  }

  // MEME INTENSITY (if not using specific meme style)
  if (ctrl.memeIntensity !== "off" && ctrl.memeStyle === "off") {
    const memeMap: Record<string, string> = {
      light: "Subtle meme energy, slight exaggeration",
      medium: "Clear meme composition, exaggerated expression, graphic accents",
      max: "Maximum meme energy, extreme expression, bold graphic elements, sticker-cutout style",
    };
    instructions.push(`- MEME VIBE: ${memeMap[ctrl.memeIntensity]}`);

    if (ctrl.memeFormats && ctrl.memeFormats.length > 0) {
      const formatDescriptions = ctrl.memeFormats.map((f) => {
        const map: Record<string, string> = {
          "reaction-face": "reaction-face composition",
          "exaggerated-expression": "extremely exaggerated facial expression",
          "bold-outline": "thick bold outline around subject (sticker cutout)",
          "circle-highlight-arrow":
            "circle highlight and arrow pointing to key element",
          "glitch-retro-pixels": "glitch effects, retro pixels, VHS aesthetic",
        };
        return map[f] || f;
      });
      instructions.push(
        `- MEME FORMATS: Include ${formatDescriptions.join(", ")}`
      );
    }
  }

  // MEME INSPIRATIONS (V2)
  if (ctrl.memeInspirations && ctrl.memeInspirations.length > 0) {
    const inspirationDescs = ctrl.memeInspirations
      .slice(0, 2)
      .map((tag) => getMemeInspirationDescription(tag))
      .join("; ");
    instructions.push(
      `- MEME INSPIRATION (vibe only, ORIGINAL design): ${inspirationDescs}`
    );
  }

  // EMOJIS (V2 - enhanced)
  if (ctrl.includeEmojis && ctrl.emojiCount > 0) {
    const isCursed =
      ctrl.emojiIconStyle === "cursed" || ctrl.emojiStyle === "cursed-weird";
    const styleDesc = isCursed ? "cursed/weird" : "popular/basic";
    instructions.push(
      `- EMOJI ICONS: Include ${ctrl.emojiCount} original ${styleDesc} emoji-like sticker icons as decorative elements (NOT official platform emoji)`
    );
  }

  // BACKGROUND
  if (ctrl.backgroundMode !== "auto") {
    const bgMap: Record<string, string> = {
      "clean-gradient": "Clean gradient background, no distractions",
      "studio-desk": "Professional studio or desk environment",
      "scene-environment": "Contextual scene environment with depth",
      "abstract-texture": "Abstract textured background, artistic",
    };
    instructions.push(
      `- BACKGROUND: ${bgMap[ctrl.backgroundMode] || ctrl.backgroundMode}`
    );
  }

  // ENVIRONMENT THEME
  if (ctrl.environmentTheme !== "auto") {
    const themeMap: Record<string, string> = {
      "tech-workspace": "tech workspace, monitors, clean desk, modern setup",
      "gaming-setup": "gaming setup, RGB lights, gaming peripherals",
      "finance-chart-room": "finance environment, charts, graphs, professional",
      "classroom-whiteboard":
        "educational setting, whiteboard, learning environment",
      "outdoor-adventure": "outdoor adventure setting, nature, exploration",
      "dark-moody": "dark moody atmosphere, shadows, mysterious",
      "bright-playful": "bright playful environment, colorful, energetic",
    };
    instructions.push(
      `- ENVIRONMENT: ${
        themeMap[ctrl.environmentTheme] || ctrl.environmentTheme
      }`
    );
  }

  // LIGHTING
  if (ctrl.lightingStyle !== "auto") {
    const lightMap: Record<string, string> = {
      flat: "flat even lighting",
      dramatic: "dramatic cinematic lighting, rim light, strong shadows",
      neon: "neon lighting, vibrant glows, cyberpunk aesthetic",
      "soft-studio": "soft studio lighting, professional, even",
    };
    instructions.push(
      `- LIGHTING: ${lightMap[ctrl.lightingStyle] || ctrl.lightingStyle}`
    );
  }

  // COLOR PALETTE
  if (ctrl.primaryColor || ctrl.accentColor) {
    instructions.push(
      `- PRIMARY COLOR: ${ctrl.primaryColor?.toUpperCase() || "auto"}`
    );
    instructions.push(
      `- ACCENT COLOR: ${ctrl.accentColor?.toUpperCase() || "auto"}`
    );
  }

  if (ctrl.contrastBoost) {
    instructions.push(`- CONTRAST: High contrast, strong color separation`);
  }

  if (ctrl.saturationBoost) {
    instructions.push(
      `- SATURATION: Boosted saturation, vibrant punchy colors`
    );
  }

  // DETAIL LEVEL
  if (ctrl.detailLevel !== "medium") {
    const detailMap: Record<string, string> = {
      minimal: "minimal detail, clean, uncluttered",
      high: "rich detail, layered, complex",
    };
    instructions.push(
      `- DETAIL: ${detailMap[ctrl.detailLevel] || ctrl.detailLevel}`
    );
  }

  // STYLE INSPIRATIONS
  if (ctrl.inspirationsText) {
    const sanitized = sanitizeInspirationText(ctrl.inspirationsText);
    if (sanitized) {
      instructions.push(
        `- STYLE INSPIRATION: "${sanitized}" (interpret as mood/vibe only, do NOT copy IP)`
      );
    }
  }

  // UNCANNY VALLEY
  if (ctrl.avoidUncanny) {
    instructions.push(
      `- QUALITY: Avoid uncanny valley. Clean consistent style, no mixed realism.`
    );
  }

  // Default if no specific instructions
  if (instructions.length === 0) {
    instructions.push(
      `- Use defaults: appropriate subject for topic, BOGY colors, clean composition`
    );
  }

  return instructions.join("\n");
}

// ============================================
// USER PROMPT BUILDER
// ============================================

function buildUserPrompt(
  input: ThumbnailJobInput,
  count: number,
  controls?: GenerationControls
): string {
  const { title, description, topic, audience, style = "Bold" } = input;
  const ctrl = controls ?? getDefaultControls();

  // Build controls-specific instructions
  const controlsInstructions = buildControlsInstructions(ctrl);

  // Get style-specific emphasis for the LLM
  const styleEmphasis =
    ctrl.memeStyle !== "off"
      ? `\n\nCRITICAL: The user has selected "${ctrl.memeStyle}" style. The basePrompt MUST describe this style explicitly. Do NOT use generic "bold modern thumbnail" language - that will produce the WRONG output.`
      : "";

  return `Generate exactly ${count} CONCEPT PLANS for this video:

VIDEO TITLE: "${title}"
${description ? `VIDEO DESCRIPTION: ${description}` : ""}
${topic ? `TOPIC/NICHE: ${topic}` : ""}
${audience ? `TARGET AUDIENCE: ${audience}` : ""}
STYLE PREFERENCE: ${style}
${styleEmphasis}

USER CONTROLS (MANDATORY - follow these exactly):
${controlsInstructions}

=== CRITICAL: FULL SCENES WITH PROPS (NOT JUST FACES) ===
The basePrompt MUST describe a COMPLETE SCENE, not just a face close-up.
Every plan MUST include:
- A SHOT TYPE: "wide shot", "medium shot", "three-quarter body", "over-the-shoulder" - VARY these across plans
- An ENVIRONMENT: office, studio, outdoor, gaming setup, gym, kitchen, etc.
- 1-2 PROPS: items related to the video topic (cash, monitors, trophies, books, equipment)
- The SUBJECT with expression and pose (body visible, not just face)

BAD: "Close-up of shocked face, blue background" - TOO SIMPLE
GOOD: "Wide shot of entrepreneur at desk surrounded by stacks of cash, laptop showing green graphs, dramatic side lighting, excited expression, three-quarter body visible with arms behind back"

=== ABSOLUTELY NO HANDS (CRITICAL) ===
AI CANNOT generate hands correctly. ALWAYS include these EXACT phrases:
- "arms cropped above the wrists, hands completely not visible in frame"
- "close-up framing that excludes hands entirely"
- "hands hidden behind object/desk, wrists not visible"
The subject can gesture but hands must be cropped out or hidden.

=== ABSOLUTELY NO TEXT IN IMAGE (CRITICAL) ===
AI generates gibberish text. The image MUST be completely text-free.
End EVERY basePrompt with: "absolutely no text, no words, no letters, no numbers, no writing, no captions, no watermarks, no logos, no signs, no labels anywhere in the image"

=== EYES AND FACE (CRITICAL) ===
Always specify: "symmetrical eyes with matching pupils, both eyes clearly visible with identical iris color, natural facial proportions"

=== TOPIC-SPECIFIC PROPS ===
For "mistakes"/"failing"/"killing growth": broken analytics graph, red downward arrow, cracked play button, warning triangle
For "money"/"income"/"revenue": stacks of cash, gold coins, green revenue chart trending up
For "tech"/"coding": glowing abstract color blocks (NOT code), server rack with LEDs
For "success"/"growth": trophy, rocket launching, green upward graph

=== REQUIREMENTS ===
1. Generate exactly ${count} plans using DIFFERENT conceptIds from: ${CONCEPT_IDS.slice(
    0,
    10
  ).join(", ")}

2. SHOT TYPE VARIETY (distribute across plans - DO NOT make all close-ups):
   - At least 1-2 WIDE SHOTS (full/3/4 body with rich environment)
   - At least 1-2 MEDIUM SHOTS (waist-up with desk/props visible)
   - At least 1 SPLIT COMPOSITION (subject on one side, big prop/symbol on other)
   - AVOID: All plans being just close-up face shots

3. HOOK TEXT: 2-5 punchy words transforming the title into emotion triggers

4. BASE PROMPT (MUST BE VERBOSE - 4-5 sentences, DESCRIBE FULL SCENE):
   - Shot type + environment: "Wide shot of modern office..." or "Medium shot at gaming setup..."
   - Props in scene: "Stacks of cash on desk, glowing monitors, trophy shelf..."
   - Subject with body: "Three-quarter body visible, arms behind back, excited expression..."
   - Lighting/style: "Dramatic rim lighting, cinematic blue and orange tones..."
   - End with no-text clause

5. NEGATIVE PROMPT: Include hands, text, faces artifacts

6. PALETTE: Use BOGY colors (Blue, Orange, Green, Yellow)

Return ONLY valid JSON: { "plans": [ ... ${count} plans ... ] }`;
}

// ============================================
// PLAN GENERATION
// ============================================

/**
 * Generate concept plans using LLM.
 * Accepts optional GenerationControls for user preferences.
 */
export async function generateConceptPlans(
  input: ThumbnailJobInput,
  count: number = 12,
  controls?: GenerationControls
): Promise<ConceptPlan[]> {
  try {
    const ctrl = controls ?? getDefaultControls();

    console.log(`[llmPlanner] Generating ${count} plans with controls:`, {
      subjectType: ctrl.subjectType,
      includePerson: ctrl.includePerson,
      visualStyle: ctrl.visualStyle,
      memeStyle: ctrl.memeStyle,
      memeIntensity: ctrl.memeIntensity,
      characterGender: ctrl.characterGender,
      avoidScreens: ctrl.avoidScreens,
    });
    const userPrompt = buildUserPrompt(input, count, controls);
    console.log(`[llmPlanner] ========== FULL USER PROMPT ==========`);
    console.log(`[llmPlanner] ${userPrompt}`);
    console.log(`[llmPlanner] ==================================`);
    console.log(`[llmPlanner] ========== FULL SYSTEM PROMPT ==========`);
    console.log(`[llmPlanner] ${SYSTEM_PROMPT}`);
    console.log(`[llmPlanner] ==================================`);

    const response = await callLLM(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      {
        model: "gpt-4o-mini",
        temperature: 0.9, // High for variety
        maxTokens: 6000,
        responseFormat: "json_object",
      }
    );

    console.log(`[llmPlanner] ========== FULL RESPONSE ==========`);
    console.log(`[llmPlanner] ${response.content}`);
    console.log(`[llmPlanner] ==================================`);

    // Parse response
    const parsed = JSON.parse(response.content);

    if (!Array.isArray(parsed.plans)) {
      console.error("[llmPlanner] Invalid response structure:", parsed);
      throw new Error(
        "LLM returned invalid response structure - no plans array"
      );
    }

    console.log(
      `[llmPlanner] Received ${parsed.plans.length} raw plans from LLM`
    );

    // Apply guardrails to each plan
    const guardrailedPlans = parsed.plans.map(
      (rawPlan: Record<string, unknown>) =>
        applyGuardrails(rawPlan, input, ctrl)
    );

    // Validate and repair plans using the new validator
    const validatedPlans = validateAndRepairPlans(guardrailedPlans);

    console.log(
      `[llmPlanner] ${validatedPlans.length} plans passed validation`
    );

    if (validatedPlans.length === 0) {
      throw new Error(
        "LLM failed to generate any valid plans after repair attempts"
      );
    }

    // Convert to ConceptPlan type and slice to requested count
    const plans: ConceptPlan[] = validatedPlans.map((vp) => ({
      ...vp,
      // Ensure all required ConceptPlan fields are present
      overlayDirectives: vp.overlayDirectives ?? {
        badges: [],
        highlights: [],
        bigSymbol: "NONE",
      },
    })) as ConceptPlan[];

    return plans.slice(0, count);
  } catch (err) {
    console.error("[llmPlanner] LLM call failed:", err);
    throw err; // Propagate error - no fallbacks
  }
}

// ============================================
// GUARDRAILS (Post-LLM Processing)
// ============================================

/**
 * Apply deterministic guardrails to LLM output.
 * V2: Also enforces style consistency.
 */
// Comprehensive anti-artifact negative prompt terms
const ANTI_ARTIFACT_NEGATIVES = [
  // Text/writing (CRITICAL)
  "text",
  "words",
  "letters",
  "numbers",
  "writing",
  "caption",
  "watermark",
  "logo",
  "sign",
  "label",
  "gibberish text",
  "random letters",
  "symbols",
  "UI text",
  "readable text",
  "pseudo-text",
  "fake text",
  // Hands (CRITICAL)
  "hands",
  "fingers",
  "visible hands",
  "visible fingers",
  "hand in frame",
  "wrist",
  "palm",
  "thumbs",
  "fingernails",
  // Face/eyes (CRITICAL)
  "asymmetrical eyes",
  "missing pupil",
  "extra teeth",
  "melted face",
  "distorted features",
  "uncanny valley",
  "crossed eyes",
  "lazy eye",
  "deformed face",
  "plastic skin",
  "wax figure",
  // Screen/tech artifacts
  "floating screen",
  "detached screen",
  "backwards laptop",
  "sideways laptop",
  "extra keyboard",
  "duplicate monitor",
  "multiple screens",
  "fake UI",
  "UI elements",
  // Anatomy
  "extra limbs",
  "extra fingers",
  "duplicate objects",
  "deformed",
  "mutated",
  // Quality
  "blurry",
  "low quality",
  "jpeg artifacts",
  "pixelated",
  // Brands
  "brands",
  "signatures",
  "copyright",
].join(", ");

/**
 * Apply guardrails to LLM output.
 * Validates structure and enforces anti-artifact constraints.
 */
function applyGuardrails(
  rawPlan: Record<string, unknown>,
  input: ThumbnailJobInput,
  ctrl: GenerationControls
): Record<string, unknown> {
  void input;
  void ctrl;
  const plan = { ...rawPlan };

  // 1. Validate conceptId (required field)
  if (!plan.conceptId || !isValidConceptId(plan.conceptId as string)) {
    plan.conceptId = "clean-hero";
  }

  // 2. Ensure basePrompt has safety suffix (no text/watermarks)
  if (typeof plan.basePrompt === "string") {
    plan.basePrompt = ensurePromptSafety(plan.basePrompt);

    // 2a. If basePrompt mentions laptop/screen, ensure physical plausibility
    const lowerPrompt = (plan.basePrompt as string).toLowerCase();
    if (
      lowerPrompt.includes("laptop") ||
      lowerPrompt.includes("screen") ||
      lowerPrompt.includes("monitor")
    ) {
      // Check if it has correct orientation language
      if (
        !lowerPrompt.includes("front-facing") &&
        !lowerPrompt.includes("correct hinge")
      ) {
        // Inject physical plausibility
        plan.basePrompt = (plan.basePrompt as string).replace(
          /laptop|screen|monitor/i,
          (match) =>
            `front-facing ${match} with correct hinge orientation, abstract color blocks on display`
        );
      }
      // Ensure no readable text on screens
      if (
        !lowerPrompt.includes("abstract color") &&
        !lowerPrompt.includes("solid color")
      ) {
        plan.basePrompt = (plan.basePrompt as string).replace(
          /on (?:the )?screen|on (?:the )?display|showing/gi,
          "showing abstract color blocks"
        );
      }
    }
  }

  // 3. Ensure negativePrompt includes anti-artifact terms
  if (!plan.negativePrompt || typeof plan.negativePrompt !== "string") {
    plan.negativePrompt = ANTI_ARTIFACT_NEGATIVES;
  } else {
    // Merge with existing negative prompt
    const existing = plan.negativePrompt as string;
    const existingTerms = new Set(existing.toLowerCase().split(/,\s*/));
    const missingTerms = ANTI_ARTIFACT_NEGATIVES.split(", ").filter(
      (term) => !existingTerms.has(term.toLowerCase())
    );
    if (missingTerms.length > 0) {
      plan.negativePrompt = `${existing}, ${missingTerms.join(", ")}`;
    }
  }

  // 4. Ensure composition structure if missing
  if (!plan.composition || typeof plan.composition !== "object") {
    const concept = getConcept(plan.conceptId as ConceptId);
    plan.composition = {
      textSafeArea: concept.overlayStyle.textSafeArea,
      focalSubjectPosition: concept.constraints.focalPosition,
      backgroundComplexity: concept.constraints.backgroundComplexity,
    };
  }

  // 5. Ensure overlayDirectives structure if missing
  if (!plan.overlayDirectives || typeof plan.overlayDirectives !== "object") {
    plan.overlayDirectives = {
      badges: [],
      highlights: [],
      bigSymbol: "NONE",
    };
  }

  // 6. hookText - trust the LLM, don't truncate

  return plan;
}

// ============================================
// HOOK REGENERATION (LLM-only, no image)
// ============================================

/**
 * Regenerate just the hook text for a plan.
 * TRUST THE LLM - use its output directly.
 */
export async function regenerateHook(
  plan: ConceptPlan,
  input: ThumbnailJobInput
): Promise<string> {
  const response = await callLLM(
    [
      {
        role: "system",
        content: `You rewrite video titles into short, punchy thumbnail hooks.
Rules:
- Output ONLY 2-5 words
- Max 28 characters
- Create curiosity or state benefit clearly
- Do NOT just shorten the title
Output format: Just the hook text, nothing else.`,
      },
      {
        role: "user",
        content: `Current hook: "${plan.hookText}"
Original title: "${input.title}"
Concept: ${plan.conceptId}

Generate a NEW, different hook that creates more curiosity:`,
      },
    ],
    {
      model: "gpt-4o-mini",
      temperature: 0.95,
      maxTokens: 50,
    }
  );

  // Trust the LLM response - just trim and return
  return response.content.trim().slice(0, 28);
}

// ============================================
// LEGACY ALIAS
// ============================================

/** @deprecated Use generateConceptPlans */
export const generateThumbnailPlans = generateConceptPlans;

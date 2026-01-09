/**
 * Meme Reference Library
 *
 * Catalog of meme images that users can select as style references
 * for the image generator. When selected, these are passed to the
 * model as reference images to guide the generation style.
 */

export interface MemeReference {
  /** Unique ID */
  id: string;
  /** Display label */
  label: string;
  /** Short description */
  description: string;
  /** Path to image (relative to /public) */
  imagePath: string;
  /** Category for grouping */
  category: "rage-comic" | "reaction" | "wojak" | "cursed" | "deep-fried" | "other";
  /** Tags for filtering */
  tags: string[];
}

/**
 * All available meme reference images from /public/memes/
 */
export const MEME_REFERENCES: MemeReference[] = [
  {
    id: "rage-face-1",
    label: "Rage Face",
    description: "Classic rage comic face expression",
    imagePath:
      "/memes/internet-meme-face-rage-comic-meme-thumbnail-removebg-preview.png",
    category: "rage-comic",
    tags: ["rage", "angry", "expression"],
  },
  {
    id: "rage-genius",
    label: "Genius Rage",
    description: "Smug genius expression",
    imagePath:
      "/memes/internet-meme-rage-comic-know-your-meme-genius-meme-thumbnail.jpg",
    category: "rage-comic",
    tags: ["genius", "smug", "smart"],
  },
  {
    id: "rage-pol",
    label: "Rage Comic Style",
    description: "Classic rage comic aesthetic",
    imagePath: "/memes/internet-meme-rage-comic-pol-antifa-meme-thumbnail.jpg",
    category: "rage-comic",
    tags: ["rage", "comic", "classic"],
  },
  {
    id: "rage-lol",
    label: "LOL Rage",
    description: "Laughing rage comic face",
    imagePath:
      "/memes/league-of-legends-internet-meme-rage-comic-lol-chimichanga-thumbnail.jpg",
    category: "rage-comic",
    tags: ["lol", "laughing", "funny"],
  },
  {
    id: "trollface-drawing",
    label: "Trollface Drawing",
    description: "Classic trollface line art",
    imagePath:
      "/memes/rage-comic-drawing-internet-meme-trollface-face-thumbnail.jpg",
    category: "rage-comic",
    tags: ["troll", "mischievous", "grin"],
  },
  {
    id: "rage-crying",
    label: "Crying Rage",
    description: "Crying angry expression",
    imagePath:
      "/memes/rage-comic-internet-meme-anger-crying-meme-thumbnail.jpg",
    category: "rage-comic",
    tags: ["crying", "angry", "upset"],
  },
  {
    id: "rage-decal",
    label: "Rage Decal",
    description: "Sticker-style rage face",
    imagePath:
      "/memes/rage-comic-internet-meme-decal-sticker-meme-thumbnail.jpg",
    category: "rage-comic",
    tags: ["sticker", "decal", "clean"],
  },
  {
    id: "rage-crying-2",
    label: "Crying Drawing",
    description: "Hand-drawn crying face",
    imagePath:
      "/memes/rage-comic-internet-meme-drawing-crying-meme-thumbnail.jpg",
    category: "rage-comic",
    tags: ["crying", "sad", "drawn"],
  },
  {
    id: "rage-youtube",
    label: "YouTube Rage",
    description: "Rage face YouTube style",
    imagePath: "/memes/rage-comic-internet-meme-youtube-meme-thumbnail.jpg",
    category: "rage-comic",
    tags: ["youtube", "video", "reaction"],
  },
  {
    id: "trollface-troll",
    label: "Internet Troll",
    description: "Classic trollface expression",
    imagePath:
      "/memes/rage-comic-internet-troll-trollface-comics-drawing-meme-thumbnail.jpg",
    category: "rage-comic",
    tags: ["troll", "trollface", "classic"],
  },
  {
    id: "trollface-anger",
    label: "Angry Troll",
    description: "Angry trollface variant",
    imagePath:
      "/memes/rage-comic-trollface-anger-internet-meme-meme-thumbnail.jpg",
    category: "rage-comic",
    tags: ["angry", "troll", "rage"],
  },
  {
    id: "trollface-image",
    label: "Trollface Image",
    description: "High contrast trollface",
    imagePath:
      "/memes/rage-comic-trollface-internet-meme-image-meme-thumbnail.jpg",
    category: "rage-comic",
    tags: ["troll", "contrast", "bold"],
  },
  {
    id: "trollface-meme",
    label: "Trollface Meme",
    description: "Standard trollface meme",
    imagePath:
      "/memes/rage-comic-trollface-internet-meme-internet-troll-meme-thumbnail.jpg",
    category: "rage-comic",
    tags: ["troll", "meme", "standard"],
  },
  {
    id: "trollface-classic",
    label: "Classic Trollface",
    description: "Original trollface design",
    imagePath: "/memes/rage-comic-trollface-internet-meme-meme-thumbnail.jpg",
    category: "rage-comic",
    tags: ["troll", "classic", "original"],
  },
  {
    id: "trollface-comics",
    label: "Comics Trollface",
    description: "Comic book style trollface",
    imagePath:
      "/memes/rage-comic-trollface-internet-troll-comics-meme-thumbnail.jpg",
    category: "rage-comic",
    tags: ["troll", "comics", "style"],
  },
  {
    id: "trollface-full",
    label: "Full Trollface",
    description: "Complete trollface design",
    imagePath:
      "/memes/trollface-rage-comic-internet-troll-internet-meme-comics-trollface-thumbnail.jpg",
    category: "rage-comic",
    tags: ["troll", "full", "complete"],
  },
];

/**
 * Get meme references by category
 */
export function getMemesByCategory(category: MemeReference["category"]): MemeReference[] {
  return MEME_REFERENCES.filter((m) => m.category === category);
}

/**
 * Get a meme reference by ID
 */
export function getMemeById(id: string): MemeReference | undefined {
  return MEME_REFERENCES.find((m) => m.id === id);
}

/**
 * Get all unique categories
 */
export function getMemeCategories(): MemeReference["category"][] {
  return [...new Set(MEME_REFERENCES.map((m) => m.category))];
}

/**
 * Search memes by tags
 */
export function searchMemes(query: string): MemeReference[] {
  const lowerQuery = query.toLowerCase();
  return MEME_REFERENCES.filter(
    (m) =>
      m.label.toLowerCase().includes(lowerQuery) ||
      m.description.toLowerCase().includes(lowerQuery) ||
      m.tags.some((t) => t.includes(lowerQuery))
  );
}

/**
 * Generate a prompt style instruction from a meme reference.
 * This is used when we can't pass an actual reference image to the model.
 */
export function getMemeStylePrompt(memeId: string): string {
  const meme = getMemeById(memeId);
  if (!meme) return "";

  // Category-specific style descriptions
  const categoryStyles: Record<MemeReference["category"], string> = {
    "rage-comic": 
      "STYLE REFERENCE: Classic internet rage comic webcomic style. " +
      "Black and white line art with thick, crude, hand-drawn ink outlines. " +
      "Simple MS Paint aesthetic, 2D flat drawing, high contrast, " +
      "exaggerated facial expressions, minimal background detail, " +
      "comedic webcomic panel look from early 2010s internet culture. " +
      "DO NOT use photorealistic rendering - keep it crude and sketchy.",
    "reaction": 
      "STYLE REFERENCE: Bold sticker-cutout reaction face style. " +
      "High saturation colors, thick white outline like a cut-out sticker, " +
      "clean simple shapes, expressive cartoon face, pop art influence. " +
      "Modern meme reaction image aesthetic.",
    "wojak": 
      "STYLE REFERENCE: Minimalist line art portrait style. " +
      "Simple thin black lines on white/beige background, " +
      "minimal shading, bald head, expressive but simple features, " +
      "melancholic or ironic mood, feels-guy aesthetic. " +
      "Very simple 2D line drawing, NOT photorealistic.",
    "cursed": 
      "STYLE REFERENCE: Surreal cursed meme aesthetic. " +
      "Dreamlike, slightly unsettling, unexpected object combinations, " +
      "off-putting but funny, internet absurdist humor, " +
      "something slightly wrong about proportions or context.",
    "deep-fried": 
      "STYLE REFERENCE: Deep-fried meme aesthetic. " +
      "Extreme over-saturation, heavy contrast, posterized colors, " +
      "jpeg artifact look, lens flares, red/orange tint, " +
      "deliberately low quality compression look, emoji overlays.",
    "other": 
      "STYLE REFERENCE: Internet meme aesthetic. " +
      "Bold, high contrast, eye-catching, internet culture inspired.",
  };

  // Tag-specific additions
  const tagAdditions: Record<string, string> = {
    "troll": "mischievous wide grin expression, scheming look, knowing smirk",
    "angry": "extreme anger, frustration, rage, furrowed brows, clenched teeth",
    "crying": "tears, emotional distress, dramatic sadness",
    "laughing": "uncontrollable laughter, tears of joy, wide open mouth",
    "smug": "self-satisfied expression, raised eyebrow, knowing look",
    "shocked": "wide eyes, dropped jaw, disbelief expression",
  };

  let prompt = categoryStyles[meme.category] || categoryStyles.other;

  // Add tag-specific details
  for (const tag of meme.tags) {
    if (tagAdditions[tag]) {
      prompt += ` Expression: ${tagAdditions[tag]}.`;
      break; // Only add one expression modifier
    }
  }

  return prompt;
}

/**
 * Check if a style reference is set and get the prompt addition
 */
export function getStyleReferencePromptAddition(
  styleReferenceId?: string
): string {
  if (!styleReferenceId) return "";
  return getMemeStylePrompt(styleReferenceId);
}

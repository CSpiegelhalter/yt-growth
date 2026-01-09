/**
 * SEO Audit Module
 *
 * Provides deterministic, explainable SEO analysis for YouTube videos.
 * Based on proven YouTube SEO best practices.
 */

// ============================================
// Types
// ============================================

export type SeoAuditInput = {
  title: string;
  description: string;
  tags: string[];
  thumbnails?: Record<
    string,
    { url: string; width?: number; height?: number }
  >;
  categoryId?: string;
  publishedAt?: string;
  caption?: "true" | "false" | boolean | string;
};

export type QuickFixAction =
  | "generate_title"
  | "generate_description"
  | "generate_tags"
  | "generate_chapters"
  | "open_thumbnail"
  | "learn_more";

export type SeoCheckStatus = "strong" | "needs_work" | "missing";

export type SeoCheck = {
  id: string;
  label: string;
  status: SeoCheckStatus;
  evidence?: string;
  whyItMatters?: string;
  recommendation: string;
  quickFix?: {
    label: string;
    action: QuickFixAction;
    payload?: Record<string, unknown>;
  };
};

export type FocusKeywordConfidence = "high" | "med" | "low";

export type SeoAuditResult = {
  focusKeyword: {
    value: string | null;
    confidence: FocusKeywordConfidence;
    candidates: string[];
  };
  summary: string;
  priorityFixes: SeoCheck[];
  checks: SeoCheck[];
};

// ============================================
// Constants
// ============================================

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "have",
  "he",
  "her",
  "his",
  "how",
  "i",
  "in",
  "is",
  "it",
  "its",
  "me",
  "my",
  "of",
  "on",
  "or",
  "our",
  "she",
  "so",
  "that",
  "the",
  "their",
  "them",
  "they",
  "this",
  "to",
  "us",
  "was",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "who",
  "will",
  "with",
  "you",
  "your",
]);

const TITLE_MAX_CHARS = 60;
const TITLE_MIN_WORDS = 4;
const TITLE_MAX_WORDS = 10;
const EARLY_PLACEMENT_CHARS = 35;
const EARLY_PLACEMENT_WORDS = 3;
const DESCRIPTION_EARLY_CHARS = 200;
const DESCRIPTION_MIN_WORDS = 120;
const THUMBNAIL_MIN_WIDTH = 640;
const THUMBNAIL_RECOMMENDED_WIDTH = 1280;
const THUMBNAIL_RECOMMENDED_HEIGHT = 720;
const MIN_HD_HEIGHT = 360;
const HASHTAG_OPTIMAL_MIN = 1;
const HASHTAG_OPTIMAL_MAX = 3;
const MIN_CHAPTERS = 3;
const REFRESH_THRESHOLD_DAYS = 180; // 6 months

// ============================================
// Utility Functions
// ============================================

/**
 * Normalize text for comparison: lowercase, strip punctuation
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();
}

/**
 * Extract n-grams (2-5 words) from text, filtering stop words
 */
function extractNGrams(text: string, minN = 2, maxN = 5): string[] {
  const words = normalizeText(text)
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STOP_WORDS.has(w));

  const ngrams: string[] = [];

  for (let n = minN; n <= maxN; n++) {
    for (let i = 0; i <= words.length - n; i++) {
      const ngram = words.slice(i, i + n).join(" ");
      if (ngram.length > 0) {
        ngrams.push(ngram);
      }
    }
  }

  return ngrams;
}

/**
 * Check if a keyword appears in text (normalized comparison)
 */
function containsKeyword(text: string, keyword: string): boolean {
  const normalizedText = normalizeText(text);
  const normalizedKeyword = normalizeText(keyword);
  return normalizedText.includes(normalizedKeyword);
}

/**
 * Check if keyword appears early in text (first N characters)
 */
function isKeywordEarly(
  text: string,
  keyword: string,
  charLimit: number
): boolean {
  const earlyText = text.slice(0, charLimit);
  return containsKeyword(earlyText, keyword);
}

/**
 * Check if keyword appears in first N words
 */
function isKeywordInFirstWords(
  text: string,
  keyword: string,
  wordLimit: number
): boolean {
  const words = text.split(/\s+/).slice(0, wordLimit).join(" ");
  return containsKeyword(words, keyword);
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Extract hashtags from text
 */
function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\p{L}\p{N}_]+/gu);
  return matches || [];
}

/**
 * Detect chapter timestamps in description
 */
function detectChapters(description: string): number {
  const lines = description.split("\n");
  let chapterCount = 0;

  // Match patterns like "00:00" or "1:23:45" at start of line, optionally followed by dash/space and text
  const timestampRegex = /^(\d{1,2}:)?(\d{1,2}):(\d{2})(\s*[-–]\s*.+)?$/;
  // Also match timestamps embedded in lines
  const inlineTimestampRegex = /(\d{1,2}:)?(\d{1,2}):(\d{2})/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (timestampRegex.test(trimmed)) {
      chapterCount++;
    } else if (inlineTimestampRegex.test(trimmed) && trimmed.length < 100) {
      // Line contains a timestamp and is reasonably short (likely a chapter)
      chapterCount++;
    }
  }

  return chapterCount;
}

/**
 * Check if description has structural elements (headers, bullets, sections)
 */
function hasDescriptionStructure(description: string): boolean {
  const lines = description.split("\n");

  // Check for bullet points
  const hasBullets = lines.some((line) =>
    /^\s*[-•*]\s+/.test(line)
  );

  // Check for headers (ALL CAPS lines or lines ending with :)
  const hasHeaders = lines.some(
    (line) =>
      /^[A-Z][A-Z\s]+:?\s*$/.test(line.trim()) ||
      /^.{3,30}:\s*$/.test(line.trim())
  );

  // Check for numbered lists
  const hasNumberedLists = lines.some((line) =>
    /^\s*\d+[.)]\s+/.test(line)
  );

  // Check for timestamps (chapters)
  const hasTimestamps = detectChapters(description) > 0;

  return hasBullets || hasHeaders || hasNumberedLists || hasTimestamps;
}

/**
 * Get best available thumbnail
 */
function getBestThumbnail(
  thumbnails?: Record<string, { url: string; width?: number; height?: number }>
): { url: string; width?: number; height?: number } | null {
  if (!thumbnails) return null;

  // Priority order: maxres > standard > high > medium > default
  const priority = ["maxres", "standard", "high", "medium", "default"];

  for (const key of priority) {
    if (thumbnails[key]) {
      return thumbnails[key];
    }
  }

  // Return first available if none match priority
  const keys = Object.keys(thumbnails);
  return keys.length > 0 ? thumbnails[keys[0]] : null;
}

/**
 * Parse caption field to boolean
 */
function hasCaptions(caption?: "true" | "false" | boolean | string): boolean | null {
  if (caption === undefined || caption === null) return null;
  if (typeof caption === "boolean") return caption;
  if (caption === "true") return true;
  if (caption === "false") return false;
  return null;
}

/**
 * Calculate days since published
 */
function daysSincePublished(publishedAt?: string): number | null {
  if (!publishedAt) return null;
  const published = new Date(publishedAt);
  const now = new Date();
  const diffMs = now.getTime() - published.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// ============================================
// Focus Keyword Detection
// ============================================

type KeywordCandidate = {
  keyword: string;
  score: number;
  inTitle: boolean;
  inEarlyDescription: boolean;
  inTags: boolean;
};

/**
 * Detect the focus keyword from video metadata
 */
function detectFocusKeyword(input: SeoAuditInput): {
  value: string | null;
  confidence: FocusKeywordConfidence;
  candidates: string[];
} {
  const { title, description, tags } = input;
  const earlyDescription = description.slice(0, DESCRIPTION_EARLY_CHARS);

  // Build candidates from multiple sources
  const candidateSet = new Set<string>();

  // From title: 2-5 word n-grams
  const titleNGrams = extractNGrams(title, 2, 5);
  titleNGrams.forEach((ng) => candidateSet.add(ng));

  // From tags (as-is, normalized)
  tags.forEach((tag) => {
    const normalized = normalizeText(tag);
    if (normalized.length > 0) {
      candidateSet.add(normalized);
    }
  });

  // From early description: 2-3 word n-grams
  const descNGrams = extractNGrams(earlyDescription, 2, 3);
  descNGrams.forEach((ng) => candidateSet.add(ng));

  // Score each candidate
  const scoredCandidates: KeywordCandidate[] = [];

  for (const keyword of candidateSet) {
    const inTitle = containsKeyword(title, keyword);
    const inEarlyDescription = containsKeyword(earlyDescription, keyword);
    const inTags = tags.some((tag) =>
      containsKeyword(tag, keyword)
    );

    // Score based on overlap
    let score = 0;
    if (inTitle) score += 3; // Title is most important
    if (inEarlyDescription) score += 2;
    if (inTags) score += 1;

    // Prefer longer, more specific keywords
    const wordCount = keyword.split(" ").length;
    if (wordCount >= 2) score += 0.5;
    if (wordCount >= 3) score += 0.5;

    scoredCandidates.push({
      keyword,
      score,
      inTitle,
      inEarlyDescription,
      inTags,
    });
  }

  // Sort by score descending
  scoredCandidates.sort((a, b) => b.score - a.score);

  // Get top 5 candidates
  const topCandidates = scoredCandidates.slice(0, 5);

  if (topCandidates.length === 0) {
    return { value: null, confidence: "low", candidates: [] };
  }

  const best = topCandidates[0];

  // Determine confidence
  let confidence: FocusKeywordConfidence;
  if (best.inTitle && (best.inTags || best.inEarlyDescription)) {
    confidence = "high";
  } else if (best.inTitle) {
    confidence = "med";
  } else {
    confidence = "low";
  }

  return {
    value: best.keyword,
    confidence,
    candidates: topCandidates.map((c) => c.keyword),
  };
}

// ============================================
// Individual Check Functions
// ============================================

function checkTitleKeywordPlacement(
  title: string,
  focusKeyword: string | null
): SeoCheck {
  const id = "title_keyword_placement";
  const label = "Title keyword placement";

  if (!focusKeyword) {
    return {
      id,
      label,
      status: "needs_work",
      evidence: "No focus keyword detected",
      whyItMatters:
        "Keywords in the title help YouTube understand your content and show it to the right viewers.",
      recommendation:
        "Add a clear target keyword to your title that describes what the video is about.",
      quickFix: {
        label: "Generate title variants",
        action: "generate_title",
      },
    };
  }

  const isEarlyByChars = isKeywordEarly(title, focusKeyword, EARLY_PLACEMENT_CHARS);
  const isEarlyByWords = isKeywordInFirstWords(title, focusKeyword, EARLY_PLACEMENT_WORDS);

  if (isEarlyByChars || isEarlyByWords) {
    return {
      id,
      label,
      status: "strong",
      evidence: `"${focusKeyword}" appears early in the title`,
      whyItMatters:
        "Front-loading keywords improves visibility in search results.",
      recommendation: "Keep using this approach for future videos.",
    };
  }

  const inTitle = containsKeyword(title, focusKeyword);
  if (inTitle) {
    return {
      id,
      label,
      status: "needs_work",
      evidence: `"${focusKeyword}" is in the title but not near the beginning`,
      whyItMatters:
        "Keywords closer to the start of the title have more weight in search.",
      recommendation: `Move "${focusKeyword}" toward the start of the title while keeping it readable.`,
      quickFix: {
        label: "Generate title variants",
        action: "generate_title",
        payload: { focusKeyword },
      },
    };
  }

  return {
    id,
    label,
    status: "needs_work",
    evidence: `"${focusKeyword}" not found in title`,
    whyItMatters:
      "Including your target keyword in the title helps YouTube match your video to search queries.",
    recommendation: `Include "${focusKeyword}" naturally in your title.`,
    quickFix: {
      label: "Generate title variants",
      action: "generate_title",
      payload: { focusKeyword },
    },
  };
}

function checkTitleLength(title: string): SeoCheck {
  const id = "title_length";
  const label = "Title length";
  const charCount = title.length;
  const wordCount = countWords(title);

  const evidence = `Title is ${charCount} characters, ${wordCount} words`;

  if (
    charCount <= TITLE_MAX_CHARS &&
    wordCount >= TITLE_MIN_WORDS &&
    wordCount <= TITLE_MAX_WORDS
  ) {
    return {
      id,
      label,
      status: "strong",
      evidence,
      whyItMatters:
        "Titles under 60 characters display fully in search results.",
      recommendation: "Good length. Keep titles concise and descriptive.",
    };
  }

  if (charCount > TITLE_MAX_CHARS) {
    return {
      id,
      label,
      status: "needs_work",
      evidence: `${evidence} - truncates in search (max ${TITLE_MAX_CHARS})`,
      whyItMatters:
        "Long titles get cut off in search results, hiding important information.",
      recommendation: `Shorten to under ${TITLE_MAX_CHARS} characters. Keep the most important words first.`,
      quickFix: {
        label: "Generate shorter titles",
        action: "generate_title",
      },
    };
  }

  if (wordCount < TITLE_MIN_WORDS) {
    return {
      id,
      label,
      status: "needs_work",
      evidence: `${evidence} - very short`,
      whyItMatters:
        "Very short titles may not provide enough context for viewers or the algorithm.",
      recommendation: `Add more descriptive words. Aim for ${TITLE_MIN_WORDS}-${TITLE_MAX_WORDS} words.`,
      quickFix: {
        label: "Generate title variants",
        action: "generate_title",
      },
    };
  }

  return {
    id,
    label,
    status: "needs_work",
    evidence,
    whyItMatters: "Title length affects how it displays in search results.",
    recommendation: `Aim for ${TITLE_MIN_WORDS}-${TITLE_MAX_WORDS} words and under ${TITLE_MAX_CHARS} characters.`,
  };
}

function checkDescriptionKeywordPlacement(
  description: string,
  focusKeyword: string | null
): SeoCheck {
  const id = "description_keyword_placement";
  const label = "Description keyword placement";

  if (!focusKeyword) {
    return {
      id,
      label,
      status: "needs_work",
      evidence: "No focus keyword detected",
      whyItMatters:
        "The first 1-2 sentences of your description appear in search results.",
      recommendation:
        "Add your target keyword naturally in the opening lines.",
      quickFix: {
        label: "Rewrite description intro",
        action: "generate_description",
      },
    };
  }

  const earlyDescription = description.slice(0, DESCRIPTION_EARLY_CHARS);
  const inEarlyDesc = containsKeyword(earlyDescription, focusKeyword);

  if (inEarlyDesc) {
    return {
      id,
      label,
      status: "strong",
      evidence: `"${focusKeyword}" appears in the first ${DESCRIPTION_EARLY_CHARS} characters`,
      whyItMatters:
        "Keywords early in the description help YouTube understand your video's topic.",
      recommendation: "Keep front-loading keywords in future descriptions.",
    };
  }

  const inFullDesc = containsKeyword(description, focusKeyword);
  if (inFullDesc) {
    return {
      id,
      label,
      status: "needs_work",
      evidence: `"${focusKeyword}" appears in description but not in the opening`,
      whyItMatters:
        "The first 1-2 sentences appear in search results and influence rankings.",
      recommendation: `Move "${focusKeyword}" to the first sentence or two.`,
      quickFix: {
        label: "Rewrite description intro",
        action: "generate_description",
        payload: { focusKeyword },
      },
    };
  }

  return {
    id,
    label,
    status: "needs_work",
    evidence: `"${focusKeyword}" not found in description`,
    whyItMatters:
      "Including your keyword in the description helps YouTube understand what your video covers.",
    recommendation: `Add "${focusKeyword}" naturally to your description, especially in the opening.`,
    quickFix: {
      label: "Rewrite description intro",
      action: "generate_description",
      payload: { focusKeyword },
    },
  };
}

function checkDescriptionDepth(description: string): SeoCheck {
  const id = "description_depth";
  const label = "Description depth";
  const wordCount = countWords(description);
  const hasStructure = hasDescriptionStructure(description);

  if (wordCount >= DESCRIPTION_MIN_WORDS || hasStructure) {
    const evidence =
      wordCount >= DESCRIPTION_MIN_WORDS
        ? `${wordCount} words with good detail`
        : `${wordCount} words with structured sections`;
    return {
      id,
      label,
      status: "strong",
      evidence,
      whyItMatters:
        "Detailed descriptions help YouTube understand your content and improve discoverability.",
      recommendation:
        "Continue providing thorough descriptions with clear structure.",
    };
  }

  return {
    id,
    label,
    status: "needs_work",
    evidence: `${wordCount} words - could be more detailed`,
    whyItMatters:
      "YouTube uses description content to understand your video and match it to searches.",
    recommendation: `Add more detail: video outline, key points, timestamps. Aim for ${DESCRIPTION_MIN_WORDS}+ words or clear sections.`,
    quickFix: {
      label: "Expand description",
      action: "generate_description",
    },
  };
}

function checkTagsCoverage(
  tags: string[],
  focusKeyword: string | null
): SeoCheck {
  const id = "tags_coverage";
  const label = "Tags coverage";

  if (tags.length === 0) {
    return {
      id,
      label,
      status: "missing",
      evidence: "No tags added",
      whyItMatters:
        "Tags help YouTube understand your video's topic and related content.",
      recommendation:
        "Add your target keyword as a tag, plus related variations and broader category terms.",
      quickFix: {
        label: "Generate tags",
        action: "generate_tags",
      },
    };
  }

  if (!focusKeyword) {
    return {
      id,
      label,
      status: "needs_work",
      evidence: `${tags.length} tags present, but no clear focus keyword detected`,
      whyItMatters:
        "Tags work best when they align with a clear target keyword.",
      recommendation:
        "Add tags that match your main topic and include related variations.",
      quickFix: {
        label: "Generate tags",
        action: "generate_tags",
      },
    };
  }

  // Check for exact or close match to focus keyword
  const normalizedFocus = normalizeText(focusKeyword);
  const focusWords = normalizedFocus.split(" ");

  const hasExactMatch = tags.some((tag) => {
    const normalizedTag = normalizeText(tag);
    return normalizedTag === normalizedFocus;
  });

  const hasCloseVariant = tags.some((tag) => {
    const normalizedTag = normalizeText(tag);
    const tagWords = normalizedTag.split(" ");
    // Close variant: contains all words from focus keyword
    return focusWords.every((fw) => tagWords.includes(fw));
  });

  // Count related tags (partial word overlap)
  const relatedTags = tags.filter((tag) => {
    const normalizedTag = normalizeText(tag);
    const tagWords = new Set(normalizedTag.split(" "));
    return focusWords.some((fw) => tagWords.has(fw));
  });

  // Check for broad category tags (single word or very short)
  const broadTags = tags.filter((tag) => {
    const wordCount = countWords(tag);
    return wordCount <= 2;
  });

  const hasFocusTag = hasExactMatch || hasCloseVariant;
  const hasEnoughRelated = relatedTags.length >= 3;
  const hasBroadTag = broadTags.length >= 1;

  if (hasFocusTag && hasEnoughRelated && hasBroadTag) {
    return {
      id,
      label,
      status: "strong",
      evidence: `${tags.length} tags including focus keyword, variations, and category tags`,
      whyItMatters:
        "Good tag coverage helps YouTube connect your video to related searches.",
      recommendation: "Well-optimized tags. Maintain this approach.",
    };
  }

  const issues: string[] = [];
  if (!hasFocusTag) issues.push("missing exact focus keyword tag");
  if (!hasEnoughRelated) issues.push("needs more related variations");
  if (!hasBroadTag) issues.push("add a broad category tag");

  return {
    id,
    label,
    status: "needs_work",
    evidence: `${tags.length} tags - ${issues.join(", ")}`,
    whyItMatters:
      "A mix of specific and broad tags helps YouTube understand and categorize your content.",
    recommendation: `Add "${focusKeyword}" as a tag, plus long-tail variations and 1-2 broader category terms.`,
    quickFix: {
      label: "Generate tags",
      action: "generate_tags",
      payload: { focusKeyword },
    },
  };
}

function checkHashtags(description: string): SeoCheck {
  const id = "hashtags";
  const label = "Hashtags in description";
  const hashtags = extractHashtags(description);
  const count = hashtags.length;

  if (count === 0) {
    return {
      id,
      label,
      status: "missing",
      evidence: "No hashtags found",
      whyItMatters:
        "Hashtags appear above your title and are clickable, helping viewers discover related content.",
      recommendation:
        "Add 2-3 relevant hashtags in your description. They'll appear above your video title.",
    };
  }

  if (count >= HASHTAG_OPTIMAL_MIN && count <= HASHTAG_OPTIMAL_MAX) {
    return {
      id,
      label,
      status: "strong",
      evidence: `${count} hashtag${count > 1 ? "s" : ""}: ${hashtags.slice(0, 3).join(", ")}`,
      whyItMatters:
        "The right number of hashtags improves discoverability without looking spammy.",
      recommendation: "Good hashtag usage. Keep it focused and relevant.",
    };
  }

  return {
    id,
    label,
    status: "needs_work",
    evidence: `${count} hashtags - more than recommended`,
    whyItMatters:
      "Too many hashtags can look spammy and YouTube may ignore them all.",
    recommendation: `Reduce to 2-3 most relevant hashtags. Current: ${hashtags.slice(0, 5).join(", ")}`,
  };
}

function checkChapters(description: string): SeoCheck {
  const id = "chapters";
  const label = "Chapters / timestamps";
  const chapterCount = detectChapters(description);

  if (chapterCount === 0) {
    return {
      id,
      label,
      status: "missing",
      evidence: "No chapter timestamps found",
      whyItMatters:
        "Chapters help viewers navigate and can appear in Google search results.",
      recommendation:
        "Add timestamps in your description starting with 00:00. Example: 00:00 Intro, 01:30 Main Topic",
      quickFix: {
        label: "Generate chapters",
        action: "generate_chapters",
      },
    };
  }

  if (chapterCount >= MIN_CHAPTERS) {
    return {
      id,
      label,
      status: "strong",
      evidence: `${chapterCount} chapter timestamps found`,
      whyItMatters:
        "Chapters improve viewer experience and can show in Google search results.",
      recommendation: "Good chapter usage. Keep adding chapters to longer videos.",
    };
  }

  return {
    id,
    label,
    status: "needs_work",
    evidence: `Only ${chapterCount} timestamp${chapterCount > 1 ? "s" : ""} found`,
    whyItMatters:
      "More chapters help viewers find specific content and improve engagement.",
    recommendation: `Add more timestamps. Aim for at least ${MIN_CHAPTERS} chapters for better navigation.`,
    quickFix: {
      label: "Generate chapters",
      action: "generate_chapters",
    },
  };
}

function checkCaptions(caption?: "true" | "false" | boolean | string): SeoCheck {
  const id = "captions";
  const label = "Captions / transcript";
  const hasCaps = hasCaptions(caption);

  if (hasCaps === null) {
    return {
      id,
      label,
      status: "needs_work",
      evidence: "Caption status unknown",
      whyItMatters:
        "Captions improve accessibility and help YouTube understand your content.",
      recommendation:
        "Add captions to your video. Manual transcripts are better than auto-generated.",
    };
  }

  if (hasCaps) {
    return {
      id,
      label,
      status: "strong",
      evidence: "Captions available",
      whyItMatters:
        "Captions help viewers with hearing impairments and boost SEO by providing text content.",
      recommendation:
        "If using auto-captions, review for accuracy. Correct any keyword pronunciations.",
    };
  }

  return {
    id,
    label,
    status: "missing",
    evidence: "No captions detected",
    whyItMatters:
      "75% of people watch videos on mute. Captions also provide SEO-indexable text.",
    recommendation:
      "Add captions to your video. Say your keywords naturally in the video so they appear in the transcript.",
  };
}

function checkThumbnail(
  thumbnails?: Record<string, { url: string; width?: number; height?: number }>
): SeoCheck {
  const id = "thumbnail";
  const label = "Thumbnail quality";
  const best = getBestThumbnail(thumbnails);

  if (!best) {
    return {
      id,
      label,
      status: "missing",
      evidence: "No thumbnail data available",
      whyItMatters:
        "Thumbnails are the first thing viewers see and heavily impact click-through rate.",
      recommendation: `Upload a custom thumbnail at ${THUMBNAIL_RECOMMENDED_WIDTH}x${THUMBNAIL_RECOMMENDED_HEIGHT} pixels.`,
      quickFix: {
        label: "Open thumbnail editor",
        action: "open_thumbnail",
      },
    };
  }

  const width = best.width ?? 0;
  const height = best.height ?? 0;

  if (width >= THUMBNAIL_MIN_WIDTH && height >= MIN_HD_HEIGHT) {
    const evidence =
      width >= THUMBNAIL_RECOMMENDED_WIDTH
        ? `High quality: ${width}x${height}`
        : `Good quality: ${width}x${height} (recommended: ${THUMBNAIL_RECOMMENDED_WIDTH}x${THUMBNAIL_RECOMMENDED_HEIGHT})`;

    return {
      id,
      label,
      status: "strong",
      evidence,
      whyItMatters:
        "High-resolution thumbnails look professional and stand out in search results.",
      recommendation:
        "Make sure your thumbnail is eye-catching, readable at small sizes, and accurately represents your content.",
    };
  }

  return {
    id,
    label,
    status: "needs_work",
    evidence: `Low resolution: ${width}x${height} (minimum: ${THUMBNAIL_MIN_WIDTH}px wide)`,
    whyItMatters:
      "Low-resolution thumbnails look blurry and unprofessional, hurting click-through rate.",
    recommendation: `Upload a custom thumbnail at ${THUMBNAIL_RECOMMENDED_WIDTH}x${THUMBNAIL_RECOMMENDED_HEIGHT} pixels (minimum width: ${THUMBNAIL_MIN_WIDTH}px).`,
    quickFix: {
      label: "Open thumbnail editor",
      action: "open_thumbnail",
    },
  };
}

function checkCategory(categoryId?: string): SeoCheck {
  const id = "category";
  const label = "Video category";

  if (!categoryId) {
    return {
      id,
      label,
      status: "needs_work",
      evidence: "No category set",
      whyItMatters:
        "Categories help YouTube group your video with similar content and recommend it appropriately.",
      recommendation:
        "Select the most accurate category for your video in YouTube Studio.",
    };
  }

  return {
    id,
    label,
    status: "strong",
    evidence: "Category assigned",
    whyItMatters:
      "Categories help YouTube understand your content's topic area.",
    recommendation:
      "Good. Make sure the category accurately reflects your content.",
  };
}

function checkRefreshOpportunity(publishedAt?: string): SeoCheck | null {
  const id = "refresh_opportunity";
  const label = "Refresh opportunity";
  const days = daysSincePublished(publishedAt);

  if (days === null) {
    return null; // Skip this check if no publish date
  }

  if (days < REFRESH_THRESHOLD_DAYS) {
    return {
      id,
      label,
      status: "strong",
      evidence: `Published ${days} days ago - still fresh`,
      whyItMatters:
        "Newer content is given preference in recommendations.",
      recommendation:
        "Focus on promotion and engagement for now. Consider refreshing after 6+ months.",
    };
  }

  const months = Math.floor(days / 30);
  return {
    id,
    label,
    status: "needs_work",
    evidence: `Published ${months} months ago - may benefit from refresh`,
    whyItMatters:
      "Refreshing metadata can re-surface older videos in search and recommendations.",
    recommendation:
      "Consider updating the title, description, or thumbnail to give this video new life. Avoid dated references in your script.",
    quickFix: {
      label: "Generate new title",
      action: "generate_title",
    },
  };
}

function checkDiscoveryFeatures(): SeoCheck {
  const id = "discovery_features";
  const label = "Discovery features";

  return {
    id,
    label,
    status: "needs_work",
    evidence: "Cards, end screens, and playlists cannot be detected automatically",
    whyItMatters:
      "Cards, end screens, and playlists keep viewers watching your content longer.",
    recommendation:
      "Add end screens in the last 20 seconds, use cards to link related videos, and add this video to relevant playlists.",
    quickFix: {
      label: "Learn more",
      action: "learn_more",
      payload: { topic: "discovery_features" },
    },
  };
}

// ============================================
// Main Audit Function
// ============================================

/**
 * Run a comprehensive SEO audit on video metadata
 */
export function runSeoAudit(input: SeoAuditInput): SeoAuditResult {
  // Detect focus keyword
  const focusKeyword = detectFocusKeyword(input);

  // Run all checks
  const allChecks: SeoCheck[] = [];

  allChecks.push(checkTitleKeywordPlacement(input.title, focusKeyword.value));
  allChecks.push(checkTitleLength(input.title));
  allChecks.push(
    checkDescriptionKeywordPlacement(input.description, focusKeyword.value)
  );
  allChecks.push(checkDescriptionDepth(input.description));
  allChecks.push(checkTagsCoverage(input.tags, focusKeyword.value));
  allChecks.push(checkHashtags(input.description));
  allChecks.push(checkChapters(input.description));
  allChecks.push(checkCaptions(input.caption));
  allChecks.push(checkThumbnail(input.thumbnails));
  allChecks.push(checkCategory(input.categoryId));

  const refreshCheck = checkRefreshOpportunity(input.publishedAt);
  if (refreshCheck) {
    allChecks.push(refreshCheck);
  }

  allChecks.push(checkDiscoveryFeatures());

  // Determine priority fixes (needs_work or missing, sorted by impact)
  const impactOrder = [
    "title_keyword_placement",
    "title_length",
    "description_keyword_placement",
    "chapters",
    "thumbnail",
    "tags_coverage",
    "captions",
    "description_depth",
    "hashtags",
    "category",
    "refresh_opportunity",
    "discovery_features",
  ];

  const priorityFixes = allChecks
    .filter((check) => check.status !== "strong")
    .sort((a, b) => {
      const aIndex = impactOrder.indexOf(a.id);
      const bIndex = impactOrder.indexOf(b.id);
      return aIndex - bIndex;
    })
    .slice(0, 6);

  // Generate summary
  const strongCount = allChecks.filter((c) => c.status === "strong").length;
  const missingCount = allChecks.filter((c) => c.status === "missing").length;

  let summary: string;
  if (strongCount >= allChecks.length * 0.7) {
    summary =
      "This video has solid SEO fundamentals. Focus on the few areas flagged below to maximize discoverability.";
  } else if (missingCount >= 3) {
    summary =
      "Several key SEO elements are missing. Adding these will significantly improve discoverability.";
  } else {
    summary = `${strongCount} of ${allChecks.length} SEO checks passed. Address the priority fixes below to improve search visibility.`;
  }

  return {
    focusKeyword,
    summary,
    priorityFixes,
    checks: allChecks,
  };
}

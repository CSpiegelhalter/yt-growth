/**
 * Description SEO Audit Module
 *
 * Provides detailed, deterministic SEO analysis for YouTube video descriptions,
 * hashtags, tags, and chapters. All checks are rules-based and explainable.
 */

// ============================================
// Types
// ============================================

export type DescriptionSeoInput = {
  title: string;
  description: string;
  tags: string[];
};

export type QuickFixAction =
  | "generate_description"
  | "generate_hashtags"
  | "generate_tags"
  | "generate_chapters"
  | "open_learn"
  | "copy_template";

export type DescriptionCheckStatus = "strong" | "needs_work" | "missing";

export type DescriptionCheck = {
  id: string;
  label: string;
  status: DescriptionCheckStatus;
  evidence?: string;
  recommendation: string;
  exampleFix?: string;
  quickFix?: {
    label: string;
    action: QuickFixAction;
    payload?: Record<string, unknown>;
  };
};

export type FocusKeywordConfidence = "high" | "med" | "low";

export type DescriptionSeoResult = {
  focusKeyword: {
    value: string | null;
    candidates: string[];
    confidence: FocusKeywordConfidence;
  };
  summary: string;
  priorityFixes: DescriptionCheck[];
  checks: DescriptionCheck[];
  // Grouped checks for UI sections
  descriptionChecks: DescriptionCheck[];
  hashtagChecks: DescriptionCheck[];
  tagChecks: DescriptionCheck[];
  chapterChecks: DescriptionCheck[];
  googleSuggestions: string[];
};

// ============================================
// Constants
// ============================================

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
  "has", "have", "he", "her", "his", "how", "i", "in", "is", "it",
  "its", "me", "my", "of", "on", "or", "our", "she", "so", "that",
  "the", "their", "them", "they", "this", "to", "us", "was", "we",
  "were", "what", "when", "where", "which", "who", "will", "with",
  "you", "your",
]);

const CTA_PHRASES = [
  "subscribe", "like", "comment", "share", "turn on notifications",
  "join", "download", "check out", "click", "watch", "follow",
  "sign up", "get started", "learn more", "hit the bell",
];

const VIDEO_TYPE_TAGS = [
  "how-to", "how to", "tutorial", "review", "guide", "tips",
  "explained", "walkthrough", "demo", "demonstration",
];

// ============================================
// Utility Functions
// ============================================

/**
 * Normalize text for comparison: lowercase, strip punctuation, collapse whitespace
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract n-grams (2-5 words) from text, filtering stop words
 */
function extractNGrams(text: string, minN = 2, maxN = 5): string[] {
  const normalized = normalizeText(text);
  const words = normalized.split(" ").filter((w) => w.length > 0 && !STOP_WORDS.has(w));

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
 * Count words in text
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Get first N sentences from text
 */
function getFirstSentences(text: string, n: number): string {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  return sentences.slice(0, n).join(". ").trim();
}

/**
 * Get first N words from text
 */
function getFirstWords(text: string, n: number): string {
  return text.split(/\s+/).slice(0, n).join(" ");
}

/**
 * Check if keyword appears in text (normalized, whole phrase)
 */
function containsKeyword(text: string, keyword: string): boolean {
  const normalizedText = normalizeText(text);
  const normalizedKeyword = normalizeText(keyword);
  return normalizedText.includes(normalizedKeyword);
}

/**
 * Count occurrences of keyword in text (case-insensitive, whole phrase)
 */
function countKeywordOccurrences(text: string, keyword: string): number {
  const normalizedText = normalizeText(text);
  const normalizedKeyword = normalizeText(keyword);
  if (!normalizedKeyword) return 0;

  let count = 0;
  let pos = 0;
  while ((pos = normalizedText.indexOf(normalizedKeyword, pos)) !== -1) {
    count++;
    pos += normalizedKeyword.length;
  }
  return count;
}

/**
 * Extract hashtags from text
 */
function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\p{L}\p{N}_]+/gu);
  return matches ? [...new Set(matches.map((h) => h.toLowerCase()))] : [];
}

/**
 * Extract links from text
 */
function extractLinks(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  const matches = text.match(urlRegex);
  return matches || [];
}

/**
 * Detect CTA phrases in text
 */
function detectCTAs(text: string): string[] {
  const lowerText = text.toLowerCase();
  return CTA_PHRASES.filter((cta) => lowerText.includes(cta));
}

/**
 * Parse chapter timestamps from description
 * Returns array of { time: string, seconds: number, title: string }
 */
type Chapter = { time: string; seconds: number; title: string };

function parseChapters(description: string): Chapter[] {
  const lines = description.split("\n");
  const chapters: Chapter[] = [];

  // Match patterns like "0:00 Intro", "00:00 - Title", "1:23:45 Main Content"
  const timestampRegex = /^((\d{1,2}):)?(\d{1,2}):(\d{2})\s*[-–]?\s*(.*)$/;

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(timestampRegex);
    if (match) {
      const hours = match[2] ? parseInt(match[2], 10) : 0;
      const minutes = parseInt(match[3], 10);
      const seconds = parseInt(match[4], 10);
      const title = match[5].trim();
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;

      chapters.push({
        time: match[1] ? `${match[2]}:${match[3]}:${match[4]}` : `${match[3]}:${match[4]}`,
        seconds: totalSeconds,
        title,
      });
    }
  }

  return chapters;
}

/**
 * Check if chapters are in ascending order
 */
function areChaptersAscending(chapters: Chapter[]): boolean {
  for (let i = 1; i < chapters.length; i++) {
    if (chapters[i].seconds <= chapters[i - 1].seconds) {
      return false;
    }
  }
  return true;
}

/**
 * Get position percentage of hashtags in description
 */
function getHashtagPositionPercent(description: string): number {
  const firstHashtagIndex = description.search(/#[\p{L}\p{N}_]+/u);
  if (firstHashtagIndex === -1) return 100;
  return (firstHashtagIndex / description.length) * 100;
}

/**
 * Generate related keywords from candidates (simple heuristics)
 */
function getRelatedKeywords(focusKeyword: string, candidates: string[]): string[] {
  const normalizedFocus = normalizeText(focusKeyword);
  const focusWords = new Set(normalizedFocus.split(" "));

  return candidates
    .filter((c) => {
      const normalized = normalizeText(c);
      // Not identical to focus keyword
      if (normalized === normalizedFocus) return false;
      // Has at least some word overlap
      const cWords = normalized.split(" ");
      const overlap = cWords.some((w) => focusWords.has(w));
      return overlap;
    })
    .slice(0, 5);
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

function detectFocusKeyword(input: DescriptionSeoInput): {
  value: string | null;
  candidates: string[];
  confidence: FocusKeywordConfidence;
} {
  const { title, description, tags } = input;
  const earlyDescription = getFirstSentences(description, 2) || description.slice(0, 200);

  const candidateSet = new Set<string>();

  // From title: 2-5 word n-grams
  extractNGrams(title, 2, 5).forEach((ng) => candidateSet.add(ng));

  // From tags (as-is, normalized)
  tags.forEach((tag) => {
    const normalized = normalizeText(tag);
    if (normalized.length > 0) {
      candidateSet.add(normalized);
    }
  });

  // From early description: 2-4 word n-grams
  extractNGrams(earlyDescription, 2, 4).forEach((ng) => candidateSet.add(ng));

  // Score each candidate
  const scoredCandidates: KeywordCandidate[] = [];

  for (const keyword of candidateSet) {
    const inTitle = containsKeyword(title, keyword);
    const inEarlyDescription = containsKeyword(earlyDescription, keyword);
    const inTags = tags.some((tag) => containsKeyword(tag, keyword));

    let score = 0;
    if (inTitle) score += 3;
    if (inEarlyDescription) score += 2;
    if (inTags) score += 1;

    // Prefer longer keywords
    const wordCount = keyword.split(" ").length;
    if (wordCount >= 2) score += 0.5;
    if (wordCount >= 3) score += 0.5;

    scoredCandidates.push({ keyword, score, inTitle, inEarlyDescription, inTags });
  }

  scoredCandidates.sort((a, b) => b.score - a.score);
  const topCandidates = scoredCandidates.slice(0, 5);

  if (topCandidates.length === 0) {
    return { value: null, candidates: [], confidence: "low" };
  }

  const best = topCandidates[0];

  let confidence: FocusKeywordConfidence;
  if (best.inTitle && (best.inTags || best.inEarlyDescription)) {
    confidence = "high";
  } else if (best.inTitle) {
    confidence = "med";
  } else {
    confidence = "low";
  }

  return {
    value: best.score >= 1 ? best.keyword : null,
    candidates: topCandidates.map((c) => c.keyword),
    confidence,
  };
}

// ============================================
// Description Checks (Part C)
// ============================================

function checkKeywordPlacement(description: string, focusKeyword: string | null): DescriptionCheck {
  const id = "desc_keyword_placement";
  const label = "Keyword in opening lines";

  if (!focusKeyword || !description.trim()) {
    return {
      id,
      label,
      status: "missing",
      evidence: focusKeyword ? "Description is empty" : "No focus keyword detected",
      recommendation: "Put your main keyword in the first 1-2 sentences naturally.",
      quickFix: { label: "Rewrite description", action: "generate_description" },
    };
  }

  const first2Sentences = getFirstSentences(description, 2);
  const first25Words = getFirstWords(description, 25);

  if (containsKeyword(first2Sentences, focusKeyword) || containsKeyword(first25Words, focusKeyword)) {
    return {
      id,
      label,
      status: "strong",
      evidence: `"${focusKeyword}" appears in the opening lines`,
      recommendation: "Keep front-loading your target keyword.",
    };
  }

  if (containsKeyword(description, focusKeyword)) {
    return {
      id,
      label,
      status: "needs_work",
      evidence: `"${focusKeyword}" appears but not in the first 25 words`,
      recommendation: "Move your main keyword closer to the beginning of the description.",
      quickFix: { label: "Rewrite opening", action: "generate_description", payload: { focusKeyword } },
    };
  }

  return {
    id,
    label,
    status: "missing",
    evidence: `"${focusKeyword}" not found in description`,
    recommendation: "Include your main keyword naturally in the opening lines.",
    quickFix: { label: "Rewrite description", action: "generate_description", payload: { focusKeyword } },
  };
}

function checkKeywordUsageCount(description: string, focusKeyword: string | null): DescriptionCheck {
  const id = "desc_keyword_count";
  const label = "Keyword usage count";

  if (!focusKeyword) {
    return {
      id,
      label,
      status: "missing",
      evidence: "No focus keyword to check",
      recommendation: "Identify a target keyword and use it 2-3 times naturally.",
    };
  }

  const count = countKeywordOccurrences(description, focusKeyword);

  if (count >= 2 && count <= 3) {
    return {
      id,
      label,
      status: "strong",
      evidence: `"${focusKeyword}" appears ${count} times`,
      recommendation: "Good natural keyword usage.",
    };
  }

  if (count === 0) {
    return {
      id,
      label,
      status: "missing",
      evidence: `"${focusKeyword}" not found in description`,
      recommendation: "Include your keyword 2-3 times naturally throughout the description.",
      quickFix: { label: "Rewrite description", action: "generate_description", payload: { focusKeyword } },
    };
  }

  if (count === 1) {
    return {
      id,
      label,
      status: "needs_work",
      evidence: `"${focusKeyword}" appears only once`,
      recommendation: "Use your keyword 2-3 times for better SEO coverage.",
      quickFix: { label: "Expand description", action: "generate_description" },
    };
  }

  // count >= 4
  return {
    id,
    label,
    status: "needs_work",
    evidence: `"${focusKeyword}" appears ${count} times (potential keyword stuffing)`,
    recommendation: "Reduce keyword usage to 2-3 times to avoid appearing spammy.",
  };
}

function checkRelatedKeywords(
  description: string,
  focusKeyword: string | null,
  candidates: string[]
): DescriptionCheck {
  const id = "desc_related_keywords";
  const label = "Related keywords present";

  if (!focusKeyword) {
    return {
      id,
      label,
      status: "needs_work",
      evidence: "No focus keyword to derive related terms from",
      recommendation: "Add related terms and variations of your main topic.",
    };
  }

  const relatedKeywords = getRelatedKeywords(focusKeyword, candidates);
  const foundRelated = relatedKeywords.filter((rk) => containsKeyword(description, rk));

  if (foundRelated.length >= 2) {
    return {
      id,
      label,
      status: "strong",
      evidence: `Found ${foundRelated.length} related terms: ${foundRelated.slice(0, 3).join(", ")}`,
      recommendation: "Good use of related keywords.",
    };
  }

  return {
    id,
    label,
    status: "needs_work",
    evidence: foundRelated.length === 0
      ? "No related keywords found"
      : `Only ${foundRelated.length} related term found`,
    recommendation: "Add related terms like: " + relatedKeywords.slice(0, 3).join(", "),
    exampleFix: relatedKeywords.length > 0
      ? `Try adding: ${relatedKeywords.slice(0, 2).join(", ")}`
      : undefined,
  };
}

function checkDescriptionLength(description: string): DescriptionCheck {
  const id = "desc_length";
  const label = "Description length";
  const wordCount = countWords(description);

  if (wordCount >= 200) {
    return {
      id,
      label,
      status: "strong",
      evidence: `${wordCount} words (200+ recommended)`,
      recommendation: "Good description depth.",
    };
  }

  if (wordCount >= 80) {
    return {
      id,
      label,
      status: "needs_work",
      evidence: `${wordCount} words (aim for 200+)`,
      recommendation: "Expand your description with an outline, key points, and value proposition.",
      quickFix: { label: "Expand description", action: "generate_description" },
    };
  }

  return {
    id,
    label,
    status: "missing",
    evidence: wordCount === 0 ? "Description is empty" : `Only ${wordCount} words`,
    recommendation: "Write at least 200 words. Include what viewers will learn, key topics, and relevant context.",
    quickFix: { label: "Generate description", action: "generate_description" },
  };
}

function checkLinksPresent(description: string): DescriptionCheck {
  const id = "desc_links";
  const label = "Links to related content";
  const links = extractLinks(description);

  if (links.length >= 1) {
    return {
      id,
      label,
      status: "strong",
      evidence: `${links.length} link${links.length > 1 ? "s" : ""} found`,
      recommendation: "Good link inclusion.",
    };
  }

  return {
    id,
    label,
    status: "needs_work",
    evidence: "No links found",
    recommendation: "Add links to related playlists, videos, or your website.",
    exampleFix: `LINKS:
Related playlist: [URL]
My website: [URL]
Follow me on Twitter: [URL]`,
    quickFix: { label: "Copy template", action: "copy_template", payload: { template: "links" } },
  };
}

function checkCTAPresent(description: string): DescriptionCheck {
  const id = "desc_cta";
  const label = "Call-to-action present";
  const ctas = detectCTAs(description);

  if (ctas.length >= 1) {
    return {
      id,
      label,
      status: "strong",
      evidence: `CTA found: "${ctas[0]}"`,
      recommendation: "Good CTA inclusion.",
    };
  }

  return {
    id,
    label,
    status: "needs_work",
    evidence: "No clear call-to-action found",
    recommendation: "Add a clear CTA like 'Subscribe for more' or 'Leave a comment below'.",
    exampleFix: "If you found this helpful, please like and subscribe for more videos like this!",
    quickFix: { label: "Copy CTA template", action: "copy_template", payload: { template: "cta" } },
  };
}

// ============================================
// Hashtag Checks (Part D)
// ============================================

function checkHashtagCount(description: string): DescriptionCheck {
  const id = "hashtag_count";
  const label = "Hashtag count";
  const hashtags = extractHashtags(description);
  const count = hashtags.length;

  if (count === 0) {
    return {
      id,
      label,
      status: "missing",
      evidence: "No hashtags found",
      recommendation: "Add 2-3 relevant hashtags at the end of your description.",
      quickFix: { label: "Generate hashtags", action: "generate_hashtags" },
    };
  }

  if (count >= 2 && count <= 3) {
    return {
      id,
      label,
      status: "strong",
      evidence: `${count} hashtags: ${hashtags.join(", ")}`,
      recommendation: "Good hashtag count.",
    };
  }

  return {
    id,
    label,
    status: "needs_work",
    evidence: count === 1
      ? "Only 1 hashtag found"
      : `${count} hashtags (more than recommended)`,
    recommendation: count === 1
      ? "Add 1-2 more relevant hashtags."
      : "Reduce to 2-3 hashtags. Too many looks spammy.",
    quickFix: { label: "Fix hashtags", action: "generate_hashtags" },
  };
}

function checkHashtagPlacement(description: string): DescriptionCheck {
  const id = "hashtag_placement";
  const label = "Hashtag placement";
  const hashtags = extractHashtags(description);

  if (hashtags.length === 0) {
    return {
      id,
      label,
      status: "missing",
      evidence: "No hashtags to check placement",
      recommendation: "Add hashtags at the end of your description.",
    };
  }

  const positionPercent = getHashtagPositionPercent(description);

  if (positionPercent >= 80) {
    return {
      id,
      label,
      status: "strong",
      evidence: "Hashtags appear at the end of description",
      recommendation: "Good placement.",
    };
  }

  return {
    id,
    label,
    status: "needs_work",
    evidence: "Hashtags are scattered or appear too early",
    recommendation: "Move all hashtags to the end of your description (last few lines).",
    quickFix: { label: "Fix placement", action: "generate_hashtags" },
  };
}

function checkHashtagContent(description: string, focusKeyword: string | null): DescriptionCheck {
  const id = "hashtag_content";
  const label = "Hashtag content mix";
  const hashtags = extractHashtags(description);

  if (hashtags.length === 0) {
    return {
      id,
      label,
      status: "missing",
      evidence: "No hashtags to analyze",
      recommendation: "Include one main keyword hashtag plus a mix of general and specific hashtags.",
      quickFix: { label: "Generate hashtags", action: "generate_hashtags" },
    };
  }

  // Check if any hashtag contains the focus keyword
  const hasKeywordHashtag = focusKeyword
    ? hashtags.some((h) => containsKeyword(h, focusKeyword))
    : false;

  // Simple heuristic: general = short (1 word), specific = longer (2+ words in hashtag)
  const generalHashtags = hashtags.filter((h) => h.replace("#", "").split(/(?=[A-Z])/).length <= 2);
  const specificHashtags = hashtags.filter((h) => h.replace("#", "").split(/(?=[A-Z])/).length > 2);

  if (hasKeywordHashtag && generalHashtags.length >= 1 && specificHashtags.length >= 1) {
    return {
      id,
      label,
      status: "strong",
      evidence: "Good mix of keyword, general, and specific hashtags",
      recommendation: "Good hashtag variety.",
    };
  }

  const issues: string[] = [];
  if (!hasKeywordHashtag && focusKeyword) issues.push("missing keyword hashtag");
  if (generalHashtags.length === 0) issues.push("no general hashtag");
  if (specificHashtags.length === 0) issues.push("no specific hashtag");

  return {
    id,
    label,
    status: "needs_work",
    evidence: issues.length > 0 ? issues.join(", ") : "Hashtag variety could be improved",
    recommendation: focusKeyword
      ? `Add #${focusKeyword.replace(/\s+/g, "")} plus one general and one specific hashtag.`
      : "Add a mix of general (broad topic) and specific (niche) hashtags.",
    quickFix: { label: "Improve hashtags", action: "generate_hashtags", payload: { focusKeyword } },
  };
}

// ============================================
// Tags Checks (Part E)
// ============================================

function checkTagsKeywordCoverage(tags: string[], focusKeyword: string | null): DescriptionCheck {
  const id = "tags_keyword";
  const label = "Primary keyword in tags";

  if (tags.length === 0) {
    return {
      id,
      label,
      status: "missing",
      evidence: "No tags added",
      recommendation: "Add tags starting with your exact target keyword.",
      quickFix: { label: "Generate tags", action: "generate_tags" },
    };
  }

  if (!focusKeyword) {
    return {
      id,
      label,
      status: "needs_work",
      evidence: "No focus keyword detected to match",
      recommendation: "Add your main topic as the first tag, then variations.",
    };
  }

  const normalizedFocus = normalizeText(focusKeyword);
  const focusWords = normalizedFocus.split(" ");

  // Check for exact match
  const hasExactMatch = tags.some((tag) => normalizeText(tag) === normalizedFocus);

  // Check for close variations (contains all focus words)
  const closeVariations = tags.filter((tag) => {
    const tagNorm = normalizeText(tag);
    if (tagNorm === normalizedFocus) return false;
    return focusWords.every((fw) => tagNorm.includes(fw));
  });

  if (hasExactMatch && closeVariations.length >= 2) {
    return {
      id,
      label,
      status: "strong",
      evidence: `Exact keyword tag + ${closeVariations.length} variations`,
      recommendation: "Good keyword coverage in tags.",
    };
  }

  if (hasExactMatch || closeVariations.length >= 1) {
    return {
      id,
      label,
      status: "needs_work",
      evidence: hasExactMatch
        ? "Has exact keyword but needs more variations"
        : "Has variations but missing exact keyword tag",
      recommendation: hasExactMatch
        ? `Add more variations like "${focusKeyword} tutorial", "${focusKeyword} tips".`
        : `Add "${focusKeyword}" as your first tag.`,
      quickFix: { label: "Improve tags", action: "generate_tags", payload: { focusKeyword } },
    };
  }

  return {
    id,
    label,
    status: "missing",
    evidence: `"${focusKeyword}" not found in tags`,
    recommendation: `Add "${focusKeyword}" as your first tag, then add variations.`,
    quickFix: { label: "Generate tags", action: "generate_tags", payload: { focusKeyword } },
  };
}

function checkTagsMix(tags: string[]): DescriptionCheck {
  const id = "tags_mix";
  const label = "Tag variety (general + specific)";

  if (tags.length === 0) {
    return {
      id,
      label,
      status: "missing",
      evidence: "No tags to analyze",
      recommendation: "Add a mix of general (1-2 words) and specific (3+ words) tags.",
      quickFix: { label: "Generate tags", action: "generate_tags" },
    };
  }

  const generalTags = tags.filter((tag) => countWords(tag) <= 2);
  const specificTags = tags.filter((tag) => countWords(tag) >= 3);

  // Check for synonyms/alternate phrasing (simple heuristic)
  const hasSynonym = tags.some((tag) => {
    const lower = tag.toLowerCase();
    return lower.includes("tips") || lower.includes("guide") || lower.includes("best") ||
           lower.includes("top") || lower.includes("ways") || lower.includes("methods");
  });

  if (generalTags.length >= 2 && specificTags.length >= 3 && hasSynonym) {
    return {
      id,
      label,
      status: "strong",
      evidence: `${generalTags.length} general, ${specificTags.length} specific tags`,
      recommendation: "Good tag variety.",
    };
  }

  const issues: string[] = [];
  if (generalTags.length < 2) issues.push("add more general tags");
  if (specificTags.length < 3) issues.push("add more long-tail specific tags");
  if (!hasSynonym) issues.push("add synonym/alternate phrasing tags");

  return {
    id,
    label,
    status: "needs_work",
    evidence: `${generalTags.length} general, ${specificTags.length} specific tags`,
    recommendation: `Improve tag mix: ${issues.join(", ")}.`,
    quickFix: { label: "Expand tags", action: "generate_tags" },
  };
}

function checkVideoTypeTags(tags: string[], title: string): DescriptionCheck {
  const id = "tags_video_type";
  const label = "Video type tag";

  // Check if title suggests a video type
  const lowerTitle = title.toLowerCase();
  const suggestsType = lowerTitle.includes("how") || lowerTitle.includes("tutorial") ||
                       lowerTitle.includes("review") || lowerTitle.includes("guide") ||
                       lowerTitle.includes("tips") || lowerTitle.includes("explained");

  const hasTypeTag = tags.some((tag) =>
    VIDEO_TYPE_TAGS.some((vt) => tag.toLowerCase().includes(vt))
  );

  if (hasTypeTag) {
    return {
      id,
      label,
      status: "strong",
      evidence: "Video type tag found",
      recommendation: "Good video type tagging.",
    };
  }

  if (!suggestsType) {
    return {
      id,
      label,
      status: "strong",
      evidence: "Video type tag not applicable",
      recommendation: "N/A - Title doesn't suggest a specific video type.",
    };
  }

  return {
    id,
    label,
    status: "needs_work",
    evidence: "Missing video type tag (title suggests how-to/tutorial/review)",
    recommendation: "Add a type tag like 'tutorial', 'how-to', or 'review' based on your content.",
    quickFix: { label: "Add type tag", action: "generate_tags" },
  };
}

// ============================================
// Chapter Checks (Part F)
// ============================================

function checkChaptersPresent(description: string): DescriptionCheck {
  const id = "chapters_present";
  const label = "Chapters present";
  const chapters = parseChapters(description);

  if (chapters.length === 0) {
    return {
      id,
      label,
      status: "missing",
      evidence: "No chapter timestamps found",
      recommendation: "Add at least 3 chapters starting with 0:00.",
      exampleFix: `0:00 Intro
1:30 Main Topic
3:45 Key Point
5:00 Summary`,
      quickFix: { label: "Generate chapters", action: "generate_chapters" },
    };
  }

  if (chapters.length >= 3) {
    return {
      id,
      label,
      status: "strong",
      evidence: `${chapters.length} chapters found`,
      recommendation: "Good chapter usage.",
    };
  }

  return {
    id,
    label,
    status: "needs_work",
    evidence: `Only ${chapters.length} chapter${chapters.length > 1 ? "s" : ""} found`,
    recommendation: "Add at least 3 chapters for better navigation.",
    quickFix: { label: "Add more chapters", action: "generate_chapters" },
  };
}

function checkChapterStartsAtZero(description: string): DescriptionCheck {
  const id = "chapters_zero_start";
  const label = "First chapter at 0:00";
  const chapters = parseChapters(description);

  if (chapters.length === 0) {
    return {
      id,
      label,
      status: "missing",
      evidence: "No chapters to check",
      recommendation: "Add chapters starting with 0:00 Intro.",
    };
  }

  if (chapters[0].seconds === 0) {
    return {
      id,
      label,
      status: "strong",
      evidence: "First chapter starts at 0:00",
      recommendation: "Correct starting point.",
    };
  }

  return {
    id,
    label,
    status: "needs_work",
    evidence: `First chapter starts at ${chapters[0].time} (not 0:00)`,
    recommendation: "YouTube requires the first chapter to start at 0:00.",
    exampleFix: `0:00 Intro
${chapters.map((c) => `${c.time} ${c.title}`).join("\n")}`,
  };
}

function checkChapterSpacing(description: string): DescriptionCheck {
  const id = "chapters_spacing";
  const label = "Chapter spacing";
  const chapters = parseChapters(description);

  if (chapters.length < 2) {
    return {
      id,
      label,
      status: "missing",
      evidence: "Not enough chapters to check spacing",
      recommendation: "Add more chapters (at least 3).",
    };
  }

  if (!areChaptersAscending(chapters)) {
    return {
      id,
      label,
      status: "needs_work",
      evidence: "Chapters are not in ascending order",
      recommendation: "Ensure timestamps are in ascending order.",
    };
  }

  // Check gaps
  const gaps: number[] = [];
  for (let i = 1; i < chapters.length; i++) {
    gaps.push(chapters[i].seconds - chapters[i - 1].seconds);
  }

  const tinyGaps = gaps.filter((g) => g < 30).length;
  const hugeGaps = gaps.filter((g) => g > 300).length;
  const goodGaps = gaps.filter((g) => g >= 60 && g <= 180).length;

  if (goodGaps >= gaps.length * 0.6 && tinyGaps <= 1 && hugeGaps <= 1) {
    return {
      id,
      label,
      status: "strong",
      evidence: "Chapters are well-spaced (1-2 minutes apart)",
      recommendation: "Good chapter distribution.",
    };
  }

  const issues: string[] = [];
  if (tinyGaps > 1) issues.push(`${tinyGaps} gaps under 30 seconds`);
  if (hugeGaps > 1) issues.push(`${hugeGaps} gaps over 5 minutes`);

  return {
    id,
    label,
    status: "needs_work",
    evidence: issues.length > 0 ? issues.join(", ") : "Uneven chapter spacing",
    recommendation: "Aim for chapters 1-2 minutes apart. Combine very short sections or break up long ones.",
  };
}

function checkChapterTitles(description: string, focusKeyword: string | null, candidates: string[]): DescriptionCheck {
  const id = "chapters_titles";
  const label = "Chapter title quality";
  const chapters = parseChapters(description);

  if (chapters.length === 0) {
    return {
      id,
      label,
      status: "missing",
      evidence: "No chapters to analyze",
      recommendation: "Add chapters with concise, keyword-rich titles.",
    };
  }

  const allKeywords = [focusKeyword, ...candidates.slice(0, 3)].filter(Boolean) as string[];
  const longTitles = chapters.filter((c) => countWords(c.title) > 6);
  const keywordRichTitles = chapters.filter((c) =>
    allKeywords.some((kw) => containsKeyword(c.title, kw))
  );

  if (longTitles.length === 0 && keywordRichTitles.length >= chapters.length * 0.5) {
    return {
      id,
      label,
      status: "strong",
      evidence: "Chapter titles are concise and keyword-rich",
      recommendation: "Good chapter naming.",
    };
  }

  const issues: string[] = [];
  if (longTitles.length > 0) issues.push(`${longTitles.length} titles too long (>6 words)`);
  if (keywordRichTitles.length < chapters.length * 0.3) issues.push("few titles contain keywords");

  return {
    id,
    label,
    status: "needs_work",
    evidence: issues.join(", ") || "Chapter titles could be improved",
    recommendation: "Use concise titles (under 6 words) that include relevant keywords.",
  };
}

// ============================================
// Google Ranking Suggestions (Part G)
// ============================================

const GOOGLE_SUGGESTIONS = [
  "Embed this video on your website or blog in a relevant article",
  "Encourage likes, comments, and shares with a clear CTA",
  "Promote on social media platforms where your audience is active",
  "Use a clear, high-quality custom thumbnail",
  "Add accurate captions/transcripts (keywords you say get indexed)",
];

// ============================================
// Main Audit Function
// ============================================

type DescriptionSeoOptions = {
  /** Override the auto-detected focus keyword with a specific keyword (e.g., from LLM) */
  focusKeywordOverride?: string | null;
};

export function runDescriptionSeoAudit(
  input: DescriptionSeoInput,
  options?: DescriptionSeoOptions
): DescriptionSeoResult {
  const { title, description, tags } = input;

  // Detect focus keyword (or use override if provided)
  const detectedKeyword = detectFocusKeyword(input);
  
  // If an override keyword is provided, use it but keep the detected candidates for alternatives
  const focusKeyword: {
    value: string | null;
    candidates: string[];
    confidence: FocusKeywordConfidence;
  } = options?.focusKeywordOverride
    ? {
        value: options.focusKeywordOverride,
        // Keep original candidates but add the override if not present
        candidates: [
          options.focusKeywordOverride,
          ...detectedKeyword.candidates.filter(
            (c) => c.toLowerCase() !== options.focusKeywordOverride?.toLowerCase()
          ),
        ].slice(0, 5),
        confidence: "high", // Override from API is considered high confidence
      }
    : detectedKeyword;

  // Run all description checks
  const descriptionChecks: DescriptionCheck[] = [
    checkKeywordPlacement(description, focusKeyword.value),
    checkKeywordUsageCount(description, focusKeyword.value),
    checkRelatedKeywords(description, focusKeyword.value, focusKeyword.candidates),
    checkDescriptionLength(description),
    checkLinksPresent(description),
    checkCTAPresent(description),
  ];

  // Run hashtag checks
  const hashtagChecks: DescriptionCheck[] = [
    checkHashtagCount(description),
    checkHashtagPlacement(description),
    checkHashtagContent(description, focusKeyword.value),
  ];

  // Run tag checks
  const tagChecks: DescriptionCheck[] = [
    checkTagsKeywordCoverage(tags, focusKeyword.value),
    checkTagsMix(tags),
    checkVideoTypeTags(tags, title),
  ];

  // Run chapter checks
  const chapterChecks: DescriptionCheck[] = [
    checkChaptersPresent(description),
    checkChapterStartsAtZero(description),
    checkChapterSpacing(description),
    checkChapterTitles(description, focusKeyword.value, focusKeyword.candidates),
  ];

  // Combine all checks
  const allChecks = [...descriptionChecks, ...hashtagChecks, ...tagChecks, ...chapterChecks];

  // Determine priority fixes (sorted by impact)
  const impactOrder = [
    "desc_keyword_placement",
    "desc_length",
    "desc_cta",
    "desc_links",
    "tags_keyword",
    "chapters_present",
    "hashtag_count",
    "desc_keyword_count",
    "desc_related_keywords",
    "tags_mix",
    "hashtag_placement",
    "hashtag_content",
    "chapters_zero_start",
    "chapters_spacing",
    "chapters_titles",
    "tags_video_type",
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
    summary = "Your description is well-optimized. Address the remaining items to maximize discoverability.";
  } else if (missingCount >= 4) {
    summary = "Several key SEO elements are missing from your description. Adding these will significantly improve reach.";
  } else {
    summary = `${strongCount} of ${allChecks.length} checks passed. Focus on the priority fixes below.`;
  }

  return {
    focusKeyword,
    summary,
    priorityFixes,
    checks: allChecks,
    descriptionChecks,
    hashtagChecks,
    tagChecks,
    chapterChecks,
    googleSuggestions: GOOGLE_SUGGESTIONS,
  };
}

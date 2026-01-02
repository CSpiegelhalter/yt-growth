/**
 * Tag Filter - Ensures tags are grounded in actual content
 * Prevents hallucinated/over-specific tags that aren't supported by evidence
 */

export type TagSource = "title" | "description" | "transcript" | "existing_tag" | "context";

export type TraceableTag = {
  tag: string;
  source: TagSource;
};

export type ContentContext = {
  title: string;
  description?: string;
  transcript?: string;
  existingTags?: string[];
  userContext?: {
    platform?: string;  // "mac" | "windows" | "linux" | "any"
    tooling?: string;   // e.g., "homebrew", "chocolatey", "nix"
    audience?: string;  // "beginner" | "advanced"
    topic?: string;     // Additional topic hints
  };
};

/**
 * Check if a tag is supported by the given content
 * Returns the source if found, null otherwise
 */
export function findTagSource(tag: string, content: ContentContext): TagSource | null {
  const normalizedTag = normalizeForMatching(tag);
  
  // Check title (highest priority)
  if (containsPhrase(content.title, normalizedTag)) {
    return "title";
  }
  
  // Check description
  if (content.description && containsPhrase(content.description, normalizedTag)) {
    return "description";
  }
  
  // Check transcript
  if (content.transcript && containsPhrase(content.transcript, normalizedTag)) {
    return "transcript";
  }
  
  // Check existing tags
  if (content.existingTags?.some(t => normalizeForMatching(t) === normalizedTag)) {
    return "existing_tag";
  }
  
  // Check user-provided context
  if (content.userContext) {
    const contextStr = [
      content.userContext.platform,
      content.userContext.tooling,
      content.userContext.audience,
      content.userContext.topic,
    ].filter(Boolean).join(" ");
    
    if (contextStr && containsPhrase(contextStr, normalizedTag)) {
      return "context";
    }
  }
  
  return null;
}

/**
 * Filter tags to only include those with evidence in the content
 */
export function filterTraceableTags(
  tags: string[],
  content: ContentContext
): TraceableTag[] {
  const result: TraceableTag[] = [];
  const seen = new Set<string>();
  
  for (const tag of tags) {
    const normalizedTag = normalizeForMatching(tag);
    
    // Skip duplicates
    if (seen.has(normalizedTag)) continue;
    seen.add(normalizedTag);
    
    // Skip platform-specific tags unless context allows them
    if (isPlatformSpecificTag(tag)) {
      if (!platformContextAllowsTag(tag, content.userContext?.platform)) {
        continue;
      }
      // If context allows, add as context-sourced tag
      result.push({ tag, source: "context" });
      continue;
    }
    
    // Skip tooling-specific tags if no tooling context  
    if (isToolingSpecificTag(tag) && !content.userContext?.tooling) {
      continue;
    }
    
    const source = findTagSource(tag, content);
    if (source) {
      result.push({ tag, source });
    }
  }
  
  return result;
}

/**
 * Check if a tag is platform-specific (Windows/Mac/Linux)
 */
function isPlatformSpecificTag(tag: string): boolean {
  const platformPatterns = [
    /\bwindows\b/i,
    /\bmacos\b/i,
    /\bmac\b/i,
    /\blinux\b/i,
    /\bubuntu\b/i,
    /\bdebian\b/i,
    /\bfedora\b/i,
    /\barch\b/i,
    /\bwsl\b/i,
    /\bpowershell\b/i,
  ];
  
  return platformPatterns.some(p => p.test(tag));
}

/**
 * Check if platform context allows a platform-specific tag
 */
function platformContextAllowsTag(tag: string, platform?: string): boolean {
  if (!platform) return false;
  
  const tagLower = tag.toLowerCase();
  const platLower = platform.toLowerCase();
  
  // Cross-platform/any allows all
  if (platLower === "any") return true;
  
  // Mac context allows mac, macos
  if (platLower === "mac" && (tagLower.includes("mac") || tagLower.includes("macos"))) {
    return true;
  }
  
  // Windows context allows windows
  if (platLower === "windows" && tagLower.includes("windows")) {
    return true;
  }
  
  // Linux context allows linux and common distros
  if (platLower === "linux" && (
    tagLower.includes("linux") || 
    tagLower.includes("ubuntu") || 
    tagLower.includes("debian") ||
    tagLower.includes("fedora")
  )) {
    return true;
  }
  
  return false;
}

/**
 * Check if a tag is tooling-specific (package managers, etc.)
 */
function isToolingSpecificTag(tag: string): boolean {
  const toolingPatterns = [
    /\bhomebrew\b/i,
    /\bbrew\b/i,
    /\bchocolatey\b/i,
    /\bchoco\b/i,
    /\bnix\b/i,
    /\bapt\b/i,
    /\byum\b/i,
    /\bpacman\b/i,
    /\bscoop\b/i,
    /\bwinget\b/i,
  ];
  
  return toolingPatterns.some(p => p.test(tag));
}

/**
 * Normalize a string for fuzzy matching
 */
function normalizeForMatching(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Check if content contains a phrase (allowing for word boundaries)
 */
function containsPhrase(content: string, phrase: string): boolean {
  const normalizedContent = normalizeForMatching(content);
  const words = phrase.split(" ").filter(Boolean);
  
  // For single words, check exact word boundary
  if (words.length === 1) {
    const regex = new RegExp(`\\b${escapeRegex(words[0])}\\b`, "i");
    return regex.test(normalizedContent);
  }
  
  // For phrases, check if all words appear in sequence or proximity
  // First try exact phrase match
  if (normalizedContent.includes(phrase)) {
    return true;
  }
  
  // Then try if all words appear in the content (within reasonable distance)
  return words.every(word => {
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, "i");
    return regex.test(normalizedContent);
  });
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Get a list of forbidden tag patterns that should never be suggested
 * These are generic/spam tags that don't help discoverability
 */
export const FORBIDDEN_TAG_PATTERNS = [
  /^viral$/i,
  /^trending$/i,
  /^fyp$/i,
  /^foryou$/i,
  /^youtube$/i,
  /^video$/i,
  /^subscribe$/i,
  /^like$/i,
  /^comment$/i,
  /^share$/i,
  /^\d{4}$/,  // Just a year
];

export function isForbiddenTag(tag: string): boolean {
  return FORBIDDEN_TAG_PATTERNS.some(p => p.test(tag));
}

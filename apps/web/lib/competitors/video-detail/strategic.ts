/**
 * Competitor Video Detail - Strategic Insights
 *
 * Pure functions for computing strategic insights from video data.
 * All functions are deterministic and have no side effects.
 */

import {
  analyzeExternalLinks,
  analyzeHashtags,
  analyzeNumberInTitle,
  detectChapters,
  formatDuration,
  getDurationBucket,
} from "@/lib/competitor-utils";
import type { CompetitorCommentsAnalysis, CompetitorVideo, CompetitorVideoAnalysis } from "@/types/api";

import type { BeatChecklist } from "./types";

// ============================================
// COMMON WORDS SET (for keyword derivation)
// ============================================

export const commonWords = new Set([
  "the", "and", "for", "with", "this", "that", "from", "have",
  "you", "what", "when", "where", "how", "why", "who", "which",
  "your", "will", "can", "all", "are", "been", "being", "but",
  "each", "had", "has", "about", "video", "watch", "youtube",
  "channel", "subscribe",
]);

// ============================================
// KEYWORD DERIVATION
// ============================================

/**
 * Derive keywords from text when tags are missing.
 * Uses word frequency analysis to extract relevant terms.
 */
export function deriveKeywordsFromText(text: string): string[] {
  const words = text
    .toLowerCase()
    .replaceAll(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4 && !commonWords.has(w));

  const wordCounts = new Map<string, number>();
  words.forEach((w) => {
    wordCounts.set(w, (wordCounts.get(w) ?? 0) + 1);
  });

  return [...wordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

// ============================================
// FORMAT GUESSING
// ============================================

type LikelyFormat =
  | "General"
  | "Tutorial"
  | "Review"
  | "Vlog"
  | "Reaction"
  | "Story/Documentary"
  | "Listicle"
  | "Explainer";

/**
 * Guess the likely format of a video based on title and description.
 */
function guessLikelyFormat(title: string, description: string): LikelyFormat {
  const haystack = `${title} ${description}`;
  if (/tutorial|how to|guide|step|learn/i.test(haystack)) {return "Tutorial";}
  if (/review|honest|vs |compared|worth/i.test(title)) {return "Review";}
  if (/vlog|day in|week in|behind/i.test(haystack)) {return "Vlog";}
  if (/react|watch|reacts/i.test(title)) {return "Reaction";}
  if (/story|journey|experience/i.test(haystack)) {return "Story/Documentary";}
  if (/top \d|best \d|\d things|\d ways/i.test(title)) {return "Listicle";}
  if (/explained|what is|why/i.test(title)) {return "Explainer";}
  return "General";
}

/**
 * Guess production level based on duration and views.
 */
function guessProductionLevel(
  durationMin: number,
  views: number
): "Low" | "Medium" | "High" {
  if (durationMin < 3) {return "Low";}
  if (durationMin > 15 && views > 50_000) {return "High";}
  return "Medium";
}

// ============================================
// FALLBACK WHAT IT'S ABOUT
// ============================================

/**
 * Generate a deterministic "What it's about" description when LLM is unavailable.
 * Picks the first meaningful sentence from description, or uses tags.
 */
export function fallbackWhatItsAbout(input: {
  title: string;
  description?: string | null;
  tags: string[];
}): string {
  const desc = (input.description ?? "")
    .replaceAll(/https?:\/\/\S+/gi, "")
    .replaceAll(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, "")
    .replaceAll(/\s+/g, " ")
    .trim();

  // Prefer the first "real" sentence from the description (not the title).
  const firstSentence = desc.split(/(?<=[.!?])\s+/).find((s) => {
    const t = s.trim();
    return t.length >= 60 && t.length <= 240;
  });
  if (firstSentence) {return firstSentence.trim();}

  const topTags = (input.tags ?? []).slice(0, 4).filter(Boolean);
  if (topTags.length > 0) {
    return `A video centered on ${topTags.join(
      ", "
    )}, framed as a practical breakdown for viewers.`;
  }

  // Last resort: avoid echoing the title; keep it general.
  return "A video that explores the core topic implied by the title, focusing on the main promise and viewer takeaway.";
}

// ============================================
// FRESH ANGLES GENERATION (Deterministic)
// ============================================

/**
 * FNV-1a 32-bit hash for deterministic randomness.
 */
function hashStringToUint32(input: string): number {
  let hash = 2_166_136_261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

/**
 * Mulberry32 PRNG for deterministic random number generation.
 */
function mulberry32(initialSeed: number): () => number {
  let seed = initialSeed;
  return () => {
    let t = (seed += 0x6D_2B_79_F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

/**
 * Pick a topic hint from tags or derived keywords.
 */
function pickTopicHint(input: {
  title: string;
  tags: string[];
  description: string;
}): string {
  const tag = (input.tags ?? [])
    .map((t) => t.trim())
    .filter(Boolean)
    .find((t) => !/youtube|subscribe|video|views/i.test(t.toLowerCase()));
  if (tag) {return tag;}

  const kws = deriveKeywordsFromText(
    `${input.title} ${input.description}`.slice(0, 800)
  );
  if (kws.length >= 2) {return `${kws[0]} ${kws[1]}`;}
  if (kws.length === 1) {return kws[0];}
  return "this topic";
}

type FormatCandidateParams = { topic: string; n: number; days: number };

const FORMAT_CANDIDATES: Record<string, (p: FormatCandidateParams) => string[]> = {
  Tutorial: (p) => [
    `Beginner-friendly variant: "${p.topic} for absolute beginners" (step-by-step + printable checklist)`,
    `Troubleshooting angle: "Why your ${p.topic} isn't working (and the ${p.n} fixes)"`,
  ],
  Review: (p) => [
    `Long-term update: "${p.topic} after ${p.days} days — what held up, what I'd buy instead"`,
    `Budget showdown: "The ${p.topic} alternative that's 80% as good for half the cost"`,
  ],
  Explainer: (p) => [
    `One-model explanation: "${p.topic} explained with 1 simple framework + real examples"`,
    `Myth-busting: "${p.n} myths about ${p.topic} that waste your time"`,
  ],
  Listicle: (p) => [
    `Ranked comparison: "${p.n} ${p.topic} approaches ranked (beginner → advanced)"`,
    `Tiers/scorecard: "I scored ${p.topic} options on 5 criteria — here's the winner"`,
  ],
  Vlog: (p) => [
    `Case study story: "I tried ${p.topic} for ${p.days} days — results, mistakes, and what I'd do differently"`,
    `Behind-the-scenes: "What it really takes to do ${p.topic} (the messy parts included)"`,
  ],
  "Story/Documentary": (p) => [
    `Case study story: "I tried ${p.topic} for ${p.days} days — results, mistakes, and what I'd do differently"`,
    `Behind-the-scenes: "What it really takes to do ${p.topic} (the messy parts included)"`,
  ],
  Reaction: (p) => [
    `Expert scorecard reaction: "Reacting to ${p.topic} — what's good, what's wrong, and the fixes"`,
    `Before/after reaction: "I react, then rebuild it properly (so you can copy the template)"`,
  ],
};

const DEFAULT_FORMAT_CANDIDATES = (p: FormatCandidateParams) => [
  `Tighter promise: "${p.topic} — the simplest path from 0 → 1 (no fluff, just steps)"`,
  `Contrarian framing: "Most advice about ${p.topic} is backwards — do this instead"`,
];

function collectHookCandidates(
  topic: string,
  n: number,
  days: number,
  hasCuriosityGap: boolean,
  hasNumber: boolean,
): string[] {
  const candidates: string[] = [];
  if (!hasCuriosityGap) {
    candidates.push(`Open-loop hook: "The part about ${topic} nobody tells you…" (build curiosity before the payoff)`);
  }
  if (!hasNumber) {
    candidates.push(`Add a concrete promise: "${n} ${topic} mistakes to avoid" or "${topic} in ${days} days"`);
  } else {
    candidates.push(`Refresh the constraint: try a tighter time-box ("${topic} in ${days} days") or a ranked list ("Top ${n} ${topic} moves")`);
  }
  return candidates;
}

function collectContextualCandidates(
  topic: string,
  durationMin: number,
  productionLevel: "Low" | "Medium" | "High",
  commentsAnalysis?: CompetitorCommentsAnalysis,
): string[] {
  const candidates: string[] = [];
  if (durationMin > 10) {
    candidates.push(`Shorter remix: "${topic} — the 5-minute version" (faster pacing + only the essentials)`);
  } else if (durationMin < 4) {
    candidates.push(`Deep-dive companion: "Everything about ${topic} (full walkthrough + examples)"`);
  }
  if (productionLevel === "High") {
    candidates.push(`Low-production version: "${topic} with zero fancy gear" (phone-only / simple setup)`);
  }
  const topAsk = commentsAnalysis?.viewerAskedFor?.[0]?.trim();
  if (topAsk) {
    const clipped = topAsk.length > 90 ? `${topAsk.slice(0, 87)}...` : topAsk;
    candidates.push(`Answer the #1 viewer request directly: "${clipped}" (make it the main promise)`);
  }
  return candidates;
}

/**
 * Generate fresh angles for remixing a video.
 * Uses deterministic randomness based on videoId for stable output.
 */
function generateFreshAngles(input: {
  seed: string;
  title: string;
  description: string;
  tags: string[];
  likelyFormat: LikelyFormat;
  durationMin: number;
  productionLevel: "Low" | "Medium" | "High";
  hasCuriosityGap: boolean;
  hasNumber: boolean;
  commentsAnalysis?: CompetitorCommentsAnalysis;
}): string[] {
  const rng = mulberry32(hashStringToUint32(input.seed));
  const topic = pickTopicHint({
    title: input.title,
    description: input.description,
    tags: input.tags,
  });

  const numberChoices = [3, 5, 7, 9];
  const dayChoices = [7, 14, 30];
  const pick = <T>(arr: T[]) => arr[Math.floor(rng() * arr.length)]!;
  const n = pick(numberChoices);
  const days = pick(dayChoices);
  const params: FormatCandidateParams = { topic, n, days };

  const formatFn = FORMAT_CANDIDATES[input.likelyFormat] ?? DEFAULT_FORMAT_CANDIDATES;
  const candidates = [
    ...collectHookCandidates(topic, n, days, input.hasCuriosityGap, input.hasNumber),
    ...formatFn(params),
    ...collectContextualCandidates(topic, input.durationMin, input.productionLevel, input.commentsAnalysis),
  ];

  const uniq = [...new Set(candidates)].filter(Boolean);
  for (let i = uniq.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [uniq[i], uniq[j]] = [uniq[j]!, uniq[i]!];
  }

  const out = uniq.slice(0, 6);
  while (out.length < 4) {
    out.push(`Add specificity by focusing on one sub-problem of ${topic} (a single "before → after" transformation)`);
  }
  return out.slice(0, 6);
}

// ============================================
// FALLBACK BEAT CHECKLIST
// ============================================

/**
 * Generate a fallback beat-this-video checklist when LLM is unavailable.
 */
function generateFallbackBeatChecklist(input: {
  numberAnalysis: ReturnType<typeof analyzeNumberInTitle>;
  chapterDetection: ReturnType<typeof detectChapters>;
  durationMin: number;
  title: string;
  commentsAnalysis?: CompetitorCommentsAnalysis;
}): BeatChecklist {
  const checklist: BeatChecklist = [];

  if (input.durationMin <= 4) {
    checklist.push({
      action:
        "Deliver the payoff faster: cut intro to <5 seconds and show the result upfront",
      difficulty: "Easy",
      impact: "High",
    });
  } else {
    checklist.push({
      action:
        "Use a sharper opening promise than theirs, then validate it with a quick preview of what's coming",
      difficulty: "Medium",
      impact: "High",
    });
  }

  if (
    !input.numberAnalysis.isPerformanceDriver &&
    /how|why|what|best|stop|fix|make/i.test(input.title)
  ) {
    checklist.push({
      action:
        "Make the title more specific with a number or constraint (time, steps, or result)",
      difficulty: "Easy",
      impact: "Medium",
    });
  }

  if (!input.chapterDetection.hasChapters && input.durationMin >= 8) {
    checklist.push({
      action:
        "Add clear chapters and reference them on-screen to reduce drop-off in the middle",
      difficulty: "Easy",
      impact: "Medium",
    });
  }

  if (input.commentsAnalysis?.viewerAskedFor?.length) {
    checklist.push({
      action: `Directly answer what viewers asked for most: "${input.commentsAnalysis.viewerAskedFor[0]}"`,
      difficulty: "Medium",
      impact: "High",
    });
  }

  checklist.push({
    action:
      "Differentiate with a unique angle they didn't cover (a contrarian take, a case study, or a tighter framework)",
    difficulty: "Medium",
    impact: "High",
  });

  if (input.durationMin > 12) {
    checklist.push({
      action:
        "Tighten pacing: remove repetition and add pattern interrupts every ~60–90 seconds",
      difficulty: "Medium",
      impact: "Medium",
    });
  }

  return checklist;
}

// ============================================
// MAIN: COMPUTE STRATEGIC INSIGHTS
// ============================================

const POWER_WORDS = new Set([
  "secret", "shocking", "amazing", "ultimate", "best", "worst",
  "never", "always", "proven", "guaranteed", "free", "instant",
  "easy", "simple", "fast", "new", "finally", "revealed",
  "truth", "mistake", "hack", "trick", "strategy",
]);

const NUMBER_TYPE_LABELS: Record<string, string> = {
  ranking: "Uses ranking (#1) → increases perceived credibility",
  list_count: "Uses list count → sets clear viewer expectations",
  episode: "Uses episode/part number → builds series continuity",
  time_constraint: "Uses time constraint → creates urgency",
  quantity: "Uses specific quantity → adds concrete stakes",
  year: "Uses year reference → signals timeliness",
};

const LENGTH_INSIGHTS: Record<string, string> = {
  Shorts: "YouTube Short format - vertical, quick consumption",
  Short: "Short-form content - quick delivery, higher completion typical",
  Medium: "Standard length - balances depth with watchability",
  Long: "Long-form content - requires strong pacing throughout",
  "Very Long": "Extended content - appeals to highly engaged viewers",
};

type RateVerdict = "Below Average" | "Average" | "Above Average" | "Exceptional";

function classifyRate(rate: number, thresholds: [number, number, number]): RateVerdict {
  if (rate < thresholds[0]) {return "Below Average";}
  if (rate < thresholds[1]) {return "Average";}
  if (rate < thresholds[2]) {return "Above Average";}
  return "Exceptional";
}

function computeTitleAnalysis(title: string) {
  const titleLength = title.length;
  const lowerTitle = title.toLowerCase();
  const hasPowerWord = [...POWER_WORDS].some((w) => lowerTitle.includes(w));
  const hasCuriosityGap = /\?|\.{3}|how|why|what|secret|truth|reveal|nobody|everyone/i.test(title);
  const hasTimeframe = /202\d|today|now|this year|\d+\s*(day|week|month|hour)/i.test(title);

  let score = 5;
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (titleLength >= 40 && titleLength <= 60) {
    score += 1;
    strengths.push("Optimal length (40-60 chars)");
  } else if (titleLength < 30) {
    score -= 1;
    weaknesses.push("Title might be too short");
  } else if (titleLength > 70) {
    weaknesses.push("Title may get truncated on mobile");
  }

  const numberAnalysis = analyzeNumberInTitle(title);
  if (numberAnalysis.hasNumber && numberAnalysis.isPerformanceDriver) {
    score += 1;
    strengths.push(NUMBER_TYPE_LABELS[numberAnalysis.type] ?? "Uses quantifier → increases specificity");
  } else if (!numberAnalysis.hasNumber) {
    weaknesses.push("No quantifier to create specificity");
  }

  if (hasPowerWord) { score += 1; strengths.push("Contains emotional trigger word"); }
  if (hasCuriosityGap) { score += 1; strengths.push("Creates curiosity gap"); }
  else { weaknesses.push("Could add more curiosity/tension"); }
  if (hasTimeframe) { score += 0.5; strengths.push("Time-relevant (freshness signal)"); }

  return {
    score: Math.min(10, Math.max(1, Math.round(score))),
    titleLength,
    numberAnalysis,
    hasPowerWord,
    hasCuriosityGap,
    hasTimeframe,
    strengths,
    weaknesses,
  };
}

function computePostingTiming(publishedAt: string) {
  const publishedDate = new Date(publishedAt);
  const dayOfWeek = publishedDate.toLocaleDateString("en-US", { weekday: "long" });
  const hourOfDay = publishedDate.getHours();
  const isWeekend = publishedDate.getDay() === 0 || publishedDate.getDay() === 6;
  const daysAgo = Math.floor((Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24));
  const localTimeFormatted = publishedDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const timingInsight = `Posted ${dayOfWeek} ${localTimeFormatted}. Posting-time pattern unavailable for this channel.`;

  return { dayOfWeek, hourOfDay, isWeekend, daysAgo, localTimeFormatted, timingInsight };
}

function computeCompetitionDifficulty(
  views: number,
  likeRate: number,
  likeRateVerdict: RateVerdict,
  durationMin: number,
  durationFormatted: string,
) {
  type DifficultyScore = "Easy" | "Medium" | "Hard" | "Very Hard";
  const reasons: string[] = [];
  const whyThisScore: string[] = [];

  let score: DifficultyScore;
  if (views > 1_000_000) {
    score = "Very Hard";
    reasons.push("Viral video (1M+ views) - hard to match reach");
    whyThisScore.push(`View count: ${views.toLocaleString()} (Very Hard threshold: 1M+)`);
  } else if (views > 100_000) {
    score = "Hard";
    reasons.push("High-performing video (100K+ views)");
    whyThisScore.push(`View count: ${views.toLocaleString()} (Hard threshold: 100K-1M)`);
  } else if (views > 10_000) {
    score = "Medium";
    reasons.push("Solid performer - achievable with good execution");
    whyThisScore.push(`View count: ${views.toLocaleString()} (Medium threshold: 10K-100K)`);
  } else {
    score = "Easy";
    reasons.push("Lower view count - opportunity to do better");
    whyThisScore.push(`View count: ${views.toLocaleString()} (Easy threshold: <10K)`);
  }

  if (likeRateVerdict === "Exceptional") {
    reasons.push("Very high like rate - content is resonating strongly");
    whyThisScore.push(`Like rate: ${likeRate.toFixed(1)}% (Exceptional: >6%)`);
  } else {
    whyThisScore.push(`Like rate: ${likeRate.toFixed(1)}% (${likeRateVerdict})`);
  }

  if (durationMin > 15) {
    reasons.push("Long-form requires significant production time");
    whyThisScore.push(`Duration: ${durationFormatted} (long-form production overhead)`);
  }

  return { score, reasons, whyThisScore };
}

function computeOpportunityScore(input: {
  description: string;
  title: string;
  videoId: string;
  tags: string[];
  likelyFormat: LikelyFormat;
  durationMin: number;
  durationFormatted: string;
  productionLevel: "Low" | "Medium" | "High";
  hasCuriosityGap: boolean;
  numberIsPerformanceDriver: boolean;
  commentsAnalysis?: CompetitorCommentsAnalysis;
}) {
  let score = 5;
  const gaps: string[] = [];
  const whyThisScore: string[] = [];
  let descriptionGapScore = 0;
  let hashtagGapScore = 0;
  let commentOpportunityScore = 0;
  let formatMismatchScore = 0;

  const hashtagAnalysis = analyzeHashtags(input.title, input.description);
  const descWordCount = input.description.split(/\s+/).filter(Boolean).length;

  if (descWordCount === 0) {
    gaps.push("Empty description (0 words) - packaging improvement: add a description with 1-3 relevant hashtags");
    score += 1.5;
    descriptionGapScore = 1.5;
    whyThisScore.push(`Description: empty (0 words) → +1.5 opportunity`);
  } else if (descWordCount < 50) {
    gaps.push("Minimal description - opportunity to add more context and hashtags");
    score += 1;
    descriptionGapScore = 1;
    whyThisScore.push(`Description: minimal (${descWordCount} words) → +1 opportunity`);
  } else if (hashtagAnalysis.count === 0) {
    gaps.push("No visible hashtags in title/description - could add 1-3 topic-relevant hashtags");
    score += 0.5;
    hashtagGapScore = 0.5;
    whyThisScore.push(`Hashtags: none visible → +0.5 opportunity`);
  } else {
    whyThisScore.push(`Description: ${descWordCount} words, ${hashtagAnalysis.count} hashtags (adequate)`);
  }

  const chapterDetection = detectChapters(input.description);
  if (!chapterDetection.hasChapters && input.durationMin > 5) {
    gaps.push("No chapter timestamps - add chapters for better UX");
    score += 0.5;
    formatMismatchScore += 0.5;
    whyThisScore.push(`Chapters: none (${input.durationFormatted} video) → +0.5 opportunity`);
  }

  const angles = generateFreshAngles({
    seed: `${input.videoId}|${input.title}`,
    title: input.title,
    description: input.description,
    tags: input.tags,
    likelyFormat: input.likelyFormat,
    durationMin: input.durationMin,
    productionLevel: input.productionLevel,
    hasCuriosityGap: input.hasCuriosityGap,
    hasNumber: input.numberIsPerformanceDriver,
    commentsAnalysis: input.commentsAnalysis,
  });

  if (input.commentsAnalysis?.viewerAskedFor && input.commentsAnalysis.viewerAskedFor.length > 0) {
    gaps.push(`Viewers asking for: ${input.commentsAnalysis.viewerAskedFor[0]} - make that video!`);
    score += 1;
    commentOpportunityScore = 1;
    whyThisScore.push(`Comment requests: found (${input.commentsAnalysis.viewerAskedFor.length} themes) → +1 opportunity`);
  } else {
    whyThisScore.push(`Comment requests: none detected`);
  }

  score = Math.min(10, Math.max(1, Math.round(score)));
  whyThisScore.unshift(`Base score: 5, Final: ${score}/10`);

  let verdict = "";
  if (score >= 8) { verdict = "High opportunity - gaps to exploit!"; }
  else if (score >= 6) { verdict = "Good opportunity - room to differentiate"; }
  else if (score >= 4) { verdict = "Moderate - will need strong execution"; }
  else { verdict = "Tough to beat - focus on unique angles"; }

  return {
    score,
    verdict,
    gaps,
    angles,
    whyThisScore,
    scoreBreakdown: { descriptionGap: descriptionGapScore, hashtagGap: hashtagGapScore, commentOpportunity: commentOpportunityScore, formatMismatch: formatMismatchScore },
    hashtagAnalysis,
    chapterDetection,
  };
}

function computeDescriptionAnalysis(description: string, chapterDetection: ReturnType<typeof detectChapters>, hashtagAnalysis: ReturnType<typeof analyzeHashtags>) {
  const linkAnalysis = analyzeExternalLinks(description);
  const hasCTA = /subscribe|like|comment|share|follow|check out|click|link|download/i.test(description);
  const estimatedWordCount = description.split(/\s+/).filter(Boolean).length;

  const keyElements: string[] = [];
  if (chapterDetection.hasChapters) { keyElements.push(`Chapter timestamps (${chapterDetection.chapterCount})`); }
  if (linkAnalysis.hasLinks) { keyElements.push(`External links (${linkAnalysis.linkCount})`); }
  if (hasCTA) { keyElements.push("Call-to-action"); }
  if (hashtagAnalysis.count > 0) { keyElements.push(`Hashtags (${hashtagAnalysis.count})`); }
  if (linkAnalysis.hasSocialLinks) { keyElements.push("Social media links"); }

  return { hasTimestamps: chapterDetection.hasChapters, hasLinks: linkAnalysis.hasLinks, hasCTA, estimatedWordCount, keyElements };
}

/**
 * Compute strategic insights from video data.
 * This is a pure function with no side effects.
 */
export function computeStrategicInsights(input: {
  video: CompetitorVideo;
  videoDetails: {
    title: string;
    description?: string;
    tags?: string[];
    viewCount: number;
    likeCount: number;
    commentCount: number;
    publishedAt: string;
    durationSec?: number;
  };
  commentsAnalysis?: CompetitorCommentsAnalysis;
  beatThisVideo?: BeatChecklist;
}): CompetitorVideoAnalysis["strategicInsights"] {
  const { video, videoDetails, commentsAnalysis } = input;
  const title = videoDetails.title;
  const description = videoDetails.description ?? "";

  const titleResult = computeTitleAnalysis(title);
  const timing = computePostingTiming(videoDetails.publishedAt);

  const durationSec = videoDetails.durationSec ?? 0;
  const durationMin = Math.round(durationSec / 60);
  const durationFormatted = formatDuration(durationSec);
  const durationBucket = getDurationBucket(durationSec);

  const views = videoDetails.viewCount || 1;
  const likes = videoDetails.likeCount || 0;
  const comments = videoDetails.commentCount || 0;
  const likeRate = (likes / views) * 100;
  const commentRate = (comments / views) * 1000;
  const likeRateVerdict = classifyRate(likeRate, [2, 4, 6]);
  const commentRateVerdict = classifyRate(commentRate, [1, 3, 6]);

  const difficulty = computeCompetitionDifficulty(views, likeRate, likeRateVerdict, durationMin, durationFormatted);

  const likelyFormat = guessLikelyFormat(title, description);
  const productionLevel = guessProductionLevel(durationMin, views);

  const opportunity = computeOpportunityScore({
    description,
    title,
    videoId: video.videoId,
    tags: videoDetails.tags ?? [],
    likelyFormat,
    durationMin,
    durationFormatted,
    productionLevel,
    hasCuriosityGap: titleResult.hasCuriosityGap,
    numberIsPerformanceDriver: titleResult.numberAnalysis.isPerformanceDriver,
    commentsAnalysis,
  });

  const beatChecklist =
    input.beatThisVideo && input.beatThisVideo.length > 0
      ? input.beatThisVideo
      : generateFallbackBeatChecklist({
          numberAnalysis: titleResult.numberAnalysis,
          chapterDetection: opportunity.chapterDetection,
          durationMin,
          title,
          commentsAnalysis,
        });

  const descAnalysis = computeDescriptionAnalysis(description, opportunity.chapterDetection, opportunity.hashtagAnalysis);

  let paceEstimate: "Slow" | "Medium" | "Fast" = "Medium";
  if (durationMin < 5) { paceEstimate = "Fast"; }
  else if (durationMin > 20) { paceEstimate = "Slow"; }

  return {
    titleAnalysis: {
      score: titleResult.score,
      characterCount: titleResult.titleLength,
      hasNumber: titleResult.numberAnalysis.hasNumber,
      numberAnalysis: titleResult.numberAnalysis,
      hasPowerWord: titleResult.hasPowerWord,
      hasCuriosityGap: titleResult.hasCuriosityGap,
      hasTimeframe: titleResult.hasTimeframe,
      strengths: titleResult.strengths.slice(0, 4),
      weaknesses: titleResult.weaknesses.slice(0, 3),
      confidence: "Medium" as const,
    },
    competitionDifficulty: {
      score: difficulty.score,
      reasons: difficulty.reasons.slice(0, 3),
      whyThisScore: difficulty.whyThisScore,
      basisMetrics: {
        viewCount: views,
        viewsPerDay: video.derived.viewsPerDay,
        likeRate: Math.round(likeRate * 100) / 100,
      },
      confidence: "Medium" as const,
    },
    postingTiming: {
      ...timing,
      hasChannelHistory: false,
      confidence: "Low" as const,
      measurement: "Inferred" as const,
    },
    lengthAnalysis: {
      durationSec,
      durationFormatted,
      bucket: durationBucket,
      insight: LENGTH_INSIGHTS[durationBucket] ?? "Standard length",
      confidence: "High" as const,
    },
    engagementBenchmarks: {
      likeRate: Math.round(likeRate * 100) / 100,
      commentRate: Math.round(commentRate * 100) / 100,
      likeRateVerdict,
      commentRateVerdict,
      confidence: "High" as const,
      measurement: "Measured" as const,
    },
    opportunityScore: {
      score: opportunity.score,
      verdict: opportunity.verdict,
      gaps: opportunity.gaps.slice(0, 4),
      angles: opportunity.angles.slice(0, 4),
      whyThisScore: opportunity.whyThisScore,
      scoreBreakdown: opportunity.scoreBreakdown,
      confidence: "Medium" as const,
    },
    beatThisVideo: beatChecklist.slice(0, 6),
    descriptionAnalysis: {
      ...descAnalysis,
      confidence: "High" as const,
    },
    formatSignals: {
      likelyFormat,
      productionLevel,
      paceEstimate,
      confidence: "Low" as const,
    },
  };
}

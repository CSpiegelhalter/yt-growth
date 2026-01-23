/**
 * Competitor Video Detail - Strategic Insights
 *
 * Pure functions for computing strategic insights from video data.
 * All functions are deterministic and have no side effects.
 */

import type { CompetitorVideo, CompetitorCommentsAnalysis, CompetitorVideoAnalysis } from "@/types/api";
import {
  analyzeNumberInTitle,
  formatDuration,
  getDurationBucket,
  detectChapters,
  analyzeExternalLinks,
  analyzeHashtags,
} from "@/lib/competitor-utils";
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
    .replace(/[^a-z0-9\s]/g, " ")
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

export type LikelyFormat =
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
export function guessLikelyFormat(title: string, description: string): LikelyFormat {
  const haystack = `${title} ${description}`;
  if (/tutorial|how to|guide|step|learn/i.test(haystack)) return "Tutorial";
  if (/review|honest|vs |compared|worth/i.test(title)) return "Review";
  if (/vlog|day in|week in|behind/i.test(haystack)) return "Vlog";
  if (/react|watch|reacts/i.test(title)) return "Reaction";
  if (/story|journey|experience/i.test(haystack)) return "Story/Documentary";
  if (/top \d|best \d|\d things|\d ways/i.test(title)) return "Listicle";
  if (/explained|what is|why/i.test(title)) return "Explainer";
  return "General";
}

/**
 * Guess production level based on duration and views.
 */
export function guessProductionLevel(
  durationMin: number,
  views: number
): "Low" | "Medium" | "High" {
  if (durationMin < 3) return "Low";
  if (durationMin > 15 && views > 50_000) return "High";
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
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Prefer the first "real" sentence from the description (not the title).
  const firstSentence = desc.split(/(?<=[.!?])\s+/).find((s) => {
    const t = s.trim();
    return t.length >= 60 && t.length <= 240;
  });
  if (firstSentence) return firstSentence.trim();

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
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Mulberry32 PRNG for deterministic random number generation.
 */
function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
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
  if (tag) return tag;

  const kws = deriveKeywordsFromText(
    `${input.title} ${input.description}`.slice(0, 800)
  );
  if (kws.length >= 2) return `${kws[0]} ${kws[1]}`;
  if (kws.length === 1) return kws[0];
  return "this topic";
}

/**
 * Generate fresh angles for remixing a video.
 * Uses deterministic randomness based on videoId for stable output.
 */
export function generateFreshAngles(input: {
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

  const candidates: string[] = [];

  if (!input.hasCuriosityGap) {
    candidates.push(
      `Open-loop hook: "The part about ${topic} nobody tells you…" (build curiosity before the payoff)`
    );
  }
  if (!input.hasNumber) {
    candidates.push(
      `Add a concrete promise: "${n} ${topic} mistakes to avoid" or "${topic} in ${days} days"`
    );
  } else {
    candidates.push(
      `Refresh the constraint: try a tighter time-box ("${topic} in ${days} days") or a ranked list ("Top ${n} ${topic} moves")`
    );
  }

  // Format-specific remixes
  switch (input.likelyFormat) {
    case "Tutorial":
      candidates.push(
        `Beginner-friendly variant: "${topic} for absolute beginners" (step-by-step + printable checklist)`
      );
      candidates.push(
        `Troubleshooting angle: "Why your ${topic} isn't working (and the ${n} fixes)"`
      );
      break;
    case "Review":
      candidates.push(
        `Long-term update: "${topic} after ${days} days — what held up, what I'd buy instead"`
      );
      candidates.push(
        `Budget showdown: "The ${topic} alternative that's 80% as good for half the cost"`
      );
      break;
    case "Explainer":
      candidates.push(
        `One-model explanation: "${topic} explained with 1 simple framework + real examples"`
      );
      candidates.push(
        `Myth-busting: "${n} myths about ${topic} that waste your time"`
      );
      break;
    case "Listicle":
      candidates.push(
        `Ranked comparison: "${n} ${topic} approaches ranked (beginner → advanced)"`
      );
      candidates.push(
        `Tiers/scorecard: "I scored ${topic} options on 5 criteria — here's the winner"`
      );
      break;
    case "Vlog":
    case "Story/Documentary":
      candidates.push(
        `Case study story: "I tried ${topic} for ${days} days — results, mistakes, and what I'd do differently"`
      );
      candidates.push(
        `Behind-the-scenes: "What it really takes to do ${topic} (the messy parts included)"`
      );
      break;
    case "Reaction":
      candidates.push(
        `Expert scorecard reaction: "Reacting to ${topic} — what's good, what's wrong, and the fixes"`
      );
      candidates.push(
        `Before/after reaction: "I react, then rebuild it properly (so you can copy the template)"`
      );
      break;
    default:
      candidates.push(
        `Tighter promise: "${topic} — the simplest path from 0 → 1 (no fluff, just steps)"`
      );
      candidates.push(
        `Contrarian framing: "Most advice about ${topic} is backwards — do this instead"`
      );
  }

  if (input.durationMin > 10) {
    candidates.push(
      `Shorter remix: "${topic} — the 5-minute version" (faster pacing + only the essentials)`
    );
  } else if (input.durationMin < 4) {
    candidates.push(
      `Deep-dive companion: "Everything about ${topic} (full walkthrough + examples)"`
    );
  }

  if (input.productionLevel === "High") {
    candidates.push(
      `Low-production version: "${topic} with zero fancy gear" (phone-only / simple setup)`
    );
  }

  const topAsk = input.commentsAnalysis?.viewerAskedFor?.[0]?.trim();
  if (topAsk) {
    const clipped = topAsk.length > 90 ? `${topAsk.slice(0, 87)}...` : topAsk;
    candidates.push(
      `Answer the #1 viewer request directly: "${clipped}" (make it the main promise)`
    );
  }

  // De-dupe + deterministic shuffle (stable per video)
  const uniq = [...new Set(candidates)].filter(Boolean);
  for (let i = uniq.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [uniq[i], uniq[j]] = [uniq[j]!, uniq[i]!];
  }

  // Ensure we always return enough angles
  const out = uniq.slice(0, 6);
  while (out.length < 4) {
    out.push(
      `Add specificity by focusing on one sub-problem of ${topic} (a single "before → after" transformation)`
    );
  }
  return out.slice(0, 6);
}

// ============================================
// FALLBACK BEAT CHECKLIST
// ============================================

/**
 * Generate a fallback beat-this-video checklist when LLM is unavailable.
 */
export function generateFallbackBeatChecklist(input: {
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

  // ===== TITLE ANALYSIS =====
  const titleLength = title.length;
  const powerWords = [
    "secret", "shocking", "amazing", "ultimate", "best", "worst",
    "never", "always", "proven", "guaranteed", "free", "instant",
    "easy", "simple", "fast", "new", "finally", "revealed",
    "truth", "mistake", "hack", "trick", "strategy",
  ];
  const hasPowerWord = powerWords.some((w) => title.toLowerCase().includes(w));
  const hasCuriosityGap =
    /\?|\.{3}|how|why|what|secret|truth|reveal|nobody|everyone/i.test(title);
  const hasTimeframe =
    /202\d|today|now|this year|\d+\s*(day|week|month|hour)/i.test(title);

  let titleScore = 5;
  const titleStrengths: string[] = [];
  const titleWeaknesses: string[] = [];

  if (titleLength >= 40 && titleLength <= 60) {
    titleScore += 1;
    titleStrengths.push("Optimal length (40-60 chars)");
  } else if (titleLength < 30) {
    titleScore -= 1;
    titleWeaknesses.push("Title might be too short");
  } else if (titleLength > 70) {
    titleWeaknesses.push("Title may get truncated on mobile");
  }

  const numberAnalysis = analyzeNumberInTitle(title);
  if (numberAnalysis.hasNumber) {
    if (numberAnalysis.isPerformanceDriver) {
      titleScore += 1;
      const typeLabels: Record<string, string> = {
        ranking: "Uses ranking (#1) → increases perceived credibility",
        list_count: "Uses list count → sets clear viewer expectations",
        episode: "Uses episode/part number → builds series continuity",
        time_constraint: "Uses time constraint → creates urgency",
        quantity: "Uses specific quantity → adds concrete stakes",
        year: "Uses year reference → signals timeliness",
      };
      titleStrengths.push(
        typeLabels[numberAnalysis.type] ??
          "Uses quantifier → increases specificity"
      );
    }
  } else {
    titleWeaknesses.push("No quantifier to create specificity");
  }

  if (hasPowerWord) {
    titleScore += 1;
    titleStrengths.push("Contains emotional trigger word");
  }

  if (hasCuriosityGap) {
    titleScore += 1;
    titleStrengths.push("Creates curiosity gap");
  } else {
    titleWeaknesses.push("Could add more curiosity/tension");
  }

  if (hasTimeframe) {
    titleScore += 0.5;
    titleStrengths.push("Time-relevant (freshness signal)");
  }

  titleScore = Math.min(10, Math.max(1, Math.round(titleScore)));

  // ===== POSTING TIMING =====
  const publishedDate = new Date(videoDetails.publishedAt);
  const dayOfWeek = publishedDate.toLocaleDateString("en-US", {
    weekday: "long",
  });
  const hourOfDay = publishedDate.getHours();
  const isWeekend =
    publishedDate.getDay() === 0 || publishedDate.getDay() === 6;
  const daysAgo = Math.floor(
    (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const localTimeFormatted = publishedDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const timingInsight = `Posted ${dayOfWeek} ${localTimeFormatted}. Posting-time pattern unavailable for this channel.`;

  // ===== VIDEO LENGTH =====
  const durationSec = videoDetails.durationSec ?? 0;
  const durationMin = Math.round(durationSec / 60);
  const durationFormatted = formatDuration(durationSec);
  const durationBucket = getDurationBucket(durationSec);

  const lengthInsights: Record<string, string> = {
    Shorts: "YouTube Short format - vertical, quick consumption",
    Short: "Short-form content - quick delivery, higher completion typical",
    Medium: "Standard length - balances depth with watchability",
    Long: "Long-form content - requires strong pacing throughout",
    "Very Long": "Extended content - appeals to highly engaged viewers",
  };
  const lengthInsight = lengthInsights[durationBucket] ?? "Standard length";

  // ===== ENGAGEMENT BENCHMARKS =====
  const views = videoDetails.viewCount || 1;
  const likes = videoDetails.likeCount || 0;
  const comments = videoDetails.commentCount || 0;

  const likeRate = (likes / views) * 100;
  const commentRate = (comments / views) * 1000;

  let likeRateVerdict: "Below Average" | "Average" | "Above Average" | "Exceptional" = "Average";
  if (likeRate < 2) likeRateVerdict = "Below Average";
  else if (likeRate >= 2 && likeRate < 4) likeRateVerdict = "Average";
  else if (likeRate >= 4 && likeRate < 6) likeRateVerdict = "Above Average";
  else likeRateVerdict = "Exceptional";

  let commentRateVerdict: "Below Average" | "Average" | "Above Average" | "Exceptional" = "Average";
  if (commentRate < 1) commentRateVerdict = "Below Average";
  else if (commentRate >= 1 && commentRate < 3) commentRateVerdict = "Average";
  else if (commentRate >= 3 && commentRate < 6) commentRateVerdict = "Above Average";
  else commentRateVerdict = "Exceptional";

  // ===== COMPETITION DIFFICULTY =====
  let difficultyScore: "Easy" | "Medium" | "Hard" | "Very Hard" = "Medium";
  const difficultyReasons: string[] = [];
  const difficultyWhyThisScore: string[] = [];

  if (views > 1_000_000) {
    difficultyScore = "Very Hard";
    difficultyReasons.push("Viral video (1M+ views) - hard to match reach");
    difficultyWhyThisScore.push(
      `View count: ${views.toLocaleString()} (Very Hard threshold: 1M+)`
    );
  } else if (views > 100_000) {
    difficultyScore = "Hard";
    difficultyReasons.push("High-performing video (100K+ views)");
    difficultyWhyThisScore.push(
      `View count: ${views.toLocaleString()} (Hard threshold: 100K-1M)`
    );
  } else if (views > 10_000) {
    difficultyScore = "Medium";
    difficultyReasons.push("Solid performer - achievable with good execution");
    difficultyWhyThisScore.push(
      `View count: ${views.toLocaleString()} (Medium threshold: 10K-100K)`
    );
  } else {
    difficultyScore = "Easy";
    difficultyReasons.push("Lower view count - opportunity to do better");
    difficultyWhyThisScore.push(
      `View count: ${views.toLocaleString()} (Easy threshold: <10K)`
    );
  }

  if (likeRateVerdict === "Exceptional") {
    difficultyReasons.push(
      "Very high like rate - content is resonating strongly"
    );
    difficultyWhyThisScore.push(
      `Like rate: ${likeRate.toFixed(1)}% (Exceptional: >6%)`
    );
  } else {
    difficultyWhyThisScore.push(
      `Like rate: ${likeRate.toFixed(1)}% (${likeRateVerdict})`
    );
  }

  if (durationMin > 15) {
    difficultyReasons.push("Long-form requires significant production time");
    difficultyWhyThisScore.push(
      `Duration: ${durationFormatted} (long-form production overhead)`
    );
  }

  // ===== FORMAT SIGNALS =====
  const likelyFormat = guessLikelyFormat(title, description);
  const productionLevel = guessProductionLevel(durationMin, views);

  // ===== OPPORTUNITY SCORE =====
  let opportunityScore = 5;
  const gaps: string[] = [];
  const angles: string[] = [];
  const opportunityWhyThisScore: string[] = [];

  let descriptionGapScore = 0;
  let hashtagGapScore = 0;
  let commentOpportunityScore = 0;
  let formatMismatchScore = 0;

  const hashtagAnalysisEarly = analyzeHashtags(title, description);
  const hashtagCount = hashtagAnalysisEarly.count;
  const descWordCount = description.split(/\s+/).filter(Boolean).length;

  if (descWordCount === 0) {
    gaps.push(
      "Empty description (0 words) - packaging improvement: add a description with 1-3 relevant hashtags"
    );
    opportunityScore += 1.5;
    descriptionGapScore = 1.5;
    opportunityWhyThisScore.push(
      `Description: empty (0 words) → +1.5 opportunity`
    );
  } else if (descWordCount < 50) {
    gaps.push(
      "Minimal description - opportunity to add more context and hashtags"
    );
    opportunityScore += 1;
    descriptionGapScore = 1;
    opportunityWhyThisScore.push(
      `Description: minimal (${descWordCount} words) → +1 opportunity`
    );
  } else if (hashtagCount === 0) {
    gaps.push(
      "No visible hashtags in title/description - could add 1-3 topic-relevant hashtags"
    );
    opportunityScore += 0.5;
    hashtagGapScore = 0.5;
    opportunityWhyThisScore.push(`Hashtags: none visible → +0.5 opportunity`);
  } else {
    opportunityWhyThisScore.push(
      `Description: ${descWordCount} words, ${hashtagCount} hashtags (adequate)`
    );
  }

  // Check for timestamps using chapter detection
  const chapterDetection = detectChapters(description);
  if (!chapterDetection.hasChapters && durationMin > 5) {
    gaps.push("No chapter timestamps - add chapters for better UX");
    opportunityScore += 0.5;
    formatMismatchScore += 0.5;
    opportunityWhyThisScore.push(
      `Chapters: none (${durationFormatted} video) → +0.5 opportunity`
    );
  }

  // Fresh angles
  angles.push(
    ...generateFreshAngles({
      seed: `${video.videoId}|${title}`,
      title,
      description,
      tags: videoDetails.tags ?? [],
      likelyFormat,
      durationMin,
      productionLevel,
      hasCuriosityGap,
      hasNumber: numberAnalysis.isPerformanceDriver,
      commentsAnalysis,
    })
  );

  // Comment-based opportunities
  if (
    commentsAnalysis?.viewerAskedFor &&
    commentsAnalysis.viewerAskedFor.length > 0
  ) {
    gaps.push(
      `Viewers asking for: ${commentsAnalysis.viewerAskedFor[0]} - make that video!`
    );
    opportunityScore += 1;
    commentOpportunityScore = 1;
    opportunityWhyThisScore.push(
      `Comment requests: found (${commentsAnalysis.viewerAskedFor.length} themes) → +1 opportunity`
    );
  } else {
    opportunityWhyThisScore.push(`Comment requests: none detected`);
  }

  opportunityScore = Math.min(10, Math.max(1, Math.round(opportunityScore)));
  opportunityWhyThisScore.unshift(
    `Base score: 5, Final: ${opportunityScore}/10`
  );

  let opportunityVerdict = "";
  if (opportunityScore >= 8) {
    opportunityVerdict = "High opportunity - gaps to exploit!";
  } else if (opportunityScore >= 6) {
    opportunityVerdict = "Good opportunity - room to differentiate";
  } else if (opportunityScore >= 4) {
    opportunityVerdict = "Moderate - will need strong execution";
  } else {
    opportunityVerdict = "Tough to beat - focus on unique angles";
  }

  // ===== BEAT THIS VIDEO CHECKLIST =====
  const fallbackBeatChecklist = generateFallbackBeatChecklist({
    numberAnalysis,
    chapterDetection,
    durationMin,
    title,
    commentsAnalysis,
  });

  const beatChecklist =
    input.beatThisVideo && input.beatThisVideo.length > 0
      ? input.beatThisVideo
      : fallbackBeatChecklist;

  // ===== DESCRIPTION ANALYSIS =====
  const linkAnalysis = analyzeExternalLinks(description);
  const hashtagAnalysis = hashtagAnalysisEarly;
  const hasCTA =
    /subscribe|like|comment|share|follow|check out|click|link|download/i.test(
      description
    );
  const estimatedWordCount = description.split(/\s+/).filter(Boolean).length;

  const keyElements: string[] = [];
  if (chapterDetection.hasChapters)
    keyElements.push(`Chapter timestamps (${chapterDetection.chapterCount})`);
  if (linkAnalysis.hasLinks)
    keyElements.push(`External links (${linkAnalysis.linkCount})`);
  if (hasCTA) keyElements.push("Call-to-action");
  if (hashtagAnalysis.count > 0)
    keyElements.push(`Hashtags (${hashtagAnalysis.count})`);
  if (linkAnalysis.hasSocialLinks) keyElements.push("Social media links");

  // ===== FORMAT SIGNALS =====
  let paceEstimate: "Slow" | "Medium" | "Fast" = "Medium";
  if (durationMin < 5) {
    paceEstimate = "Fast";
  } else if (durationMin > 20) {
    paceEstimate = "Slow";
  }

  return {
    titleAnalysis: {
      score: titleScore,
      characterCount: titleLength,
      hasNumber: numberAnalysis.hasNumber,
      numberAnalysis,
      hasPowerWord,
      hasCuriosityGap,
      hasTimeframe,
      strengths: titleStrengths.slice(0, 4),
      weaknesses: titleWeaknesses.slice(0, 3),
      confidence: "Medium" as const,
    },
    competitionDifficulty: {
      score: difficultyScore,
      reasons: difficultyReasons.slice(0, 3),
      whyThisScore: difficultyWhyThisScore,
      basisMetrics: {
        viewCount: views,
        viewsPerDay: video.derived.viewsPerDay,
        likeRate: Math.round(likeRate * 100) / 100,
      },
      confidence: "Medium" as const,
    },
    postingTiming: {
      dayOfWeek,
      hourOfDay,
      localTimeFormatted,
      daysAgo,
      isWeekend,
      timingInsight,
      hasChannelHistory: false,
      confidence: "Low" as const,
      measurement: "Inferred" as const,
    },
    lengthAnalysis: {
      durationSec,
      durationFormatted,
      bucket: durationBucket,
      insight: lengthInsight,
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
      score: opportunityScore,
      verdict: opportunityVerdict,
      gaps: gaps.slice(0, 4),
      angles: angles.slice(0, 4),
      whyThisScore: opportunityWhyThisScore,
      scoreBreakdown: {
        descriptionGap: descriptionGapScore,
        hashtagGap: hashtagGapScore,
        commentOpportunity: commentOpportunityScore,
        formatMismatch: formatMismatchScore,
      },
      confidence: "Medium" as const,
    },
    beatThisVideo: beatChecklist.slice(0, 6),
    descriptionAnalysis: {
      hasTimestamps: chapterDetection.hasChapters,
      hasLinks: linkAnalysis.hasLinks,
      hasCTA,
      estimatedWordCount,
      keyElements,
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
